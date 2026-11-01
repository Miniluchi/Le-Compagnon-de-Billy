import type { BookConfig, TableCell } from './types';

// Table recopiée de la photo du livre (docs/01-regles-du-jeu.md §6.2).
// Lignes : dé 1 à 6. Colonnes : différence d'HABILETÉ de -7 à +7.
const ROWS: readonly (readonly string[])[] = [
  ['0-12', '1-8', '1-7', '1-6', '2-6', '2-6', '3-6', '3-5', '3-5', '3-5', '3-4', '3-4', '4-4', '4-3', '4-3'],
  ['0-9', '1-7', '1-6', '2-6', '2-5', '2-5', '3-5', '3-4', '3-4', '3-4', '3-3', '3-3', '4-3', '5-2', '5-2'],
  ['1-8', '1-6', '1-5', '2-5', '2-4', '2-4', '3-4', '3-3', '3-3', '3-3', '4-3', '4-2', '5-2', '5-2', '6-2'],
  ['2-6', '2-5', '2-5', '2-4', '3-4', '3-3', '3-3', '3-3', '4-3', '4-2', '4-2', '5-2', '5-1', '6-1', '8-1'],
  ['2-5', '2-5', '3-4', '3-3', '3-3', '4-3', '4-3', '4-3', '5-3', '5-2', '5-2', '6-2', '6-1', '7-1', '9-0'],
  ['3-4', '3-4', '4-4', '4-3', '4-3', '5-3', '5-3', '5-3', '6-3', '6-2', '6-2', '6-1', '7-1', '8-1', '12-0'],
];

function buildTable(): Record<number, TableCell[]> {
  const table: Record<number, TableCell[]> = {};
  for (let diff = -7; diff <= 7; diff++) {
    table[diff] = ROWS.map(row => {
      const [billy, adv] = row[diff + 7].split('-').map(Number);
      return [billy, adv] as const;
    });
  }
  return table;
}

const FLEE_COST = [5, 5, 5, 3, 3, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0];

export const FCDN: BookConfig = {
  id: 'FCDN',
  tome: 1,
  title: 'La Forteresse du Chaudron Noir',
  available: true,
  baseStats: { hab: 2, adr: 1, end: 2, cha: 3, deg: 0, arm: 0, crit: 0 },
  items: [
    { id: 'epee', label: "L'épée", category: 'ARME', effects: { hab: 4 } },
    { id: 'lance', label: 'La lance', category: 'ARME', effects: { hab: 3, adr: 1 } },
    { id: 'morgenstern', label: 'La morgenstern', category: 'ARME', effects: { hab: 1, end: 1, deg: 1 } },
    {
      id: 'arc',
      label: "L'arc",
      category: 'ARME',
      effects: { hab: 3, adr: 1, crit: 4 },
      rules: ['arc-exclusif'],
      special: 'Se tient à deux mains : les bonus des autres armes sont ignorés.',
    },
    { id: 'cotte', label: 'La cotte de mailles', category: 'EQUIPEMENT', effects: { hab: -1, adr: -1, end: 1, arm: 2 } },
    { id: 'marmite', label: 'La marmite', category: 'EQUIPEMENT', effects: { end: 2, arm: 1 } },
    { id: 'pamphlet', label: 'Le pamphlet touristique', category: 'EQUIPEMENT', effects: { cha: 4 } },
    {
      id: 'kit-soin',
      label: 'Le kit de soin',
      category: 'EQUIPEMENT',
      effects: { cha: 1 },
      rules: ['soin-double'],
      special: 'Double les PV récupérés naturellement (ceux donnés par le texte).',
    },
    {
      id: 'fourche',
      label: 'La fourche',
      category: 'OUTIL',
      effects: { hab: 1, end: 3 },
      special: 'Compte comme un objet tenu à la main.',
    },
    {
      id: 'dague',
      label: 'La dague',
      category: 'OUTIL',
      effects: { hab: 1, crit: 6 },
      rules: ['dague-sans-hab'],
      special: "Avec l'arc ou deux armes, seul le +6 CRIT s'applique.",
    },
    { id: 'escalade', label: "Le kit d'escalade", category: 'OUTIL', effects: { adr: 1 } },
    { id: 'grains', label: 'Le sac de grains', category: 'OUTIL', effects: { end: 2, cha: 2 } },
  ],
  characters: {
    GUERRIER: {
      label: 'Guerrier',
      mods: { hab: 2, cha: -1, deg: 1 },
      power: 'Vous infligez +1 DÉGÂTS à toutes vos attaques. Baston !',
    },
    PRUDENT: {
      label: 'Prudent',
      mods: { cha: 2, hab: -1 },
      power: 'Votre CHANCE sert en combat : fuir le combat, survivre à un coup mortel, ou tenter un coup chanceux qui double vos dégâts.',
    },
    PAYSAN: {
      label: 'Paysan',
      mods: { end: 2, adr: -1 },
      power: "Vous ne perdez jamais plus de 3 PV par phase d'attaque, quoi qu'il arrive.",
    },
    DEBROUILLARD: {
      label: 'Débrouillard',
      mods: { adr: 2, end: -1 },
      power: "Vous pouvez relancer le dé d'attaque une fois par tour. Le second jet est définitif.",
    },
  },
  situationTable: buildTable(),
  fleeCost: Object.fromEntries(FLEE_COST.map((cost, i) => [i - 7, cost])),
  counters: [
    { id: 'gloire', label: 'Gloire', track: 13 },
    { id: 'richesse', label: 'Richesse', track: 13 },
  ],
};
