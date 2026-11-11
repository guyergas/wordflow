// Rules, as in the alef-bet: one new letter a day, and a new one waits while four are still shaky. Exercises are mixed.
// Knowing a letter and writing it are two measures, each reviewed at growing gaps.
import { ABC, LETTER, lookAlikes, PAIRS, wordsOf } from './letters';

export interface Box { box: number; due: number }
export interface Known { see: Box; write: Box; met: number; ok: [number, number]; wrote: [number, number]; missed: Record<string, number> }
export type StepKind = 'meet' | 'trace' | 'copy' | 'memory' | 'write' | 'find' | 'hunt' | 'word' | 'picture' | 'twin' | 'pair' | 'opening';
export interface Step { t: StepKind; id: string; n: number }
export interface Plan { day: number; steps: Step[]; at: number; extra?: boolean }
export interface EState { onboarded: boolean; name: string; letters: Record<string, Known>; days: Record<number, { sec: number; fresh: number }>; plan: Plan | null; settings: { sound: boolean } }
export type PlanOptions = { bonus?: boolean; warm?: boolean; boost?: boolean; focus?: string; rnd?: () => number };

const GAPS = [1, 1, 2, 4, 8, 16, 32];
export const SHAKY_LIMIT = 4;
export const REPEAT = { first: 20, see: 10, write: 10 };
export const WRITING: StepKind[] = ['trace', 'copy', 'memory', 'write', 'opening'];
export const pairsOf = (st: EState, id: string) => PAIRS.filter((p) => p.slice(0, 2).includes(id) && st.letters[p[0]] && st.letters[p[1]] && st.letters[id]);
export const dayNumber = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
export const initial = (name: string): EState => ({ onboarded: true, name, letters: {}, days: {}, plan: null, settings: { sound: true } });
export const secure = (k: Known) => k.see.box >= 2 && k.write.box >= 3;
export const shaky = (st: EState) => Object.keys(st.letters).filter((id) => !secure(st.letters[id]));
export const nextLetter = (st: EState) => ABC.find((l) => !st.letters[l.id]);
export const dayLog = (st: EState, day: number) => st.days[day] ?? { sec: 0, fresh: 0 };
const shuffle = <T,>(a: T[], rnd: () => number) => a.map((v) => ({ v, k: rnd() })).sort((p, q) => p.k - q.k).map((x) => x.v);

export function mix(steps: Step[], rnd: () => number): Step[] {
  const left = shuffle(steps, rnd), out: Step[] = [];
  const kind = (s: Step) => (WRITING.includes(s.t) ? 'draw' : s.t);
  while (left.length) {
    const last = out[out.length - 1], i = last ? left.findIndex((s) => kind(s) !== kind(last)) : 0;
    out.push(left.splice(Math.max(i, 0), 1)[0]);
  }
  return out;
}
function seeSet(st: EState, id: string, count: number, rnd: () => number): Step[] {
  const kinds: StepKind[] = ['find', 'word', 'hunt', 'picture'];
  if (!LETTER[id].big) kinds.push('twin');
  if (pairsOf(st, id).length) kinds.push('pair');
  const order = shuffle(kinds, rnd), seen: Record<string, number> = {};
  return Array.from({ length: count }, (_, i) => { const t = order[i % order.length], n = seen[t] ?? 0; seen[t] = n + 1; return { t, id, n }; });
}
const times = (t: StepKind, id: string, count: number): Step[] => Array.from({ length: count }, (_, n) => ({ t, id, n }));
function writeSet(id: string, box: number): Step[] {
  if (box === 0) return times('trace', id, REPEAT.write);
  if (box === 1) return times('copy', id, REPEAT.write);
  return [...times('memory', id, 4), ...times('write', id, 4), ...times('opening', id, 2)];
}
function practice(st: EState, id: string, day: number, rnd: () => number, force = false): Step[] {
  const k = st.letters[id], out: Step[] = [];
  if (force || k.see.due <= day) out.push(...seeSet(st, id, REPEAT.see, rnd));
  if (force || k.write.due <= day) out.push(...writeSet(id, k.write.box));
  return out;
}
const rate = ([good, bad]: [number, number]) => (good + bad >= 4 ? bad / (good + bad) : 0);
export const hardness = (k: Known) => Math.max(rate(k.ok), rate(k.wrote));
export const isHard = (k: Known) => hardness(k) >= 0.25;

