import { useState } from 'react';
import { adresseSucceeds, chanceSucceeds, type DieFace } from '../engine/rolls';
import { ADR_MAX } from '../engine/stats';
import { useBilly } from '../store/derived';
import { useStore, type Game } from '../store/store';
import { Frame, Stepper } from '../ui/common';
import { DiceRoller, DieFaceSvg } from '../ui/Dice';

interface Outcome {
  die: DieFace;
  success: boolean;
  against: number;
}

export function Rolls({ game }: { game: Game }) {
  const { billy } = useBilly(game);
  const update = useStore(s => s.update);
  const [mod, setMod] = useState(0);
  const [adr, setAdr] = useState<Outcome | null>(null);
  const [cha, setCha] = useState<Outcome | null>(null);

  const adrValue = Math.min(ADR_MAX, billy.stats.adr.total + mod);

  const rollChance = (die: DieFace) => {
    const against = game.chance;
    const success = chanceSucceeds(die, against);
    setCha({ die, success, against });
    update(game.id, `Jet de chance ${success ? 'réussi' : 'raté'} : −1 chance`, g => ({ ...g, chance: Math.max(0, g.chance - 1) }));
  };

  return (
    <div className="cols">
      <Frame title="Jet d'adresse">
        <p className="small muted">Réussi si le dé est inférieur ou égal à votre adresse. Ne coûte rien.</p>
        <div className="row spread" style={{ margin: '10px 0' }}>
          <span>
            Adresse{' '}
            <strong className="figure" style={{ fontSize: 30 }}>
              {adrValue}
            </strong>
          </span>
          <div style={{ width: 170 }}>
            <Stepper value={mod} onChange={setMod} label="Modificateur du chapitre" min={-6} max={6} />
          </div>
        </div>
        <p className="small muted">Modificateur demandé par le chapitre, s'il y en a un.</p>
        <Result outcome={adr} />
        <DiceRoller
          label="Lancer le jet d'adresse"
          onResult={die => setAdr({ die, success: adresseSucceeds(die, adrValue), against: adrValue })}
        />
      </Frame>

      <Frame title="Jet de chance">
        <p className="small muted">
          Réussi si le dé est inférieur ou égal à votre chance actuelle. Le jet coûte 1 point de chance, réussi ou non.
        </p>
        <p style={{ margin: '10px 0' }}>
          Chance{' '}
          <strong className="figure" style={{ fontSize: 30 }}>
            {game.chance}
          </strong>
          {game.chance >= 6 && <span className="small muted">, réussite assurée</span>}
        </p>
        <Result outcome={cha} />
        {game.chance > 0 ? (
          <DiceRoller label="Lancer le jet de chance (−1)" onResult={rollChance} />
        ) : (
          <p className="notice">Plus de chance : impossible de tenter un jet de chance.</p>
        )}
      </Frame>
    </div>
  );
}

function Result({ outcome }: { outcome: Outcome | null }) {
  if (!outcome) return null;
  return (
    <div className="stack" style={{ alignItems: 'center', margin: '8px 0 14px' }} aria-live="polite">
      <DieFaceSvg face={outcome.die} size={72} />
      <p className={`verdict ${outcome.success ? 'ok' : 'ko'}`}>{outcome.success ? 'Réussi' : 'Raté'}</p>
      <p className="small muted">
        {outcome.die} {outcome.success ? '≤' : '>'} {outcome.against}
      </p>
    </div>
  );
}
