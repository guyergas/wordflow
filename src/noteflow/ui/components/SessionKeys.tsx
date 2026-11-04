import { useEffect } from 'react';
import { audio } from '../../audio/engine';
import { pitchFromMidi } from '../../engine/exercise';
import { midi, parsePitch } from '../../music/pitch';
import type { Attempt } from '../../storage/types';
import { keyboardRange } from './Piano';

const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);

/**
 * The keyboard of this session: every key that was asked is tinted by how it went.
 * When `celebrate` is set (a mastery test passed, a perfect run), the keys light up in a glissando.
 */
export function SessionKeys({ attempts, celebrate }: { attempts: Attempt[]; celebrate?: boolean }) {
  const stats = new Map<number, { ok: number; n: number }>();
  for (const a of attempts) {
    const m = midi(parsePitch(a.pitch));
    const s = stats.get(m) ?? { ok: 0, n: 0 };
    s.n++;
    if (a.correct) s.ok++;
    stats.set(m, s);
  }
  const ms = [...stats.keys()];
  const [low, high] = ms.length ? keyboardRange(Math.min(...ms), Math.max(...ms)) : [60, 71];
  const whites: number[] = [];
  for (let m = low; m <= high; m++) if (!isBlack(m)) whites.push(m);
  const pct = 100 / whites.length;

  useEffect(() => {
    if (!celebrate) return;
    const ctx = audio.context;
    if (!ctx) return;
    const t = ctx.currentTime + 0.25;
    whites.forEach((m, i) => audio.playNote(m, 0.35, t + i * 0.055, 0.5));
    audio.playNote(whites[whites.length - 1], 1.4, t + whites.length * 0.055 + 0.05, 0.7);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cls = (m: number) => {
    const s = stats.get(m);
    if (!s) return '';
    const acc = s.ok / s.n;
    return acc >= 0.9 ? 'k-good' : acc >= 0.6 ? 'k-mid' : 'k-bad';
  };
  const label = (m: number) => {
    const p = pitchFromMidi(m);
    const s = stats.get(m);
    return s ? `${p.letter}${p.octave}: ${s.ok}/${s.n}` : `${p.letter}${p.octave}`;
  };

  return (
    <div className={`mk sk ${celebrate ? 'celebrate' : ''}`} role="img" aria-label={`מקלדת האימון: ${[...stats.keys()].sort((a, b) => a - b).map(label).join(', ')}`}>
      <div className="keys">
        {whites.map((m, i) => {
          const p = pitchFromMidi(m);
          return (
            <div key={m} className="w" title={label(m)} style={{ ['--d' as string]: `${i * 55}ms` }}>
              {p.letter === 'C' ? `C${p.octave}` : ''}
            </div>
          );
        })}
        {whites.map((m, i) => {
          const b = m + 1;
          if (b > high || !isBlack(b)) return null;
          return <div key={b} className="b" title={label(b)} style={{ left: `calc(${(i + 1) * pct}% - ${pct * 0.29}%)`, width: `${pct * 0.58}%`, ['--d' as string]: `${i * 55 + 27}ms` }} />;
        })}
      </div>
      <div className="mk-dots" aria-hidden="true">
        {whites.map((m, i) => (cls(m) ? <i key={m} className={`d on ${cls(m)}`} style={{ left: `${(i + 0.5) * pct}%`, ['--d' as string]: `${i * 55}ms` }} /> : null))}
        {whites.map((m, i) => (m + 1 <= high && isBlack(m + 1) && cls(m + 1) ? <i key={m + 1} className={`d blk on ${cls(m + 1)}`} style={{ left: `${(i + 1) * pct}%`, ['--d' as string]: `${i * 55 + 27}ms` }} /> : null))}
      </div>
      <div className="sk-legend"><span><i className="k-good" />בטוח</span><span><i className="k-mid" />כמעט</span><span><i className="k-bad" />לחזק</span></div>
    </div>
  );
}
