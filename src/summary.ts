// The summary sent to a parent: study time in each course, for a day or a week, against the goals.
// It reads every course's saved days on this device. The timer counts only real practice.
import { COURSES, CourseId } from './course';

export type SummaryPeriod = 'day' | 'week';
export interface Goal { day: number; week: number }
export type Goals = Partial<Record<CourseId, Goal>>;
export type SecondsByDay = Record<string, { sec?: number }>;
export interface SummaryRow { id: CourseId; name: string; sec: number; goalMin: number; met: boolean; perDay: number[] }
export interface Summary { period: SummaryPeriod; name: string; from: number; to: number; days: number[]; rows: SummaryRow[]; totalSec: number; allMet: boolean; hasGoals: boolean }

const GOALS_KEY = 'wordflow.goals';
export const defaultGoal = (id: CourseId): Goal => { const m = COURSES.find((c) => c.id === id)!.defaultMinutes; return { day: m, week: m * 5 }; };
export const goalOf = (g: Goals, id: CourseId): Goal => g[id] ?? defaultGoal(id);
export function loadGoals(): Goals { try { return JSON.parse(localStorage.getItem(GOALS_KEY) ?? '{}') as Goals; } catch { return {}; } }
export function saveGoals(g: Goals) { try { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); } catch { /* this visit only */ } }

export function readCourses(): { id: CourseId; days: SecondsByDay; name: string }[] {
  return COURSES.map((c) => {
    try { const p = JSON.parse(localStorage.getItem(c.storageKey) ?? '{}'); return { id: c.id, days: p.days ?? {}, name: p.name ?? '' }; }
    catch { return { id: c.id, days: {}, name: '' }; }
  });
}

/** Weeks start on Sunday, like the week shown on the home screen. Day 0 was a Thursday. */
export const weekStart = (day: number) => day - ((day + 4) % 7);

export function buildSummary(courses: { id: CourseId; days: SecondsByDay }[], goals: Goals, end: number, period: SummaryPeriod, name: string): Summary {
  const from = period === 'day' ? end : weekStart(end);
  const days = Array.from({ length: period === 'day' ? 1 : 7 }, (_, i) => from + i);
  const rows: SummaryRow[] = [];
  for (const c of courses) {
    const goal = goalOf(goals, c.id), goalMin = period === 'day' ? goal.day : goal.week;
    const perDay = days.map((d) => c.days[d]?.sec ?? 0);
    const sec = perDay.reduce((a, b) => a + b, 0);
    if (goalMin > 0 || sec > 0) rows.push({ id: c.id, name: COURSES.find((x) => x.id === c.id)!.name, sec, goalMin, met: goalMin > 0 && sec >= goalMin * 60, perDay });
  }
  const withGoal = rows.filter((r) => r.goalMin > 0);
  return { period, name, from, to: period === 'day' ? end : from + 6, days, rows, totalSec: rows.reduce((a, r) => a + r.sec, 0), hasGoals: withGoal.length > 0, allMet: withGoal.length > 0 && withGoal.every((r) => r.met) };
}

/** Time is rounded down, so a goal never looks reached before it really is. */
export const minutes = (sec: number) => Math.floor(sec / 60);
export const timeLabel = (sec: number) => { const m = minutes(sec); return m >= 60 ? `${Math.floor(m / 60)} ש׳ ${m % 60} דק׳` : `${m} דק׳`; };

const dateOf = (day: number, year = false) => new Date(day * 864e5).toLocaleDateString('he-IL', { day: 'numeric', month: year ? 'long' : 'numeric', year: year ? 'numeric' : undefined, timeZone: 'UTC' });
export const rangeLabel = (s: Summary) => (s.period === 'day' ? dateOf(s.to, true) : `${dateOf(s.from)} עד ${dateOf(s.to)}`);

