import type { BookConfig, CharacterId, TableCell } from '../books';
import { ADR_MAX } from './stats';
import { chanceSucceeds, type DieFace } from './rolls';

export const DOMINATION = 8;

export interface Foe {
  name: string;
  pv: number;
  hab: number;
  arm: number;
  deg: number;
}

/** Modificateurs temporaires du combat (surnombre, situation du chapitre…). */
export interface CombatMods {
  hab: number;
  adr: number;
  deg: number;
  arm: number;
  crit: number;
}

export const NO_MODS: CombatMods = { hab: 0, adr: 0, deg: 0, arm: 0, crit: 0 };

/** Stats de Billy hors combat, issues de computeBilly. */
export interface BaseFighter {
  hab: number;
  adr: number;
  deg: number;
  arm: number;
  crit: number;
  character: CharacterId;
}

export type Fighter = BaseFighter;

export type DodgeOutcome = 'none' | 'failed' | 'dodged' | 'crit';

export interface RoundResult {
  cell: TableCell;
  toFoe: number;
  toBilly: number;
  foeLines: string[];
  billyLines: string[];
  dodge: DodgeOutcome;
  paysanCapped: boolean;
  mutualDeath: boolean;
  billyPvBefore: number;
  foePvBefore: number;
  billyPvAfter: number;
  foePvAfter: number;
}

export type Phase = 'attack' | 'decide' | 'dodge' | 'summary' | 'death-save' | 'won' | 'lost' | 'fled';

export interface LuckyStrike {
  die: DieFace;
  success: boolean;
}

export interface RoundLog {
  round: number;
  foeName: string;
  attackDie: DieFace;
  rerolledFrom?: DieFace;
  dodgeDie?: DieFace;
  lucky?: LuckyStrike;
  result: RoundResult;
  deathSave?: { die: DieFace; cost: number; success: boolean };
}

export interface CombatState {
  foes: Foe[];
  foeIndex: number;
  foePv: number;
  companions: number;
  mods: CombatMods;
  round: number;
  phase: Phase;
  attackDie?: DieFace;
  rerolledFrom?: DieFace;
  dodgeDie?: DieFace;
  lucky?: LuckyStrike;
  fleeTried: boolean;
  deathSaves: number;
  /** Message d'événement à afficher (domination, adversaire suivant, fuite ratée…). */
  notice?: string;
  last?: RoundLog;
  log: RoundLog[];
  /** État juste avant le jet d'attaque du tour en cours, pour « Recommencer ce tour ». */
  roundStart?: { combat: CombatState; pv: number; chance: number };
  /** PV et chance de Billy avant le combat, rendus si on l'annule. */
  before?: { pv: number; chance: number };
}

/** État partagé avec la partie : le combat modifie les PV et la CHANCE de Billy. */
export interface CombatWorld {
  combat: CombatState;
  pv: number;
  chance: number;
}

export interface CombatCtx {
  book: BookConfig;
  base: BaseFighter;
}

export function clampDiff(diff: number): number {
  return Math.max(-7, Math.min(7, diff));
}

export function fighter(base: BaseFighter, combat: Pick<CombatState, 'mods' | 'companions'>): Fighter {
  const { mods, companions } = combat;
  return {
    character: base.character,
    hab: base.hab + mods.hab + companions,
    adr: Math.min(ADR_MAX, base.adr + mods.adr),
    deg: base.deg + mods.deg,
    arm: base.arm + mods.arm,
    crit: base.crit + mods.crit,
  };
}

export function currentFoe(combat: CombatState): Foe {
  return combat.foes[Math.min(combat.foeIndex, combat.foes.length - 1)];
}

export function habDiff(ctx: CombatCtx, combat: CombatState): number {
  return fighter(ctx.base, combat).hab - currentFoe(combat).hab;
}

