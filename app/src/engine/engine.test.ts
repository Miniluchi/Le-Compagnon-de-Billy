import { describe, expect, it } from 'vitest';
import { FCDN } from '../books/fcdn';
import {
  continueRound,
  deathSave,
  flee,
  luckyStrike,
  nextRound,
  reroll,
  resolveRound,
  restartRound,
  rollAttack,
  rollDodge,
  startCombat,
  type BaseFighter,
  type CombatCtx,
  type CombatWorld,
  type Foe,
  NO_MODS,
} from './combat';
import { chanceSucceeds } from './rolls';
import { computeBilly } from './stats';

const totals = (ids: string[]) => {
  const { character, stats } = computeBilly(FCDN, ids);
  return { character, ...Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, v.total])) };
};

const fighter = (over: Partial<BaseFighter> = {}): BaseFighter => ({
  hab: 5,
  adr: 1,
  deg: 0,
  arm: 0,
  crit: 0,
  character: 'GUERRIER',
  ...over,
});

const foe = (over: Partial<Foe> = {}): Foe => ({ name: 'Orc', pv: 10, hab: 5, arm: 0, deg: 0, ...over });

function world(base: BaseFighter, foes: Foe[], pv = 20, chance = 5): [CombatCtx, CombatWorld] {
  const ctx = { book: FCDN, base };
  return [ctx, { combat: startCombat(ctx, foes, 0, NO_MODS), pv, chance }];
}

describe('table des situations', () => {
  it('correspond à la photo du livre, y compris les 3 cases corrigées', () => {
    expect(FCDN.situationTable[5][3]).toEqual([5, 1]);
    expect(FCDN.situationTable[6][5]).toEqual([8, 1]);
    expect(FCDN.situationTable[7][4]).toEqual([9, 0]);
    expect(FCDN.situationTable[-7][0]).toEqual([0, 12]);
    expect(FCDN.situationTable[7][5]).toEqual([12, 0]);
    expect(Object.keys(FCDN.situationTable)).toHaveLength(15);
  });

  it('coût de fuite', () => {
    expect([-7, -4, -2, 0, 2, 4, 5, 7].map(d => FCDN.fleeCost[d])).toEqual([5, 3, 1, 1, 1, 1, 0, 0]);
  });
});

describe('création du Billy', () => {
  it('épée + lance + marmite → Guerrier', () => {
    expect(totals(['epee', 'lance', 'marmite'])).toMatchObject({
      character: 'GUERRIER',
      hab: 11,
      adr: 2,
      end: 4,
      pvMax: 12,
      cha: 2,
      arm: 1,
      deg: 1,
      crit: 0,
    });
  });

  it('feuille réelle : épée + cotte + dague → Débrouillard', () => {
    expect(totals(['epee', 'cotte', 'dague'])).toMatchObject({
      character: 'DEBROUILLARD',
      hab: 6,
      adr: 2,
      end: 2,
      cha: 3,
      arm: 2,
      crit: 6,
      pvMax: 6,
    });
    const withBonus = computeBilly(FCDN, ['epee', 'cotte', 'dague'], [{ id: '1', stat: 'end', value: 1, at: '' }]);
    expect(withBonus.stats.end.total).toBe(3);
    expect(withBonus.stats.pvMax.total).toBe(9);
  });

  it("arc + épée + dague : seuls les bonus de l'arc, dague sans HAB", () => {
    const r = computeBilly(FCDN, ['arc', 'epee', 'dague']);
    expect(r.character).toBe('GUERRIER');
    expect(r.stats.hab.total).toBe(2 + 3 + 2);
    expect(r.stats.crit.total).toBe(4 + 6);
    expect(r.ignored.map(i => i.itemId)).toEqual(['epee', 'dague']);
  });

  it('dague avec deux armes : pas de +1 HAB', () => {
    expect(computeBilly(FCDN, ['epee', 'lance', 'dague']).stats.hab.total).toBe(2 + 4 + 3 + 2);
  });

  it("l'adresse ne dépasse jamais 5", () => {
    const r = computeBilly(FCDN, ['lance', 'cotte', 'escalade'], [{ id: '1', stat: 'adr', value: 5, at: '' }]);
    expect(r.stats.adr.total).toBe(5);
    expect(r.stats.adr.capped).toBe(true);
  });
});

