// Exercise Generator, Answer Evaluation and Hints.

import {
  Clef, describePosition, diatonic, fromDiatonic, keyAccidental, KeySig, keySigText, Letter, LETTERS, midi, parsePitch, Pitch,
  pitchAtPosition, pitchId, pitchName, staffPosition,
} from '../music/pitch';
import type { Attempt, ErrorType, SessionSummary, Settings } from '../storage/types';
import type { Skill, StageItem } from './curriculum';
import { getItem, itemMastery, median, mean, StatsIndex, targetFor, clamp } from './stats';

export interface Question {
  n: number;
  skill: Skill;
  clef: Clef;
  pitch: Pitch;
  timeLimitMs: number | null;
  /** Read under this key signature. */
  keySig?: KeySig;
}

export interface PoolItem extends StageItem {
  skill: Skill;
}

type Rng = () => number;

function weightedPick<T>(xs: T[], w: (x: T) => number, rng: Rng): T {
  const ws = xs.map((x) => Math.max(0.0001, w(x)));
  let r = rng() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < xs.length; i++) {
    r -= ws[i];
    if (r <= 0) return xs[i];
  }
  return xs[xs.length - 1];
}

const same = (a: PoolItem, b: { skill: Skill; clef: Clef; pitch: Pitch }) =>
  a.skill === b.skill && a.clef === b.clef && pitchId(a.pitch) === pitchId(b.pitch);

export interface GeneratorOptions {
  mode: 'practice' | 'test';
  count: number;
  pool: PoolItem[];
  reviewPool?: PoolItem[];
  reviewShare?: number;
  timeLimitMs: number | null;
  adaptiveTime: boolean;
  idx: StatsIndex;
  settings: Settings;
  rng?: Rng;
}

/**
 * Adaptive selection: weak, slow, new and due items are weighted up;
 * mastered items still appear; no immediate repeats; error streaks get an easy win;
 * a practice session ends on an easy item.
 */
export class Generator {
  private rng: Rng;
  private testList: PoolItem[] = [];
  private relaxUntil = -1;
  constructor(private o: GeneratorOptions) {
    this.rng = o.rng ?? Math.random;
    if (o.mode === 'test') this.testList = balancedList(o.pool, o.count, this.rng);
  }

  private weight(it: PoolItem, recent: Question[], now: number): number {
    const s = getItem(this.o.idx, it.skill, it.clef, pitchId(it.pitch));
    const target = targetFor(it.skill, this.o.settings);
    let w = 1 + 4 * (1 - s.acc);
    if (s.medianRt != null && s.medianRt > target) w += 2 * Math.min(1, s.medianRt / target - 1);
    if (s.attempts === 0) w += 2;
    else if (now >= s.dueAt) w += 1.5;
    if (recent.slice(-3).some((q) => same(it, q))) w *= 0.25;
    return w;
  }

  private easiest(pool: PoolItem[], last?: Question): PoolItem {
    const cands = pool.filter((p) => !last || !same(p, last));
    return cands.reduce((best, p) => {
      const m = itemMastery(getItem(this.o.idx, p.skill, p.clef, pitchId(p.pitch)), p.skill, this.o.settings);
      const mb = itemMastery(getItem(this.o.idx, best.skill, best.clef, pitchId(best.pitch)), best.skill, this.o.settings);
      return m > mb ? p : best;
    }, cands[0] ?? pool[0]);
  }

  private timeFor(it: PoolItem, n: number): number | null {
    if (!this.o.adaptiveTime || n <= this.relaxUntil) return this.o.adaptiveTime ? null : this.o.timeLimitMs;
    const s = getItem(this.o.idx, it.skill, it.clef, pitchId(it.pitch));
    if (s.attempts < 6 || s.acc < 0.85 || s.medianRt == null) return null;
    // Push gently: a bit above the user's own median, never below 1.2s.
    return Math.round(clamp(s.medianRt * 2.2, 1200, 8000) / 100) * 100;
  }

