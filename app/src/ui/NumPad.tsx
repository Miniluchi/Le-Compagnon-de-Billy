import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import { vibrate } from '../store/store';

/** Pavé numérique plein écran pour saisir un chapitre ou un montant. */
export function NumPad({
  title,
  submitLabel,
  onSubmit,
  onClose,
  max = 9999,
}: {
  title: string;
  submitLabel: string;
  onSubmit: (value: number) => void;
  onClose: () => void;
  max?: number;
}) {
  const [value, setValue] = useState('');

  const push = (d: string) => {
    vibrate();
    setValue(v => (Number(v + d) > max ? v : (v + d).replace(/^0+(?=\d)/, '')));
  };
  const submit = () => {
    if (value === '') return;
    onSubmit(Number(value));
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) push(e.key);
      else if (e.key === 'Backspace') setValue(v => v.slice(0, -1));
      else if (e.key === 'Enter') submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <Sheet title={title} onClose={onClose}>
      <output className="numpad-display figure" aria-live="polite">
        {value || ' '}
      </output>
      <div className="numpad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button key={d} type="button" onClick={() => push(d)}>
            {d}
          </button>
        ))}
        <button type="button" onClick={() => setValue(v => v.slice(0, -1))} aria-label="Effacer">
          <Icon name="back" />
        </button>
        <button type="button" onClick={() => push('0')}>
          0
        </button>
        <button type="button" onClick={submit} aria-label={submitLabel} disabled={value === ''}>
          <Icon name="check" />
        </button>
      </div>
    </Sheet>
  );
}
