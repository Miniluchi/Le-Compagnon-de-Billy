import { describe, expect, it } from 'vitest';
import type { Game } from './store';
import { mergeSave, type Save } from './sync';

const game = (id: string, updatedAt: string, name = id) => ({ id, bookId: 'fcdn', name, items: [], updatedAt }) as unknown as Game;
const save = (games: Game[] = [], deleted: Record<string, string> = {}, achievements = {}): Save => ({
  games: Object.fromEntries(games.map(g => [g.id, g])),
  deleted,
  achievements,
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

  it('ignore les données distantes invalides', () => {
    const local = save([game('a', '2026-01-01')]);
    expect(mergeSave(local, null)).toEqual(local);
    const m = mergeSave(local, { games: { z: { id: 3 } }, deleted: { a: 42 }, achievements: { fcdn: { x: 'hier' } } });
    expect(m.games).toEqual(local.games);
    expect(m.achievements.fcdn).toEqual({});
  });
});
