import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getBook } from '../books';
import { computeBilly, type Bonus } from '../engine/stats';
import type { CombatState } from '../engine/combat';

export interface Game {
  id: string;
  bookId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: string[];
  bonuses: Bonus[];
  pv: number;
  chance: number;
  counters: Record<string, number>;
  collected: string[];
  notes: string[];
  /** Chapitre courant en premier, puis l'historique. */
  chapters: number[];
  combat?: CombatState;
}

export type Theme = 'system' | 'light' | 'dark';
export type DiceMode = 'virtual' | 'physical';

export interface Settings {
  theme: Theme;
  diceMode: DiceMode;
  vibrate: boolean;
}

interface UndoEntry {
  gameId: string;
  label: string;
  snapshot: Game | null;
}

interface State {
  games: Record<string, Game>;
  lastGameId?: string;
  settings: Settings;
  undo: UndoEntry[];
  toast?: { id: number; message: string; undoable: boolean };

  createGame: (bookId: string, items: string[], name: string) => string;
  deleteGame: (id: string) => void;
  openGame: (id: string) => void;
  /** Modifie une partie et empile l'état précédent pour pouvoir annuler. */
  update: (id: string, label: string, fn: (g: Game) => Game, opts?: { toast?: boolean }) => void;
  undoLast: () => void;
  setSettings: (s: Partial<Settings>) => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
  importGames: (games: Game[]) => number;
}

const UNDO_LIMIT = 40;
let toastSeq = 0;

export const newId = () => crypto.randomUUID();

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      games: {},
      settings: { theme: 'system', diceMode: 'virtual', vibrate: true },
      undo: [],

      createGame: (bookId, items, name) => {
        const book = getBook(bookId);
        const { stats } = computeBilly(book, items);
        const now = new Date().toISOString();
        const game: Game = {
          id: newId(),
          bookId,
          name,
          createdAt: now,
          updatedAt: now,
          items,
          bonuses: [],
          pv: stats.pvMax.total,
          chance: stats.cha.total,
          counters: Object.fromEntries(book.counters.map(c => [c.id, 0])),
          collected: [],
          notes: [],
          chapters: [1],
        };
        set(s => ({ games: { ...s.games, [game.id]: game }, lastGameId: game.id }));
        return game.id;
      },

      deleteGame: id => {
        const game = get().games[id];
        if (!game) return;
        set(s => {
          const games = { ...s.games };
          delete games[id];
          return {
            games,
            lastGameId: s.lastGameId === id ? undefined : s.lastGameId,
            undo: [...s.undo, { gameId: id, label: `Partie « ${game.name} » supprimée`, snapshot: game }].slice(-UNDO_LIMIT),
            toast: { id: ++toastSeq, message: `Partie « ${game.name} » supprimée`, undoable: true },
          };
        });
      },

      openGame: id => set({ lastGameId: id }),

      update: (id, label, fn, opts = {}) => {
        const game = get().games[id];
        if (!game) return;
        const next = { ...fn(game), updatedAt: new Date().toISOString() };
        set(s => ({
          games: { ...s.games, [id]: next },
          undo: [...s.undo, { gameId: id, label, snapshot: game }].slice(-UNDO_LIMIT),
          toast: opts.toast === false ? s.toast : { id: ++toastSeq, message: label, undoable: true },
        }));
      },

      undoLast: () => {
        const entry = get().undo.at(-1);
        if (!entry?.snapshot) return;
        set(s => ({
          games: { ...s.games, [entry.gameId]: entry.snapshot! },
          undo: s.undo.slice(0, -1),
          toast: { id: ++toastSeq, message: `Annulé : ${entry.label}`, undoable: false },
        }));
      },

      setSettings: settings => set(s => ({ settings: { ...s.settings, ...settings } })),
      showToast: message => set({ toast: { id: ++toastSeq, message, undoable: false } }),
      dismissToast: () => set({ toast: undefined }),

      importGames: games => {
        const valid = games.filter(g => g && typeof g.id === 'string' && typeof g.bookId === 'string' && Array.isArray(g.items));
        set(s => ({ games: { ...s.games, ...Object.fromEntries(valid.map(g => [g.id, g])) } }));
        return valid.length;
      },
    }),
    {
      name: 'billyhelper',
      version: 1,
      partialize: s => ({ games: s.games, lastGameId: s.lastGameId, settings: s.settings, undo: s.undo.slice(-10) }),
    },
  ),
);

export function useGame(id: string | undefined): Game | undefined {
  return useStore(s => (id ? s.games[id] : undefined));
}

export function vibrate(ms = 10) {
  if (useStore.getState().settings.vibrate) navigator.vibrate?.(ms);
}
