// Rules: three new words a day, and new words wait while four groups are still shaky. Exercises are mixed.
// A group is secure after being answered well on separate days. Words that go wrong are remembered for the progress page.
import { ALL_WORDS, BATCH, Batch, BATCHES, Word, WORD } from './words';

export interface Box { box: number; due: number }
export interface Known { see: Box; met: number; ok: number; bad: number; missed: Record<string, number> }
export type StepKind = 'meet' | 'listen' | 'yesno' | 'hunt' | 'pairs';
export interface Step { t: StepKind; id: string; n: number; word?: string }
export interface Plan { day: number; steps: Step[]; at: number; extra?: boolean }
export interface EState { onboarded: boolean; name: string; batches: Record<string, Known>; days: Record<number, { sec: number; fresh: number }>; plan: Plan | null; settings: { sound: boolean } }
export type PlanOptions = { bonus?: boolean; warm?: boolean; boost?: boolean; rnd?: () => number };

const GAPS = [1, 1, 2, 4, 8, 16, 32];
export const SHAKY_LIMIT = 4;
export const REPEAT = { first: 24, review: 12 };
export const dayNumber = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
export const initial = (name: string): EState => ({ onboarded: true, name, batches: {}, days: {}, plan: null, settings: { sound: true } });
export const secure = (k: Known) => k.see.box >= 3;
export const shaky = (st: EState) => Object.keys(st.batches).filter((id) => !secure(st.batches[id]));
export const nextBatch = (st: EState) => BATCHES.find((b) => !st.batches[b.id]);
export const dayLog = (st: EState, day: number) => st.days[day] ?? { sec: 0, fresh: 0 };
const shuffle = <T,>(a: T[], rnd: () => number) => a.map((v) => ({ v, k: rnd() })).sort((p, q) => p.k - q.k).map((x) => x.v);

export function mix(steps: Step[], rnd: () => number): Step[] {
  const left = shuffle(steps, rnd), out: Step[] = [];
  while (left.length) {
    const last = out[out.length - 1], i = last ? left.findIndex((s) => s.t !== last.t) : 0;
    out.push(left.splice(Math.max(i, 0), 1)[0]);
  }
  return out;
}
/** Listening does most of the teaching. The other games come in between, so that it stays a game. */
function games(b: Batch, count: number): Step[] {
  const pattern: StepKind[] = ['listen', 'yesno', 'listen', 'hunt', 'listen', 'yesno', 'listen', 'pairs'];
  return Array.from({ length: count }, (_, n) => ({ t: pattern[n % pattern.length], id: b.id, n, word: b.words[n % b.words.length].en }));
}
const hardness = (k: Known) => (k.ok + k.bad >= 4 ? k.bad / (k.ok + k.bad) : 0);
export const isHard = (k: Known) => hardness(k) >= 0.25;

export function buildPlan(st: EState, day: number, o: PlanOptions = {}): Plan {
  const rnd = o.rnd ?? Math.random, met = Object.keys(st.batches);
  if (o.warm || o.boost) {
    const known = met.filter((id) => secure(st.batches[id]));
    const list = o.warm ? shuffle(known.length >= 2 ? known : met, rnd) : shuffle(met, rnd).sort((a, b) => hardness(st.batches[b]) - hardness(st.batches[a]) || st.batches[a].see.box - st.batches[b].see.box);
    return { day, steps: mix(list.slice(0, 3).flatMap((id) => games(BATCH[id], REPEAT.review)), rnd), at: 0, extra: true };
  }
  const due = met.filter((id) => st.batches[id].see.due <= day).sort((a, b) => st.batches[a].see.due - st.batches[b].see.due);
  const next = nextBatch(st), freshToday = dayLog(st, day).fresh > 0;
  const canLearn = !!next && shaky(st).length < SHAKY_LIMIT && (!freshToday || !!o.bonus);
  let chosen = due.slice(0, canLearn ? 1 : 3);
  if (!canLearn && !freshToday && !chosen.length) chosen = shaky(st).slice(0, 3);
  const reviews = chosen.flatMap((id) => games(BATCH[id], REPEAT.review));
  if (canLearn && next) {
    const meets: Step[] = next.words.map((w, n) => ({ t: 'meet', id: next.id, n, word: w.en }));
    return { day, steps: [...meets, ...mix([...reviews, ...games(next, REPEAT.first)], rnd)], at: 0 };
  }
  return { day, steps: mix(reviews, rnd), at: 0 };
}

