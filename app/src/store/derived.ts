import { useMemo } from 'react';
import { getBook } from '../books';
import { computeBilly } from '../engine/stats';
import type { BaseFighter } from '../engine/combat';
import type { Game } from './store';

export function useBilly(game: Game) {
  return useMemo(() => {
    const book = getBook(game.bookId);
    const billy = computeBilly(book, game.items, game.bonuses);
    const { stats, character } = billy;
    const base: BaseFighter = {
      hab: stats.hab.total,
      adr: stats.adr.total,
      deg: stats.deg.total,
      arm: stats.arm.total,
      crit: stats.crit.total,
      character,
    };
    return { book, billy, base, pvMax: stats.pvMax.total, chanceMax: stats.cha.total };
  }, [game.bookId, game.items, game.bonuses]);
}

export function currentChapter(game: Game): number | undefined {
  return game.chapters[0];
}
