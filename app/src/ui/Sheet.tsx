import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/** Feuille modale qui monte du bas de l'écran. Remplace les boîtes de dialogue natives. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('input, button:not([data-close])')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="scrim" onClick={onClose}>
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="row spread">
          <h2 className="heading">{title}</h2>
          <button type="button" className="icon-btn" data-close onClick={onClose} aria-label="Fermer">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  title,
  message,
  action,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  action: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet title={title} onClose={onClose}>
      <p>{message}</p>
      <div className="grid-2">
        <button type="button" className="btn" onClick={onClose}>
          Garder
        </button>
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {action}
        </button>
      </div>
    </Sheet>
  );
}
