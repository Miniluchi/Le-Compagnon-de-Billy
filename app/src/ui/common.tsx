import { useEffect, type ReactNode } from 'react';
import { useStore, vibrate } from '../store/store';
import { Icon } from './Icon';

export function Frame({ title, className = '', children }: { title?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`frame ${className}`}>
      {title && <h2 className="heading frame-title">{title}</h2>}
      {children}
    </section>
  );
}

export function Stepper({
  value,
  onChange,
  label,
  min = -99,
  max = 999,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min?: number;
  max?: number;
}) {
  const step = (d: number) => {
    vibrate();
    onChange(Math.max(min, Math.min(max, value + d)));
  };
  return (
    <div className="stepper">
      <button type="button" className="icon-btn outlined" onClick={() => step(-1)} disabled={value <= min} aria-label={`${label} −1`}>
        <Icon name="minus" />
      </button>
      <span className="figure" aria-live="polite" aria-label={`${label} : ${value}`}>
        {value}
      </span>
      <button type="button" className="icon-btn outlined" onClick={() => step(1)} disabled={value >= max} aria-label={`${label} +1`}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

/** Piste de cases à cocher, comme sur la feuille du livre. */
export function Track({ count, value, onSet, label }: { count: number; value: number; onSet?: (v: number) => void; label: string }) {
  const size = Math.max(count, value);
  return (
    <div className="track" role={onSet ? 'group' : undefined} aria-label={label}>
      {Array.from({ length: size }, (_, i) =>
        onSet ? (
          <button
            key={i}
            type="button"
            className={`box${i < value ? ' on ember' : ''}`}
            aria-label={`${label} : ${i + 1}`}
            aria-pressed={i < value}
            onClick={() => {
              vibrate();
              onSet(i + 1 === value ? i : i + 1);
            }}
          />
        ) : (
          <span key={i} className={`box${i < value ? ' on' : ''}`} />
        ),
      )}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toast() {
  const toast = useStore(s => s.toast);
  const dismiss = useStore(s => s.dismissToast);
  const undo = useStore(s => s.undoLast);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismiss, toast.undoable ? 5000 : 2500);
    return () => window.clearTimeout(t);
  }, [toast, dismiss]);

  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <span>{toast.message}</span>
      {toast.undoable && (
        <button type="button" onClick={undo}>
          Annuler
        </button>
      )}
    </div>
  );
}

/** Filtre SVG qui donne aux cadres l'aspect d'un trait d'encre irrégulier. */
export function InkFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <filter id="ink-edge">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="3.5" />
      </filter>
    </svg>
  );
}
