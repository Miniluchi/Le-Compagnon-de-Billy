import { useMemo, useState } from 'react';
import { BOOKS, type BookConfig, type Category } from '../books';
import { computeBilly, STAT_SHORT } from '../engine/stats';
import { href, navigate } from '../router';
import { useStore } from '../store/store';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { formatEffects } from '../ui/format';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'ARME', label: 'Les armes' },
  { id: 'EQUIPEMENT', label: 'Les équipements' },
  { id: 'OUTIL', label: 'Les outils' },
];

export function Creation() {
  const available = BOOKS.filter((b): b is BookConfig => b.available);
  const [book, setBook] = useState<BookConfig | null>(available.length === 1 ? available[0] : null);

  return (
    <main className="page screen">
      <div className="row">
        <a className="icon-btn" href={href({ name: 'home' })} aria-label="Retour">
          <Icon name="back" />
        </a>
        <h1 className="title">Nouveau Billy</h1>
      </div>
      {book ? <ItemPicker book={book} /> : <BookPicker onPick={setBook} />}
    </main>
  );
}

function BookPicker({ onPick }: { onPick: (b: BookConfig) => void }) {
  return (
    <div className="stack">
      <p>Dans quel livre se lance votre Billy ?</p>
      {BOOKS.map(b => (
        <button key={b.id} type="button" className="frame item-card" disabled={!b.available} onClick={() => b.available && onPick(b)}>
          <span className="figure" style={{ fontSize: 32, gridRow: '1 / span 2' }}>
            {b.tome}
          </span>
          <strong>{b.title}</strong>
          <span className="small muted">{b.available ? 'Disponible' : 'Bientôt disponible'}</span>
        </button>
      ))}
    </div>
  );
}

function ItemPicker({ book }: { book: BookConfig }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [naming, setNaming] = useState(false);

  const preview = useMemo(() => (picked.length === 3 ? computeBilly(book, picked) : null), [book, picked]);

  const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : p.length < 3 ? [...p, id] : p));

  return (
    <>
      <p>
        Choisissez <strong>3 objets</strong>. Les catégories de vos objets décident du caractère de votre Billy : deux armes font un
        guerrier, deux équipements un prudent, deux outils un paysan, un de chaque un débrouillard.
      </p>

      <div className="cols three">
        {CATEGORIES.map(cat => (
          <section key={cat.id} className="stack" aria-labelledby={`cat-${cat.id}`}>
            <h2 id={`cat-${cat.id}`} className="heading">
              {cat.label}
            </h2>
            {book.items
              .filter(i => i.category === cat.id)
              .map(item => {
                const on = picked.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="frame item-card"
                    aria-pressed={on}
                    disabled={!on && picked.length >= 3}
                    onClick={() => toggle(item.id)}
                  >
                    <span className="check">{on && <Icon name="check" size={18} />}</span>
                    <strong>{item.label}</strong>
                    <span className="effects">{formatEffects(item.effects)}</span>
                    {item.special && <span className="small muted">{item.special}</span>}
                  </button>
                );
              })}
          </section>
        ))}
      </div>

      <div className="preview stack" aria-live="polite">
        {preview ? (
          <>
            <div className="row spread">
              <span>
                Billy <strong>{book.characters[preview.character].label.toLowerCase()}</strong>
              </span>
              <span className="small muted">{preview.stats.pvMax.total} PV</span>
            </div>
            <div className="mini-stats">
              {(['hab', 'adr', 'end', 'cha'] as const).map(k => (
                <div key={k}>
                  <div className="figure">{preview.stats[k].total}</div>
                  <div className="label">{STAT_SHORT[k].toLowerCase()}</div>
                </div>
              ))}
            </div>
            {preview.ignored.map(i => (
              <p key={i.itemId + (i.stat ?? '')} className="small muted">
                {i.reason}
              </p>
            ))}
            <button type="button" className="btn primary block" onClick={() => setNaming(true)}>
              Continuer avec ce Billy
            </button>
          </>
        ) : (
          <p className="muted">
            {picked.length}/3 objets choisis{picked.length > 0 ? '. Encore ' + (3 - picked.length) + '.' : '.'}
          </p>
        )}
      </div>

      {naming && preview && (
        <NameSheet
          book={book}
          items={picked}
          defaultName={`Billy ${book.characters[preview.character].label.toLowerCase()}`}
          power={book.characters[preview.character].power}
          onClose={() => setNaming(false)}
        />
      )}
    </>
  );
}

function NameSheet({
  book,
  items,
  defaultName,
  power,
  onClose,
}: {
  book: BookConfig;
  items: string[];
  defaultName: string;
  power: string;
  onClose: () => void;
}) {
  const createGame = useStore(s => s.createGame);
  const [name, setName] = useState(defaultName);
  const submit = () => {
    const id = createGame(book.id, items, name.trim() || defaultName);
    navigate({ name: 'game', id, tab: 'aventure' }, true);
  };
  return (
    <Sheet title="Votre Billy est prêt" onClose={onClose}>
      <p>{power}</p>
      <label className="field">
        <span className="label">Nom de la partie</span>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          maxLength={40}
        />
      </label>
      <button type="button" className="btn primary block" onClick={submit}>
        Commencer l'aventure
      </button>
    </Sheet>
  );
}
