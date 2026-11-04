// Draws the progress summary as an image that can be sent through WhatsApp or any other app.
import { dayLog, hardWords, questionCount, studyTimeLabel, isMet, State, totals, ws } from './engine';
import { HAS_SPELLING, x as say } from './course';
import { Word, WORDS } from './words';

export type Period = 'day' | 'week';
export interface ReportDay { day: number; answers: number; sec: number; done: boolean }
export interface Report {
  period: Period; name: string; from: number; to: number; practiced: number; sec: number; questions: number;
  freshCount: number; recOk: number; recAll: number; spellOk: number; spellAll: number; sentences: number;
  gainedKnown: number; gainedSpelled: number; totalKnown: number; totalSpelled: number;
  newWords: Word[]; toImprove: Word[]; days: ReportDay[];
}

export function buildReport(st: State, today: number, period: Period): Report {
  const span = period === 'day' ? 1 : 7;
  const from = today - span + 1;
  const r: Report = {
    period, name: st.name, from, to: today, practiced: 0, sec: 0, questions: questionCount(st, from, today), freshCount: 0, recOk: 0, recAll: 0, spellOk: 0, spellAll: 0, sentences: 0,
    gainedKnown: 0, gainedSpelled: 0, totalKnown: 0, totalSpelled: 0, newWords: [], toImprove: [], days: [],
  };
  for (let d = from; d <= today; d++) {
    const l = dayLog(st, d);
    const answers = l.rOk + l.rNo + l.sOk + l.sNo + (l.sen ?? 0);
    if (answers > 0) r.practiced++;
    r.sec += l.sec ?? 0;
    r.freshCount += l.fresh; r.recOk += l.rOk; r.recAll += l.rOk + l.rNo; r.spellOk += l.sOk; r.spellAll += l.sOk + l.sNo;
    r.sentences += l.sen ?? 0; r.gainedKnown += l.known ?? 0; r.gainedSpelled += l.spelled ?? 0;
    r.days.push({ day: d, answers, sec: l.sec ?? 0, done: l.done });
  }
  const t = totals(st);
  r.totalKnown = t.known; r.totalSpelled = t.spelled;
  r.newWords = WORDS.filter((w) => { const s = ws(st, w.id); return isMet(s) && !s.assumed && s.r.ok + s.r.no > 0 && (s.met as number) >= from && (s.met as number) <= today; })
    .sort((a, b) => (ws(st, b.id).met as number) - (ws(st, a.id).met as number) || b.order - a.order);
  r.toImprove = hardWords(st, 6).filter((e) => e.s.r.flag || e.s.s.flag).map((e) => e.w);
  return r;
}

export const dateLabel = (day: number, withYear = false) =>
  new Date(day * 864e5).toLocaleDateString('he-IL', { day: 'numeric', month: withYear ? 'long' : 'numeric', year: withYear ? 'numeric' : undefined, timeZone: 'UTC' });
const pct = (ok: number, all: number) => (all ? `${Math.round((ok / all) * 100)}%` : '-');

const C = { bg: '#f5f4ef', surface: '#fffefa', line: '#e2e3dc', ink: '#172b35', ink2: '#4f5d60', ink3: '#7f8a88', dark: '#182c35', darkInk: '#fffef3', darkMuted: '#b4c2bd', sun: '#ffc83d', sunInk: '#2d2406', tile: '#ffe9ad', tileEdge: '#dfae3f', rec: '#118a7e', spell: '#e4633f', soft: '#ecebe4' };
const HE = '"Heebo Variable", Heebo, Arial, sans-serif';
const EN = '"Fredoka Variable", Fredoka, "Avenir Next", sans-serif';

const W = 1080, M = 56;

