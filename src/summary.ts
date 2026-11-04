// The cross-course summary: study time and how many new things were learned, for a day or a week, against the weekly schedule.
// It reads every course's saved days on this device. The timer counts only real practice.
import { COURSES, CourseId } from './course';

export type SummaryPeriod = 'day' | 'week';
/** Minutes planned for each weekday. Index 0 is Sunday. */
export type Schedule = Partial<Record<CourseId, number[]>>;
export interface RawCourse { id: CourseId; name?: string; days: Record<string, { sec?: number; fresh?: number }>; skills?: Record<string, { met: number | null; assumed?: boolean }> }
export interface SummaryRow { id: CourseId; name: string; short: string; sec: number; goalMin: number; met: boolean; perDay: number[]; fresh: number; freshLabel: string }
export interface Summary { period: SummaryPeriod; name: string; from: number; to: number; days: number[]; rows: SummaryRow[]; totalSec: number; totalFresh: number; allMet: boolean; hasGoals: boolean }

const KEY = 'wordflow.schedule', OLD_GOALS = 'wordflow.goals';
export const weekday = (day: number) => (day + 4) % 7;
export const weekStart = (day: number) => day - weekday(day);
const defaults = (m: number) => [m, m, m, m, m, 0, 0];
export const planOf = (s: Schedule, id: CourseId) => s[id] ?? defaults(COURSES.find((c) => c.id === id)!.defaultMinutes);

export function loadSchedule(): Schedule {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as Schedule;
    const old = JSON.parse(localStorage.getItem(OLD_GOALS) ?? '{}') as Record<string, { day: number }>;
    return Object.fromEntries(Object.entries(old).map(([id, g]) => [id, defaults(g.day)])) as Schedule;
  } catch { return {}; }
}
export function saveSchedule(s: Schedule) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* this visit only */ } }

export function readCourses(): RawCourse[] {
  return COURSES.map((c) => {
    try { const p = JSON.parse(localStorage.getItem(c.storageKey) ?? '{}'); return { id: c.id, days: p.days ?? {}, name: p.name ?? '', skills: p.skills }; }
    catch { return { id: c.id, days: {} }; }
  });
}

/** New words, new math skills or new lessons on that day. What the opening test assumed she knows is not counted. */
export function newOn(c: RawCourse, day: number): number {
  if (c.id === 'math') return Object.values(c.skills ?? {}).filter((s) => s.met === day && !s.assumed).length;
  return c.days[day]?.fresh ?? 0;
}

export function buildSummary(courses: RawCourse[], schedule: Schedule, end: number, period: SummaryPeriod, name: string): Summary {
  const from = period === 'day' ? end : weekStart(end);
  const days = Array.from({ length: period === 'day' ? 1 : 7 }, (_, i) => from + i);
  const rows: SummaryRow[] = [];
  for (const c of courses) {
    const info = COURSES.find((x) => x.id === c.id)!, plan = planOf(schedule, c.id);
    const goalMin = period === 'day' ? plan[weekday(end)] : plan.reduce((a, b) => a + b, 0);
    const perDay = days.map((d) => c.days[d]?.sec ?? 0);
    const sec = perDay.reduce((a, b) => a + b, 0), fresh = days.reduce((a, d) => a + newOn(c, d), 0);
    if (goalMin > 0 || sec > 0 || fresh > 0) rows.push({ id: c.id, name: info.name, short: info.short ?? info.name, sec, goalMin, met: goalMin > 0 && sec >= goalMin * 60, perDay, fresh, freshLabel: info.newLabel });
  }
  const withGoal = rows.filter((r) => r.goalMin > 0);
  return { period, name, from, to: period === 'day' ? end : from + 6, days, rows, totalSec: rows.reduce((a, r) => a + r.sec, 0), totalFresh: rows.reduce((a, r) => a + r.fresh, 0), hasGoals: withGoal.length > 0, allMet: withGoal.length > 0 && withGoal.every((r) => r.met) };
}

/** Time is rounded down, so a goal never looks reached before it really is. */
export const minutes = (sec: number) => Math.floor(sec / 60);
export const timeLabel = (sec: number) => { const m = minutes(sec); return m >= 60 ? `${Math.floor(m / 60)} ש׳ ${m % 60} דק׳` : `${m} דק׳`; };

