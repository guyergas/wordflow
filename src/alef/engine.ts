// Rules of the course. One new letter at a time, and a new one waits while three letters are still shaky.
// Knowing a letter and writing it are two separate measures, each with its own spaced review.
import { FINALS, firstWords, LETTER, LETTERS, lookAlikes, PAIRS, SONG_ORDER, SONG_TIMES } from './letters';

export interface Box { box: number; due: number }
/** Right and wrong counts, and which letters this one was mistaken for. Practice counts here too, though it moves no stage. */
export interface Tally { see: [number, number]; write: [number, number]; mixed: Record<string, number> }
export interface Known { see: Box; write: Box; met: number; tally?: Tally }
export type Step = { t: 'meet' | 'trace' | 'copy' | 'memory' | 'write' | 'opening' | 'find' | 'word' | 'sound' | 'hunt' | 'pair' | 'missing' | 'song'; id: string; print?: boolean; n?: number };
export interface Plan { day: number; steps: Step[]; at: number; extra?: boolean; mixed?: boolean; review?: number }
export interface AState { onboarded: boolean; name: string; letters: Record<string, Known>; days: Record<number, { sec: number; fresh: number; done?: boolean }>; plan: Plan | null; reviews?: number[]; settings: { sound: boolean } }

const GAPS = [1, 1, 2, 4, 8, 16, 32];
export const SHAKY_LIMIT = 4;
/** Writing grows in three stages: over a dashed letter, beside a model, then alone. */
export const writeStage = (box: number): Step['t'] => (box === 0 ? 'trace' : box === 1 ? 'copy' : 'write');
export const dayNumber = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
export const initial = (name: string): AState => ({ onboarded: true, name, letters: {}, days: {}, plan: null, settings: { sound: true } });
export const secure = (k: Known) => k.see.box >= 2 && k.write.box >= 3;
export const shaky = (st: AState) => Object.keys(st.letters).filter((id) => !secure(st.letters[id]));
/** Letters he keeps getting wrong. Only these hold back a new letter: a letter that is merely young does not. */
export const struggling = (st: AState) => Object.keys(st.letters).filter((id) => isHard(st.letters[id]));
export const HARD_LIMIT = 3;
export const nextLetter = (st: AState) => LETTERS.find((l) => !st.letters[l.id]);
export const dayLog = (st: AState, day: number) => st.days[day] ?? { sec: 0, fresh: 0 };

const shuffle = <T,>(a: T[], rnd: () => number) => a.map((v) => ({ v, k: rnd() })).sort((p, q) => p.k - q.k).map((x) => x.v);

/** Each sitting gives a letter this many tasks of each measure, and the recognition tasks are shared among the games it can have. */
export const REPEAT = { firstSee: 20, see: 10, write: 10 };
/** A review is short: a few tasks per letter, at most REVIEW_MAX on a day with a new letter and REVIEW_ONLY_MAX on a day without one. */
export const REVIEW_EACH = 4, REVIEW_MAX = 12, REVIEW_ONLY_MAX = 24;
/** After every REVIEW_EVERY new letters comes a long review day: no new letter, LONG_EACH recognition and LONG_EACH writing tasks for every letter met so far, at most LONG_MAX. */
export const REVIEW_EVERY = 6, LONG_EACH = 3, LONG_MAX = 48;
export function longReviewDue(st: AState, day: number): number | null {
  const met = Object.values(st.letters), n = Math.floor(met.length / REVIEW_EVERY) * REVIEW_EVERY;
  if (!n || (st.reviews ?? []).includes(n) || Math.max(...met.map((k) => k.met)) >= day) return null;
  return n;
}
const times = (t: Step['t'], id: string, count: number): Step[] => Array.from({ length: count }, (_, n) => ({ t, id, n }));
export const WRITING: Step['t'][] = ['trace', 'copy', 'memory', 'write', 'opening'];
export const pairsOf = (st: AState, id: string) => PAIRS.filter((p) => p.slice(0, 2).includes(id) && st.letters[p[0]] && st.letters[p[1]] && st.letters[id]);

