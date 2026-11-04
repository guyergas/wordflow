import { useEffect, useRef } from 'react';
import { pitchFromMidi } from '../../engine/exercise';
import { pitchName } from '../../music/pitch';

export interface PianoProps {
  low: number;    // MIDI, should be a C
  high: number;   // MIDI, should be a B or C
  onPress: (midi: number) => void;
  showNames: boolean;
  marks?: Record<number, 'good' | 'bad' | 'reveal'>;
  disabled?: boolean;
  minKeyWidth?: number;
}

const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);

/** Expand a range to whole octaves C..B (or ending on C). */
export function keyboardRange(minMidi: number, maxMidi: number): [number, number] {
  const low = minMidi - (((minMidi % 12) + 12) % 12);
  let high = maxMidi;
  const pc = ((high % 12) + 12) % 12;
  if (pc !== 0) high = high + (11 - pc);
  if (high - low < 11) high = low + 11;
  return [low, high];
}

export function Piano({ low, high, onPress, showNames, marks = {}, disabled, minKeyWidth = 34 }: PianoProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const whites: number[] = [];
  for (let m = low; m <= high; m++) if (!isBlack(m)) whites.push(m);
  const pct = 100 / whites.length;

  // Center the scroll on first render when the keyboard is wider than the screen.
  useEffect(() => {
    const el = wrap.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [low, high]);

  const press = (m: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    if (!disabled) onPress(m);
  };

  return (
    <div className="piano-wrap" ref={wrap}>
      <div className="piano" style={{ minWidth: whites.length * minKeyWidth }} role="group" aria-label="מקלדת פסנתר">
        {whites.map((m) => {
          const p = pitchFromMidi(m);
          const label = showNames ? pitchName(p) : p.letter === 'C' ? pitchName(p) : '';
          return (
            <button key={m} className={`white ${marks[m] ?? ''} ${p.letter === 'C' ? 'c-mark' : ''}`}
              onPointerDown={press(m)} aria-label={pitchName(p)} style={{ width: `${pct}%` }}>
              {label}
            </button>
          );
        })}
        {whites.map((m, i) => {
          const b = m + 1;
          if (b > high || !isBlack(b)) return null;
          return (
            <button key={b} className={`black ${marks[b] ?? ''}`} onPointerDown={press(b)} aria-label={pitchName(pitchFromMidi(b))}
              style={{ left: `calc(${(i + 1) * pct}% - ${pct * 0.3}%)`, width: `${pct * 0.6}%` }} />
          );
        })}
      </div>
    </div>
  );
}
