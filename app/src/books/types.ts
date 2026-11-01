export type StatKey = 'hab' | 'adr' | 'end' | 'cha' | 'deg' | 'arm' | 'crit' | 'pvMax';

export type Category = 'ARME' | 'EQUIPEMENT' | 'OUTIL';

export type CharacterId = 'GUERRIER' | 'PRUDENT' | 'PAYSAN' | 'DEBROUILLARD';

/** Règles d'objet codées dans le moteur, activées par identifiant dans la config du livre. */
export type ItemRule = 'arc-exclusif' | 'dague-sans-hab' | 'soin-double';

export type Effects = Partial<Record<StatKey, number>>;

export interface Item {
  id: string;
  label: string;
  category: Category;
  effects: Effects;
  rules?: ItemRule[];
  /** Règle spéciale lisible, affichée sous les effets. */
  special?: string;
}

export interface Character {
  label: string;
  mods: Effects;
  power: string;
}

/** Une case de la table : [dommages infligés par Billy, dommages infligés par l'adversaire]. */
export type TableCell = readonly [number, number];

export interface Counter {
  id: string;
  label: string;
  /** Nombre de cases sur la feuille du livre (indicatif, pas un maximum). */
  track: number;
}

export interface BookConfig {
  id: string;
  tome: number;
  title: string;
  available: true;
  baseStats: Record<Exclude<StatKey, 'pvMax'>, number>;
  items: Item[];
  characters: Record<CharacterId, Character>;
  /** Clé : différence d'HABILETÉ de -7 à 7. Valeur : 6 cases, dé 1 à 6. */
  situationTable: Record<number, readonly TableCell[]>;
  /** Clé : différence d'HABILETÉ de -7 à 7. */
  fleeCost: Record<number, number>;
  counters: Counter[];
}

export interface UpcomingBook {
  id: string;
  tome: number;
  title: string;
  available: false;
}

export type BookEntry = BookConfig | UpcomingBook;
