import { getBook } from '../books';
import { computeBilly } from '../engine/stats';
import { href } from '../router';
import { useStore, type Game } from '../store/store';
import { Icon } from '../ui/Icon';

export function Home() {
  const games = useStore(s => s.games);
  const list = Object.values(games).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <main className="page">
      <div className="row spread">
        <span />
        <a className="icon-btn" href={href({ name: 'settings' })} aria-label="Réglages">
          <Icon name="settings" />
        </a>
      </div>
      <div className="cols">
        <div className="col">
          <header className="hero">
            <img src={`${import.meta.env.BASE_URL}open_book.png`} alt="" />
            <h1 className="title">Le compagnon de Billy</h1>
            <p className="muted">Votre feuille de personnage, vos dés et vos combats. Le livre reste ouvert devant vous.</p>
          </header>

          <a className="btn primary block" href={href({ name: 'new' })}>
            <Icon name="plus" /> Créer un Billy
          </a>
        </div>

        {list.length === 0 && (
          <section className="frame stack" aria-labelledby="games-title">
            <h2 id="games-title" className="heading">
              Vos parties
            </h2>
            <p>Aucune partie pour l'instant.</p>
            <p className="muted">
              Créez votre premier Billy : choisissez 3 objets comme au début du livre, l'appli calcule son caractère et ses stats.
            </p>
          </section>
        )}
        {list.length > 0 && (
          <section className="stack" aria-labelledby="games-title">
            <h2 id="games-title" className="heading">
              Reprendre une partie
            </h2>
            {list.map(g => (
              <GameCard key={g.id} game={g} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function GameCard({ game }: { game: Game }) {
  const book = getBook(game.bookId);
  const { character, stats } = computeBilly(book, game.items, game.bonuses);
  const dead = game.pv <= 0;
  return (
    <a className="frame game-card" href={href({ name: 'game', id: game.id, tab: 'aventure' })}>
      <strong>{game.name}</strong>
      <span className="figure" aria-label={`Chapitre ${game.chapters[0] ?? '-'}`}>
        {game.chapters[0] ?? '–'}
      </span>
      <span className="small muted">
        {book.characters[character].label}, {dead ? 'mort' : `${game.pv}/${stats.pvMax.total} PV`}. {book.title}
      </span>
    </a>
  );
}
