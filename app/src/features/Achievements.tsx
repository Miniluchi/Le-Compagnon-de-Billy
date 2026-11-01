import { useState } from 'react';
import { getBook, type Achievement } from '../books';
import { achievementProgress, formatDate, today } from '../engine/achievements';
import { goBack, href } from '../router';
import { useStore, type Unlocked } from '../store/store';
import { Frame, Segmented } from '../ui/common';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';

type Filter = 'all' | 'todo' | 'done';

const NO_UNLOCKED: Unlocked = {};

export function Achievements({ bookId }: { bookId: string }) {
  const book = getBook(bookId);
  const unlocked = useStore(s => s.achievements[bookId] ?? NO_UNLOCKED);
  const setAchievement = useStore(s => s.setAchievement);
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Achievement | null>(null);
  const { all, count, finalDate } = achievementProgress(book, unlocked);
  const final = book.finalAchievement;
  const total = all.length + (final ? 1 : 0);
  const done = count + (finalDate ? 1 : 0);

  const unlock = (a: Achievement) => {
    const completes = !!final && count === all.length - 1;
    setAchievement(bookId, a.id, today(), completes ? `Succès obtenus : ${a.title} et ${final.title}` : `Succès obtenu : ${a.title}`);
  };

  const shown = (a: Achievement) => filter === 'all' || (filter === 'done') === !!unlocked[a.id];
  const groups = book.achievements.map(g => ({ ...g, visible: g.items.filter(shown) })).filter(g => g.visible.length > 0);

  return (
    <main className="page screen">
      <div className="row">
        <a
          className="icon-btn"
          href={href({ name: 'home' })}
          aria-label="Retour"
          onClick={e => {
            if (goBack()) e.preventDefault();
          }}
        >
          <Icon name="back" />
        </a>
        <h1 className="title">Succès</h1>
      </div>

      <Frame className="achievement-summary">
        <div className="row spread" style={{ alignItems: 'flex-end' }}>
          <div>
            <p className="heading">{book.title}</p>
            <p className="small muted">Communs à toutes vos parties de ce livre.</p>
          </div>
          <span className="figure gauge-value" aria-label={`${done} succès sur ${total}`}>
            {done}
            <span className="of">/ {total}</span>
          </span>
        </div>
        <div className="gauge-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
        {final && (
          <div className={`achievement-final${finalDate ? ' on' : ''}`}>
            <Icon name="trophy" />
            <div>
              <strong>{final.title}</strong>
              <p className="small muted">
                {finalDate ? `Obtenu le ${formatDate(finalDate)}.` : `S'obtient tout seul avec les ${all.length} autres succès.`}
              </p>
            </div>
          </div>
        )}
      </Frame>

      <Segmented<Filter>
        label="Afficher"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Tous' },
          { value: 'todo', label: 'À obtenir' },
          { value: 'done', label: 'Obtenus' },
        ]}
      />

      {groups.length === 0 && (
        <p className="empty">
          {filter === 'done' ? "Aucun succès obtenu pour l'instant. Touchez un succès pour le cocher." : 'Tous les succès sont obtenus !'}
        </p>
      )}

      {groups.map(g => (
        <Frame
          key={g.title}
          title={
            <span className="row spread">
              {g.title}
              <span className="small muted">
                {g.items.filter(a => unlocked[a.id]).length} / {g.items.length}
              </span>
            </span>
          }
        >
          <ul className="achievement-list">
            {g.visible.map(a => {
              const date = unlocked[a.id];
              return (
                <li key={a.id}>
                  <button type="button" className="achievement" aria-pressed={!!date} onClick={() => (date ? setEditing(a) : unlock(a))}>
                    <span className="tick" aria-hidden="true">
                      {date && <Icon name="check" size={16} />}
                    </span>
                    <strong>{a.title}</strong>
                    <span className="small muted">{a.description}</span>
                    {date && <span className="achievement-date small">Obtenu le {formatDate(date)}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </Frame>
      ))}

      {editing && unlocked[editing.id] && (
        <EditSheet
          achievement={editing}
          date={unlocked[editing.id]}
          onSave={date => setAchievement(bookId, editing.id, date, `Date modifiée : ${editing.title}`)}
          onRemove={() => setAchievement(bookId, editing.id, null, `Succès retiré : ${editing.title}`)}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}

function EditSheet({
  achievement,
  date,
  onSave,
  onRemove,
  onClose,
}: {
  achievement: Achievement;
  date: string;
  onSave: (date: string) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(date);
  return (
    <Sheet title={achievement.title} onClose={onClose}>
      <p className="muted">{achievement.description}</p>
      <label className="field">
        <span className="label">Obtenu le</span>
        <input className="input" type="date" value={value} max={today()} onChange={e => setValue(e.target.value)} />
      </label>
      <button
        type="button"
        className="btn primary block"
        disabled={!value || value === date}
        onClick={() => {
          onSave(value);
          onClose();
        }}
      >
        Enregistrer la date
      </button>
      <button
        type="button"
        className="btn danger block"
        onClick={() => {
          onRemove();
          onClose();
        }}
      >
        Retirer ce succès
      </button>
    </Sheet>
  );
}

/** Lien vers les succès du livre, avec la progression. */
export function AchievementsLink({ bookId }: { bookId: string }) {
  const book = getBook(bookId);
  const unlocked = useStore(s => s.achievements[bookId] ?? NO_UNLOCKED);
  const { all, count, finalDate } = achievementProgress(book, unlocked);
  const total = all.length + (book.finalAchievement ? 1 : 0);
  return (
    <a className="frame achievements-link" href={href({ name: 'achievements', bookId })}>
      <span className="link-icon">
        <Icon name="trophy" />
      </span>
      <span>
        <strong>Succès du livre</strong>
        <span className="small muted">
          {count + (finalDate ? 1 : 0)} sur {total} obtenus
        </span>
      </span>
      <Icon name="forward" size={20} />
    </a>
  );
}