const dateOf = (day: number, year = false) => new Date(day * 864e5).toLocaleDateString('he-IL', { day: 'numeric', month: year ? 'long' : 'numeric', year: year ? 'numeric' : undefined, timeZone: 'UTC' });
export const rangeLabel = (s: Summary) => (s.period === 'day' ? dateOf(s.to, true) : `${dateOf(s.from)} עד ${dateOf(s.to)}`);

const C = { bg: '#f5f4ef', surface: '#fffefa', line: '#e2e3dc', ink: '#172b35', ink2: '#4f5d60', dark: '#182c35', darkInk: '#fffef3', darkMuted: '#b4c2bd', sun: '#ffc83d', soft: '#ecebe4', good: '#1f8a58', goodSoft: '#dcf2e4' };
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
  he(week ? 'הלמידה השבוע' : 'הלמידה ביום הזה', W - M, 100, 48, 750, C.ink);
  he(rangeLabel(s), W - M, 150, 30, 400, C.ink2);

  let y = 182;
  box(M, y, W - 2 * M, 196, 36, C.dark);
  he(s.name, W - M - 40, y + 62, 34, 500, C.sun);
  he(timeLabel(s.totalSec), W - M - 40, y + 130, 66, 750, C.darkInk);
  const goals = s.rows.filter((r) => r.goalMin > 0);
  he(`דברים חדשים: ${s.totalFresh}`, M + 40, y + 130, 36, 650, C.sun, 'left');
  he(!s.hasGoals ? 'סך כל הזמן' : s.allMet ? 'כל הלו״ז בוצע' : `${goals.filter((r) => r.met).length} מתוך ${goals.length} קורסים בלו״ז`, W - M - 40, y + 172, 30, 400, C.darkMuted);
  y += 222;

  if (!s.rows.length) { box(M, y, W - 2 * M, rowH - 24, 30, C.surface, C.line); he('אין עדיין למידה ואין לו״ז', W - M - 32, y + 96, 34, 500, C.ink2); y += rowH; }
  for (const r of s.rows) {
    box(M, y, W - 2 * M, rowH - 24, 30, C.surface, C.line);
    const right = W - M - 32, left = M + 32;
    he(r.name, right, y + 56, 38, 700, C.ink);
    if (r.met) { box(left, y + 24, 136, 46, 23, C.goodSoft); he('בוצע', left + 68, y + 58, 28, 700, C.good, 'center'); }
    he(r.goalMin > 0 ? `${timeLabel(r.sec)} מתוך ${timeLabel(r.goalMin * 60)}` : timeLabel(r.sec), right, y + 106, 32, 500, C.ink2);
    if (r.fresh > 0) he(`${r.freshLabel}: ${r.fresh}`, left, y + 106, 28, 500, C.ink2, 'left');
    const bw = W - 2 * M - 64;
    box(left, y + 128, bw, 18, 9, C.soft);
    const part = r.goalMin > 0 ? Math.min(1, r.sec / (r.goalMin * 60)) : r.sec > 0 ? 1 : 0;
    if (part > 0) { const w = Math.max(18, bw * part); box(left + bw - w, y + 128, w, 18, 9, r.met ? C.good : C.sun); }
    y += rowH;
  }

  if (week && s.rows.length) {
    box(M, y, W - 2 * M, tableH - 20, 30, C.surface, C.line);
    const nameW = 170, slot = (W - 2 * M - 64 - nameW) / 7, right = W - M - 32;
    he('דקות', right, y + 48, 26, 500, C.ink2);
    NAMES.forEach((d, i) => he(d, right - nameW - slot * (i + 0.5), y + 48, 28, 600, C.ink2, 'center'));
    s.rows.forEach((r, ri) => {
      const ty = y + 104 + ri * 72;
      he(r.short, right, ty, 30, 600, C.ink);
      r.perDay.forEach((sec, i) => {
        const cx = right - nameW - slot * (i + 0.5), m = minutes(sec);
        if (m > 0) box(cx - 32, ty - 36, 64, 50, 12, C.sun);
        he(m > 0 ? String(m) : '–', cx, ty, 28, m > 0 ? 700 : 400, m > 0 ? '#2d2406' : C.ink2, 'center');
      });
    });
  }
  return c;
}
