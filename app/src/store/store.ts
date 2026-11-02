import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getBook } from '../books';
import { computeBilly, type Bonus } from '../engine/stats';
import type { CombatState } from '../engine/combat';
import { isGame, validUnlocked, type Save } from './sync';

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
  /** Le chapitre courant a déjà été lu : il reste à faire le choix de la suite. */
  chapterDone?: boolean;
  combat?: CombatState;
}

export type Theme = 'system' | 'light' | 'dark';
export type DiceMode = 'virtual' | 'physical';

export interface Settings {
  theme: Theme;
  diceMode: DiceMode;
  vibrate: boolean;
}

/** Succès obtenus : identifiant du succès → date au format AAAA-MM-JJ. */
export type Unlocked = Record<string, string>;

interface UndoEntry {
  gameId: string;
  label: string;
  snapshot: Game | null;
  /** Annulation d'un succès : l'état précédent des succès du livre. */
  achievements?: { bookId: string; snapshot: Unlocked };
}

interface State {
  games: Record<string, Game>;
  lastGameId?: string;
  /** Succès par livre, communs à toutes les parties. */
  achievements: Record<string, Unlocked>;
  /** Parties supprimées, pour que la synchro ne les fasse pas revenir. */
  deleted: Record<string, string>;
  achievementsAt: Record<string, string>;
  settings: Settings;
  undo: UndoEntry[];
  toast?: { id: number; message: string; undoable: boolean };

  createGame: (bookId: string, items: string[], name: string) => string;
  deleteGame: (id: string) => void;
  openGame: (id: string) => void;
  /** Modifie une partie et empile l'état précédent pour pouvoir annuler. */
  update: (id: string, label: string, fn: (g: Game) => Game, opts?: { toast?: boolean }) => void;
  undoLast: () => void;
  /** Débloque un succès à la date donnée, ou le retire avec `null`. */
  setAchievement: (bookId: string, id: string, date: string | null, label: string) => void;
  importAchievements: (achievements: Record<string, Unlocked>) => void;
  setSettings: (s: Partial<Settings>) => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
  importGames: (games: Game[]) => number;
  /** Remplace les données partagées par le résultat d'une synchro, sans toast ni annulation. */
  applySync: (save: Save) => void;
}

const UNDO_LIMIT = 40;

/** Date les succès d'un livre qui diffèrent entre deux états, pour que la synchro sache lequel est le plus récent. */
function stampChanges(at: Record<string, string>, bookId: string, before: Unlocked, after: Unlocked): Record<string, string> {
  const now = new Date().toISOString();
  const next = { ...at };
  for (const id of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[id] !== after[id]) next[`${bookId}/${id}`] = now;
  }
  return next;
}
let toastSeq = 0;

export const newId = () => crypto.randomUUID();

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      games: {},
      achievements: {},
      deleted: {},
      achievementsAt: {},
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
            deleted: { ...s.deleted, [id]: new Date().toISOString() },
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
        if (entry?.achievements) {
          const { bookId, snapshot } = entry.achievements;
          set(s => ({
            achievements: { ...s.achievements, [bookId]: snapshot },
            achievementsAt: stampChanges(s.achievementsAt, bookId, s.achievements[bookId] ?? {}, snapshot),
            undo: s.undo.slice(0, -1),
            toast: { id: ++toastSeq, message: `Annulé : ${entry.label}`, undoable: false },
          }));
          return;
        }
        if (!entry?.snapshot) return;
        set(s => {
          const deleted = { ...s.deleted };
          delete deleted[entry.gameId];
          return {
            // Date neuve : sinon la synchro reprend la version annulée, plus récente.
            games: { ...s.games, [entry.gameId]: { ...entry.snapshot!, updatedAt: new Date().toISOString() } },
            deleted,
            undo: s.undo.slice(0, -1),
            toast: { id: ++toastSeq, message: `Annulé : ${entry.label}`, undoable: false },
          };
        });
      },

      setAchievement: (bookId, id, date, label) => {
        const previous = get().achievements[bookId] ?? {};
        const next = { ...previous };
        if (date) next[id] = date;
        else delete next[id];
        set(s => ({
          achievements: { ...s.achievements, [bookId]: next },
          achievementsAt: stampChanges(s.achievementsAt, bookId, previous, next),
          undo: [...s.undo, { gameId: '', label, snapshot: null, achievements: { bookId, snapshot: previous } }].slice(-UNDO_LIMIT),
          toast: { id: ++toastSeq, message: label, undoable: true },
        }));
      },

      // On garde la date déjà connue : un import ne fait qu'ajouter des succès.
      importAchievements: imported =>
        set(s => {
          const achievements = { ...s.achievements };
          let achievementsAt = s.achievementsAt;
          for (const [bookId, unlocked] of Object.entries(imported ?? {})) {
            const previous = achievements[bookId] ?? {};
            achievements[bookId] = { ...validUnlocked(unlocked), ...previous };
            achievementsAt = stampChanges(achievementsAt, bookId, previous, achievements[bookId]);
          }
          return { achievements, achievementsAt };
        }),

      setSettings: settings => set(s => ({ settings: { ...s.settings, ...settings } })),
      showToast: message => set({ toast: { id: ++toastSeq, message, undoable: false } }),
      dismissToast: () => set({ toast: undefined }),

      importGames: games => {
        const valid = games.filter(isGame);
        // Une partie importée volontairement l'emporte sur une suppression passée.
        set(s => ({
          games: { ...s.games, ...Object.fromEntries(valid.map(g => [g.id, g])) },
          deleted: Object.fromEntries(Object.entries(s.deleted).filter(([id]) => !valid.some(g => g.id === id))),
        }));
        return valid.length;
      },

      applySync: ({ games, achievements, deleted, achievementsAt }) => set({ games, achievements, deleted, achievementsAt }),
    }),
    {
      name: 'billyhelper',
      version: 1,
      partialize: s => ({
        games: s.games,
        lastGameId: s.lastGameId,
        achievements: s.achievements,
        deleted: s.deleted,
        achievementsAt: s.achievementsAt,
        settings: s.settings,
        undo: s.undo.slice(-10),
      }),
    },
  ),
);

export function useGame(id: string | undefined): Game | undefined {
  return useStore(s => (id ? s.games[id] : undefined));
}

export function vibrate(ms = 10) {
  if (useStore.getState().settings.vibrate) navigator.vibrate?.(ms);
}
