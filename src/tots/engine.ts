// Rules of the course: one new thing a day, and it waits while four skills are still shaky. Exercises are mixed.
// Numbers have two measures, knowing and writing. Arithmetic has one. Each is reviewed at growing gaps.
import { hasWriting, SKILL, Skill, SKILLS, WORD, SAY } from './numbers';

export interface Box { box: number; due: number }
export interface Tally { see: [number, number]; write: [number, number]; mixed: Record<string, number> }
export interface Known { see: Box; write: Box; met: number; tally?: Tally }
export type StepKind = 'meet' | 'trace' | 'copy' | 'memory' | 'write' | 'count' | 'find' | 'match' | 'make' | 'next' | 'before' | 'more' | 'less' | 'add' | 'addEq' | 'sub' | 'subEq' | 'bond';
export interface Step { t: StepKind; id: string; n: number }
export interface Plan { day: number; steps: Step[]; at: number; extra?: boolean }
export interface TState { onboarded: boolean; name: string; skills: Record<string, Known>; days: Record<number, { sec: number; fresh: number }>; plan: Plan | null; settings: { sound: boolean } }

const GAPS = [1, 1, 2, 4, 8, 16, 32];
export const SHAKY_LIMIT = 4;
export const REPEAT = { first: 20, see: 10, write: 10 };
export const WRITING: StepKind[] = ['trace', 'copy', 'memory', 'write'];
export const dayNumber = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
export const initial = (name: string): TState => ({ onboarded: true, name, skills: {}, days: {}, plan: null, settings: { sound: true } });
export const secure = (s: Skill, k: Known) => k.see.box >= 2 && (!hasWriting(s) || k.write.box >= 3);
export const shaky = (st: TState) => Object.keys(st.skills).filter((id) => !secure(SKILL[id], st.skills[id]));
export const nextSkill = (st: TState) => SKILLS.find((s) => !st.skills[s.id]);
export const dayLog = (st: TState, day: number) => st.days[day] ?? { sec: 0, fresh: 0 };
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

const GAMES: Record<Skill['kind'], (box: number) => StepKind[]> = {
  num: () => ['count', 'find', 'match', 'make'],
  seq: () => ['next', 'before'],
  more: () => ['more', 'less'],
  // Pictures first. Once a skill has started, numbers alone come in, with a picture hint a tap away.
  add: (box) => (box >= 1 ? ['add', 'addEq'] : ['add']),
  sub: (box) => (box >= 1 ? ['sub', 'subEq'] : ['sub']),
  bond: () => ['bond'],
};
function seeSet(s: Skill, box: number, count: number, rnd: () => number): Step[] {
  const kinds = shuffle(s.n === 0 ? ['count', 'find'] as StepKind[] : GAMES[s.kind](box), rnd);
  return Array.from({ length: count }, (_, n) => ({ t: kinds[n % kinds.length], id: s.id, n }));
}
const times = (t: StepKind, id: string, count: number): Step[] => Array.from({ length: count }, (_, n) => ({ t, id, n }));
function writeSet(id: string, box: number): Step[] {
  if (box === 0) return times('trace', id, REPEAT.write);
  if (box === 1) return times('copy', id, REPEAT.write);
  return [...times('memory', id, 5), ...times('write', id, 5)];
}
function practice(st: TState, id: string, day: number, rnd: () => number, force = false): Step[] {
  const s = SKILL[id], k = st.skills[id], out: Step[] = [];
  if (force || k.see.due <= day) out.push(...seeSet(s, k.see.box, REPEAT.see, rnd));
  if (hasWriting(s) && (force || k.write.due <= day)) out.push(...writeSet(id, k.write.box));
  return out;
}

export const hardness = (k: Known) => { const r = ([ok, bad]: [number, number]) => (ok + bad >= 4 ? bad / (ok + bad) : 0); return k.tally ? Math.max(r(k.tally.see), r(k.tally.write)) : 0; };
export const isHard = (k: Known) => hardness(k) >= 0.25;
export type PlanOptions = { bonus?: boolean; warm?: boolean; boost?: boolean; rnd?: () => number };

