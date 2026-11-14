// Rules for the knowledge courses: pure functions over plain state, no DOM and no storage.
//   understanding = first-try answers in the lesson   remembering = key points in spaced review
import { COURSE_ID, CourseId, USER_ID } from '../course';
import { Lesson, LESSONS, QuizQ } from './lessons';

export interface Metric { box: number; due: number; flag: boolean; ok: number; no: number; last: number }
export interface LessonState { done: number; pass: boolean; ok: number; all: number; due: number; recalled?: boolean }
export type Step = { t: 'key'; id: string } | { t: 'lesson'; id: string } | { t: 'recall'; id: string } | { t: 'review'; ids: string[]; n: number };
export interface Plan { day: number; steps: Step[]; at: number; bonus?: boolean; extra?: boolean }
export interface DayLog { fresh: number; ok: number; no: number; done: boolean; sec?: number }
export interface KState { v: 1; name: string; onboarded: boolean; lessons: Record<string, LessonState>; keys: Record<string, Metric>; days: Record<string, DayLog>; plan: Plan | null; reviews?: number[]; settings: { sound: boolean; wiki: boolean } }

const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];
export const SOLID = 3, KEYS_PER_DAY = 5, PASS = 2 / 3;
/** A review lesson after every REVIEW_EVERY new lessons, with all the questions of those lessons. A day opens with RECALL_SHARE of the previous lesson's questions. */
export const REVIEW_EVERY = 5, RECALL_SHARE = 0.65;
export const recallCount = (id: string) => Math.max(1, Math.round(LESSON[id].qs.length * RECALL_SHARE));
export const dayNumber = (d: Date = new Date()) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5);
export const initial = (): KState => ({ v: 1, name: '', onboarded: false, lessons: {}, keys: {}, days: {}, plan: null, settings: { sound: true, wiki: false } });
export const dayLog = (st: KState, d: number): DayLog => st.days[d] ?? { fresh: 0, ok: 0, no: 0, done: false };
export const lessonsOf = (c: CourseId = COURSE_ID): Lesson[] => LESSONS.filter((l) => l.course === c && (!l.only || !USER_ID || l.only.includes(USER_ID))).sort((a, b) => a.level - b.level);
export const LESSON: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export const keyOf = (id: string): QuizQ => { const [l, i] = id.split('#'); return LESSON[l].keys[Number(i)]; };
export const nextLesson = (st: KState, c: CourseId = COURSE_ID) => lessonsOf(c).find((l) => !st.lessons[l.id]) ?? null;

function shuffle<T>(a: T[], rnd: () => number): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

export function buildPlan(st: KState, today: number, o: { bonus?: boolean; extra?: boolean; rnd?: () => number } = {}, c: CourseId = COURSE_ID): Plan {
  const rnd = o.rnd ?? Math.random, steps: Step[] = [];
  // A lesson opens with its text, so reading comes first and review questions follow.
  const mine = Object.entries(st.keys).filter(([id]) => id.startsWith(`${c}.`));
  if (!o.bonus) {
    const due = mine.filter(([, m]) => o.extra || m.due <= today).sort((a, b) => Number(b[1].flag) - Number(a[1].flag) || a[1].due - b[1].due);
    shuffle(due.slice(0, KEYS_PER_DAY * 2), rnd).slice(0, KEYS_PER_DAY).forEach(([id]) => steps.push({ t: 'key', id }));
  }
  // One topic a day: a lesson that was not understood comes back first, and otherwise the next one opens.
  if (!o.extra) {
    const again = lessonsOf(c).find((l) => { const s = st.lessons[l.id]; return s && !s.pass && s.due <= today; });
    const review = again ? null : reviewDue(st, today, c);
    const topic = again ?? lessonsOf(c).find((l) => !st.lessons[l.id]);
    if (review) steps.push(review);
    else if (topic) {
      // Before a new topic, she recalls the previous lesson. The text is there to look back at, but not open.
      const prev = learned(st, c).at(-1);
      if (!again && prev && !st.lessons[prev.id].recalled && st.lessons[prev.id].done < today) steps.push({ t: 'recall', id: prev.id });
      steps.push({ t: 'lesson', id: topic.id });
    }
  }
  const rank = (x: Step) => (x.t === 'recall' ? 0 : x.t === 'key' ? 2 : 1);
  steps.sort((x, y) => rank(x) - rank(y));
  return { day: today, steps, at: 0, bonus: o.bonus, extra: o.extra };
}

