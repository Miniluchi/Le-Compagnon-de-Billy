import { href, type Tab } from '../router';
import { useBilly } from '../store/derived';
import { useStore, type Game } from '../store/store';
import { Icon, type IconName } from '../ui/Icon';
import { Adventure } from './Adventure';
import { BillySheet } from './BillySheet';
import { CombatScreen } from './Combat';
import { Rolls } from './Rolls';
import { Reference } from './Reference';
import { useEffect } from 'react';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'aventure', label: 'Aventure', icon: 'book' },
  { id: 'billy', label: 'Billy', icon: 'billy' },
  { id: 'combat', label: 'Combat', icon: 'sword' },
  { id: 'jets', label: 'Jets', icon: 'die' },
  { id: 'table', label: 'Table', icon: 'table' },
];

export function GameLayout({ id, tab }: { id: string; tab: Tab }) {
  const game = useStore(s => s.games[id]);
  const openGame = useStore(s => s.openGame);

  useEffect(() => {
    if (game) openGame(id);
  }, [game, id, openGame]);

  if (!game) {
    return (
      <main className="page">
        <p>Cette partie n'existe plus.</p>
        <a className="btn" href={href({ name: 'home' })}>
          Revenir aux parties
        </a>
      </main>
    );
  }

  return (
    <>
      <StatusBar game={game} />
      <main className="page with-tabs">
        {tab === 'aventure' && <Adventure game={game} />}
        {tab === 'billy' && <BillySheet game={game} />}
        {tab === 'combat' && <CombatScreen game={game} />}
        {tab === 'jets' && <Rolls game={game} />}
        {tab === 'table' && <Reference game={game} />}
      </main>
      <nav className="tabs" aria-label="Sections de la partie">
        {TABS.map(t => (
          <a key={t.id} className="tab" href={href({ name: 'game', id, tab: t.id })} aria-current={t.id === tab ? 'page' : undefined}>
            <Icon name={t.icon} />
            {t.id === 'combat' && game.combat && <span className="dot" aria-label="Combat en cours" />}
            {t.label}
          </a>
        ))}
      </nav>
    </>
  );
}

function StatusBar({ game }: { game: Game }) {
  const { pvMax, chanceMax } = useBilly(game);
  return (
    <header className="status">
      <a className="icon-btn" href={href({ name: 'home' })} aria-label="Toutes les parties">
        <Icon name="back" />
      </a>
      <span className="status-name">{game.name}</span>
      <span className="status-pill pv" aria-label={`${game.pv} PV sur ${pvMax}`}>
        <span className="figure">{game.pv}</span>
        <span className="of">/{pvMax} PV</span>
      </span>
      <span className="status-pill chance" aria-label={`${game.chance} chance sur ${chanceMax}`}>
        <span className="figure">{game.chance}</span>
        <span className="of">/{chanceMax} CHA</span>
      </span>
    </header>
  );
}
