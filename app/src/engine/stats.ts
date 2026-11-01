import type { BookConfig, Category, CharacterId, Item, StatKey } from '../books';

export const ADR_MAX = 5;

export const STAT_LABELS: Record<StatKey, string> = {
  hab: 'Habileté',
  adr: 'Adresse',
  end: 'Endurance',
  cha: 'Chance',
  deg: 'Dégâts',
  arm: 'Armure',
  crit: 'Critique',
  pvMax: 'PV max',
};

export const STAT_SHORT: Record<StatKey, string> = {
  hab: 'HAB',
  adr: 'ADR',
  end: 'END',
  cha: 'CHA',
  deg: 'DEG',
  arm: 'ARM',
  crit: 'CRIT',
  pvMax: 'PV MAX',
};

export interface Bonus {
  id: string;
  stat: StatKey;
  value: number;
  reason?: string;
  at: string;
}

export interface StatBreakdown {
  /** Base du livre, ou END × 3 pour les PV max. */
  base: number;
  carac: number;
  materiel: number;
  bonus: number;
  total: number;
  /** Vrai si le total a été ramené au plafond (ADRESSE ≤ 5). */
  capped: boolean;
}

export interface IgnoredEffect {
  itemId: string;
  stat?: StatKey;
  reason: string;
}

export interface BillyStats {
  character: CharacterId;
  stats: Record<StatKey, StatBreakdown>;
  ignored: IgnoredEffect[];
  hasRule: (rule: NonNullable<Item['rules']>[number]) => boolean;
}

const STAT_KEYS: StatKey[] = ['hab', 'adr', 'end', 'cha', 'deg', 'arm', 'crit', 'pvMax'];

export function resolveItems(book: BookConfig, itemIds: string[]): Item[] {
  return itemIds.map(id => {
    const item = book.items.find(i => i.id === id);
    if (!item) throw new Error(`Objet inconnu : ${id}`);
    return item;
  });
}

export function countCategories(items: Item[]): Record<Category, number> {
  const counts: Record<Category, number> = { ARME: 0, EQUIPEMENT: 0, OUTIL: 0 };
  for (const item of items) counts[item.category]++;
  return counts;
}

/** Caractère déterminé par les catégories des 3 objets choisis. */
export function determineCharacter(items: Item[]): CharacterId {
  const counts = countCategories(items);
  if (counts.ARME >= 2) return 'GUERRIER';
  if (counts.EQUIPEMENT >= 2) return 'PRUDENT';
  if (counts.OUTIL >= 2) return 'PAYSAN';
  return 'DEBROUILLARD';
}

export function computeBilly(book: BookConfig, itemIds: string[], bonuses: Bonus[] = []): BillyStats {
  const items = resolveItems(book, itemIds);
  const character = determineCharacter(items);
  const counts = countCategories(items);
  const hasBow = items.some(i => i.rules?.includes('arc-exclusif'));
  const ignored: IgnoredEffect[] = [];

  const materiel: Record<StatKey, number> = { hab: 0, adr: 0, end: 0, cha: 0, deg: 0, arm: 0, crit: 0, pvMax: 0 };
  for (const item of items) {
    // L'arc se tient à deux mains : les autres armes n'apportent rien.
    if (hasBow && item.category === 'ARME' && !item.rules?.includes('arc-exclusif')) {
      ignored.push({ itemId: item.id, reason: `${item.label} : bonus ignorés, l'arc occupe les deux mains.` });
      continue;
    }
    for (const [stat, value] of Object.entries(item.effects) as [StatKey, number][]) {
      if (item.rules?.includes('dague-sans-hab') && stat === 'hab' && (hasBow || counts.ARME >= 2)) {
        ignored.push({
          itemId: item.id,
          stat,
          reason: `${item.label} : pas de +${value} HAB avec ${hasBow ? "l'arc" : 'deux armes'}.`,
        });
        continue;
      }
      materiel[stat] += value;
    }
  }

  const mods = book.characters[character].mods;
  const bonusTotals: Record<StatKey, number> = { hab: 0, adr: 0, end: 0, cha: 0, deg: 0, arm: 0, crit: 0, pvMax: 0 };
  for (const b of bonuses) bonusTotals[b.stat] += b.value;

  const stats = {} as Record<StatKey, StatBreakdown>;
  for (const stat of STAT_KEYS) {
    if (stat === 'pvMax') continue;
    const base = book.baseStats[stat];
    const carac = mods[stat] ?? 0;
    const raw = base + carac + materiel[stat] + bonusTotals[stat];
    const capped = stat === 'adr' && raw > ADR_MAX;
    stats[stat] = { base, carac, materiel: materiel[stat], bonus: bonusTotals[stat], total: capped ? ADR_MAX : raw, capped };
  }

  const pvBase = stats.end.total * 3;
  const pvCarac = mods.pvMax ?? 0;
  stats.pvMax = {
    base: pvBase,
    carac: pvCarac,
    materiel: materiel.pvMax,
    bonus: bonusTotals.pvMax,
    total: Math.max(1, pvBase + pvCarac + materiel.pvMax + bonusTotals.pvMax),
    capped: false,
  };

  return {
    character,
    stats,
    ignored,
    hasRule: rule => items.some(i => i.rules?.includes(rule)),
  };
}