function seeSet(st: AState, id: string, count: number, rnd: () => number): Step[] {
  const opens = firstWords(id).length > 0, k = st.letters[id];
  const kinds: Step['t'][] = ['find', 'word', 'hunt'];
  if (opens) kinds.push('sound');
  if (opens && k && k.see.box >= 1) kinds.push('missing');
  if (pairsOf(st, id).length) kinds.push('pair');
  const seen: Record<string, number> = {}, order = shuffle(kinds, rnd);
  return Array.from({ length: count }, (_, i) => {
    const t = order[i % order.length], n = seen[t] ?? 0;
    seen[t] = n + 1;
    return t === 'find' ? { t, id, n, print: !!k && k.see.box >= 2 && rnd() < 0.5 } : { t, id, n };
  });
}

function writeSet(k: Known, id: string): Step[] {
  if (k.write.box < 2) return times(writeStage(k.write.box), id, REPEAT.write);
  // Once a letter is written beside a model, writing varies: from memory, alone, and from the sound of a word.
  return firstWords(id).length ? [...times('memory', id, 4), ...times('write', id, 4), ...times('opening', id, 2)] : [...times('memory', id, 5), ...times('write', id, 5)];
}

function practice(st: AState, id: string, day: number, rnd: () => number, force = false, short = false): Step[] {
  const k = st.letters[id], out: Step[] = [];
  if (force || k.see.due <= day) out.push(...seeSet(st, id, short ? REVIEW_EACH : REPEAT.see, rnd));
  if (force || k.write.due <= day) out.push(...(short ? shuffle(writeSet(k, id), rnd).slice(0, REVIEW_EACH) : writeSet(k, id)));
  return out;
}

/** Exercises in random order, so that writing and recognizing keep alternating. The same kind twice in a row happens only when nothing else is left. */
export function mix(steps: Step[], rnd: () => number): Step[] {
  const left = shuffle(steps, rnd), out: Step[] = [];
  const kind = (s: Step) => (WRITING.includes(s.t) ? 'draw' : s.t);
  while (left.length) {
    const last = out[out.length - 1], i = last ? left.findIndex((s) => kind(s) !== kind(last)) : 0;
    out.push(left.splice(Math.max(i, 0), 1)[0]);
  }
  return out;
}

/** A sitting: some review of whole letters, then the new letter. */
export type PlanOptions = { bonus?: boolean; extra?: boolean; warm?: boolean; boost?: boolean; rnd?: () => number };
const level = (k: Known) => k.see.box + k.write.box;
export function buildPlan(st: AState, day: number, o: PlanOptions = {}): Plan {
  const rnd = o.rnd ?? Math.random, met = Object.keys(st.letters);
  // Warm-up and boost are free practice: no new letter, and stages stay as they are.
  if (o.warm || o.boost) {
    const known = met.filter((id) => secure(st.letters[id]));
    const list = o.warm ? shuffle(known.length >= 2 ? known : met, rnd) : shuffle(met, rnd).sort((a, b) => hardness(st.letters[b]) - hardness(st.letters[a]) || level(st.letters[a]) - level(st.letters[b]));
    // A warm-up: every letter in the list gets its turn (up to eight), with fewer tasks each when there are many, so none is skipped.
    if (o.boost) return { day, steps: mix(list.slice(0, 3).flatMap((id) => practice(st, id, day, rnd, true)).slice(0, 30), rnd), at: 0, extra: true, mixed: true };
    const pick = list.slice(0, 8), each = Math.max(2, Math.floor(15 / pick.length));
    const steps = pick.flatMap((id) => [...seeSet(st, id, each, rnd), ...shuffle(writeSet(st.letters[id], id), rnd).slice(0, each)]);
    return { day, steps: mix(steps, rnd), at: 0, extra: true, mixed: true };
  }
  if (o.extra) {
    const steps = shuffle(met, rnd).slice(0, 2).flatMap((id) => practice(st, id, day, rnd, true));
    return { day, steps: mix(steps, rnd), at: 0, extra: true, mixed: true };
  }
  const long = o.bonus ? null : longReviewDue(st, day);
  if (long) {
    // A long review: every letter met so far, the weakest first, with recognition and writing mixed.
    const order = [...met].sort((a, b) => level(st.letters[a]) - level(st.letters[b]));
    const steps = order.flatMap((id) => [...seeSet(st, id, LONG_EACH, rnd), ...shuffle(writeSet(st.letters[id], id), rnd).slice(0, LONG_EACH)]);
    return { day, steps: mix(steps, rnd).slice(0, LONG_MAX), at: 0, mixed: true, review: long };
  }
  const due = met.filter((id) => st.letters[id].see.due <= day || st.letters[id].write.due <= day)
    .sort((a, b) => Math.min(st.letters[a].see.due, st.letters[a].write.due) - Math.min(st.letters[b].see.due, st.letters[b].write.due));
  const next = nextLetter(st), freshToday = dayLog(st, day).fresh > 0;
  const canLearn = !!next && struggling(st).length < HARD_LIMIT && (!freshToday || !!o.bonus);
  // Reviews are short, a few tasks for each letter that is due, so the boys reach new material while they still want to.
  let reviews = due.flatMap((id) => practice(st, id, day, rnd, false, true));
  if (!canLearn && !freshToday && !reviews.length) reviews = shaky(st).flatMap((id) => practice(st, id, day, rnd, true, true));
  reviews = mix(reviews, rnd).slice(0, canLearn ? REVIEW_MAX : REVIEW_ONLY_MAX);
  // The new letter comes first: meeting it and its own tasks. The short review comes after.
  if (canLearn && next) {
    const id = next.id;
    return { day, steps: [{ t: 'meet', id }, ...mix([...seeSet({ ...st, letters: { ...st.letters, [id]: { see: { box: 0, due: day }, write: { box: 0, due: day }, met: day } } }, id, REPEAT.firstSee, rnd), ...times('trace', id, REPEAT.write)], rnd), ...reviews], at: 0, mixed: true };
  }
  return { day, steps: reviews, at: 0, mixed: true };
}

