// Monthly progress card data — derived from raw attempts and sessions.

import type { Attempt, SessionRecord } from '../storage/types';
import { dayKey } from './stats';

export interface MonthCard {
  monthLabel: string;
  days: number;
  minutes: number;
  notesRead: number;
  accuracy: number | null;
  sessions: number;
  testsPassed: number;
  songs: string[];
  /** Month-over-month change in accuracy (points), when both months have data. */
  accuracyDelta: number | null;
}

const HEB_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

export function monthStart(ts: number, offset = 0): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime();
}

export function monthCard(attempts: Attempt[], sessions: SessionRecord[], now = Date.now()): MonthCard {
  const from = monthStart(now);
  const to = monthStart(now, 1);
  const prevFrom = monthStart(now, -1);
  const ss = sessions.filter((s) => s.endedAt >= from && s.endedAt < to);
  const as = attempts.filter((a) => a.ts >= from && a.ts < to && a.skill !== 'ear');
  const prev = attempts.filter((a) => a.ts >= prevFrom && a.ts < from && a.skill !== 'ear');
  const acc = (xs: Attempt[]) => (xs.length >= 20 ? xs.filter((a) => a.correct).length / xs.length : null);
  const a1 = acc(as);
  const a0 = acc(prev);
  const songs = new Set<string>();
  for (const s of ss) for (const m of s.summary.melodies ?? []) if (m.total && m.correct === m.total && !m.id.startsWith('orig-')) songs.add(m.title);
  const d = new Date(now);
  return {
    monthLabel: `${HEB_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    days: new Set(ss.map((s) => dayKey(s.endedAt))).size,
    minutes: Math.round(ss.reduce((a, s) => a + Math.min(15, (s.endedAt - s.startedAt) / 60_000), 0)),
    notesRead: as.filter((a) => a.correct).length,
    accuracy: a1,
    sessions: ss.length,
    testsPassed: ss.filter((s) => s.config.kind === 'stage-test' && s.summary.passed).length,
    songs: [...songs],
    accuracyDelta: a1 != null && a0 != null ? Math.round((a1 - a0) * 100) : null,
  };
}