function box(x: CanvasRenderingContext2D, l: number, t: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  x.beginPath(); x.roundRect(l, t, w, h, r); x.fillStyle = fill; x.fill();
  if (stroke) { x.strokeStyle = stroke; x.lineWidth = 2; x.stroke(); }
}
function he(x: CanvasRenderingContext2D, s: string, right: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = 'right') {
  x.direction = 'rtl'; x.textAlign = align; x.font = `${weight} ${size}px ${HE}`; x.fillStyle = color; x.fillText(s, right, y);
}
function en(x: CanvasRenderingContext2D, s: string, left: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = 'left') {
  x.direction = 'ltr'; x.textAlign = align; x.font = `${weight} ${size}px ${EN}`; x.fillStyle = color; x.fillText(s, left, y);
}

function chipRows(x: CanvasRenderingContext2D, words: Word[], max: number) {
  x.direction = 'ltr'; x.font = `500 34px ${EN}`;
  let cx = W - M, rows = 1, shown = 0;
  for (const w of words) {
    const cw = x.measureText(w.en).width + 44;
    if (cx - cw < M) { if (rows === max) break; rows++; cx = W - M; }
    cx -= cw + 12; shown++;
  }
  return { rows, shown };
}

function chips(x: CanvasRenderingContext2D, words: Word[], top: number, max: number) {
  let cx = W - M, y = top, shown = 0;
  x.font = `500 34px ${EN}`;
  for (const w of words) {
    x.direction = 'ltr'; x.font = `500 34px ${EN}`;
    const cw = x.measureText(w.en).width + 44;
    if (cx - cw < M) { cx = W - M; y += 78; if (y > top + 78 * (max - 1)) break; }
    box(x, cx - cw, y, cw, 64, 16, C.tileEdge); box(x, cx - cw, y, cw, 59, 16, C.tile);
    en(x, w.en, cx - cw / 2, y + 42, 34, 500, C.ink, 'center');
    cx -= cw + 12; shown++;
  }
  return { bottom: y + 64, shown };
}

function measure(x: CanvasRenderingContext2D, l: number, t: number, w: number, label: string, color: string, total: number, gained: number, acc: string, when: string) {
  box(x, l, t, w, 236, 30, C.surface, C.line);
  const r = l + w - 32;
  he(x, label, r, t + 54, 32, 700, color);
  he(x, String(total), r, t + 136, 84, 750, color);
  he(x, gained > 0 ? `מילים מבוססות, ${gained} חדשות ${when}` : 'מילים מבוססות', r, t + 178, 25, 400, C.ink2);
  he(x, `דיוק ${acc}`, r, t + 214, 25, 400, C.ink2);
}