export function buildPlan(st: EState, day: number, o: PlanOptions = {}): Plan {
  const rnd = o.rnd ?? Math.random, met = Object.keys(st.letters);
  // Focused review: one letter or number the parent picked on the board, as free practice that moves no stage.
  if (o.focus && st.letters[o.focus]) return { day, steps: mix(practice(st, o.focus, day, rnd, true), rnd).slice(0, 16), at: 0, extra: true };
  // Warm-up and boost are free practice: no new letter, and stages stay as they are.
  if (o.warm || o.boost) {
    const known = met.filter((id) => secure(st.letters[id]));
    const level = (id: string) => st.letters[id].see.box + st.letters[id].write.box;
    const list = o.warm ? shuffle(known.length >= 2 ? known : met, rnd) : shuffle(met, rnd).sort((a, b) => hardness(st.letters[b]) - hardness(st.letters[a]) || level(a) - level(b));
    return { day, steps: mix(list.slice(0, 3).flatMap((id) => practice(st, id, day, rnd, true)).slice(0, 30), rnd), at: 0, extra: true };
  }
  const due = met.filter((id) => st.letters[id].see.due <= day || st.letters[id].write.due <= day).sort((a, b) => st.letters[a].see.due - st.letters[b].see.due);
  const next = nextLetter(st), freshToday = dayLog(st, day).fresh > 0;
  const canLearn = !!next && shaky(st).length < SHAKY_LIMIT && (!freshToday || !!o.bonus);
  let reviews = due.flatMap((id) => practice(st, id, day, rnd));
  if (!canLearn && !freshToday && !reviews.length) reviews = shaky(st).flatMap((id) => practice(st, id, day, rnd, true));
  reviews = reviews.slice(0, canLearn ? 20 : 40);
  if (canLearn && next) return { day, steps: [{ t: 'meet', id: next.id, n: 0 }, ...mix([...reviews, ...seeSet(st, next.id, REPEAT.first, rnd), ...times('trace', next.id, REPEAT.write)], rnd)], at: 0 };
  return { day, steps: mix(reviews, rnd), at: 0 };
}

const bump = (b: Box, ok: boolean, day: number): Box => {
  if (!ok) return { box: Math.max(0, b.box - 1), due: day + 1 };
  if (b.due > day) return b;
  const box = Math.min(GAPS.length - 1, b.box + 1);
  return { box, due: day + GAPS[box] };
};
export function meet(st: EState, id: string, day: number): EState {
  if (st.letters[id]) return st;
  const log = dayLog(st, day);
  return { ...st, letters: { ...st.letters, [id]: { see: { box: 0, due: day }, write: { box: 0, due: day }, met: day, ok: [0, 0], wrote: [0, 0], missed: {} } }, days: { ...st.days, [day]: { ...log, fresh: log.fresh + 1 } } };
}
/** Free practice counts right and wrong, and moves no stage. */
export function answer(st: EState, id: string, what: 'see' | 'write', ok: boolean, day: number, free = false): EState {
  const k = st.letters[id]; if (!k) return st;
  const field = what === 'see' ? 'ok' : 'wrote', [g, b] = k[field];
  return { ...st, letters: { ...st.letters, [id]: { ...k, [what]: free ? k[what] : bump(k[what], ok, day), [field]: ok ? [g + 1, b] : [g, b + 1] } } };
}
export function noteMiss(st: EState, id: string, other: string): EState {
  const k = st.letters[id]; if (!k) return st;
  return { ...st, letters: { ...st.letters, [id]: { ...k, missed: { ...k.missed, [other]: (k.missed[other] ?? 0) + 1 } } } };
}
export const topMisses = (k: Known) => Object.entries(k.missed).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
export type Status = 'hard' | 'known' | 'learning' | 'new';
export const statusOf = (st: EState, id: string): Status => { const k = st.letters[id]; return !k ? 'new' : isHard(k) ? 'hard' : secure(k) ? 'known' : 'learning'; };
export const advance = (st: EState): EState => (st.plan ? { ...st, plan: { ...st.plan, at: st.plan.at + 1 } } : st);
export const addTime = (st: EState, day: number, sec: number): EState => { const log = dayLog(st, day); return { ...st, days: { ...st.days, [day]: { ...log, sec: log.sec + sec } } }; };
export const validStep = (s: Step) => !!LETTER[s.id];

/** Choices of the same size: look-alikes first, then met letters, then the rest. Small letters are never mixed with capitals here. */
export function choices(st: EState, id: string, size = 3, rnd: () => number = Math.random): string[] {
  const sameCase = (c: string) => LETTER[c].big === LETTER[id].big;
  const like = shuffle(lookAlikes(id).filter((c) => LETTER[c] && sameCase(c)), rnd).sort((a, b) => Number(!!st.letters[b]) - Number(!!st.letters[a]));
  const met = shuffle(Object.keys(st.letters).filter((c) => c !== id && sameCase(c)), rnd);
  const rest = shuffle(ABC.map((l) => l.id).filter((c) => c !== id && sameCase(c)), rnd);
  return shuffle([id, ...[...new Set([...met.filter((c) => like.includes(c)), ...like, ...met, ...rest])].slice(0, size - 1)], rnd);
}
export function huntCells(st: EState, id: string, rnd: () => number = Math.random): string[] {
  const others = choices(st, id, 4, rnd).filter((c) => c !== id);
  return shuffle([...Array<string>(5).fill(id), ...Array.from({ length: 11 }, (_, i) => others[i % others.length])], rnd);
}
/** Three pictures: one opens with the letter, and two open with other letters. */
export function pictureChoices(st: EState, id: string, n: number, rnd: () => number = Math.random) {
  const own = wordsOf(id), right = own[n % own.length];
  const others = choices(st, id.toUpperCase(), 3, rnd).filter((c) => c.toUpperCase() !== id.toUpperCase()).map((c) => { const w = wordsOf(c); return w[Math.floor(rnd() * w.length)]; });
  return { right, options: shuffle([right, ...others], rnd) };
}
