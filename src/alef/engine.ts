// Rules of the course. One new letter at a time, and a new one waits while three letters are still shaky.
// Knowing a letter and writing it are two separate measures, each with its own spaced review.
import { LETTER, LETTERS, lookAlikes } from './letters';

export interface Box { box: number; due: number }
export interface Known { see: Box; write: Box; met: number }
export type Step = { t: 'meet' | 'trace' | 'copy' | 'write' | 'find' | 'word'; id: string; print?: boolean; n?: number };
export interface Plan { day: number; steps: Step[]; at: number; extra?: boolean }
export interface AState { onboarded: boolean; name: string; letters: Record<string, Known>; days: Record<number, { sec: number; fresh: number; done?: boolean }>; plan: Plan | null; settings: { sound: boolean } }

const GAPS = [1, 1, 2, 4, 8, 16, 32];
export const SHAKY_LIMIT = 4;
/** Writing grows in three stages: over a dashed letter, beside a model, then alone. */
export const writeStage = (box: number): Step['t'] => (box === 0 ? 'trace' : box === 1 ? 'copy' : 'write');
export const dayNumber = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
export const initial = (name: string): AState => ({ onboarded: true, name, letters: {}, days: {}, plan: null, settings: { sound: true } });
export const secure = (k: Known) => k.see.box >= 2 && k.write.box >= 3;
export const shaky = (st: AState) => Object.keys(st.letters).filter((id) => !secure(st.letters[id]));
export const nextLetter = (st: AState) => LETTERS.find((l) => !st.letters[l.id]);
export const dayLog = (st: AState, day: number) => st.days[day] ?? { sec: 0, fresh: 0 };

const shuffle = <T,>(a: T[], rnd: () => number) => a.map((v) => ({ v, k: rnd() })).sort((p, q) => p.k - q.k).map((x) => x.v);

/** Every exercise comes several times in a row, because one success at five years old proves little. */
export const REPEAT = { find: 3, word: 2, trace: 4, copy: 3, write: 3 };
const times = (t: Step['t'], id: string, count: number, extra: Partial<Step> = {}): Step[] => Array.from({ length: count }, (_, n) => ({ t, id, n, ...extra }));

function practice(st: AState, id: string, day: number, rnd: () => number, force = false): Step[] {
  const k = st.letters[id], out: Step[] = [];
  if (force || k.see.due <= day) out.push(...(rnd() < 0.5 ? times('word', id, REPEAT.word, { n: undefined }).map((s, n) => ({ ...s, n: n + Math.floor(rnd() * 3) })) : times('find', id, 2, { print: k.see.box >= 2 && rnd() < 0.5 })));
  if (force || k.write.due <= day) { const stage = writeStage(k.write.box) as 'trace' | 'copy' | 'write'; out.push(...times(stage, id, REPEAT[stage])); }
  return out;
}

/** A sitting: some review of whole letters, then the new letter. */
export function buildPlan(st: AState, day: number, o: { bonus?: boolean; extra?: boolean; rnd?: () => number } = {}): Plan {
  const rnd = o.rnd ?? Math.random, met = Object.keys(st.letters);
  if (o.extra) {
    const steps = shuffle(met, rnd).slice(0, 2).flatMap((id) => practice(st, id, day, rnd, true));
    return { day, steps, at: 0, extra: true };
  }
  const due = met.filter((id) => st.letters[id].see.due <= day || st.letters[id].write.due <= day)
    .sort((a, b) => Math.min(st.letters[a].see.due, st.letters[a].write.due) - Math.min(st.letters[b].see.due, st.letters[b].write.due));
  const next = nextLetter(st), freshToday = dayLog(st, day).fresh > 0;
  const canLearn = !!next && shaky(st).length < SHAKY_LIMIT && (!freshToday || !!o.bonus);
  let reviews = due.flatMap((id) => practice(st, id, day, rnd));
  if (!canLearn && !freshToday && !reviews.length) reviews = shaky(st).flatMap((id) => practice(st, id, day, rnd, true));
  reviews = reviews.slice(0, canLearn ? 6 : 14);
  const steps: Step[] = [...reviews];
  if (canLearn && next) {
    const id = next.id;
    steps.push({ t: 'meet', id }, ...times('find', id, REPEAT.find), ...times('trace', id, REPEAT.trace), ...times('word', id, REPEAT.word));
  }
  return { day, steps, at: 0 };
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
export function answer(st: AState, id: string, what: 'see' | 'write', ok: boolean, day: number): AState {
  const k = st.letters[id];
  return k ? { ...st, letters: { ...st.letters, [id]: { ...k, [what]: bump(k[what], ok, day) } } } : st;
}
export const advance = (st: AState): AState => (st.plan ? { ...st, plan: { ...st.plan, at: st.plan.at + 1 } } : st);
export const addTime = (st: AState, day: number, sec: number): AState => { const log = dayLog(st, day); return { ...st, days: { ...st.days, [day]: { ...log, sec: log.sec + sec } } }; };

/** The other choices in a find game: look-alikes first, then letters already met, then the coming ones. */
export function choices(st: AState, id: string, rnd: () => number = Math.random): string[] {
  const size = Object.keys(st.letters).length >= 6 ? 4 : 3;
  const known = (c: string) => !!st.letters[c];
  const like = shuffle(lookAlikes(id), rnd).sort((a, b) => Number(known(b)) - Number(known(a)));
  const met = shuffle(Object.keys(st.letters).filter((c) => c !== id), rnd);
  const rest = LETTERS.map((l) => l.id).filter((c) => c !== id);
  const others = [...new Set([...like, ...met, ...rest])].slice(0, size - 1);
  return shuffle([id, ...others], rnd);
}

const STEPS = ['meet', 'trace', 'copy', 'write', 'find', 'word'];
export const validStep = (s: Step) => !!LETTER[s.id] && STEPS.includes(s.t);