const C = { bg: '#f5f4ef', surface: '#fffefa', line: '#e2e3dc', ink: '#172b35', ink2: '#4f5d60', dark: '#182c35', darkInk: '#fffef3', darkMuted: '#b4c2bd', sun: '#ffc83d', soft: '#ecebe4', good: '#1f8a58', goodSoft: '#dcf2e4', rec: '#118a7e' };
const HE = '"Heebo Variable", Heebo, Arial, sans-serif';
const W = 1080, M = 56;
const NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export async function drawSummary(s: Summary): Promise<HTMLCanvasElement> {
  try { await document.fonts.load(`700 40px ${HE}`, 'אב'); } catch { /* fallback fonts are fine */ }
  const week = s.period === 'week';
  const rowH = 196, tableH = week && s.rows.length ? 110 + s.rows.length * 72 : 0;
  const H = 420 + Math.max(1, s.rows.length) * rowH + tableH + 40;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  const box = (l: number, t: number, w: number, h: number, r: number, fill: string, stroke?: string) => { x.beginPath(); x.roundRect(l, t, w, h, r); x.fillStyle = fill; x.fill(); if (stroke) { x.strokeStyle = stroke; x.lineWidth = 2; x.stroke(); } };
  const he = (t: string, px: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = 'right') => { x.direction = 'rtl'; x.textAlign = align; x.font = `${weight} ${size}px ${HE}`; x.fillStyle = color; x.fillText(t, px, y); };
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
  he(week ? 'זמן תרגול השבוע' : 'זמן תרגול היום', W - M, 100, 48, 750, C.ink);
  he(rangeLabel(s), W - M, 150, 30, 400, C.ink2);

  let y = 182;
  box(M, y, W - 2 * M, 196, 36, C.dark);
  he(s.name, W - M - 40, y + 62, 34, 500, C.sun);
  he(timeLabel(s.totalSec), W - M - 40, y + 130, 66, 750, C.darkInk);
  he(!s.hasGoals ? 'סך כל התרגול' : s.allMet ? 'כל המטרות הושגו' : `${s.rows.filter((r) => r.met).length} מתוך ${s.rows.filter((r) => r.goalMin > 0).length} מטרות הושגו`, W - M - 40, y + 172, 30, 400, C.darkMuted);
  y += 222;

  if (!s.rows.length) { box(M, y, W - 2 * M, rowH - 24, 30, C.surface, C.line); he('אין עדיין תרגול ואין מטרות', W - M - 32, y + 96, 34, 500, C.ink2); y += rowH; }
  for (const r of s.rows) {
    box(M, y, W - 2 * M, rowH - 24, 30, C.surface, C.line);
    const right = W - M - 32, left = M + 32;
    he(r.name, right, y + 56, 38, 700, C.ink);
    if (r.met) { box(left, y + 24, 136, 46, 23, C.goodSoft); he('הושג', left + 68, y + 58, 28, 700, C.good, 'center'); }
    he(r.goalMin > 0 ? `${timeLabel(r.sec)} מתוך ${timeLabel(r.goalMin * 60)}` : timeLabel(r.sec), right, y + 106, 32, 500, C.ink2);
    const bw = W - 2 * M - 64;
    box(left, y + 128, bw, 18, 9, C.soft);
    const part = r.goalMin > 0 ? Math.min(1, r.sec / (r.goalMin * 60)) : r.sec > 0 ? 1 : 0;
    if (part > 0) { const w = Math.max(18, bw * part); box(left + bw - w, y + 128, w, 18, 9, r.met ? C.good : C.sun); }
    y += rowH;
  }

  if (week && s.rows.length) {
    box(M, y, W - 2 * M, tableH - 20, 30, C.surface, C.line);
    const nameW = 170, slot = (W - 2 * M - 64 - nameW) / 7, right = W - M - 32;
    he('דקות בכל יום', right, y + 48, 26, 500, C.ink2);
    NAMES.forEach((d, i) => he(d, right - nameW - slot * (i + 0.5), y + 48, 28, 600, C.ink2, 'center'));
    s.rows.forEach((r, ri) => {
      const ty = y + 104 + ri * 72;
      he(r.name, right, ty, 30, 600, C.ink);
      r.perDay.forEach((sec, i) => {
        const cx = right - nameW - slot * (i + 0.5), m = minutes(sec);
        if (m > 0) box(cx - 32, ty - 36, 64, 50, 12, C.sun);
        he(m > 0 ? String(m) : '–', cx, ty, 28, m > 0 ? 700 : 400, m > 0 ? '#2d2406' : C.ink2, 'center');
      });
    });
  }
  return c;
}
