import { useRef, useState } from 'react';
import { href } from '../router';
import { useStore, type DiceMode, type Game, type Theme } from '../store/store';
import { Frame, Segmented } from '../ui/common';
import { Icon } from '../ui/Icon';
import { Confirm } from '../ui/Sheet';

export function Settings() {
  const settings = useStore(s => s.settings);
  const setSettings = useStore(s => s.setSettings);
  const games = useStore(s => s.games);
  const importGames = useStore(s => s.importGames);
  const deleteGame = useStore(s => s.deleteGame);
  const showToast = useStore(s => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [toDelete, setToDelete] = useState<Game | null>(null);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ app: 'billyhelper', version: 1, games: Object.values(games) }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `billyhelper-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const count = importGames(Array.isArray(data?.games) ? data.games : []);
      showToast(count ? `${count} partie(s) importée(s)` : 'Aucune partie valide dans ce fichier');
    } catch {
      showToast('Fichier illisible : choisissez un export BillyHelper (.json)');
    }
  };

  return (
    <main className="page">
      <div className="row">
        <a className="icon-btn" href={href({ name: 'home' })} aria-label="Retour">
          <Icon name="back" />
        </a>
        <h1 className="title">Réglages</h1>
      </div>

      <Frame title="Thème">
        <Segmented<Theme>
          label="Thème"
          value={settings.theme}
          onChange={theme => setSettings({ theme })}
          options={[
            { value: 'system', label: 'Système' },
            { value: 'light', label: 'Clair' },
            { value: 'dark', label: 'Sombre' },
          ]}
        />
      </Frame>

      <Frame title="Dés">
        <Segmented<DiceMode>
          label="Mode de dé"
          value={settings.diceMode}
          onChange={diceMode => setSettings({ diceMode })}
          options={[
            { value: 'virtual', label: "Dé de l'appli" },
            { value: 'physical', label: 'Mon vrai dé' },
          ]}
        />
        <p className="small muted" style={{ marginTop: 8 }}>
          Avec votre vrai dé, l'appli vous demande la face obtenue au lieu de lancer pour vous.
        </p>
        <label className="row" style={{ marginTop: 12, minHeight: 44 }}>
          <input type="checkbox" checked={settings.vibrate} onChange={e => setSettings({ vibrate: e.target.checked })} />
          Vibrer à chaque action
        </label>
      </Frame>

      <Frame title="Sauvegarde">
        <p className="small muted">Vos parties restent sur cet appareil. Exportez-les pour les garder ou changer de téléphone.</p>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <button type="button" className="btn" onClick={exportAll} disabled={Object.keys(games).length === 0}>
            <Icon name="download" /> Exporter
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" /> Importer
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
      </Frame>

      {Object.keys(games).length > 0 && (
        <Frame title="Parties">
          <ul className="list">
            {Object.values(games).map(g => (
              <li key={g.id}>
                <span>{g.name}</span>
                <button type="button" className="icon-btn" aria-label={`Supprimer ${g.name}`} onClick={() => setToDelete(g)}>
                  <Icon name="trash" />
                </button>
              </li>
            ))}
          </ul>
        </Frame>
      )}

      {toDelete && (
        <Confirm
          title="Supprimer la partie ?"
          message={`« ${toDelete.name} » sera supprimée de cet appareil. Vous pourrez annuler juste après.`}
          action="Supprimer"
          onConfirm={() => deleteGame(toDelete.id)}
          onClose={() => setToDelete(null)}
        />
      )}
    </main>
  );
}
