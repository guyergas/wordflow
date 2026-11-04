// Rhythm engine — patterns by level and tap evaluation on the audio clock. Pure functions (unit-tested).

import type { RhythmSummary } from '../storage/types';

export interface RhythmEvent {
  beats: number;
  rest: boolean;
}

/** One-bar patterns (4/4) by level. Each level also includes the earlier ones. */
const BARS: Record<number, string[]> = {
  1: ['q q q q', 'h q q', 'q q h', 'h h', 'w', 'q h q'],
  2: ['8 8 q q q', 'q 8 8 q q', 'q q 8 8 q', '8 8 8 8 h', 'q qr q q', 'q q qr q', 'h qr q', '8 8 q h', 'q q q qr'],
  3: ['qd 8 q q', 'q qd 8 q', 'hd q', 'q hd', '16 16 16 16 q h', 'q 16 16 16 16 h', 'qd 8 h', '8 8 qd 8 q'],
};

const BEATS: Record<string, number> = { w: 4, hd: 3, h: 2, qd: 1.5, q: 1, '8': 0.5, '16': 0.25 };

export function parseBar(s: string): RhythmEvent[] {
  return s.split(' ').map((t) => {
    const rest = t.endsWith('r');
    const d = rest ? t.slice(0, -1) : t;
    return { beats: BEATS[d], rest };
  });
}

export function barsForLevel(level: number): string[] {
  const out: string[] = [];
  for (let l = 1; l <= Math.max(1, Math.min(3, level)); l++) out.push(...BARS[l]);
  return out;
}

/** A two-bar pattern; newer material is favoured, never starts with a rest. */
export function makePattern(level: number, rng: () => number, bars = 2): RhythmEvent[] {
  const all = barsForLevel(level);
  const own = BARS[Math.max(1, Math.min(3, level))];
  const out: RhythmEvent[] = [];
  let last = '';
  for (let b = 0; b < bars; b++) {
    let pick = '';
    for (let tries = 0; tries < 6 && (!pick || pick === last || (b === 0 && pick.startsWith('qr'))); tries++) {
      const pool = rng() < 0.6 ? own : all;
      pick = pool[Math.floor(rng() * pool.length)];
    }
    last = pick;
    out.push(...parseBar(pick));
  }
  return out;
}

export interface Onset {
  index: number;   // event index
  time: number;    // seconds from pattern start
}

export function onsetsOf(events: RhythmEvent[], beatSec: number): { onsets: Onset[]; rests: [number, number][]; length: number } {
  const onsets: Onset[] = [];
  const rests: [number, number][] = [];
  let t = 0;
  events.forEach((e, i) => {
    if (e.rest) rests.push([t * beatSec, (t + e.beats) * beatSec]);
    else onsets.push({ index: i, time: t * beatSec });
    t += e.beats;
  });
  return { onsets, rests, length: t * beatSec };
}

export type OnsetResult = { index: number; status: 'ontime' | 'early' | 'late' | 'miss'; offsetMs: number | null };

export interface RoundResult {
  perOnset: OnsetResult[];
  extras: number[];     // tap times (s) not matched to any onset
  restTaps: number;
  summary: Omit<RhythmSummary, 'bpm' | 'level'>;
}

/** On-time window: tighter at faster tempos, never below 70 ms or above 130 ms. */
export function toleranceSec(beatSec: number): number {
  return Math.max(0.07, Math.min(0.13, 0.18 * beatSec));
}

/**
 * Matches taps to note onsets. Each onset takes the closest unused tap inside its window
 * (half the gap to its neighbours, at most 0.45 beat). Unused taps are extras; extras inside
 * a rest are counted separately. Only the order-independent nearest match is used, so a tap
 * can never be credited to a note that has not started yet by more than the window.
 */