export function buildPlan(st: TState, day: number, o: PlanOptions = {}): Plan {
  const rnd = o.rnd ?? Math.random, met = Object.keys(st.skills);
  // Warm-up and boost are free practice: nothing new, and stages stay as they are.
  if (o.warm || o.boost) {
    const known = met.filter((id) => secure(SKILL[id], st.skills[id]));
    const level = (id: string) => st.skills[id].see.box + st.skills[id].write.box;
    const list = o.warm ? shuffle(known.length >= 2 ? known : met, rnd) : shuffle(met, rnd).sort((a, b) => hardness(st.skills[b]) - hardness(st.skills[a]) || level(a) - level(b));
    return { day, steps: mix(list.slice(0, 3).flatMap((id) => practice(st, id, day, rnd, true)).slice(0, 30), rnd), at: 0, extra: true };
  }
  const due = met.filter((id) => st.skills[id].see.due <= day || (hasWriting(SKILL[id]) && st.skills[id].write.due <= day))
    .sort((a, b) => st.skills[a].see.due - st.skills[b].see.due);
  const next = nextSkill(st), freshToday = dayLog(st, day).fresh > 0;
  const canLearn = !!next && shaky(st).length < SHAKY_LIMIT && (!freshToday || !!o.bonus);
  let reviews = due.flatMap((id) => practice(st, id, day, rnd));
  if (!canLearn && !freshToday && !reviews.length) reviews = shaky(st).flatMap((id) => practice(st, id, day, rnd, true));
  reviews = reviews.slice(0, canLearn ? 20 : 40);
  if (canLearn && next) {
    const first = [...seeSet(next, 0, REPEAT.first, rnd), ...(hasWriting(next) ? times('trace', next.id, REPEAT.write) : [])];
    return { day, steps: [{ t: 'meet', id: next.id, n: 0 }, ...mix([...reviews, ...first], rnd)], at: 0 };
  }
  return { day, steps: mix(reviews, rnd), at: 0 };
}

