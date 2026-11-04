// Rules for the knowledge courses: pure functions over plain state, no DOM and no storage.
//   understanding = first-try answers in the lesson   remembering = key points in spaced review
import { COURSE_ID, CourseId } from '../course';
import { Lesson, LESSONS, QuizQ } from './lessons';

export interface Metric { box: number; due: number; flag: boolean; ok: number; no: number; last: number }
export interface LessonState { done: number; pass: boolean; ok: number; all: number; due: number }
export type Step = { t: 'key'; id: string } | { t: 'lesson'; id: string };
export interface Plan { day: number; steps: Step[]; at: number; bonus?: boolean; extra?: boolean }
export interface DayLog { fresh: number; ok: number; no: number; done: boolean; sec?: number }
export interface KState { v: 1; name: string; onboarded: boolean; lessons: Record<string, LessonState>; keys: Record<string, Metric>; days: Record<string, DayLog>; plan: Plan | null; settings: { sound: boolean; wiki: boolean } }

const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];
export const SOLID = 3, NEW_PER_DAY = 2, KEYS_PER_DAY = 5, PASS = 2 / 3;
export const dayNumber = (d: Date = new Date()) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5);
export const initial = (): KState => ({ v: 1, name: '', onboarded: false, lessons: {}, keys: {}, days: {}, plan: null, settings: { sound: true, wiki: false } });
export const dayLog = (st: KState, d: number): DayLog => st.days[d] ?? { fresh: 0, ok: 0, no: 0, done: false };
export const lessonsOf = (c: CourseId = COURSE_ID): Lesson[] => LESSONS.filter((l) => l.course === c).sort((a, b) => a.level - b.level);
export const LESSON: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export const keyOf = (id: string): QuizQ => { const [l, i] = id.split('#'); return LESSON[l].keys[Number(i)]; };
export const nextLesson = (st: KState, c: CourseId = COURSE_ID) => lessonsOf(c).find((l) => !st.lessons[l.id]) ?? null;

function shuffle<T>(a: T[], rnd: () => number): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

export function buildPlan(st: KState, today: number, o: { bonus?: boolean; extra?: boolean; rnd?: () => number } = {}, c: CourseId = COURSE_ID): Plan {
  const rnd = o.rnd ?? Math.random, steps: Step[] = [];
  const mine = Object.entries(st.keys).filter(([id]) => id.startsWith(`${c}.`));
  if (!o.bonus) {
    const due = mine.filter(([, m]) => o.extra || m.due <= today).sort((a, b) => Number(b[1].flag) - Number(a[1].flag) || a[1].due - b[1].due);
    shuffle(due.slice(0, KEYS_PER_DAY * 2), rnd).slice(0, KEYS_PER_DAY).forEach(([id]) => steps.push({ t: 'key', id }));
    const again = lessonsOf(c).find((l) => { const s = st.lessons[l.id]; return s && !s.pass && s.due <= today; });
    if (again && !o.extra) steps.push({ t: 'lesson', id: again.id });
  }
  if (!o.extra) lessonsOf(c).filter((l) => !st.lessons[l.id]).slice(0, o.bonus ? 1 : NEW_PER_DAY).forEach((l) => steps.push({ t: 'lesson', id: l.id }));
  return { day: today, steps, at: 0, bonus: o.bonus, extra: o.extra };
}

/** A lesson is passed on two thirds of first-try answers. Otherwise it returns tomorrow, without any label of failure. */
export function finishLesson(st: KState, id: string, ok: number, all: number, today: number): KState {
  const first = !st.lessons[id], pass = all === 0 || ok / all >= PASS, log = dayLog(st, today);
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
export const statusOf = (st: KState, l: Lesson) => { const s = st.lessons[l.id]; if (!s) return 'מחכה לך'; if (!s.pass) return 'חוזר מחר'; return isSolid(st, l) ? 'מבוסס' : 'בחזרה'; };