describe('jets', () => {
  it('exemple du livre : 5 chance, jet sur 5 ou moins', () => {
    expect(chanceSucceeds(5, 5)).toBe(true);
    expect(chanceSucceeds(6, 5)).toBe(false);
    expect(chanceSucceeds(6, 7)).toBe(true);
  });
});

describe('résolution d’un tour', () => {
  it('Billy (5 PV) vs Orc (2 PV), 6–1 : l’orc meurt, Billy finit à 4', () => {
    // diff +6, dé 4 → 6–1
    const r = resolveRound({
      book: FCDN,
      diff: 6,
      attackDie: 4,
      billy: fighter({ deg: 0 }),
      foe: foe({ pv: 2 }),
      billyPv: 5,
      foePv: 2,
    });
    expect(r.cell).toEqual([6, 1]);
    expect(r.foePvAfter).toBe(0);
    expect(r.billyPvAfter).toBe(4);
  });

  it('mort mutuelle 3–6 : Billy gagne sans perdre de PV', () => {
    // diff -1, dé 1 → 3–6
    const r = resolveRound({
      book: FCDN,
      diff: -1,
      attackDie: 1,
      billy: fighter(),
      foe: foe({ pv: 2 }),
      billyPv: 5,
      foePv: 2,
    });
    expect(r.cell).toEqual([3, 6]);
    expect(r.mutualDeath).toBe(true);
    expect(r.billyPvAfter).toBe(5);
  });

  it('exemple critique : situation −4, dé 2, esquive 1 → 11 dommages', () => {
    const r = resolveRound({
      book: FCDN,
      diff: -4,
      attackDie: 2,
      dodgeDie: 1,
      billy: fighter({ adr: 4, deg: 1, crit: 7 }),
      foe: foe({ pv: 30, arm: 3 }),
      billyPv: 10,
      foePv: 30,
    });
    expect(r.cell).toEqual([2, 6]);
    expect(r.dodge).toBe('crit');
    expect(r.toFoe).toBe(11);
    expect(r.toBilly).toBe(0);
  });

  it('dégâts et armure', () => {
    const r = resolveRound({
      book: FCDN,
      diff: 0,
      attackDie: 3,
      billy: fighter({ deg: 1, arm: 2 }),
      foe: foe({ arm: 1, deg: 2 }),
      billyPv: 10,
      foePv: 10,
    });
    expect(r.toFoe).toBe(3 + 1 - 1);
    expect(r.toBilly).toBe(3 + 2 - 2);
  });

  it('plafond Paysan après armure', () => {
    const r = resolveRound({
      book: FCDN,
      diff: -7,
      attackDie: 1,
      billy: fighter({ character: 'PAYSAN', arm: 2 }),
      foe: foe(),
      billyPv: 20,
      foePv: 10,
    });
    expect(r.toBilly).toBe(3);
    expect(r.paysanCapped).toBe(true);
  });

  it('esquive simple', () => {
    const r = resolveRound({
      book: FCDN,
      diff: 0,
      attackDie: 1,
      dodgeDie: 3,
      billy: fighter({ adr: 3 }),
      foe: foe(),
      billyPv: 10,
      foePv: 10,
    });
    expect(r.dodge).toBe('dodged');
    expect(r.toBilly).toBe(0);
    expect(r.toFoe).toBe(3);
  });

  it('coup chanceux : double le résultat final, ou 0 en cas d’échec', () => {
    const base = { book: FCDN, diff: 0, attackDie: 3 as const, billy: fighter({ deg: 1 }), foe: foe({ arm: 1 }), billyPv: 10, foePv: 10 };
    expect(resolveRound({ ...base, lucky: { die: 1, success: true } }).toFoe).toBe(6);
    expect(resolveRound({ ...base, lucky: { die: 6, success: false } }).toFoe).toBe(0);
  });
});

