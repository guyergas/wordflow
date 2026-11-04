import { INTERVAL_NAMES } from '../../engine/intervals';

/** Answer pad for intervals: up row, "same note", down row. Values are signed staff steps. */
export function IntervalPad({ max, onAnswer, marks, disabled }: {
  max: number;
  onAnswer: (dist: number) => void;
  marks?: (dist: number) => string;
  disabled?: boolean;
}) {
  const sizes = Array.from({ length: max - 1 }, (_, i) => i + 2);
  const btn = (dist: number, label: string, sub?: string) => (
    <button key={dist} className={`ipad-btn ${marks?.(dist) ?? ''}`} disabled={disabled}
      onPointerDown={(e) => { e.preventDefault(); if (!disabled) onAnswer(dist); }}
      aria-label={dist === 0 ? 'אותו תו' : `${INTERVAL_NAMES[Math.abs(dist) + 1].name} ${dist > 0 ? 'למעלה' : 'למטה'}`}>
      <b>{label}</b>{sub && <small>{sub}</small>}
    </button>
  );
  return (
    <div className="ipad" role="group" aria-label="מרווח">
      <div className="ipad-row"><span className="ipad-dir">↑ עולה</span>{sizes.map((n) => btn(n - 1, String(n), INTERVAL_NAMES[n].plain))}</div>
      <div className="ipad-row same">{btn(0, '=', 'אותו תו')}</div>
      <div className="ipad-row"><span className="ipad-dir">↓ יורד</span>{sizes.map((n) => btn(-(n - 1), String(n), INTERVAL_NAMES[n].plain))}</div>
    </div>
  );
}