export function evaluateTaps(events: RhythmEvent[], tapsSec: number[], beatSec: number): RoundResult {
  const { onsets, rests } = onsetsOf(events, beatSec);
  const taps = [...tapsSec].sort((a, b) => a - b);
  const used = new Set<number>();
  const tol = toleranceSec(beatSec);
  const perOnset: OnsetResult[] = onsets.map((o, k) => {
    const prev = k > 0 ? onsets[k - 1].time : -Infinity;
    const next = k < onsets.length - 1 ? onsets[k + 1].time : Infinity;
    const w = Math.max(0.08, Math.min(0.45 * beatSec, (o.time - prev) / 2, (next - o.time) / 2));
    let best = -1;
    let bestD = Infinity;
    taps.forEach((t, j) => {
      if (used.has(j)) return;
      const d = Math.abs(t - o.time);
      if (d <= w && d < bestD) { best = j; bestD = d; }
    });
    if (best < 0) return { index: o.index, status: 'miss', offsetMs: null };
    used.add(best);
    const off = taps[best] - o.time;
    return { index: o.index, status: Math.abs(off) <= tol ? 'ontime' : off < 0 ? 'early' : 'late', offsetMs: Math.round(off * 1000) };
  });
  const extras = taps.filter((_, j) => !used.has(j));
  const restTaps = extras.filter((t) => rests.some(([a, b]) => t >= a + 0.02 && t < b - 0.02)).length;
  const hits = perOnset.filter((r) => r.status !== 'miss');
  const offs = hits.map((r) => r.offsetMs!);
  const onTime = perOnset.filter((r) => r.status === 'ontime').length;
  return {
    perOnset, extras, restTaps,
    summary: {
      onsets: onsets.length, hits: hits.length, onTime, misses: onsets.length - hits.length, extras: extras.length, restTaps,
      meanOffsetMs: offs.length ? Math.round(offs.reduce((a, b) => a + b, 0) / offs.length) : null,
      meanAbsOffsetMs: offs.length ? Math.round(offs.reduce((a, b) => a + Math.abs(b), 0) / offs.length) : null,
      timingAccuracy: onsets.length ? onTime / onsets.length : 0,
    },
  };
}

export function combineRounds(rounds: RoundResult['summary'][], bpm: number, level: number): RhythmSummary {
  const sum = (k: keyof RoundResult['summary']) => rounds.reduce((a, r) => a + ((r[k] as number) ?? 0), 0);
  const onsets = sum('onsets');
  const hits = sum('hits');
  const weighted = (k: 'meanOffsetMs' | 'meanAbsOffsetMs') => {
    const xs = rounds.filter((r) => r[k] != null && r.hits);
    const n = xs.reduce((a, r) => a + r.hits, 0);
    return n ? Math.round(xs.reduce((a, r) => a + r[k]! * r.hits, 0) / n) : null;
  };
  return {
    onsets, hits, onTime: sum('onTime'), misses: sum('misses'), extras: sum('extras'), restTaps: sum('restTaps'),
    meanOffsetMs: weighted('meanOffsetMs'), meanAbsOffsetMs: weighted('meanAbsOffsetMs'),
    timingAccuracy: onsets ? sum('onTime') / onsets : 0, bpm, level,
  };
}

/** 0–100: on-time notes count fully, early/late half, extra taps cost half a note each. */
export function rhythmScore(r: RhythmSummary): number {
  if (!r.onsets) return 0;
  const v = (r.onTime + 0.5 * (r.hits - r.onTime) - 0.5 * r.extras) / r.onsets;
  return Math.round(Math.max(0, Math.min(1, v)) * 100);
}

export function rhythmPassed(r: RhythmSummary): boolean {
  return r.timingAccuracy >= 0.85 && r.extras <= Math.max(1, Math.floor(r.onsets * 0.1));
}

/** VexFlow duration for beats (without rest suffix) and whether it is dotted. */
export function vexDuration(beats: number): { d: string; dots: number } {
  switch (beats) {
    case 4: return { d: 'w', dots: 0 };
    case 3: return { d: 'h', dots: 1 };
    case 2: return { d: 'h', dots: 0 };
    case 1.5: return { d: 'q', dots: 1 };
    case 1: return { d: 'q', dots: 0 };
    case 0.75: return { d: '8', dots: 1 };
    case 0.5: return { d: '8', dots: 0 };
    case 0.25: return { d: '16', dots: 0 };
    default: throw new Error(`Unsupported duration ${beats}`);
  }
}