const bump = (b: Box, ok: boolean, day: number): Box => {
  if (!ok) return { box: Math.max(0, b.box - 1), due: day + 1 };
  // A second success on the same day proves nothing new, so it does not move the letter on.
  if (b.due > day) return b;
  const box = Math.min(GAPS.length - 1, b.box + 1);
  return { box, due: day + GAPS[box] };
};

export function meet(st: AState, id: string, day: number): AState {
  if (st.letters[id]) return st;
  const log = dayLog(st, day);
  return { ...st, letters: { ...st.letters, [id]: { see: { box: 0, due: day }, write: { box: 0, due: day }, met: day } }, days: { ...st.days, [day]: { ...log, fresh: log.fresh + 1 } } };
}
const emptyTally = (): Tally => ({ see: [0, 0], write: [0, 0], mixed: {} });
export function record(st: AState, id: string, what: 'see' | 'write', ok: boolean): AState {
  const k = st.letters[id]; if (!k) return st;
  const old = k.tally ?? emptyTally(), pair: [number, number] = ok ? [old[what][0] + 1, old[what][1]] : [old[what][0], old[what][1] + 1];
  return { ...st, letters: { ...st.letters, [id]: { ...k, tally: { ...old, [what]: pair } } } };
}
export function noteMix(st: AState, id: string, other: string): AState {
  const k = st.letters[id]; if (!k) return st;
  const old = k.tally ?? emptyTally();
  return { ...st, letters: { ...st.letters, [id]: { ...k, tally: { ...old, mixed: { ...old.mixed, [other]: (old.mixed[other] ?? 0) + 1 } } } } };
}
const missRate = ([ok, bad]: [number, number]) => (ok + bad >= 4 ? bad / (ok + bad) : 0);
/** How hard a letter is for this child: the share of tasks missed, in its weaker measure. */
export const hardness = (k: Known) => (k.tally ? Math.max(missRate(k.tally.see), missRate(k.tally.write)) : 0);
export const isHard = (k: Known) => hardness(k) >= 0.25;
export const topMix = (k: Known) => Object.entries(k.tally?.mixed ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map((e) => e[0]);
export type Status = 'hard' | 'known' | 'learning' | 'new';
export const statusOf = (st: AState, id: string): Status => { const k = st.letters[id]; return !k ? 'new' : isHard(k) ? 'hard' : secure(k) ? 'known' : 'learning'; };

export function answer(st: AState, id: string, what: 'see' | 'write', ok: boolean, day: number): AState {
  const k = st.letters[id];
  return k ? { ...st, letters: { ...st.letters, [id]: { ...k, [what]: bump(k[what], ok, day) } } } : st;
}
/** Moves to the next task. Finishing a long review records it, so it does not come back; leaving it in the middle brings it back. */
export const advance = (st: AState): AState => {
  if (!st.plan) return st;
  const plan = { ...st.plan, at: st.plan.at + 1 }, ended = plan.review && plan.at >= plan.steps.length;
  return { ...st, plan, ...(ended ? { reviews: [...(st.reviews ?? []), plan.review!] } : {}) };
};
export const addTime = (st: AState, day: number, sec: number): AState => { const log = dayLog(st, day); return { ...st, days: { ...st.days, [day]: { ...log, sec: log.sec + sec } } }; };

/** The other choices in a find game: look-alikes first, then letters already met, then the coming ones. */
export function choices(st: AState, id: string, rnd: () => number = Math.random): string[] {
  const size = Object.keys(st.letters).length >= 6 ? 4 : 3;
  const known = (c: string) => !!st.letters[c];
  const like = shuffle(lookAlikes(id), rnd).sort((a, b) => Number(known(b)) - Number(known(a)));
  const met = shuffle(Object.keys(st.letters).filter((c) => c !== id), rnd);
  const rest = LETTERS.map((l) => l.id).filter((c) => c !== id);
  const allowed = (c: string) => known(c) || !FINALS.includes(c) || FINALS.includes(id);
  const others = [...new Set([...like, ...met, ...rest])].filter(allowed).slice(0, size - 1);
  return shuffle([id, ...others], rnd);
}

const STEPS = ['meet', 'trace', 'copy', 'memory', 'write', 'opening', 'find', 'word', 'sound', 'hunt', 'pair', 'missing'];
/** The look-alikes and other letters that fill a hunt: 5 to find among 16. */
export function huntCells(st: AState, id: string, rnd: () => number = Math.random): string[] {
  const others = choices({ ...st, letters: { ...st.letters } }, id, rnd).filter((c) => c !== id);
  const fill = Array.from({ length: 11 }, (_, i) => others[i % others.length]);
  return shuffle([...Array<string>(5).fill(id), ...fill], rnd);
}

/** A question on the order of the alef-bet: the song sings one to four letters in a row, and the child picks the letter that comes next.
 * The choices hold the right letter and two to four others: its neighbours in the alef-bet first, since those are the real mix-ups, then look-alikes. */
export interface OrderQuestion { target: string; lead: string[]; from: number; to: number; options: string[] }
export function orderQuestion(rnd: () => number = Math.random, avoid?: string): OrderQuestion {
  let k = 1 + Math.floor(rnd() * (SONG_ORDER.length - 1));
  if (SONG_ORDER[k] === avoid) k = k === SONG_ORDER.length - 1 ? 1 : k + 1;
  const len = 1 + Math.floor(rnd() * Math.min(4, k)), lead = SONG_ORDER.slice(k - len, k).split('');
  const target = SONG_ORDER[k], size = 3 + Math.floor(rnd() * 3);
  const near = [k + 1, k + 2, k - len - 1, k + 3].filter((i) => i >= 0 && i < SONG_ORDER.length).map((i) => SONG_ORDER[i]);
  const others = [...new Set([...shuffle(near, rnd), ...shuffle(lookAlikes(target).filter((c) => SONG_ORDER.includes(c)), rnd), ...shuffle(SONG_ORDER.split(''), rnd)])]
    .filter((c) => c !== target && !lead.includes(c)).slice(0, size - 1);
  return { target, lead, from: SONG_TIMES[k - len][0], to: SONG_TIMES[k - 1][1], options: shuffle([target, ...others], rnd) };
}

export const validStep = (s: Step) => !!LETTER[s.id] && STEPS.includes(s.t);
