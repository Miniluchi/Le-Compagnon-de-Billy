import { useState } from 'react';
import {
  canFlee,
  clampDiff,
  continueRound,
  currentFoe,
  deathSave,
  deathSaveCost,
  fighter,
  flee,
  fleeCost,
  giveUpDeathSave,
  habDiff,
  hasDodge,
  luckyStrike,
  nextRound,
  NO_MODS,
  reroll,
  rollAttack,
  rollDodge,
  situationLabel,
  startCombat,
  type CombatCtx,
  type CombatMods,
  type CombatState,
  type CombatWorld,
  type Foe,
  type RoundLog,
} from '../engine/combat';
import type { DieFace } from '../engine/rolls';
import { useBilly } from '../store/derived';
import { useStore, type Game } from '../store/store';
import { Frame, Stepper } from '../ui/common';
import { signed } from '../ui/format';
import { DiceRoller, DieFaceSvg } from '../ui/Dice';
import { Icon } from '../ui/Icon';
import { Confirm } from '../ui/Sheet';

export function CombatScreen({ game }: { game: Game }) {
  return game.combat ? <ActiveCombat game={game} combat={game.combat} /> : <CombatSetup game={game} />;
}

// ---------------------------------------------------------------------------
// Préparation
// ---------------------------------------------------------------------------

// Le livre présente toujours un seul adversaire : un groupe (« Horde de gobelins ») a ses propres stats.
const NEW_FOE: Foe = { name: 'Adversaire', pv: 8, hab: 5, arm: 0, deg: 0 };

