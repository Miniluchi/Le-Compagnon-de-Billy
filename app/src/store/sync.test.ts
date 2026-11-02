import { describe, expect, it } from 'vitest';
import { useStore, type Game } from './store';
import { mergeSave, type Save } from './sync';

const game = (id: string, updatedAt: string, name = id) => ({ id, bookId: 'fcdn', name, items: [], updatedAt }) as unknown as Game;
const save = (games: Game[] = [], deleted: Record<string, string> = {}, achievements = {}, achievementsAt = {}): Save => ({
  games: Object.fromEntries(games.map(g => [g.id, g])),
  deleted,
  achievements,
  achievementsAt,
});

describe('Fusion de sauvegarde', () => {
  it('réunit les parties des deux appareils', () => {
    const m = mergeSave(save([game('a', '2026-01-01')]), save([game('b', '2026-01-01')]));
    expect(Object.keys(m.games).sort()).toEqual(['a', 'b']);
  });

  it('garde la version modifiée en dernier', () => {
    const m = mergeSave(save([game('a', '2026-01-01', 'vieux')]), save([game('a', '2026-02-01', 'neuf')]));
    expect(m.games.a.name).toBe('neuf');
    expect(mergeSave(save([game('a', '2026-03-01', 'local')]), save([game('a', '2026-02-01')])).games.a.name).toBe('local');
  });

  it("une suppression l'emporte sur une version plus ancienne, pas sur une plus récente", () => {
    expect(mergeSave(save(), save([game('a', '2026-01-01')], { a: '2026-02-01' })).games.a).toBeUndefined();
    expect(mergeSave(save([game('a', '2026-01-01')]), save([], { a: '2026-02-01' })).games.a).toBeUndefined();
    expect(mergeSave(save([game('a', '2026-03-01')]), save([], { a: '2026-02-01' })).games.a).toBeDefined();
  });

  it('cumule les succès en gardant la date déjà connue', () => {
    const m = mergeSave(save([], {}, { fcdn: { x: '2026-01-01' } }), save([], {}, { fcdn: { x: '2025-01-01', y: '2026-05-05' } }));
    expect(m.achievements.fcdn).toEqual({ x: '2026-01-01', y: '2026-05-05' });
  });

  it("une annulation n'est pas écrasée par la version distante annulée", () => {
    useStore.setState({ games: { a: game('a', '2020-01-01') }, undo: [] });
    useStore.getState().update('a', 'Combat commencé', g => ({ ...g, combat: {} as Game['combat'] }));
    const remote = save(Object.values(useStore.getState().games));
    useStore.getState().undoLast();
    const { games, achievements, deleted, achievementsAt } = useStore.getState();
    expect(mergeSave({ games, achievements, deleted, achievementsAt }, remote).games.a.combat).toBeUndefined();
  });

  it('un retrait de succès plus récent gagne, une obtention plus récente aussi', () => {
    const remote = save([], {}, { fcdn: { x: '2026-01-01' } }, { 'fcdn/x': '2026-01-01T10:00' });
    expect(mergeSave(save([], {}, { fcdn: {} }, { 'fcdn/x': '2026-01-02T10:00' }), remote).achievements.fcdn).toEqual({});
    const removedRemotely = save([], {}, { fcdn: {} }, { 'fcdn/x': '2026-01-03T10:00' });
    expect(
      mergeSave(save([], {}, { fcdn: { x: '2026-01-01' } }, { 'fcdn/x': '2026-01-01T10:00' }), removedRemotely).achievements.fcdn,
    ).toEqual({});
    const reUnlocked = mergeSave(save([], {}, { fcdn: { x: '2026-01-05' } }, { 'fcdn/x': '2026-01-05T10:00' }), removedRemotely);
    expect(reUnlocked.achievements.fcdn).toEqual({ x: '2026-01-05' });
    expect(reUnlocked.achievementsAt['fcdn/x']).toBe('2026-01-05T10:00');
  });

  it('setAchievement date chaque changement, retrait compris', () => {
    useStore.setState({ achievements: { fcdn: {} }, achievementsAt: {} });
    useStore.getState().setAchievement('fcdn', 'x', '2026-01-01', 'obtenu');
    const unlockedAt = useStore.getState().achievementsAt['fcdn/x'];
    useStore.getState().setAchievement('fcdn', 'x', null, 'retiré');
    expect(useStore.getState().achievementsAt['fcdn/x'] >= unlockedAt).toBe(true);
    useStore.getState().undoLast();
    expect(useStore.getState().achievements.fcdn).toEqual({ x: '2026-01-01' });
  });

  it('ignore les données distantes invalides', () => {
    const local = save([game('a', '2026-01-01')]);
    expect(mergeSave(local, null)).toEqual(local);
    const m = mergeSave(local, { games: { z: { id: 3 } }, deleted: { a: 42 }, achievements: { fcdn: { x: 'hier' } } });
    expect(m.games).toEqual(local.games);
    expect(m.achievements.fcdn).toEqual({});
  });
});