/** Lessons she has read in this course, in the order she read them. */
export const learned = (st: KState, c: CourseId = COURSE_ID) => lessonsOf(c).filter((l) => st.lessons[l.id]).sort((a, b) => st.lessons[a.id].done - st.lessons[b.id].done);
/** After every five lessons comes a day of review only: no new text, questions from those five with their texts to look back at. */
export function reviewDue(st: KState, today: number, c: CourseId = COURSE_ID): Step | null {
  const list = learned(st, c), n = Math.floor(list.length / REVIEW_EVERY) * REVIEW_EVERY;
  if (n === 0 || (st.reviews ?? []).includes(n) || st.lessons[list[n - 1].id].done >= today) return null;
  return { t: 'review', ids: list.slice(n - REVIEW_EVERY, n).map((l) => l.id), n };
}
/** Picks questions from a lesson for a recall or a review, in a fixed order for the day so returning to it does not reshuffle. */
export function pickQs(id: string, count: number, seed: number): [string, number][] {
  const qs = LESSON[id].qs.map((_, i) => i);
  let x = seed % 2147483647 || 1; const r = () => (x = (x * 48271) % 2147483647) / 2147483647;
  return shuffle(qs, r).slice(0, count).sort((a, b) => a - b).map((i) => [id, i]);
}
/** Marks a recall or a review as done and counts its first-try answers in the day's log. */
export function finishReview(st: KState, step: Step, ok: number, all: number, today: number): KState {
  const log = dayLog(st, today), days = { ...st.days, [today]: { ...log, ok: log.ok + ok, no: log.no + all - ok } };
  if (step.t === 'recall') return { ...st, days, lessons: { ...st.lessons, [step.id]: { ...st.lessons[step.id], recalled: true } } };
  if (step.t === 'review') return { ...st, days, reviews: [...(st.reviews ?? []), step.n] };
  return st;
}

/** A lesson is passed on two thirds of first-try answers. Otherwise it returns tomorrow, and its closing screen says why. */
export const passes = (ok: number, all: number) => all === 0 || ok / all >= PASS;
/** How many first-try answers a lesson of `all` questions needs. */
export const needed = (all: number) => Math.ceil(all * PASS - 1e-9);
export function finishLesson(st: KState, id: string, ok: number, all: number, today: number): KState {
  const first = !st.lessons[id], pass = passes(ok, all), log = dayLog(st, today);
  const keys = { ...st.keys };
  LESSON[id].keys.forEach((_, i) => { const k = `${id}#${i}`; keys[k] ??= { box: 0, due: today + 1, flag: false, ok: 0, no: 0, last: -1 }; });
  return { ...st, keys, lessons: { ...st.lessons, [id]: { done: st.lessons[id]?.done ?? today, pass, ok, all, due: today + 1 } }, days: { ...st.days, [today]: { ...log, fresh: log.fresh + (first ? 1 : 0), ok: log.ok + ok, no: log.no + (all - ok) } } };
}

export function answerKey(st: KState, id: string, correct: boolean, today: number): KState {
  const m = st.keys[id] ?? { box: 0, due: 0, flag: false, ok: 0, no: 0, last: -1 }, n = { ...m }, log = dayLog(st, today);
  if (correct) { n.ok++; if (n.last !== today) { n.box = Math.min(INTERVALS.length - 1, n.box + 1); n.due = today + INTERVALS[n.box]; n.flag = false; } }
  else { n.no++; n.box = Math.max(0, n.box - 2); n.flag = true; n.due = today + 1; }
  n.last = today;
  return { ...st, keys: { ...st.keys, [id]: n }, days: { ...st.days, [today]: { ...log, ok: log.ok + (correct ? 1 : 0), no: log.no + (correct ? 0 : 1) } } };
}

export function advance(st: KState): KState {
  if (!st.plan) return st;
  const at = st.plan.at + 1, today = st.plan.day, log = dayLog(st, today);
  const finished = at >= st.plan.steps.length && !st.plan.extra && !st.plan.bonus;
  return { ...st, plan: { ...st.plan, at }, days: finished ? { ...st.days, [today]: { ...log, done: true } } : st.days };
}
export const addTime = (st: KState, day: number, sec: number): KState => { const log = dayLog(st, day); return { ...st, days: { ...st.days, [day]: { ...log, sec: (log.sec ?? 0) + sec } } }; };
export const isSolid = (st: KState, l: Lesson) => !!st.lessons[l.id]?.pass && l.keys.every((_, i) => (st.keys[`${l.id}#${i}`]?.box ?? 0) >= SOLID);
export const statusOf = (st: KState, l: Lesson) => { const s = st.lessons[l.id]; if (!s) return 'מחכה לך'; if (!s.pass) return s.due <= dayNumber() ? 'חוזר היום' : 'חוזר מחר'; return isSolid(st, l) ? 'מבוסס' : 'בחזרה'; };
