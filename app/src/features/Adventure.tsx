import { useState } from 'react';
import { href } from '../router';
import { useBilly } from '../store/derived';
import { useStore, type Game } from '../store/store';
import { Frame, Stepper, Track } from '../ui/common';
import { Icon } from '../ui/Icon';
import { NumPad } from '../ui/NumPad';

type PadMode = 'chapter' | 'damage' | 'heal' | 'natural';

export function Adventure({ game }: { game: Game }) {
  const update = useStore(s => s.update);
  const undoLast = useStore(s => s.undoLast);
  const { book, billy, pvMax, chanceMax } = useBilly(game);
  const [pad, setPad] = useState<PadMode | null>(null);
  const hasKit = billy.hasRule('soin-double');

  const setPv = (pv: number, label: string) => update(game.id, label, g => ({ ...g, pv: Math.max(0, Math.min(pvMax, pv)) }));
  const setChance = (chance: number, label: string) =>
    update(game.id, label, g => ({ ...g, chance: Math.max(0, Math.min(chanceMax, chance)) }));
  const goToChapter = (n: number) =>
    update(game.id, `Chapitre ${n}`, g => ({ ...g, chapters: [n, ...g.chapters].slice(0, 200) }), { toast: false });

  const current = game.chapters[0];
  const trail = game.chapters.slice(1, 13);

  return (
    <>
      {game.pv <= 0 && (
        <Frame className="ember" title="Billy est mort">
          <p>Ce sont des choses qui arrivent. Vous pouvez annuler la dernière action ou recommencer avec un nouveau Billy.</p>
          <div className="grid-2" style={{ marginTop: 12 }}>
            <button type="button" className="btn" onClick={undoLast}>
              <Icon name="undo" /> Annuler
            </button>
            <a className="btn primary" href={href({ name: 'new' })}>
              Nouveau Billy
            </a>
          </div>
        </Frame>
      )}

      <div className="cols">
        <div className="col">
          <Frame className="chapter">
            <span className="label">Chapitre en cours</span>
            <button
              type="button"
              className="figure chapter-number"
              onClick={() => setPad('chapter')}
              aria-label={`Chapitre ${current ?? 'aucun'}. Changer de chapitre`}
            >
              {current ?? '–'}
            </button>
            <button type="button" className="btn" onClick={() => setPad('chapter')}>
              Aller au chapitre…
            </button>
            {trail.length > 0 && (
              <div className="stack" style={{ alignItems: 'center', marginTop: 8 }}>
                <span className="small muted">Chapitres précédents, touchez pour y revenir</span>
                <div className="chapter-trail">
                  {trail.map((c, i) => (
                    <button key={`${c}-${i}`} type="button" className="chip" onClick={() => goToChapter(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Frame>

          <Frame className="pv" title="Points de vie">
            <Gauge value={game.pv} max={pvMax} />
            <div className="grid-2" style={{ marginTop: 12 }}>
              <button type="button" className="btn" onClick={() => setPv(game.pv - 1, '−1 PV')} disabled={game.pv <= 0}>
                <Icon name="minus" /> 1 PV
              </button>
              <button type="button" className="btn" onClick={() => setPv(game.pv + 1, '+1 PV')} disabled={game.pv >= pvMax}>
                <Icon name="plus" /> 1 PV
              </button>
              <button type="button" className="btn" onClick={() => setPad('damage')}>
                Perdre…
              </button>
              <button type="button" className="btn" onClick={() => setPad('heal')}>
                Récupérer…
              </button>
            </div>
            <button type="button" className="btn ghost block" onClick={() => setPad('natural')}>
              <Icon name="heal" /> Soin naturel{hasKit ? ' (doublé par le kit de soin)' : ''}
            </button>
          </Frame>

          <Frame className="chance" title="Chance">
            <Gauge value={game.chance} max={chanceMax} />
            <div className="grid-2" style={{ marginTop: 12 }}>
              <button type="button" className="btn" onClick={() => setChance(game.chance - 1, '−1 chance')} disabled={game.chance <= 0}>
                <Icon name="minus" /> 1
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setChance(game.chance + 1, '+1 chance')}
                disabled={game.chance >= chanceMax}
              >
                <Icon name="plus" /> 1
              </button>
            </div>
          </Frame>
        </div>
        <div className="col">
          <div className="counters">
            {book.counters.map(c => {
              const value = game.counters[c.id] ?? 0;
              const set = (v: number) => update(game.id, `${c.label} : ${v}`, g => ({ ...g, counters: { ...g.counters, [c.id]: v } }));
              return (
                <Frame key={c.id} title={c.label}>
                  <Stepper value={value} onChange={set} label={c.label} min={0} />
                  <div style={{ marginTop: 10 }}>
                    <Track count={c.track} value={value} label={c.label} />
                  </div>
                </Frame>
              );
            })}
          </div>

          <EditableList
            title="Objets récupérés"
            items={game.collected}
            placeholder="Ex. : Broche dorée"
            onChange={(collected, label) => update(game.id, label, g => ({ ...g, collected }))}
          />
          <EditableList
            title="Notes d'aventure"
            items={game.notes}
            placeholder="Ex. : le mot de passe est « Gratin »"
            onChange={(notes, label) => update(game.id, label, g => ({ ...g, notes }))}
          />
        </div>
      </div>

      {pad === 'chapter' && <NumPad title="Aller au chapitre" submitLabel="Aller" onSubmit={goToChapter} onClose={() => setPad(null)} />}
      {pad === 'damage' && (
        <NumPad
          title="PV perdus"
          submitLabel="Retirer"
          max={999}
          onSubmit={n => setPv(game.pv - n, `−${n} PV`)}
          onClose={() => setPad(null)}
        />
      )}
      {pad === 'heal' && (
        <NumPad
          title="PV récupérés"
          submitLabel="Ajouter"
          max={999}
          onSubmit={n => setPv(game.pv + n, `+${n} PV`)}
          onClose={() => setPad(null)}
        />
      )}
      {pad === 'natural' && (
        <NumPad
          title={hasKit ? 'Soin indiqué par le livre (sera doublé)' : 'Soin indiqué par le livre'}
          submitLabel="Soigner"
          max={999}
          onSubmit={n => {
            const gain = hasKit ? n * 2 : n;
            setPv(game.pv + gain, hasKit ? `+${gain} PV (kit de soin : ${n} × 2)` : `+${gain} PV`);
          }}
          onClose={() => setPad(null)}
        />
      )}
    </>
  );
}

function Gauge({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="figure gauge-value">
        {value}
        <span className="of">/ {max}</span>
      </div>
      <div className="gauge-bar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EditableList({
  title,
  items,
  placeholder,
  onChange,
}: {
  title: string;
  items: string[];
  placeholder: string;
  onChange: (items: string[], label: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, text], `Ajouté : ${text}`);
    setDraft('');
  };
  return (
    <Frame title={title}>
      {items.length === 0 ? (
        <p className="empty">Rien pour l'instant.</p>
      ) : (
        <ul className="list">
          {items.map((item, i) => (
            <li key={`${item}-${i}`}>
              <span>{item}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Retirer ${item}`}
                onClick={() =>
                  onChange(
                    items.filter((_, j) => j !== i),
                    `Retiré : ${item}`,
                  )
                }
              >
                <Icon name="close" size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="row"
        style={{ marginTop: 8 }}
        onSubmit={e => {
          e.preventDefault();
          add();
        }}
      >
        <input
          className="input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={`Ajouter à ${title}`}
        />
        <button type="submit" className="icon-btn outlined" aria-label="Ajouter" disabled={!draft.trim()}>
          <Icon name="plus" />
        </button>
      </form>
    </Frame>
  );
}
