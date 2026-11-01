import type { Effects, StatKey } from '../books';
import { STAT_SHORT } from '../engine/stats';

export function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${-n}`;
  return '0';
}

const EFFECT_ORDER: StatKey[] = ['hab', 'adr', 'end', 'cha', 'deg', 'arm', 'crit', 'pvMax'];

export function formatEffects(effects: Effects): string {
  return EFFECT_ORDER.filter(k => effects[k])
    .map(k => `${signed(effects[k]!)} ${STAT_SHORT[k]}`)
    .join(', ');
}