export async function drawReport(r: Report): Promise<HTMLCanvasElement> {
  try {
    await Promise.all([document.fonts.load(`700 40px ${HE}`, 'אב'), document.fonts.load(`500 40px ${EN}`, 'ab')]);
  } catch { /* fallback fonts are fine */ }
  const week = r.period === 'week';
  const hasNew = r.newWords.length > 0, hasHard = r.toImprove.length > 0;
  const c = document.createElement('canvas');
  c.width = W;
  const x = c.getContext('2d')!;
  const newRows = hasNew ? chipRows(x, r.newWords, 2) : { rows: 0, shown: 0 };
  const more = r.newWords.length - newRows.shown;
  const hardRows = hasHard ? chipRows(x, r.toImprove, 1) : { rows: 0, shown: 0 };
  const newH = hasNew ? 60 + newRows.rows * 78 + (more > 0 ? 40 : 0) + 14 : 0;
  const hardH = hasHard ? 60 + hardRows.rows * 78 + 14 : 0;
  const H = 706 + (week ? 300 : 0) + newH + hardH;
  c.height = H;
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H);

  // Header
  box(x, M, 56, 56, 62, 14, C.tileEdge); box(x, M, 56, 56, 56, 14, C.tile);
  en(x, 'W', M + 28, 98, 36, 600, C.ink, 'center');
  en(x, 'ordFlow', M + 60, 99, 40, 600, C.ink);
  he(x, week ? 'הסיכום השבועי' : 'הסיכום היומי', W - M, 100, 44, 750, C.ink);
  he(x, week ? `${dateLabel(r.from)} עד ${dateLabel(r.to)}` : dateLabel(r.to, true), W - M, 148, 28, 400, C.ink2);

  // Focal card
  let y = 182;
  box(x, M, y, W - 2 * M, 236, 36, C.dark);
  he(x, r.name, W - M - 40, y + 66, 34, 500, C.sun);
  he(x, `זמן למידה: ${studyTimeLabel(r.sec, r.questions)}`, M + 40, y + 66, 34, 650, C.sun, 'left');
  const headline = r.practiced === 0 ? (week ? 'לא היה אימון השבוע' : 'לא היה אימון ביום הזה')
    : r.freshCount > 0 ? `${say('למדה', 'למד')} ${r.freshCount} מילים חדשות` : say('חיזקה מילים שכבר למדה', 'חיזק מילים שכבר למד');
  he(x, headline, W - M - 40, y + 142, 62, 750, C.darkInk);
  const sub = [`${r.questions} שאלות`, r.sentences > 0 ? `${r.sentences} מהן משפטים` : null, week ? `${r.practiced} ימי אימון מתוך 7` : null].filter(Boolean).join(' · ');
  he(x, sub, W - M - 40, y + 196, 30, 400, C.darkMuted);
  y += 262;

  // Two independent measures
  const mw = (W - 2 * M - 20) / 2;
  measure(x, HAS_SPELLING ? M + mw + 20 : M, y, HAS_SPELLING ? mw : W - 2 * M, 'הכרות', C.rec, r.totalKnown, r.gainedKnown, pct(r.recOk, r.recAll), week ? 'השבוע' : 'ביום הזה');
  if (HAS_SPELLING) measure(x, M, y, mw, 'איות', C.spell, r.totalSpelled, r.gainedSpelled, pct(r.spellOk, r.spellAll), week ? 'השבוע' : 'ביום הזה');
  y += 262;

  if (week) {
    box(x, M, y, W - 2 * M, 276, 30, C.surface, C.line);
    const byTime = r.sec > 0;
    const val = (d: ReportDay) => (byTime ? Math.round(d.sec / 60) : d.answers);
    he(x, byTime ? 'דקות למידה בכל יום' : 'תשובות בכל יום', W - M - 32, y + 50, 30, 700, C.ink);
    const max = Math.max(1, ...r.days.map(val));
    const slot = (W - 2 * M - 64) / 7, base = y + 226, full = 140;
    const names = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    r.days.forEach((d, i) => {
      const cx = W - M - 32 - slot * (i + 0.5);
      const h = val(d) ? Math.max(10, (val(d) / max) * full) : 4;
      box(x, cx - 28, base - h, 56, h, Math.min(10, h / 2), val(d) ? C.sun : C.soft);
      if (val(d)) he(x, String(val(d)), cx, base - h - 10, 25, 600, C.ink, 'center');
      he(x, names[(d.day + 4) % 7], cx, base + 34, 26, 500, C.ink2, 'center');
    });
    y += 300;
  }

  if (hasNew) {
    he(x, week ? 'מילים חדשות השבוע' : 'מילים חדשות', W - M, y + 36, 32, 700, C.ink);
    chips(x, r.newWords, y + 60, 2);
    if (more > 0) he(x, `ועוד ${more}`, W - M, y + 60 + newRows.rows * 78 + 22, 26, 400, C.ink2);
    y += newH;
  }
  if (hasHard) {
    he(x, 'מילים לחיזוק', W - M, y + 36, 32, 700, C.ink);
    chips(x, r.toImprove, y + 60, 1);
    y += hardH;
  }
  return c;
}

export const toBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('no image'))), 'image/png'));
export const fileName = (r: Report) => `wordflow-${r.period === 'week' ? 'week' : 'day'}-${new Date(r.to * 864e5).toISOString().slice(0, 10)}.png`;