const bump = (b: Box, ok: boolean, day: number): Box => {
  if (!ok) return { box: Math.max(0, b.box - 1), due: day + 1 };
  if (b.due > day) return b;
  const box = Math.min(GAPS.length - 1, b.box + 1);
  return { box, due: day + GAPS[box] };
};
export function meet(st: EState, id: string, day: number): EState {
  if (st.batches[id]) return st;
  const log = dayLog(st, day);
  return { ...st, batches: { ...st.batches, [id]: { see: { box: 0, due: day }, met: day, ok: 0, bad: 0, missed: {} } }, days: { ...st.days, [day]: { ...log, fresh: log.fresh + BATCH[id].words.length } } };
}
/** Free practice counts right and wrong, and moves no stage. */
export function answer(st: EState, id: string, ok: boolean, day: number, free = false): EState {
  const k = st.batches[id]; if (!k) return st;
  return { ...st, batches: { ...st.batches, [id]: { ...k, see: free ? k.see : bump(k.see, ok, day), ok: k.ok + (ok ? 1 : 0), bad: k.bad + (ok ? 0 : 1) } } };
}
export function noteMiss(st: EState, id: string, word: string): EState {
  const k = st.batches[id]; if (!k) return st;
  return { ...st, batches: { ...st.batches, [id]: { ...k, missed: { ...k.missed, [word]: (k.missed[word] ?? 0) + 1 } } } };
}
export const topMisses = (k: Known) => Object.entries(k.missed).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
export type Status = 'hard' | 'known' | 'learning' | 'new';
export const statusOf = (st: EState, id: string): Status => { const k = st.batches[id]; return !k ? 'new' : isHard(k) ? 'hard' : secure(k) ? 'known' : 'learning'; };
export const advance = (st: EState): EState => (st.plan ? { ...st, plan: { ...st.plan, at: st.plan.at + 1 } } : st);
export const addTime = (st: EState, day: number, sec: number): EState => { const log = dayLog(st, day); return { ...st, days: { ...st.days, [day]: { ...log, sec: log.sec + sec } } }; };
export const validStep = (s: Step) => !!BATCH[s.id] && (!s.word || !!WORD[s.word]);

/** Words to mix in: others from this group first, then words already met, then any others. Pictures never repeat. */
export function others(st: EState, target: Word, count: number, rnd: () => number = Math.random): Word[] {
  const batch = BATCHES.find((b) => b.words.includes(target))!;
  const metWords = Object.keys(st.batches).flatMap((id) => BATCH[id].words);
  const order = [...shuffle(batch.words, rnd), ...shuffle(metWords, rnd), ...shuffle(ALL_WORDS, rnd)];
  const out: Word[] = [];
  for (const w of order) if (w !== target && w.pic !== target.pic && !out.some((o) => o.pic === w.pic) && out.length < count) out.push(w);
  return out;
}
export function huntCells(st: EState, target: Word, rnd: () => number = Math.random): Word[] {
  const rest = others(st, target, 3, rnd);
  return shuffle([...Array<Word>(4).fill(target), ...Array.from({ length: 8 }, (_, i) => rest[i % rest.length])], rnd);
}
export function pairCards(st: EState, target: Word, rnd: () => number = Math.random): Word[] {
  const set = [target, ...others(st, target, 2, rnd)];
  return shuffle([...set, ...set], rnd);
}
/** Half the time the picture matches what is said. */
export function yesNoPicture(st: EState, target: Word, rnd: () => number = Math.random): { shown: Word; match: boolean } {
  const match = rnd() < 0.5;
  return { shown: match ? target : others(st, target, 1, rnd)[0], match };
}