  next(history: { q: Question; correct: boolean }[], now = Date.now()): Question {
    const n = history.length;
    const last = history[n - 1]?.q;
    let it: PoolItem;
    if (this.o.mode === 'test') {
      it = this.testList[n % this.testList.length];
    } else {
      // Easy win once per error streak (exactly two misses in a row), and to close the session —
      // only when we know which items are easy for this learner.
      const errStreak = n >= 2 && !history[n - 1].correct && !history[n - 2].correct && (n < 3 || history[n - 3].correct);
      if (errStreak) this.relaxUntil = n + 2;
      const isLast = n === this.o.count - 1;
      const easy = (errStreak || isLast) ? this.easiest(this.o.pool, last) : null;
      const knownEasy = easy && itemMastery(getItem(this.o.idx, easy.skill, easy.clef, pitchId(easy.pitch)), easy.skill, this.o.settings) >= 0.3;
      if (easy && knownEasy) {
        it = easy;
      } else {
        const useReview = this.o.reviewPool?.length && this.rng() < (this.o.reviewShare ?? 0);
        const pool = (useReview ? this.o.reviewPool! : this.o.pool).filter((p) => !last || !same(p, last));
        const recent = history.map((h) => h.q);
        it = weightedPick(pool.length ? pool : this.o.pool, (p) => this.weight(p, recent, now), this.rng);
      }
    }
    return { n, skill: it.skill, clef: it.clef, pitch: it.pitch, timeLimitMs: this.timeFor(it, n), ...(it.keySig ? { keySig: it.keySig } : {}) };
  }
}

/** Every item appears about equally often, shuffled, with no back-to-back repeats. */
export function balancedList<T extends PoolItem>(pool: T[], count: number, rng: Rng = Math.random): T[] {
  const out: T[] = [];
  while (out.length < count) {
    const round = [...pool];
    for (let i = round.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [round[i], round[j]] = [round[j], round[i]];
    }
    if (out.length && round.length > 1 && same(round[0], out[out.length - 1])) round.push(round.shift()!);
    out.push(...round);
  }
  return out.slice(0, count);
}

// ---------- Evaluation ----------

export interface Evaluation {
  correct: boolean;
  error?: ErrorType;
}

/** Black-key answer buttons on the name pad: one button per black key, labelled with both spellings. */
export const BLACK_ANSWERS = ['C#', 'D#', 'F#', 'G#', 'A#'] as const;
export type BlackAnswer = (typeof BLACK_ANSWERS)[number];
/** A name answer: a natural letter, or a black-key button (C#/D♭ …). */
export type NameAnswer = Letter | BlackAnswer;

const NAT_PC: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const pc = (p: Pitch) => (((midi(p)) % 12) + 12) % 12;

export function isBlackAnswer(a: string): a is BlackAnswer {
  return (BLACK_ANSWERS as readonly string[]).includes(a);
}

/** Both spellings of a black-key button, e.g. "C#" → "C♯ / D♭". */
export function blackLabel(a: BlackAnswer): { sharp: string; flat: string } {
  const next = LETTERS[(LETTERS.indexOf(a[0] as Letter) + 1) % 7];
  return { sharp: `${a[0]}♯`, flat: `${next}♭` };
}

/**
 * Name answers. A black-key button accepts either spelling of that key (C♯ and D♭ are the same key);
 * a letter button means the natural note.
 */
export function evaluateName(q: Question, ans: NameAnswer | null): Evaluation {
  if (ans === null) return { correct: false, error: 'timeout' };
  const target = q.pitch;
  if (isBlackAnswer(ans)) {
    if (target.accidental !== 0 && pc(target) === (NAT_PC[ans[0] as Letter] + 1) % 12) return { correct: true };
  } else if (target.accidental === 0 && ans === target.letter) {
    return { correct: true };
  }
  // Right note name, wrong ♯/♭/natural.
  const letters: Letter[] = isBlackAnswer(ans)
    ? [ans[0] as Letter, LETTERS[(LETTERS.indexOf(ans[0] as Letter) + 1) % 7]]
    : [ans];
  if (letters.includes(target.letter)) return { correct: false, error: 'accidental' };
  const letter = isBlackAnswer(ans) ? (ans[0] as Letter) : ans;
  const d = Math.abs(LETTERS.indexOf(letter) - LETTERS.indexOf(target.letter));
  if (d === 1 || d === 6) return { correct: false, error: 'adjacent' };
  const other: Clef = q.clef === 'treble' ? 'bass' : 'treble';
  if (!isBlackAnswer(ans) && pitchAtPosition(staffPosition(target, q.clef), other).letter === letter) return { correct: false, error: 'clef' };
  return { correct: false, error: 'other' };
}

