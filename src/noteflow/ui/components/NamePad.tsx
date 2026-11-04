import { audio } from '../../audio/engine';
import { BLACK_ANSWERS, blackLabel, NameAnswer } from '../../engine/exercise';
import { LETTERS } from '../../music/pitch';

/** Note-name answer pad: C–B with ♯/♭ buttons above, placed like the black keys. */
export function NamePad({ onAnswer, marks, disabled }: {
  onAnswer: (n: NameAnswer) => void;
  marks?: (n: NameAnswer) => string;
  disabled?: boolean;
}) {
  const press = (n: NameAnswer) => (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled) return;
    audio.unlock();
    onAnswer(n);
  };
  // Laid out like a piano octave: seven white keys side by side, the black keys on the boundaries between them.
  const blackAt: Record<string, number> = { 'C#': 1, 'D#': 2, 'F#': 4, 'G#': 5, 'A#': 6 };
  return (
    <div className="namepad keys" role="group" aria-label="שמות התווים">
      {LETTERS.map((l) => (
        <button key={l} className={`wht ${marks?.(l) ?? ''}`} data-note={l} disabled={disabled} onPointerDown={press(l)}>{l}</button>
      ))}
      {BLACK_ANSWERS.map((b) => {
        const l = blackLabel(b);
        return (
          <button key={b} className={`blk ${marks?.(b) ?? ''}`} disabled={disabled} data-col={b}
            style={{ left: `calc(${(blackAt[b] / 7) * 100}% - var(--bw) / 2)` }}
            aria-label={`${l.sharp} או ${l.flat}`} onPointerDown={press(b)}>
            <span>{l.sharp}</span><span>{l.flat}</span>
          </button>
        );
      })}
    </div>
  );
}
