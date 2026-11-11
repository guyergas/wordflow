// A monthly progress card, drawn as an image to keep or send.

import { useEffect, useMemo, useRef, useState } from 'react';
import { monthCard, MonthCard } from '../../engine/card';
import { pitchFromMidi } from '../../engine/exercise';
import { getItem, itemMastery, StatsIndex } from '../../engine/stats';
import { pitchId } from '../../music/pitch';
import { useApp } from '../../state/store';
import type { Settings } from '../../storage/types';
import { saveFile } from '../download';
import { Icon, TopBar } from '../components/ui';

const W = 1080;
const H = 1350;
const C = {
  paper: '#fffefa', sky: '#f5f4ef', rule: '#d5d9d2', ink: '#172b35', ink2: '#4f5d60', ink3: '#8a938f', coral: '#a87a12',
  keyLine: '#cfd3cc', black: '#1a1d22',
  notes: new Proxy({}, { get: () => '#a87a12' }) as Record<string, string>,
};
const DISPLAY = '"Heebo Variable", Heebo, sans-serif';

const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(m % 12);

function mastery(m: number, idx: StatsIndex, s: Settings): number {
  const id = pitchId(pitchFromMidi(m));
  return Math.max(...['treble', 'bass'].map((c) => itemMastery(getItem(idx, 'name', c, id), 'name', s)));
}

function noteHead(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string | null, stroke?: string, lw = 4): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-20 * Math.PI / 180);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.restore();
}

function draw(cv: HTMLCanvasElement, card: MonthCard, name: string, idx: StatsIndex, s: Settings): void {
  const ctx = cv.getContext('2d')!;
  cv.width = W;
  cv.height = H;
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  // Sky band with the staff; the month's practice days climb it as notes, today's in coral.
  ctx.fillStyle = C.sky;
  ctx.fillRect(0, 0, W, 470);
  const lines = [310, 336, 362, 388, 414];
  ctx.fillStyle = C.rule;
  for (const y of lines) ctx.fillRect(0, y - 1.5, W, 3);
  const days = Math.min(9, Math.max(1, card.days));
  for (let i = 0; i < days; i++) {
    const x = 120 + i * 104;
    const y = 414 - i * 13;
    const last = i === days - 1;
    noteHead(ctx, x, y, last ? 26 : 21, last ? 19 : 15, last ? C.coral : C.ink);
  }
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.font = `750 44px ${DISPLAY}`;
  ctx.fillStyle = C.ink;
  ctx.fillText('Note', 80, 110);
  const nw = ctx.measureText('Note').width;
  ctx.fillStyle = C.coral;
  ctx.fillText('Flow', 80 + nw, 110);
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = C.ink2;
  ctx.font = '500 36px "Heebo Variable", sans-serif';
  ctx.fillText(card.monthLabel, W - 80, 110);
  ctx.fillStyle = C.ink;
  ctx.font = `750 96px ${DISPLAY}`;
  ctx.fillText(name ? `החודש של ${name}` : 'החודש שלי', W - 80, 250);

  // Numbers: 2×2, each with a note-coloured head.
  const stats: [string, string, string][] = [
    [String(card.days), 'ימי תרגול', 'C'],
    [String(card.minutes), 'דקות', 'E'],
    [card.notesRead.toLocaleString('he-IL'), 'תווים שנקראו נכון', 'G'],
    [card.accuracy != null ? `${Math.round(card.accuracy * 100)}%` : '—', card.accuracyDelta != null && card.accuracyDelta > 0 ? `דיוק, ${card.accuracyDelta}+ מהחודש הקודם` : 'דיוק', 'A'],
  ];
  stats.forEach(([v, l, n], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? W - 80 : W / 2 - 20;
    const y = 620 + row * 190;
    noteHead(ctx, x - 14, y - 96, 13, 10, C.notes[n]);
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = C.ink;
    ctx.font = `750 110px ${DISPLAY}`;
    ctx.fillText(v, x, y);
    ctx.fillStyle = C.ink2;
    ctx.font = '400 32px "Heebo Variable", sans-serif';
    ctx.fillText(l, x, y + 50);
  });

  // The keyboard stays black and white; a dot in the note's colour under every key she reads with confidence.
  const low = 48, high = 72;
  const whites: number[] = [];
  for (let m = low; m <= high; m++) if (!isBlack(m)) whites.push(m);
  const kx = 80, ky = 1000, kw = (W - 160) / whites.length, kh = 170;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = C.ink;
  ctx.font = `750 40px ${DISPLAY}`;
  ctx.fillText('המקלדת שלי', W - 80, ky - 34);
  whites.forEach((m, i) => {
    const x = kx + i * kw;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, ky, kw, kh);
    ctx.strokeStyle = C.keyLine;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, ky, kw - 3, kh - 1.5);
    const v = mastery(m, idx, s);
    const col = C.notes[pitchFromMidi(m).letter];
    if (v >= 0.6) noteHead(ctx, x + kw / 2, ky + kh + 34, 15, 11, col);
    else if (v >= 0.15) noteHead(ctx, x + kw / 2, ky + kh + 34, 13, 9.5, null, col, 4);
    if (m % 12 === 0) {
      ctx.direction = 'ltr';
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink3;
      ctx.font = '500 22px "Heebo Variable", sans-serif';
      ctx.fillText(`C${m / 12 - 1}`, x + kw / 2, ky + kh - 16);
    }
  });
  whites.forEach((m, i) => {
    if (m + 1 > high || !isBlack(m + 1)) return;
    const x = kx + (i + 1) * kw - kw * 0.29;
    ctx.fillStyle = C.black;
    ctx.fillRect(x, ky, kw * 0.58, kh * 0.6);
  });

  // Footer: songs and tests.
  const footer: string[] = [];
  if (card.songs.length) footer.push(`מנגינות שנקראו בלי טעות: ${card.songs.slice(0, 3).join(', ')}`);
  if (card.testsPassed) footer.push(`${card.testsPassed} מבחני שליטה עברו בהצלחה`);
  if (!footer.length) footer.push(`${card.sessions} אימונים החודש`);
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = C.ink2;
  ctx.font = '400 32px "Heebo Variable", sans-serif';
  footer.forEach((l, i) => ctx.fillText(l, W - 80, 1290 + i * 44 - (footer.length - 1) * 44));
}

