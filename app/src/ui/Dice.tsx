import { useState } from 'react';
import { rollDie, type DieFace } from '../engine/rolls';
import { useStore, vibrate } from '../store/store';

const PIPS: Record<DieFace, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 26],
    [72, 26],
    [28, 50],
    [72, 50],
    [28, 74],
    [72, 74],
  ],
};

export function DieFaceSvg({ face, size = 64, rolling = false }: { face?: DieFace; size?: number; rolling?: boolean }) {
  return (
    <svg
      className={`die${rolling ? ' rolling' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={face ? `Dé : ${face}` : 'Dé pas encore lancé'}
    >
      <rect x="4" y="4" width="92" height="92" rx="16" fill="none" stroke="currentColor" strokeWidth="6" />
      {face && PIPS[face].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="8.5" fill="currentColor" />)}
      {!face && (
        <text x="50" y="64" textAnchor="middle" fontSize="44" fill="currentColor" opacity="0.35" fontFamily="serif">
          ?
        </text>
      )}
    </svg>
  );
}

/**
 * Lance un dé : virtuel (animation puis résultat) ou physique (le joueur tape la face obtenue),
 * selon le réglage. Appelle onResult avec la face.
 */
export function DiceRoller({
  label,
  onResult,
  disabled = false,
  face,
  primary = true,
}: {
  label: string;
  onResult: (face: DieFace) => void;
  disabled?: boolean;
  face?: DieFace;
  primary?: boolean;
}) {
  const mode = useStore(s => s.settings.diceMode);
  const [rolling, setRolling] = useState(false);
  const [shown, setShown] = useState<DieFace | undefined>(undefined);

  const roll = () => {
    if (rolling) return;
    vibrate(15);
    const result = rollDie();
    setRolling(true);
    setShown(undefined);
    window.setTimeout(
      () => {
        setRolling(false);
        setShown(result);
        onResult(result);
      },
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550,
    );
  };

  if (mode === 'physical') {
    return (
      <div className="stack">
        <span className="label">{label} : quelle face avez-vous obtenue ?</span>
        <div className="die-pad">
          {([1, 2, 3, 4, 5, 6] as DieFace[]).map(f => (
            <button
              key={f}
              type="button"
              disabled={disabled}
              onClick={() => {
                vibrate();
                onResult(f);
              }}
              aria-label={`J'ai fait ${f}`}
            >
              <DieFaceSvg face={f} size={34} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button type="button" className={`btn block${primary ? ' primary' : ''}`} disabled={disabled || rolling} onClick={roll}>
      <DieFaceSvg face={rolling ? undefined : (shown ?? face)} size={30} rolling={rolling} />
      {label}
    </button>
  );
}