function CombatSetup({ game }: { game: Game }) {
  const { book, base } = useBilly(game);
  const update = useStore(s => s.update);
  const [foe, setFoe] = useState<Foe>(NEW_FOE);
  const [companions, setCompanions] = useState(0);
  const [mods, setMods] = useState<CombatMods>(NO_MODS);

  const ctx: CombatCtx = { book, base };
  const draft = { foes: [foe], foeIndex: 0, mods, companions } as CombatState;
  const diff = habDiff(ctx, draft);

  const patchFoe = (patch: Partial<Foe>) => setFoe(f => ({ ...f, ...patch }));

  const start = () =>
    update(game.id, 'Combat commencé', g => ({ ...g, combat: startCombat(ctx, [foe], companions, mods) }), { toast: false });

  return (
    <>
      <h1 className="title">Préparer le combat</h1>
      <p className="muted small">Recopiez les stats de l'adversaire données par le chapitre.</p>

      <div className="cols">
        <div className="col">
          <Frame>
            <input
              className="input"
              style={{ marginBottom: 10 }}
              value={foe.name}
              onChange={e => patchFoe({ name: e.target.value })}
              aria-label="Nom de l'adversaire"
            />
            <div className="grid-2">
              <Field label="PV">
                <Stepper value={foe.pv} onChange={pv => patchFoe({ pv })} label="PV" min={1} />
              </Field>
              <Field label="Habileté">
                <Stepper value={foe.hab} onChange={hab => patchFoe({ hab })} label="Habileté" min={0} />
              </Field>
              <Field label="Armure">
                <Stepper value={foe.arm} onChange={arm => patchFoe({ arm })} label="Armure" min={0} />
              </Field>
              <Field label="Dégâts">
                <Stepper value={foe.deg} onChange={deg => patchFoe({ deg })} label="Dégâts" min={-5} />
              </Field>
            </div>
          </Frame>
        </div>
        <div className="col">
          <Frame title="Compagnons">
            <p className="small muted" style={{ marginBottom: 8 }}>
              Additionnez l'habileté de vos compagnons (icône bouclier « +N » dans le livre).
            </p>
            <Stepper value={companions} onChange={setCompanions} label="Habileté des compagnons" min={0} />
          </Frame>

          <details className="frame">
            <summary className="label" style={{ minHeight: 32, cursor: 'pointer' }}>
              Modificateurs du chapitre (surnombre…)
            </summary>
            <ModsEditor mods={mods} onChange={setMods} />
          </details>

          <SituationBanner ctx={ctx} combat={draft} />

          <button type="button" className="btn primary block" onClick={start} disabled={!foe.name.trim()}>
            Commencer le combat
          </button>
          {base.character === 'PRUDENT' && (
            <p className="small muted">
              Billy prudent : vous pourrez tenter de fuir au premier tour pour {fleeCost(book, diff)} point(s) de chance.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

const MOD_LABELS: [keyof CombatMods, string][] = [
  ['hab', 'Habileté'],
  ['adr', 'Adresse'],
  ['deg', 'Dégâts'],
  ['arm', 'Armure'],
  ['crit', 'Critique'],
];

function ModsEditor({ mods, onChange }: { mods: CombatMods; onChange: (m: CombatMods) => void }) {
  return (
    <div className="grid-2" style={{ marginTop: 10 }}>
      {MOD_LABELS.map(([k, label]) => (
        <Field key={k} label={label}>
          <Stepper value={mods[k]} onChange={v => onChange({ ...mods, [k]: v })} label={`Modificateur ${label}`} min={-10} max={10} />
        </Field>
      ))}
    </div>
  );
}

function SituationBanner({ ctx, combat, hitDie }: { ctx: CombatCtx; combat: CombatState; hitDie?: DieFace }) {
  const diff = habDiff(ctx, combat);
  const f = fighter(ctx.base, combat);
  const row = ctx.book.situationTable[clampDiff(diff)];
  return (
    <Frame className="situation">
      <p className="heading">{situationLabel(diff)}</p>
      <p className="small muted">
        Votre habileté {f.hab} contre {currentFoe(combat).hab} : écart {signed(diff)}
      </p>
      {Math.abs(diff) < 8 && (
        <div className="table-strip" style={{ marginTop: 10 }} aria-label="Ligne de la table des situations">
          {row.map(([b, a], i) => (
            <div key={i} className={hitDie === i + 1 ? 'hit' : undefined}>
              <DieFaceSvg face={(i + 1) as DieFace} size={18} />
              <div>
                {b}–{a}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="small muted" style={{ marginTop: 6 }}>
        {hasDodge(f) ? `Esquive sur ${f.adr} ou moins, critique sur 1.` : "Adresse sous 2 : pas d'esquive."}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Combat en cours
// ---------------------------------------------------------------------------

function ActiveCombat({ game, combat }: { game: Game; combat: CombatState }) {
  const { book, base, pvMax, chanceMax } = useBilly(game);
  const update = useStore(s => s.update);
  const undoLast = useStore(s => s.undoLast);
  const lastUndo = useStore(s => s.undo.at(-1));
  const [quitting, setQuitting] = useState(false);
  const ctx: CombatCtx = { book, base };
  const foe = currentFoe(combat);
  const f = fighter(base, combat);

  const act = (label: string, fn: (w: CombatWorld) => CombatWorld) =>
    update(
      game.id,
      label,
      g => {
        if (!g.combat) return g;
        const w = fn({ combat: g.combat, pv: g.pv, chance: g.chance });
        return { ...g, combat: w.combat, pv: w.pv, chance: w.chance };
      },
      { toast: false },
    );

  const end = (label: string) => update(game.id, label, g => ({ ...g, combat: undefined }), { toast: false });

  const setPv = (pv: number) => update(game.id, 'PV ajustés', g => ({ ...g, pv: Math.max(0, Math.min(pvMax, pv)) }), { toast: false });
  const setFoe = (patch: Partial<Foe>) =>
    act('Stats adversaire', w => ({
      ...w,
      combat: { ...w.combat, foes: w.combat.foes.map((x, i) => (i === w.combat.foeIndex ? { ...x, ...patch } : x)) },
    }));
  const setFoePv = (foePv: number) => act('PV adversaire ajustés', w => ({ ...w, combat: { ...w.combat, foePv: Math.max(0, foePv) } }));

  const hitDie = combat.phase === 'summary' || combat.phase === 'death-save' ? combat.last?.attackDie : combat.attackDie;
  const over = combat.phase === 'won' || combat.phase === 'lost' || combat.phase === 'fled';

  return (
    <div className="cols">
      <div className="col">
        <div className="versus" aria-live="polite">
          <div>
            <div className="label">Billy</div>
            <div className="figure pv-billy">{game.pv}</div>
            <MiniAdjust value={game.pv} onChange={setPv} label="PV de Billy" />
          </div>
          <div className="muted">contre</div>
          <div>
            <div className="label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {foe.name}
              {combat.foes.length > 1 && ` (${Math.min(combat.foeIndex + 1, combat.foes.length)}/${combat.foes.length})`}
            </div>
            <div className="figure">{combat.foePv}</div>
            <MiniAdjust value={combat.foePv} onChange={setFoePv} label={`PV de ${foe.name}`} />
          </div>
        </div>

        {!over && <SituationBanner ctx={ctx} combat={combat} hitDie={hitDie} />}

        {combat.notice && <p className="notice">{combat.notice}</p>}

        <section className="stack" aria-label="Actions">
          {combat.phase === 'attack' && (
            <>
              <DiceRoller
                label={`Tour ${combat.round} : lancer l'attaque`}
                onResult={d => act(`Attaque : ${d}`, w => rollAttack(ctx, w, d))}
              />
              {canFlee(ctx, { combat, pv: game.pv, chance: game.chance }) && (
                <DiceRoller
                  primary={false}
                  label={`Fuir (jet de chance, coût ${fleeCost(book, habDiff(ctx, combat))})`}
                  onResult={d => act('Tentative de fuite', w => flee(ctx, w, d))}
                />
              )}
            </>
          )}

          {combat.phase === 'decide' && <DecidePanel game={game} combat={combat} ctx={ctx} act={act} />}

          {combat.phase === 'dodge' && (
            <>
              <AttackPreview ctx={ctx} combat={combat} />
              <DiceRoller label={`Lancer l'esquive (${f.adr} ou moins)`} onResult={d => act(`Esquive : ${d}`, w => rollDodge(ctx, w, d))} />
            </>
          )}

          {combat.phase === 'summary' && (
            <DiceRoller
              label={`Tour ${combat.round + 1} : lancer l'attaque`}
              onResult={d => act(`Attaque : ${d}`, w => rollAttack(ctx, nextRound(w), d))}
            />
          )}

          {combat.phase === 'death-save' && (
            <Frame className="ember" title="Coup mortel">
              <p>
                Billy prudent peut tenter de survivre : jet de chance sur {game.chance} ou moins, pour {deathSaveCost(combat)} point(s) de
                chance. En cas de réussite, les dégâts reçus sont annulés.
              </p>
              <div className="stack" style={{ marginTop: 12 }}>
                <DiceRoller
                  label={`Survivre (−${deathSaveCost(combat)} chance)`}
                  onResult={d => act('Survie miraculeuse', w => deathSave(ctx, w, d))}
                />
                <button type="button" className="btn danger block" onClick={() => act('Mort acceptée', giveUpDeathSave)}>
                  Accepter la mort
                </button>
              </div>
            </Frame>
          )}

          {over && (
            <Frame className={combat.phase === 'lost' ? '' : 'ember'}>
              <p className={`verdict ${combat.phase === 'lost' ? 'ko' : 'ok'}`}>
                {combat.phase === 'won' ? 'Victoire' : combat.phase === 'fled' ? 'Combat évité' : 'Billy est mort'}
              </p>
              <p className="small muted" style={{ textAlign: 'center' }}>
                {combat.phase === 'won'
                  ? `Il vous reste ${game.pv}/${pvMax} PV. Visez la bouche, juste pour être sûr.`
                  : combat.phase === 'fled'
                    ? `Il vous reste ${game.chance}/${chanceMax} points de chance.`
                    : 'Vous pouvez annuler la dernière action si vous vous êtes trompé.'}
              </p>
              <div className="stack" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn primary block"
                  onClick={() => end(combat.phase === 'won' ? 'Combat gagné' : combat.phase === 'fled' ? 'Combat évité' : 'Combat perdu')}
                >
                  Terminer le combat
                </button>
              </div>
            </Frame>
          )}
        </section>
      </div>

      <div className="col">
        {combat.last && (combat.phase === 'summary' || combat.phase === 'death-save' || over) && combat.log.length > 0 && (
          <RoundCard entry={combat.last} foeName={combat.last.foeName} />
        )}

        <div className="stack">
          <button type="button" className="btn" onClick={undoLast} disabled={lastUndo?.gameId !== game.id} style={{ minWidth: 0 }}>
            <Icon name="undo" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Annuler{lastUndo?.gameId === game.id && ` : ${lastUndo.label}`}
            </span>
          </button>
          {!over &&
            (combat.log.length === 0 ? (
              <button type="button" className="btn danger" onClick={() => end('Combat annulé')}>
                Annuler le combat
              </button>
            ) : (
              <button type="button" className="btn danger" onClick={() => setQuitting(true)}>
                Quitter le combat
              </button>
            ))}
        </div>

        {combat.log.length > 0 && (
          <details className="frame log">
            <summary className="label" style={{ minHeight: 32, cursor: 'pointer' }}>
              Journal du combat ({combat.log.length} tours)
            </summary>
            <ol className="list" style={{ marginTop: 6 }}>
              {[...combat.log].reverse().map((l, i) => (
                <li key={i}>
                  <span>
                    Tour {l.round} contre {l.foeName} : dé {l.attackDie}
                    {l.rerolledFrom && ` (relancé, était ${l.rerolledFrom})`}
                    {l.dodgeDie && `, esquive ${l.dodgeDie}`}. Vous infligez {l.result.toFoe}, vous subissez {l.result.toBilly}.
                    {l.deathSave && ` Survie ${l.deathSave.success ? 'réussie' : 'ratée'} (dé ${l.deathSave.die}).`}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        )}

        {!over && (
          <details className="frame">
            <summary className="label" style={{ minHeight: 32, cursor: 'pointer' }}>
              Ajuster les stats (Billy et adversaire)
            </summary>
            <p className="label" style={{ marginTop: 10 }}>
              {foe.name}
            </p>
            <div className="grid-2" style={{ marginTop: 6 }}>
              <Field label="Habileté">
                <Stepper value={foe.hab} onChange={hab => setFoe({ hab })} label={`Habileté de ${foe.name}`} min={0} />
              </Field>
              <Field label="Armure">
                <Stepper value={foe.arm} onChange={arm => setFoe({ arm })} label={`Armure de ${foe.name}`} min={0} />
              </Field>
              <Field label="Dégâts">
                <Stepper value={foe.deg} onChange={deg => setFoe({ deg })} label={`Dégâts de ${foe.name}`} min={-5} />
              </Field>
            </div>
            <p className="label" style={{ marginTop: 14 }}>
              Billy
            </p>
            <div className="field" style={{ marginTop: 6 }}>
              <span className="label">Habileté des compagnons</span>
              <Stepper
                value={combat.companions}
                onChange={v => act('Compagnons', w => ({ ...w, combat: { ...w.combat, companions: v } }))}
                label="Habileté des compagnons"
                min={0}
              />
            </div>
            <ModsEditor mods={combat.mods} onChange={m => act('Modificateurs', w => ({ ...w, combat: { ...w.combat, mods: m } }))} />
          </details>
        )}
      </div>

      {quitting && (
        <Confirm
          title="Abandonner le combat ?"
          message="Les PV et la chance perdus pendant le combat restent perdus. Le combat ne sera pas résolu."
          action="Abandonner"
          onConfirm={() => end('Combat abandonné')}
          onClose={() => setQuitting(false)}
        />
      )}
    </div>
  );
}

function MiniAdjust({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 0 }}>
      <button type="button" className="icon-btn" onClick={() => onChange(value - 1)} aria-label={`${label} −1`}>
        <Icon name="minus" size={20} />
      </button>
      <button type="button" className="icon-btn" onClick={() => onChange(value + 1)} aria-label={`${label} +1`}>
        <Icon name="plus" size={20} />
      </button>
    </div>
  );
}

function AttackPreview({ ctx, combat }: { ctx: CombatCtx; combat: CombatState }) {
  if (!combat.attackDie) return null;
  const [b, a] = ctx.book.situationTable[clampDiff(habDiff(ctx, combat))][combat.attackDie - 1];
  return (
    <div className="row" style={{ justifyContent: 'center' }}>
      <DieFaceSvg face={combat.attackDie} size={56} />
      <div>
        <div>
          Table : vous <strong>{b}</strong>, lui <strong>{a}</strong>
        </div>
        {combat.rerolledFrom && <div className="small muted">Relancé (était {combat.rerolledFrom})</div>}
        {combat.lucky && (
          <div className="small muted">
            Coup chanceux {combat.lucky.success ? 'réussi : dégâts doublés' : 'raté : vous n’infligerez rien'} (dé {combat.lucky.die})
          </div>
        )}
      </div>
    </div>
  );
}

function DecidePanel({
  game,
  combat,
  ctx,
  act,
}: {
  game: Game;
  combat: CombatState;
  ctx: CombatCtx;
  act: (label: string, fn: (w: CombatWorld) => CombatWorld) => void;
}) {
  const character = ctx.base.character;
  return (
    <>
      <AttackPreview ctx={ctx} combat={combat} />
      {character === 'DEBROUILLARD' && (
        <>
          <p className="small muted">Billy débrouillard : vous pouvez relancer une fois. Le second jet sera définitif.</p>
          <div className="grid-2">
            <button type="button" className="btn primary" onClick={() => act('Jet gardé', w => continueRound(ctx, w))}>
              Garder ce jet
            </button>
            <DiceRoller primary={false} label="Relancer" onResult={d => act(`Relance : ${d}`, w => reroll(ctx, w, d))} />
          </div>
        </>
      )}
      {character === 'PRUDENT' && (
        <>
          {!combat.lucky && (
            <>
              <p className="small muted">
                Coup chanceux : jet de chance sur {game.chance} ou moins pour 1 point. Réussi, vos dégâts sont doublés ; raté, vous
                n'infligez rien ce tour.
              </p>
              <DiceRoller
                primary={false}
                label="Coup chanceux (−1 chance)"
                onResult={d => act('Coup chanceux', w => luckyStrike(ctx, w, d))}
              />
            </>
          )}
          <button type="button" className="btn primary block" onClick={() => act('Suite du tour', w => continueRound(ctx, w))}>
            Continuer le tour
          </button>
        </>
      )}
    </>
  );
}

function RoundCard({ entry, foeName }: { entry: RoundLog; foeName: string }) {
  const r = entry.result;
  const dodgeText =
    r.dodge === 'crit'
      ? 'Contre-attaque critique !'
      : r.dodge === 'dodged'
        ? 'Esquive réussie'
        : r.dodge === 'failed'
          ? 'Esquive ratée'
          : null;
  return (
    <Frame title={`Tour ${entry.round}`}>
      <div className="row" style={{ justifyContent: 'center', marginBottom: 8 }}>
        <DieFaceSvg face={entry.attackDie} size={40} />
        {entry.dodgeDie && <DieFaceSvg face={entry.dodgeDie} size={40} />}
        {dodgeText && <strong>{dodgeText}</strong>}
      </div>
      <div className="grid-2">
        <div>
          <div className="label">Vous infligez</div>
          <div className="dmg">{r.toFoe}</div>
          <ul className="small muted" style={{ paddingLeft: 18 }}>
            {r.foeLines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="label">Vous subissez</div>
          <div className="dmg" style={{ color: 'var(--blood)' }}>
            {r.toBilly}
          </div>
          <ul className="small muted" style={{ paddingLeft: 18 }}>
            {r.billyLines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
      {r.mutualDeath && (
        <p className="notice small" style={{ marginTop: 8 }}>
          Mort mutuelle : vous achevez {foeName} avant sa riposte.
        </p>
      )}
    </Frame>
  );
}