const bump = (b: Box, ok: boolean, day: number): Box => {
  if (!ok) return { box: Math.max(0, b.box - 1), due: day + 1 };
  if (b.due > day) return b;
  const box = Math.min(GAPS.length - 1, b.box + 1);
  return { box, due: day + GAPS[box] };
};
export function meet(st: TState, id: string, day: number): TState {
  if (st.skills[id]) return st;
  const log = dayLog(st, day);
  return { ...st, skills: { ...st.skills, [id]: { see: { box: 0, due: day }, write: { box: 0, due: day }, met: day } }, days: { ...st.days, [day]: { ...log, fresh: log.fresh + 1 } } };
}
export function answer(st: TState, id: string, what: 'see' | 'write', ok: boolean, day: number): TState {
  const k = st.skills[id];
  return k ? { ...st, skills: { ...st.skills, [id]: { ...k, [what]: bump(k[what], ok, day) } } } : st;
}
const emptyTally = (): Tally => ({ see: [0, 0], write: [0, 0], mixed: {} });
export function record(st: TState, id: string, what: 'see' | 'write', ok: boolean): TState {
  const k = st.skills[id]; if (!k) return st;
  const old = k.tally ?? emptyTally(), pair: [number, number] = ok ? [old[what][0] + 1, old[what][1]] : [old[what][0], old[what][1] + 1];
  return { ...st, skills: { ...st.skills, [id]: { ...k, tally: { ...old, [what]: pair } } } };
}
/** Remembers what went wrong: the number chosen by mistake, or the exercise, such as 3+2. */
export function noteMiss(st: TState, id: string, what: string): TState {
  const k = st.skills[id]; if (!k) return st;
  const old = k.tally ?? emptyTally();
  return { ...st, skills: { ...st.skills, [id]: { ...k, tally: { ...old, mixed: { ...old.mixed, [what]: (old.mixed[what] ?? 0) + 1 } } } } };
}
export const topMisses = (k: Known) => Object.entries(k.tally?.mixed ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
export type Status = 'hard' | 'known' | 'learning' | 'new';
export const statusOf = (st: TState, id: string): Status => { const k = st.skills[id]; return !k ? 'new' : isHard(k) ? 'hard' : secure(SKILL[id], k) ? 'known' : 'learning'; };
export const advance = (st: TState): TState => (st.plan ? { ...st, plan: { ...st.plan, at: st.plan.at + 1 } } : st);
export const addTime = (st: TState, day: number, sec: number): TState => { const log = dayLog(st, day); return { ...st, days: { ...st.days, [day]: { ...log, sec: log.sec + sec } } }; };
export const validStep = (s: Step) => !!SKILL[s.id];

// ---------- Exercises ----------
/** What one exercise shows and asks. Everything is decided here, so that it can be tested without a screen. */
export interface Task {
  say: string; rightSay: string; missLabel: (picked: number) => string;
  visual: 'none' | 'objects' | 'digit' | 'line' | 'sum' | 'frame' | 'groups';
  answer: number; options: number[];
  a?: number; b?: number; op?: '+' | '−'; pictures?: boolean; line?: (number | null)[]; size?: number; filled?: number; groups?: boolean;
}
const randInt = (lo: number, hi: number, rnd: () => number) => lo + Math.floor(rnd() * (hi - lo + 1));

/** The highest number this child has met, so that an exercise never uses one they do not know. */
export function ceiling(st: TState) {
  let top = 0;
  for (const s of SKILLS) if (s.kind === 'num' && s.n > top && st.skills[s.id]) top = s.n;
  return top || 1;
}
/** The answer, and two others close to it, in order of size. */
export function answerChoices(right: number, lo: number, hi: number, rnd: () => number): number[] {
  const near = [right - 1, right + 1, right - 2, right + 2, right - 3, right + 3].filter((v) => v >= lo && v <= hi && v !== right);
  const close = near.slice(0, 2), far = near.slice(2);
  const picks = rnd() < 0.7 || far.length === 0 ? close : [close[0], far[0]];
  return [right, ...picks].filter((v) => v !== undefined).sort((x, y) => x - y);
}

export function makeTask(st: TState, step: Step, rnd: () => number = Math.random): Task {
  const s = SKILL[step.id], top = Math.max(ceiling(st), s.kind === 'num' ? s.n : 1), plain = (n: number) => String(n);
  switch (step.t) {
    case 'count': return { say: SAY.howMany, rightSay: SAY.isRight(s.n), missLabel: plain, visual: 'objects', answer: s.n, a: s.n, options: answerChoices(s.n, 0, Math.max(top + 1, 3), rnd) };
    case 'find': return { say: SAY.find(s.n), rightSay: SAY.isRight(s.n), missLabel: plain, visual: 'none', answer: s.n, options: answerChoices(s.n, 0, Math.max(top + 1, 3), rnd) };
    case 'match': return { say: SAY.match(s.n), rightSay: SAY.isRight(s.n), missLabel: plain, visual: 'digit', answer: s.n, a: s.n, groups: true, options: answerChoices(s.n, 1, Math.max(top + 1, 3), rnd) };
    case 'next': case 'before': {
      const low = s.n === 20 ? 10 : 1, at = step.t === 'next' ? randInt(low, s.n - 1, rnd) : randInt(low + 1, s.n, rnd);
      const right = step.t === 'next' ? at + 1 : at - 1, from = Math.max(low, Math.min(Math.min(at, right) - 1, s.n - 3));
      const line = Array.from({ length: 4 }, (_, i) => from + i).map((v) => (v === right ? null : v));
      return { say: step.t === 'next' ? SAY.next(at) : SAY.before(at), rightSay: SAY.isRight(right), missLabel: plain, visual: 'line', answer: right, line, options: answerChoices(right, low, s.n, rnd) };
    }
    case 'more': case 'less': {
      const big = randInt(2, s.n, rnd), small = randInt(1, big - 1, rnd), right = step.t === 'more' ? big : small;
      return { say: step.t === 'more' ? SAY.more : SAY.less, rightSay: SAY.isRight(right), missLabel: () => `${big} מול ${small}`, visual: 'groups', answer: right, groups: true, options: rnd() < 0.5 ? [big, small] : [small, big] };
    }
    case 'add': case 'addEq': {
      const low = s.n === 10 ? 3 : 2, total = randInt(low, s.n, rnd), a = randInt(1, total - 1, rnd), b = total - a;
      return { say: SAY.add(a, b), rightSay: SAY.addRight(a, b), missLabel: () => `${a}+${b}`, visual: 'sum', op: '+', a, b, pictures: step.t === 'add', answer: total, options: answerChoices(total, 1, Math.max(s.n, 3), rnd) };
    }
    case 'sub': case 'subEq': {
      const a = randInt(2, s.n, rnd), b = randInt(1, a - 1, rnd);
      return { say: SAY.sub(a, b), rightSay: SAY.subRight(a, b), missLabel: () => `${a}−${b}`, visual: 'sum', op: '−', a, b, pictures: step.t === 'sub', answer: a - b, options: answerChoices(a - b, 0, Math.max(a, 3), rnd) };
    }
    case 'bond': {
      const filled = randInt(1, s.n - 1, rnd), right = s.n - filled;
      return { say: SAY.bond(s.n), rightSay: SAY.isRight(right), missLabel: () => `${filled} עד ${s.n}`, visual: 'frame', size: s.n, filled, answer: right, options: answerChoices(right, 0, s.n, rnd) };
    }
    default: return { say: SAY.howMany, rightSay: SAY.isRight(s.n), missLabel: plain, visual: 'objects', answer: s.n, a: s.n, options: answerChoices(s.n, 0, Math.max(top + 1, 3), rnd) };
  }
}
export const wordOf = (n: number) => WORD[n];