/** How an answer is shown back to the learner. */
export function answerLabel(a: string): string {
  if (isBlackAnswer(a)) { const l = blackLabel(a); return `${l.sharp}/${l.flat}`; }
  return a;
}

export function evaluateKey(q: Question, keyMidi: number | null): Evaluation {
  if (keyMidi === null) return { correct: false, error: 'timeout' };
  const target = midi(q.pitch);
  if (keyMidi === target) return { correct: true };
  if ((keyMidi - target) % 12 === 0) return { correct: false, error: 'octave' };
  const blackKey = [1, 3, 6, 8, 10].includes(((keyMidi % 12) + 12) % 12);
  // F♯ answered with F (or F answered with F♯): right key family, missed the ♯/♭.
  if (q.pitch.accidental !== 0 && keyMidi === target - q.pitch.accidental) return { correct: false, error: 'accidental' };
  if (q.pitch.accidental === 0 && blackKey && Math.abs(keyMidi - target) === 1) return { correct: false, error: 'accidental' };
  if (Math.abs(keyMidi - target) <= 2) return { correct: false, error: 'adjacent' };
  return { correct: false, error: 'other' };
}

/** Spell a MIDI key as the pitch the keyboard shows (sharps for black keys). */
export function pitchFromMidi(m: number): Pitch {
  const pc = ((m % 12) + 12) % 12;
  const octave = Math.floor(m / 12) - 1;
  const map: [Letter, -1 | 0 | 1][] = [
    ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0], ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0],
  ];
  const [letter, accidental] = map[pc];
  return { letter, octave, accidental };
}

// ---------- Hints (never name the target) ----------

const ANCHORS: Record<Clef, string[]> = {
  treble: ['C4', 'G4', 'C5', 'C6'],
  bass: ['C2', 'C3', 'F3', 'C4'],
};

export interface Hint {
  level: 1 | 2 | 3;
  text: string;
  anchor?: Pitch;
}

export function anchorFor(p: Pitch, clef: Clef): Pitch {
  const d = diatonic(p);
  const cands = ANCHORS[clef].map(parsePitch).filter((a) => diatonic(a) !== d);
  return cands.reduce((b, a) => (Math.abs(diatonic(a) - d) < Math.abs(diatonic(b) - d) ? a : b));
}

const HEB_NUM = ['', 'צעד אחד', 'שני צעדים', 'שלושה צעדים', 'ארבעה צעדים', 'חמישה צעדים', 'שישה צעדים', 'שבעה צעדים', 'שמונה צעדים'];

/** True when the note's ♯/♭ comes from the key signature rather than a sign in front of it. */
export function fromKey(q: Pick<Question, 'pitch' | 'keySig'>): boolean {
  return !!q.keySig && q.pitch.accidental !== 0 && keyAccidental(q.keySig, q.pitch.letter) === q.pitch.accidental;
}

export function hint(q: Question, level: 1 | 2 | 3): Hint {
  const accNote = fromKey(q)
    ? ` שימי לב לסימן הסולם בתחילת השורה (${keySigText(q.keySig!)}) — הוא חל על כל ${q.pitch.letter}.`
    : q.pitch.accidental === 1 ? ' הסימן ♯ לפניו מעלה אותו בחצי טון — לקליד השחור שמימין.'
    : q.pitch.accidental === -1 ? ' הסימן ♭ לפניו מוריד אותו בחצי טון — לקליד השחור שמשמאל.' : '';
  if (level === 1) return { level, text: `התו נמצא ${describePosition(q.pitch, q.clef)}.${accNote}` };
  const a = anchorFor(q.pitch, q.clef);
  if (level === 2) {
    return { level, anchor: a, text: `התו האפור הוא העוגן ${pitchName(a)}. ספרי ממנו קו־רווח־קו.${accNote}` };
  }
  const diff = diatonic(q.pitch) - diatonic(a);
  const steps = HEB_NUM[Math.abs(diff)] ?? `${Math.abs(diff)} צעדים`;
  return { level, anchor: a, text: `${steps} ${diff > 0 ? 'מעל ' : 'מתחת ל־'}${pitchName(a)}.${accNote}` };
}

