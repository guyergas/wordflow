import { getItem, itemMastery, StatsIndex } from '../../engine/stats';
import { pitchFromMidi } from '../../engine/exercise';
import { pitchId } from '../../music/pitch';
import type { Settings } from '../../storage/types';
import type { Skill } from '../../engine/curriculum';

const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);

/** Best mastery of a key across the given clefs (and both spellings for black keys). */
function keyMastery(m: number, idx: StatsIndex, s: Settings, skill: Skill = 'name', clefs: string[] = ['treble', 'bass']): number {
  const p = pitchFromMidi(m);
  const spellings = [pitchId(p)];
  if (p.accidental === 1) {
    const flat = pitchFromMidi(m + 1); // next natural letter
    spellings.push(`${flat.letter}b${flat.octave}`);
  }
  let best = 0;
  for (const id of spellings) {
    for (const clef of clefs) {
      best = Math.max(best, itemMastery(getItem(idx, skill, clef, id), skill, s));
    }
  }
  return best;
}

/**
 * The learner's own keyboard, C3–C5. The keys stay black and white; under every key a dot in the note's colour
 * shows how well its note is read (small and hollow while learning, full once it is read with confidence).
 */
export function MasteryKeyboard({ idx, settings, low = 48, high = 72, skill = 'name', clefs, onKey }: {
  idx: StatsIndex; settings: Settings; low?: number; high?: number; skill?: Skill; clefs?: string[];
  /** When set, keys are buttons (e.g. to show that note's details). */
  onKey?: (midi: number) => void;
}) {
  const whites: number[] = [];
  for (let m = low; m <= high; m++) if (!isBlack(m)) whites.push(m);
  const pct = 100 / whites.length;
  const mastery = (m: number) => keyMastery(m, idx, settings, skill, clefs);
  const level = (v: number) => (v >= 0.6 ? 'on' : v >= 0.15 ? 'half' : '');
  return (
    <div className="mk" role="img" aria-label="המקלדת שלך: כל קליד מסומן כשהתו שלו נקרא בביטחון">
      <div className="keys">
        {whites.map((m) => {
          const v = mastery(m);
          const p = pitchFromMidi(m);
          return (
            <div key={m} className="w" onClick={onKey ? () => onKey(m) : undefined} role={onKey ? 'button' : undefined}
              aria-label={onKey ? `${p.letter}${p.octave}: ${Math.round(v * 100)}%` : undefined}
              style={{ cursor: onKey ? 'pointer' : undefined }}>
              {p.letter === 'C' || onKey ? `${p.letter}${p.letter === 'C' ? p.octave : ''}` : ''}
            </div>
          );
        })}
        {whites.map((m, i) => {
          const b = m + 1;
          if (b > high || !isBlack(b)) return null;
          return <div key={b} className="b" style={{ left: `calc(${(i + 1) * pct}% - ${pct * 0.29}%)`, width: `${pct * 0.58}%` }} />;
        })}
      </div>
      <div className="mk-dots" aria-hidden="true">
        {whites.map((m, i) => {
          const lv = level(mastery(m));
          return lv ? <i key={m} className={`d ${lv}`} style={{ left: `${(i + 0.5) * pct}%`, ['--d' as string]: `${i * 30}ms` }} /> : null;
        })}
        {whites.map((m, i) => {
          const b = m + 1;
          if (b > high || !isBlack(b)) return null;
          const lv = level(mastery(b));
          return lv ? <i key={b} className={`d blk ${lv}`} style={{ left: `${(i + 1) * pct}%`, ['--d' as string]: `${i * 30 + 15}ms` }} /> : null;
        })}
      </div>
    </div>
  );
}

export function learnedKeys(idx: StatsIndex, settings: Settings, low = 48, high = 72): { learned: number; total: number } {
  let learned = 0;
  let total = 0;
  for (let m = low; m <= high; m++) {
    if (isBlack(m)) continue;
    total++;
    if (keyMastery(m, idx, settings) >= 0.6) learned++;
  }
  return { learned, total };
}