export const SITUATIONS: { min: number; max: number; label: string }[] = [
  { min: -Infinity, max: -DOMINATION, label: 'Domination adverse' },
  { min: -7, max: -5, label: 'Désavantage lourd' },
  { min: -4, max: -3, label: 'Désavantage' },
  { min: -2, max: -1, label: 'Désavantage léger' },
  { min: 0, max: 0, label: 'Égalité' },
  { min: 1, max: 2, label: 'Avantage léger' },
  { min: 3, max: 4, label: 'Avantage' },
  { min: 5, max: 7, label: 'Avantage lourd' },
  { min: DOMINATION, max: Infinity, label: 'Domination' },
];

export function situationLabel(diff: number): string {
  return SITUATIONS.find(s => diff >= s.min && diff <= s.max)!.label;
}

export function fleeCost(book: BookConfig, diff: number): number {
  return book.fleeCost[clampDiff(diff)];
}

export function hasDodge(f: Fighter): boolean {
  return f.adr >= 2;
}

/** Résolution pure d'un tour (docs/01-regles-du-jeu.md §6.3). */
export function resolveRound(input: {
  book: BookConfig;
  diff: number;
  attackDie: DieFace;
  dodgeDie?: DieFace;
  billy: Fighter;
  foe: Foe;
  lucky?: LuckyStrike;
  billyPv: number;
  foePv: number;
}): RoundResult {
  const { book, billy, foe, attackDie, dodgeDie, lucky, billyPv, foePv } = input;
  const row = book.situationTable[clampDiff(input.diff)];
  const cell = row[attackDie - 1];
  const [b, a] = cell;

  const foeLines = [`Table : ${b}`];
  if (billy.deg) foeLines.push(`${signed(billy.deg)} dégâts`);
  if (foe.arm) foeLines.push(`−${foe.arm} armure adverse`);
  let toFoe = Math.max(0, b + billy.deg - foe.arm);

  const billyLines = [`Table : ${a}`];
  if (foe.deg) billyLines.push(`${signed(foe.deg)} dégâts adverses`);
  if (billy.arm) billyLines.push(`−${billy.arm} armure`);
  let toBilly = Math.max(0, a + foe.deg - billy.arm);

  let paysanCapped = false;
  if (billy.character === 'PAYSAN' && toBilly > 3) {
    toBilly = 3;
    paysanCapped = true;
    billyLines.push('Plafond Paysan : 3');
  }

  let dodge: DodgeOutcome = 'none';
  if (hasDodge(billy) && dodgeDie) {
    if (dodgeDie === 1) {
      dodge = 'crit';
      const max = row[5][0];
      toFoe = max + billy.crit;
      foeLines.length = 0;
      foeLines.push(`Contre-attaque critique : ${max} (max) ${signed(billy.crit)} critique`, 'Armure adverse ignorée');
      toBilly = 0;
      billyLines.push('Esquivé');
    } else if (dodgeDie <= billy.adr) {
      dodge = 'dodged';
      toBilly = 0;
      billyLines.push('Esquivé');
    } else {
      dodge = 'failed';
    }
  }

  if (lucky) {
    toFoe = lucky.success ? toFoe * 2 : 0;
    foeLines.push(lucky.success ? 'Coup chanceux : ×2' : 'Coup chanceux raté : 0');
  }

  let billyPvAfter = billyPv - toBilly;
  const foePvAfter = foePv - toFoe;
  const mutualDeath = foePvAfter <= 0 && billyPvAfter <= 0;
  if (mutualDeath) {
    // Mort mutuelle : Billy achève l'adversaire avant qu'il ne riposte.
    billyPvAfter = billyPv;
    toBilly = 0;
    billyLines.push('Annulé : vous l’achevez avant sa riposte');
  }

  return {
    cell,
    toFoe,
    toBilly,
    foeLines,
    billyLines,
    dodge,
    paysanCapped,
    mutualDeath,
    billyPvBefore: billyPv,
    foePvBefore: foePv,
    billyPvAfter: Math.max(0, billyPvAfter),
    foePvAfter: Math.max(0, foePvAfter),
  };
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `−${-n}`;
}

// ---------------------------------------------------------------------------
// Transitions du combat. Chaque fonction est pure : elle renvoie un nouveau monde.
// ---------------------------------------------------------------------------