describe('déroulé du combat', () => {
  it('domination : victoire immédiate', () => {
    const [, w] = world(fighter({ hab: 13 }), [foe({ hab: 5 })]);
    expect(w.combat.phase).toBe('won');
  });

  it('domination adverse : défaite immédiate', () => {
    const [, w] = world(fighter({ hab: 2 }), [foe({ hab: 10 })]);
    expect(w.combat.phase).toBe('lost');
  });

  it('sans esquive ni pouvoir : un seul jet résout le tour', () => {
    const [ctx, w] = world(fighter(), [foe()]);
    const after = rollAttack(ctx, w, 3);
    expect(after.combat.phase).toBe('summary');
    expect(after.pv).toBe(17);
    expect(after.combat.foePv).toBe(7);
  });

  it('recommencer le tour rend PV, chance et dés d’avant le jet', () => {
    const [ctx, w] = world(fighter({ character: 'PRUDENT' }), [foe()]);
    const round2 = nextRound(continueRound(ctx, rollAttack(ctx, w, 3)));
    const played = continueRound(ctx, luckyStrike(ctx, rollAttack(ctx, round2, 3), 6));
    expect(played.pv).toBeLessThan(round2.pv);
    expect(played.chance).toBe(round2.chance - 1);
    const back = restartRound(played);
    expect(back).toEqual({ ...round2, combat: { ...round2.combat, roundStart: undefined } });
    expect(back.combat.phase).toBe('attack');
    expect(back.combat.round).toBe(2);
  });

  it('avec ADR ≥ 2 : attaque puis esquive', () => {
    const [ctx, w] = world(fighter({ adr: 3 }), [foe()]);
    const a = rollAttack(ctx, w, 3);
    expect(a.combat.phase).toBe('dodge');
    const b = rollDodge(ctx, a, 2);
    expect(b.pv).toBe(20);
    expect(b.combat.phase).toBe('summary');
  });

  it('Débrouillard : relance unique, puis esquive', () => {
    const [ctx, w] = world(fighter({ character: 'DEBROUILLARD', adr: 3 }), [foe()]);
    const a = rollAttack(ctx, w, 1);
    expect(a.combat.phase).toBe('decide');
    const b = reroll(ctx, a, 6);
    expect(b.combat.attackDie).toBe(6);
    expect(b.combat.rerolledFrom).toBe(1);
    expect(b.combat.phase).toBe('dodge');
  });

  it('adversaires à la suite', () => {
    const [ctx, w] = world(fighter({ hab: 10 }), [foe({ name: 'A', pv: 3 }), foe({ name: 'B', pv: 3 })]);
    const a = rollAttack(ctx, w, 6);
    expect(a.combat.foeIndex).toBe(1);
    expect(a.combat.foePv).toBe(3);
    const b = rollAttack(ctx, nextRound(a), 6);
    expect(b.combat.phase).toBe('won');
  });

  it('Prudent : survie miraculeuse au coût croissant', () => {
    const [ctx, w] = world(fighter({ character: 'PRUDENT' }), [foe({ pv: 50 })], 3, 5);
    let s = continueRound(ctx, rollAttack(ctx, w, 1));
    expect(s.combat.phase).toBe('death-save');
    s = deathSave(ctx, s, 2);
    expect(s.pv).toBe(3);
    expect(s.chance).toBe(4);
    s = continueRound(ctx, rollAttack(ctx, nextRound(s), 1));
    expect(s.combat.phase).toBe('death-save');
    s = deathSave(ctx, s, 6);
    expect(s.chance).toBe(2);
    expect(s.combat.phase).toBe('lost');
  });

  it('Prudent : coup chanceux coûte 1 chance', () => {
    const [ctx, w] = world(fighter({ character: 'PRUDENT' }), [foe()]);
    const a = luckyStrike(ctx, rollAttack(ctx, w, 3), 2);
    expect(a.chance).toBe(4);
    const b = continueRound(ctx, a);
    expect(b.combat.foePv).toBe(10 - 6);
  });

  it('Prudent : fuite réussie ou ratée', () => {
    const [ctx, w] = world(fighter({ character: 'PRUDENT', hab: 0 }), [foe({ hab: 4 })], 20, 5);
    const ok = flee(ctx, w, 2);
    expect(ok.combat.phase).toBe('fled');
    expect(ok.chance).toBe(2);
    const ko = flee(ctx, w, 6);
    expect(ko.chance).toBe(4);
    expect(ko.combat.fleeTried).toBe(true);
    expect(flee(ctx, ko, 1)).toBe(ko);
  });
});
