// Reading by intervals: how far apart are two notes on the staff, and in which direction.
// Distances are diatonic (staff steps): 0 = same note, 1 = second (step), 2 = third (skip) …

import { Clef, diatonic, fromDiatonic, naturalRange, parsePitch, Pitch, staffPosition } from '../music/pitch';
import type { ErrorType } from '../storage/types';

export interface IntervalQuestion {
  clef: Clef;
  a: Pitch;
  b: Pitch;
  /** Signed staff steps from a to b. */
  dist: number;
}

/** Interval number as musicians count it: steps + 1 (a step is a 2nd). */
export const intervalNumber = (dist: number) => Math.abs(dist) + 1;

export const INTERVAL_NAMES: Record<number, { name: string; plain: string }> = {
  1: { name: 'אוניסון', plain: 'אותו תו' },
  2: { name: 'סקונדה', plain: 'צעד' },
  3: { name: 'טרצה', plain: 'דילוג' },
  4: { name: 'קוורטה', plain: 'קפיצה של 4' },
  5: { name: 'קווינטה', plain: 'קפיצה של 5' },
};

/** "↑3", "↓2", "=" — the answer id stored with an attempt. */
export function intervalId(dist: number): string {
  return dist === 0 ? '=' : `${dist > 0 ? '↑' : '↓'}${intervalNumber(dist)}`;
}

export function intervalText(dist: number): string {
  if (dist === 0) return 'אותו תו';
  const n = intervalNumber(dist);
  return `${INTERVAL_NAMES[n]?.plain ?? n} ${dist > 0 ? 'למעלה' : 'למטה'}`;
}

export interface IntervalRange { clef: Clef; from: string; to: string }

/**
 * A random interval question. Sizes are spread evenly (including the same note, less often),
 * and both directions are equally likely.
 */
export function intervalQuestion(ranges: IntervalRange[], maxInterval: number, rng: () => number, last?: string): IntervalQuestion {
  for (let tries = 0; tries < 40; tries++) {
    const r = ranges[Math.floor(rng() * ranges.length)];
    const notes = naturalRange(r.from, r.to);
    const lo = diatonic(notes[0]);
    const hi = diatonic(notes[notes.length - 1]);
    const size = rng() < 0.08 ? 0 : 1 + Math.floor(rng() * (maxInterval - 1));
    const dir = rng() < 0.5 ? -1 : 1;
    const dist = size * dir;
    const minA = Math.max(lo, lo - dist);
    const maxA = Math.min(hi, hi - dist);
    if (minA > maxA) continue;
    const da = minA + Math.floor(rng() * (maxA - minA + 1));
    const q: IntervalQuestion = { clef: r.clef, a: fromDiatonic(da), b: fromDiatonic(da + dist), dist };
    const key = `${q.clef}${da}${dist}`;
    if (key === last && tries < 10) continue;
    return q;
  }
  const r = ranges[0];
  const a = parsePitch(r.from);
  return { clef: r.clef, a, b: fromDiatonic(diatonic(a) + 1), dist: 1 };
}

export const questionKey = (q: IntervalQuestion) => `${q.clef}${diatonic(q.a)}${q.dist}`;

export function evaluateInterval(q: IntervalQuestion, answer: number | null): { correct: boolean; error?: ErrorType } {
  if (answer == null) return { correct: false, error: 'timeout' };
  if (answer === q.dist) return { correct: true };
  if (Math.abs(answer) === Math.abs(q.dist)) return { correct: false, error: 'direction' };
  if (Math.sign(answer) === Math.sign(q.dist) && Math.abs(Math.abs(answer) - Math.abs(q.dist)) === 1) return { correct: false, error: 'adjacent' };
  return { correct: false, error: 'other' };
}

/** How to see it on the staff: line→space is a step, line→line (or space→space) is a skip … */
export function explainInterval(q: IntervalQuestion): string {
  const n = intervalNumber(q.dist);
  const pa = staffPosition(q.a, q.clef);
  const onLine = (pos: number) => pos % 2 === 0;
  const kind = (p: number) => (onLine(p) ? 'קו' : 'רווח');
  const from = kind(pa);
  const to = kind(pa + q.dist);
  if (q.dist === 0) return 'שני התווים באותו מקום בדיוק — אותו תו.';
  const dir = q.dist > 0 ? 'למעלה' : 'למטה';
  const tip = n === 2 ? `מ${from} ל${to} הסמוך — צעד ${dir}.`
    : n === 3 ? `מ${from} ל${to} הבא — מדלגים על ${from === 'קו' ? 'רווח' : 'קו'} אחד. דילוג ${dir}.`
      : n === 4 ? `מ${from} ל${to}, ${Math.abs(q.dist)} צעדים ${dir}. קוורטה: ${from} ו${to} — תמיד אחד על קו ואחד ברווח.`
        : `${Math.abs(q.dist)} צעדים ${dir}: מ${from} ל${to}, עם ${from} אחד באמצע.`;
  return `${INTERVAL_NAMES[n]?.name ?? n} (${n}) — ${tip}`;
}
