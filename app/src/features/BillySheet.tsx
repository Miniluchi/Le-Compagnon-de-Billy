import { useState } from 'react';
import type { StatKey } from '../books';
import { ADR_MAX, STAT_LABELS, STAT_SHORT, type StatBreakdown } from '../engine/stats';
import { useBilly } from '../store/derived';
import { newId, useStore, type Game } from '../store/store';
import { Frame, Stepper } from '../ui/common';
import { formatEffects, signed } from '../ui/format';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';

const MAIN: StatKey[] = ['hab', 'adr', 'end', 'cha'];
const SECONDARY: StatKey[] = ['deg', 'arm', 'crit', 'pvMax'];

export function BillySheet({ game }: { game: Game }) {
  const { book, billy } = useBilly(game);
  const update = useStore(s => s.update);
  const [adding, setAdding] = useState<StatKey | null>(null);
  const character = book.characters[billy.character];

  const removeBonus = (id: string) => update(game.id, 'Bonus retiré', g => ({ ...g, bonuses: g.bonuses.filter(b => b.id !== id) }));

  return (
    <>
      <Frame title="Caractère">
        <p className="title" style={{ textAlign: 'center' }}>
          {character.label}
        </p>
        <p style={{ marginTop: 6 }}>{character.power}</p>
      </Frame>

      <div className="grid-2 stats-grid">
        {MAIN.map(k => (
          <StatFrame key={k} stat={k} data={billy.stats[k]} onAdd={() => setAdding(k)} />
        ))}
      </div>

      <div className="cols">
        <div className="col">
          <Frame title="Stats secondaires">
            <ul className="list">
              {SECONDARY.map(k => (
                <li key={k}>
                  <span>{STAT_LABELS[k]}</span>
                  <span className="small muted">{secondaryDetail(k, billy.stats[k])}</span>
                  <span className="figure" style={{ fontSize: 28, minWidth: '2ch', textAlign: 'right' }}>
                    {billy.stats[k].total}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Ajouter un bonus de ${STAT_LABELS[k]}`}
                    onClick={() => setAdding(k)}
                  >
                    <Icon name="plus" size={20} />
                  </button>
                </li>
              ))}
            </ul>
          </Frame>

          <Frame title="Matériel">
            <ul className="list">
              {game.items.map(id => {
                const item = book.items.find(i => i.id === id)!;
                return (
                  <li key={id} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '8px 0', gap: 0 }}>
                    <strong>{item.label}</strong>
                    <span className="small">{formatEffects(item.effects)}</span>
                    {item.special && <span className="small muted">{item.special}</span>}
                  </li>
                );
              })}
            </ul>
            {billy.ignored.map(i => (
              <p key={i.itemId + (i.stat ?? '')} className="notice small" style={{ marginTop: 8 }}>
                {i.reason}
              </p>
            ))}
          </Frame>
        </div>
        <Frame title="Gains d'aventure">
          {game.bonuses.length === 0 ? (
            <p className="empty">Quand le livre vous donne ou retire un point de stat, ajoutez-le avec le bouton + d'une stat.</p>
          ) : (
            <ul className="list">
              {game.bonuses.map(b => (
                <li key={b.id}>
                  <span>
                    <strong>
                      {signed(b.value)} {STAT_LABELS[b.stat]}
                    </strong>
                    {b.reason && <span className="muted">, {b.reason}</span>}
                  </span>
                  <button type="button" className="icon-btn" aria-label="Retirer ce bonus" onClick={() => removeBonus(b.id)}>
                    <Icon name="close" size={20} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Frame>
      </div>

      {adding && <BonusSheet game={game} initial={adding} onClose={() => setAdding(null)} />}
    </>
  );
}

function secondaryDetail(stat: StatKey, d: StatBreakdown): string {
  const parts: string[] = [];
  if (stat === 'pvMax') parts.push(`END × 3 = ${d.base}`);
  if (d.carac) parts.push(`caractère ${signed(d.carac)}`);
  if (d.materiel) parts.push(`matériel ${signed(d.materiel)}`);
  if (d.bonus) parts.push(`gains ${signed(d.bonus)}`);
  return parts.join(', ');
}

function StatFrame({ stat, data, onAdd }: { stat: StatKey; data: StatBreakdown; onAdd: () => void }) {
  // Toujours les mêmes lignes, pour que toutes les tuiles aient la même forme.
  const rows: [string, number][] = [
    ['Base', data.base],
    ['Caractère', data.carac],
    ['Matériel', data.materiel],
    ['Gains', data.bonus],
  ];
  return (
    <section className="frame stat-tile">
      <div className="stat-tile-head">
        <h2 className="heading">{STAT_LABELS[stat]}</h2>
        <span className="figure">{data.total}</span>
      </div>
      <div className="breakdown">
        {rows.map(([label, value]) => (
          <span key={label} style={{ display: 'contents' }}>
            <span>{label}</span>
            <span>{label === 'Base' ? value : signed(value)}</span>
          </span>
        ))}
      </div>
      {stat === 'adr' && <p className="small muted">{data.capped ? `Plafonnée à ${ADR_MAX}.` : `Ne peut dépasser ${ADR_MAX}.`}</p>}
      <button type="button" className="btn ghost block stat-tile-add" onClick={onAdd}>
        <Icon name="plus" size={20} /> Gain
      </button>
    </section>
  );
}

function BonusSheet({ game, initial, onClose }: { game: Game; initial: StatKey; onClose: () => void }) {
  const update = useStore(s => s.update);
  const [stat, setStat] = useState<StatKey>(initial);
  const [value, setValue] = useState(1);
  const [reason, setReason] = useState(game.chapters[0] ? `chap. ${game.chapters[0]}` : '');

  const save = () => {
    if (!value) return;
    // Les réserves (PV, CHANCE) ne bougent pas : le livre précise s'il faut aussi les remplir.
    update(
      game.id,
      `${signed(value)} ${STAT_LABELS[stat]}`,
      g => ({
        ...g,
        bonuses: [...g.bonuses, { id: newId(), stat, value, reason: reason.trim() || undefined, at: new Date().toISOString() }],
      }),
      { toast: false },
    );
    onClose();
  };

  return (
    <Sheet title="Gain d'aventure" onClose={onClose}>
      <div className="stat-picker" role="group" aria-label="Statistique">
        {[...MAIN, ...SECONDARY].map(k => (
          <button key={k} type="button" aria-pressed={k === stat} onClick={() => setStat(k)}>
            {STAT_SHORT[k]}
          </button>
        ))}
      </div>
      <div className="field">
        <span className="label">{STAT_LABELS[stat]}</span>
        <Stepper value={value} onChange={setValue} label="Valeur" min={-20} max={20} />
      </div>
      <label className="field">
        <span className="label">Motif (facultatif)</span>
        <input className="input" value={reason} onChange={e => setReason(e.target.value)} maxLength={60} />
      </label>
      <button type="button" className="btn primary block" onClick={save} disabled={!value}>
        Ajouter {signed(value)} {STAT_LABELS[stat]}
      </button>
    </Sheet>
  );
}
