import { useEffect, useRef, useState } from 'react';

/** In-page confirmation / text prompt (native confirm()/prompt() are unreliable in embedded views). */
export function Sheet({ title, body, confirmLabel, cancelLabel = 'ביטול', danger, input, onConfirm, onCancel }: {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  input?: { initial: string; placeholder?: string; mustEqual?: string };
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(input?.initial ?? '');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const ok = !input || (input.mustEqual ? v.trim() === input.mustEqual : v.trim().length > 0);
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {body && <p className="muted" style={{ margin: '6px 0 0' }}>{body}</p>}
        {input && (
          <input id="sheet-input" ref={ref} className="text-input" value={v} placeholder={input.placeholder}
            onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && ok) onConfirm(v.trim()); }} />
        )}
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn grow" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn grow ${danger ? 'danger-fill' : 'primary'}`} disabled={!ok} onClick={() => onConfirm(v.trim())}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
