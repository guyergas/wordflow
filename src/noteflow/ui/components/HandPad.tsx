import { FINGER_NAMES, Hand } from '../../engine/fingers';

/**
 * A hand seen from above, palm down, as it rests on the keys: five fingers to tap.
 * Right hand: thumb on the left. Left hand: thumb on the right.
 */
export function HandPad({ hand, onAnswer, marks, disabled, highlight }: {
  hand: Hand;
  onAnswer?: (finger: number) => void;
  marks?: (finger: number) => string;
  disabled?: boolean;
  /** Show this finger lit (lessons, feedback). */
  highlight?: number | null;
}) {
  const order = hand === 'right' ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1];
  return (
    <div className={`handpad ${hand}`} dir="ltr" role="group" aria-label={hand === 'right' ? 'יד ימין' : 'יד שמאל'}>
      <div className="fingers">
        {order.map((f) => (
          <button key={f} className={`finger f${f} ${marks?.(f) ?? ''} ${highlight === f ? 'lit' : ''}`} disabled={disabled || !onAnswer}
            onPointerDown={(e) => { e.preventDefault(); if (!disabled) onAnswer?.(f); }}
            aria-label={`אצבע ${f} — ${FINGER_NAMES[f]}`}>
            <span className="num">{f}</span>
          </button>
        ))}
      </div>
      <div className="palm" aria-hidden="true"><span>{hand === 'right' ? 'יד ימין' : 'יד שמאל'}</span></div>
    </div>
  );
}