export function startCombat(ctx: CombatCtx, foes: Foe[], companions: number, mods: CombatMods): CombatState {
  const combat: CombatState = {
    foes,
    foeIndex: 0,
    foePv: foes[0].pv,
    companions,
    mods,
    round: 1,
    phase: 'attack',
    fleeTried: false,
    deathSaves: 0,
    log: [],
  };
  return applyDomination(ctx, combat);
}

/** Applique la domination (±8) à l'adversaire courant, en enchaînant si besoin. */
function applyDomination(ctx: CombatCtx, combat: CombatState): CombatState {
  let c = combat;
  while (c.phase !== 'won' && c.phase !== 'lost') {
    const diff = habDiff(ctx, c);
    if (diff >= DOMINATION) {
      const name = currentFoe(c).name;
      c = nextFoe({ ...c, foePv: 0 });
      c.notice = `Domination : ${name} est vaincu sans combattre.`;
    } else if (diff <= -DOMINATION) {
      return { ...c, phase: 'lost', notice: `Domination adverse : ${currentFoe(c).name} vous écrase.` };
    } else break;
  }
  return c;
}

function nextFoe(combat: CombatState): CombatState {
  const foeIndex = combat.foeIndex + 1;
  if (foeIndex >= combat.foes.length) return { ...combat, phase: 'won' };
  return { ...combat, foeIndex, foePv: combat.foes[foeIndex].pv };
}

/** Phase de décision après le jet d'attaque : relance (Débrouillard) ou coup chanceux (Prudent). */
function needsDecision(ctx: CombatCtx, world: CombatWorld): boolean {
  const { combat } = world;
  if (ctx.base.character === 'DEBROUILLARD') return combat.rerolledFrom === undefined;
  if (ctx.base.character === 'PRUDENT') return !combat.lucky && world.chance > 0;
  return false;
}

export function rollAttack(ctx: CombatCtx, world: CombatWorld, die: DieFace): CombatWorld {
  const combat: CombatState = {
    ...world.combat,
    roundStart: { combat: { ...world.combat, roundStart: undefined }, pv: world.pv, chance: world.chance },
    attackDie: die,
    rerolledFrom: undefined,
    dodgeDie: undefined,
    lucky: undefined,
    notice: undefined,
    phase: 'decide',
  };
  return afterAttack(ctx, { ...world, combat });
}

function afterAttack(ctx: CombatCtx, world: CombatWorld): CombatWorld {
  if (needsDecision(ctx, world)) return { ...world, combat: { ...world.combat, phase: 'decide' } };
  return continueRound(ctx, world);
}

/** Termine la phase de décision : esquive si ADR ≥ 2, sinon résolution. */
export function continueRound(ctx: CombatCtx, world: CombatWorld): CombatWorld {
  if (hasDodge(fighter(ctx.base, world.combat))) return { ...world, combat: { ...world.combat, phase: 'dodge' } };
  return resolve(ctx, world);
}

export function reroll(ctx: CombatCtx, world: CombatWorld, die: DieFace): CombatWorld {
  const { combat } = world;
  if (ctx.base.character !== 'DEBROUILLARD' || combat.rerolledFrom !== undefined) return world;
  return continueRound(ctx, { ...world, combat: { ...combat, rerolledFrom: combat.attackDie, attackDie: die } });
}

export function luckyStrike(ctx: CombatCtx, world: CombatWorld, die: DieFace): CombatWorld {
  if (ctx.base.character !== 'PRUDENT' || world.combat.lucky || world.chance <= 0) return world;
  const success = chanceSucceeds(die, world.chance);
  return { ...world, chance: world.chance - 1, combat: { ...world.combat, lucky: { die, success } } };
}

export function rollDodge(ctx: CombatCtx, world: CombatWorld, die: DieFace): CombatWorld {
  return resolve(ctx, { ...world, combat: { ...world.combat, dodgeDie: die } });
}

