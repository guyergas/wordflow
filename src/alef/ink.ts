// Compares what a finger drew with a letter. Order and direction are free: a child of five should not fail on those.
// Every line of the letter must be covered, and most of the drawing must lie on the letter. Height counts, because
// the size of the line is the whole difference between י, ו and ן.
import { LETTERS, Pt, Shape } from './letters';

export type Ink = Pt[][];
export interface Verdict { ok: boolean; missing: number[]; stray: number }

const dense = (line: Pt[], step = 3): Pt[] => {
  const out: Pt[] = line.length ? [line[0]] : [];
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1], [bx, by] = line[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
};
/** Points filed by area, so that a drawing is judged at once even on an old phone. */
function field(points: Pt[], tol: number) {
  // A number for each area and no square roots: this runs tens of thousands of times for one drawing.
  const key = (i: number, j: number) => i * 4096 + j, map = new Map<number, Pt[]>(), reach = tol * tol;
  for (const p of points) { const k = key(Math.floor(p[0] / tol), Math.floor(p[1] / tol)); const c = map.get(k); if (c) c.push(p); else map.set(k, [p]); }
  return (x: number, y: number) => {
    const cx = Math.floor(x / tol), cy = Math.floor(y / tol);
    for (let i = cx - 1; i <= cx + 1; i++) for (let j = cy - 1; j <= cy + 1; j++) {
      const near = map.get(key(i, j));
      if (near) for (const q of near) { const dx = x - q[0], dy = y - q[1]; if (dx * dx + dy * dy <= reach) return true; }
    }
    return false;
  };
}

// Over a dashed letter the whole line must be walked, so a child does not jump on after half of it.
export interface Rules { tol: number; shift: number; need: number }
export const TRACE: Rules = { tol: 15, shift: 0, need: 0.88 }, FREE: Rules = { tol: 13, shift: 1, need: 0.72 };
const ON_LETTER = 0.8;

// A letter's own points never change, and each drawing is compared with many letters, so they are prepared once.
const prepared = new Map<Shape, Map<number, ReturnType<typeof prepare>>>();
function prepare(letter: Shape, tol: number) {
  const targets = letter.strokes.map((s) => dense(s.p)), all = targets.flat();
  return { targets, wide: field(all, tol * 1.5), tight: field(all, tol) };
}
function preparedFor(letter: Shape, tol: number) {
  let byTol = prepared.get(letter);
  if (!byTol) prepared.set(letter, (byTol = new Map()));
  let p = byTol.get(tol);
  if (!p) byTol.set(tol, (p = prepare(letter, tol)));
  return p;
}

function fit(drawn: Pt[], letter: Shape, mode: Rules) {
  const { targets, wide, tight } = preparedFor(letter, mode.tol);
  const inked = field(drawn, mode.tol);
  let best = { score: -1, missing: letter.strokes.map((_, i) => i), on: 0 };
  // Free writing has no guide to sit on, so the drawing may stand a little to the side.
  const xs = mode.shift ? [-35, -25, -15, -5, 0, 5, 15, 25, 35] : [0], ys = mode.shift ? [-10, -5, 0, 5, 10] : [0];
  for (const dx of xs) for (const dy of ys) {
    const cover = targets.map((t) => t.filter((p) => inked(p[0] - dx, p[1] - dy)).length / t.length);
    const count = (f: (x: number, y: number) => boolean) => drawn.filter(([x, y]) => f(x + dx, y + dy)).length / drawn.length;
    const score = cover.reduce((a, b) => a + b, 0) / cover.length + count(tight);
    if (score > best.score) best = { score, on: count(wide), missing: cover.flatMap((c, i) => (c < mode.need ? [i] : [])) };
  }
  return best;
}

export function judge(ink: Ink, letter: Shape, mode: Rules = FREE, rivals: Shape[] = LETTERS): Verdict {
  const drawn = ink.flatMap((l) => dense(l));
  if (drawn.length < 4) return { ok: false, missing: letter.strokes.map((_, i) => i), stray: 0 };
  const mine = fit(drawn, letter, mode);
  let ok = mine.missing.length === 0 && mine.on >= ON_LETTER;
  // A generous tolerance could let one letter pass for another, so the drawing must also look most like this letter.
  if (ok && mode.shift) ok = !rivals.some((o) => o !== letter && fit(drawn, o, mode).score > mine.score + 0.02);
  return { ok, missing: mine.missing, stray: 1 - mine.on };
}