// ---------- Explanation after a wrong practice answer ----------

export function explain(q: Question, error?: ErrorType): string {
  const where = describePosition(q.pitch, q.clef);
  const clefName = q.clef === 'treble' ? 'מפתח סול' : 'מפתח פה';
  const base = `${pitchName(q.pitch)} — ${where} ב${clefName}.`;
  switch (error) {
    case 'clef': return `${base} זו הייתה התשובה בחמשה של המפתח השני — שימי לב לסימן המפתח.`;
    case 'adjacent': return `${base} קרוב מאוד — צעד אחד בלבד.`;
    case 'octave': return `${base} האות נכונה, האוקטבה לא. Middle C הוא C4.`;
    case 'accidental':
      if (fromKey(q)) return `${base} בסימן הסולם יש ${keySigText(q.keySig!)} — לכן כל ${q.pitch.letter} בשורה הזו הוא ${pitchName(q.pitch, false)}, גם בלי סימן לפני התו.`;
      if (q.pitch.accidental === 1) return `${base} שימי לב לסימן ♯ — הוא מעלה בחצי טון, לקליד השחור שמימין ל־${q.pitch.letter}.`;
      if (q.pitch.accidental === -1) return `${base} שימי לב לסימן ♭ — הוא מוריד בחצי טון, לקליד השחור שמשמאל ל־${q.pitch.letter}.`;
      return `${base} אין לפניו ♯ או ♭ — זה הקליד הלבן.`;
    case 'timeout': return `${base} הזמן נגמר.`;
    default: return base;
  }
}

// ---------- Summary ----------

export function summarize(attempts: Attempt[], settings: Settings, passCriteria?: boolean): SessionSummary {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const misses = attempts.filter((a) => a.error === 'timeout').length;
  const rts = attempts.filter((a) => a.correct && a.rtMs != null).map((a) => a.rtMs!);
  const target = attempts[0] ? targetFor(attempts[0].skill, settings) : settings.fluencyTargetMs;
  const points = attempts.map((a) => {
    if (!a.correct || a.rtMs == null) return 0;
    const b = clamp(1 - (a.rtMs - 0.5 * target) / (1.5 * target), 0, 1);
    return (60 + 40 * b) * (a.hints ? 0.7 : 1);
  });
  const wrong = new Map<string, number>();
  for (const a of attempts) if (!a.correct) wrong.set(noteLabel(a), (wrong.get(noteLabel(a)) ?? 0) + 1);
  const byNote = new Map<string, number[]>();
  for (const a of attempts) if (a.correct && a.rtMs != null) byNote.set(noteLabel(a), [...(byNote.get(noteLabel(a)) ?? []), a.rtMs]);
  const slow = [...byNote].map(([key, xs]) => ({ key, medianRt: median(xs)! })).sort((a, b) => b.medianRt - a.medianRt);
  const medianRt = median(rts);
  const accuracy = total ? correct / total : 0;
  return {
    total, correct, misses, accuracy,
    meanRt: mean(rts), medianRt,
    score: Math.round(mean(points) ?? 0),
    passed: passCriteria ? accuracy >= settings.masteryAccuracy && medianRt != null && medianRt <= target : undefined,
    wrongNotes: [...wrong].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    slowNotes: slow.slice(0, 3),
  };
}

export function noteLabel(a: Pick<Attempt, 'clef' | 'pitch'>): string {
  return `${pitchName(parsePitch(a.pitch))} ${a.clef === 'treble' ? 'סול' : 'פה'}`;
}

export { fromDiatonic };