export function ProgressCard({ onBack }: { onBack: () => void }) {
  const { attempts, sessions, idx, settings } = useApp();
  const card = useMemo(() => monthCard(attempts, sessions), [attempts, sessions]);
  const cv = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      await Promise.all(['400 32px "Heebo Variable"', '700 96px "Heebo Variable"'].flatMap((f) => [document.fonts.load(f, 'אב'), document.fonts.load(f, 'Ab1')]).map((pr) => pr.catch(() => undefined)));
      if (!alive || !cv.current) return;
      draw(cv.current, card, settings.name, idx, settings);
      setUrl(cv.current.toDataURL('image/png'));
    })();
    return () => { alive = false; };
  }, [card, idx, settings]);

  const blob = () => new Promise<Blob | null>((res) => cv.current?.toBlob(res, 'image/png') ?? res(null));
  const filename = `noteflow-${card.monthLabel.replace(/\s+/g, '-')}.png`;

  const share = async () => {
    const b = await blob();
    if (!b) return;
    const file = new File([b], filename, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] }) && window.self === window.top) {
      try { await nav.share({ files: [file], title: 'NoteFlow' }); return; } catch { /* cancelled */ return; }
    }
    const r = await saveFile(filename, b, 'image/png');
    setMsg(r === 'saved' ? 'התמונה נשמרה.' : r === 'declined' ? 'השמירה בוטלה.' : 'לא ניתן לשמור קובץ בתצוגה הזו — אפשר ללחוץ לחיצה ארוכה על התמונה.');
  };

  return (
    <div className="page with-nav">
      <TopBar title="כרטיס התקדמות" onBack={onBack} />
      <p className="muted" style={{ marginTop: -6 }}>סיכום של החודש כתמונה — לשמור למזכרת או לשלוח למי שמעודד אותך.</p>
      <canvas ref={cv} style={{ display: 'none' }} />
      <div className="card-preview">
        {url ? <img src={url} alt={`כרטיס התקדמות — ${card.monthLabel}`} /> : <div className="faint" style={{ padding: 40, textAlign: 'center' }}>מכינה את הכרטיס…</div>}
      </div>
      <button className="btn primary block" style={{ marginTop: 12 }} onClick={share} disabled={!url}><Icon name="share" size={18} />שמירה או שליחה</button>
      {msg && <p className="faint" style={{ textAlign: 'center' }}>{msg}</p>}
    </div>
  );
}
