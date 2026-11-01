import { describe, expect, it } from 'vitest';
import { FCDN } from '../books/fcdn';
import { achievementProgress, today } from './achievements';

describe('Succès', () => {
  const all = FCDN.achievements.flatMap(g => g.items);

  it('le livre liste 51 succès plus LA MAX, sans doublon', () => {
    expect(all).toHaveLength(51);
    expect(new Set(all.map(a => a.id)).size).toBe(51);
    expect(FCDN.finalAchievement?.title).toBe('LA MAX !!');
  });

  it('compte les succès cochés, LA MAX reste à obtenir', () => {
    const p = achievementProgress(FCDN, { 'filtre-a-journaliste': '2021-10-07', 'cheval-de-trois': '2026-11-01', inconnu: '2020-01-01' });
    expect(p.count).toBe(2);
    expect(p.finalDate).toBeUndefined();
  });

  it('LA MAX tombe avec le dernier succès, à sa date', () => {
    const unlocked = Object.fromEntries(all.map((a, i) => [a.id, i === 10 ? '2026-11-01' : '2021-10-07']));
    expect(achievementProgress(FCDN, unlocked).finalDate).toBe('2026-11-01');
  });

  it('date du jour au format AAAA-MM-JJ', () => {
    expect(today(new Date(2021, 9, 7, 23, 59))).toBe('2021-10-07');
  });
});