function resolve(ctx: CombatCtx, world: CombatWorld): CombatWorld {
  const { combat } = world;
  const foe = currentFoe(combat);
  const result = resolveRound({
    book: ctx.book,
    diff: habDiff(ctx, combat),
    attackDie: combat.attackDie!,
    dodgeDie: combat.dodgeDie,
    billy: fighter(ctx.base, combat),
    foe,
    lucky: combat.lucky,
    billyPv: world.pv,
    foePv: combat.foePv,
  });
  const entry: RoundLog = {
    round: combat.round,
    foeName: foe.name,
    attackDie: combat.attackDie!,
    rerolledFrom: combat.rerolledFrom,
    dodgeDie: combat.dodgeDie,
    lucky: combat.lucky,
    result,
  };
  let next: CombatState = { ...combat, foePv: result.foePvAfter, last: entry, log: [...combat.log, entry], phase: 'summary' };

  const billyDies = result.billyPvAfter <= 0;
  if (billyDies) {
    const cost = combat.deathSaves + 1;
    const canSave = ctx.base.character === 'PRUDENT' && world.chance >= cost;
    return { ...world, pv: 0, combat: { ...next, phase: canSave ? 'death-save' : 'lost' } };
  }
  if (result.foePvAfter <= 0) {
    next = nextFoe(next);
    if (next.phase !== 'won') {
      next.notice = `${foe.name} est vaincu. Au suivant : ${currentFoe(next).name}.`;
      next = applyDomination(ctx, next);
    }
  }
  return { ...world, pv: result.billyPvAfter, combat: next };
}

export function deathSaveCost(combat: CombatState): number {
  return combat.deathSaves + 1;
}

export function deathSave(_ctx: CombatCtx, world: CombatWorld, die: DieFace): CombatWorld {
  const { combat } = world;
  const last = combat.last;
  if (combat.phase !== 'death-save' || !last) return world;
  const cost = deathSaveCost(combat);
  const success = chanceSucceeds(die, world.chance);
  const log = combat.log.map(l => (l === last ? { ...l, deathSave: { die, cost, success } } : l));
  if (!success) return { ...world, chance: world.chance - cost, combat: { ...combat, log, phase: 'lost' } };
  return {
    ...world,
    chance: world.chance - cost,
    pv: last.result.billyPvBefore,
    combat: {
      ...combat,
      log,
      deathSaves: combat.deathSaves + 1,
      phase: 'summary',
      notice: 'Survie miraculeuse : les dégâts reçus sont annulés.',
    },
  };
}

export function giveUpDeathSave(world: CombatWorld): CombatWorld {
  return { ...world, combat: { ...world.combat, phase: 'lost' } };
}

export function nextRound(world: CombatWorld): CombatWorld {
  const { combat } = world;
  if (combat.phase !== 'summary') return world;
  return {
    ...world,
    combat: {
      ...combat,
      round: combat.round + 1,
      phase: 'attack',
      attackDie: undefined,
      rerolledFrom: undefined,
      dodgeDie: undefined,
      lucky: undefined,
    },
  };
}

export function restartRound(world: CombatWorld): CombatWorld {
  const start = world.combat.roundStart;
  return start ? { pv: start.pv, chance: start.chance, combat: start.combat } : world;
}

export function canFlee(ctx: CombatCtx, world: CombatWorld): boolean {
  const { combat } = world;
  return (
    ctx.base.character === 'PRUDENT' &&
    combat.round === 1 &&
    combat.foeIndex === 0 &&
    combat.phase === 'attack' &&
    !combat.fleeTried &&
    world.chance > 0 &&
    world.chance >= fleeCost(ctx.book, habDiff(ctx, combat))
  );
}

export function flee(ctx: CombatCtx, world: CombatWorld, die: DieFace): CombatWorld {
  if (!canFlee(ctx, world)) return world;
  const cost = fleeCost(ctx.book, habDiff(ctx, world.combat));
  if (chanceSucceeds(die, world.chance)) {
    return {
      ...world,
      chance: world.chance - cost,
      combat: { ...world.combat, phase: 'fled', notice: `Fuite réussie (dé ${die}) : −${cost} chance.` },
    };
  }
  return {
    ...world,
    chance: world.chance - 1,
    combat: { ...world.combat, fleeTried: true, notice: `Fuite ratée (dé ${die}) : −1 chance, le combat continue.` },
  };
}
