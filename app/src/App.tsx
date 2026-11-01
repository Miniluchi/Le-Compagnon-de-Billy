import { useEffect } from 'react';
import { Achievements } from './features/Achievements';
import { Creation } from './features/Creation';
import { GameLayout } from './features/GameLayout';
import { Home } from './features/Home';
import { Settings } from './features/Settings';
import { navigate, useRoute } from './router';
import { useStore } from './store/store';
import { Toast } from './ui/common';

export default function App() {
  const route = useRoute();
  const theme = useStore(s => s.settings.theme);

  useEffect(() => {
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Au premier lancement sans adresse, on rouvre la dernière partie.
  useEffect(() => {
    const { lastGameId, games } = useStore.getState();
    if ((location.hash === '' || location.hash === '#/') && lastGameId && games[lastGameId]) {
      navigate({ name: 'game', id: lastGameId, tab: 'aventure' }, true);
    }
  }, []);

  const screenKey = route.name === 'game' ? `${route.name}/${route.tab}` : route.name;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screenKey]);

  return (
    <div className={`app ${route.name}`}>
      {route.name === 'home' && <Home />}
      {route.name === 'new' && <Creation />}
      {route.name === 'settings' && <Settings />}
      {route.name === 'achievements' && <Achievements bookId={route.bookId} />}
      {route.name === 'game' && <GameLayout id={route.id} tab={route.tab} />}
      <Toast />
    </div>
  );
}
