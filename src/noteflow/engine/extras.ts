// Daily plan, moods, mistakes workshop, weekly summary and checks, couple challenge, musical ending,
// hear-and-find questions. Pure functions over raw data (unit-tested).

import { Clef, diatonic, fromDiatonic, midi, parsePitch, Pitch, pitchId } from '../music/pitch';
import { generateMelody, MelodyNote } from '../music/songs';
import type { Attempt, SessionRecord, Settings } from '../storage/types';
import { RECOMMENDED_ORDER, Skill, stageById, stageExercise, stageItems } from './curriculum';
import { PoolItem } from './exercise';
import { SessionPlan, stagePractice, seededRng } from './sessions';
import { atLeast, dayKey, getItem, itemMastery, median, recommend, stageProgress, StatsIndex, weekStart } from './stats';

const DAY = 86_400_000;
const MIN = 60_000;

export type Mood = 'new' | 'strengthen' | 'play';

export const MOODS: { id: Mood; title: string; hint: string }[] = [
  { id: 'new', title: 'להכיר משהו חדש', hint: 'השלב הבא במסלול' },
  { id: 'strengthen', title: 'לחזק את המוכר', hint: 'תווים חלשים וחזרות' },
  { id: 'play', title: 'פשוט לנגן', hint: 'מנגינות ומקצב, בלי לחץ' },
];

/** Stages already started, in order. */
function reached(idx: StatsIndex, sessions: SessionRecord[], s: Settings): string[] {
  const rec = recommend(idx, sessions, s);
  const upto = RECOMMENDED_ORDER.indexOf(rec.stageId);
  return RECOMMENDED_ORDER.slice(0, upto + 1);
}

function lastOf(ids: string[], ex: 'notes' | 'sequence' | 'rhythm', fallback: string): string {
  const f = ids.filter((id) => stageExercise(stageById(id)) === ex);
  return f.length ? f[f.length - 1] : fallback;
}

/** Weak or due items across everything learned so far (for "strengthen"). */
export function reviewPool(idx: StatsIndex, sessions: SessionRecord[], s: Settings, skill: Skill, now = Date.now()): PoolItem[] {
  const ids = reached(idx, sessions, s).filter((id) => stageExercise(stageById(id)) === 'notes');
  const seen = new Set<string>();
  const scored: { it: PoolItem; w: number }[] = [];
  for (const id of ids) {
    for (const i of stageItems(stageById(id))) {
      const k = `${i.clef}:${pitchId(i.pitch)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const st = getItem(idx, skill, i.clef, pitchId(i.pitch));
      if (!st.attempts) continue;
      const due = st.level >= 1 && now >= st.dueAt ? 1 : 0;
      scored.push({ it: { ...i, skill }, w: (1 - itemMastery(st, skill, s)) + due * 0.5 });
    }
  }
  scored.sort((a, b) => b.w - a.w);
  return scored.slice(0, Math.max(6, Math.ceil(scored.length * 0.5))).map((x) => x.it);
}

/** How many learned notes are due for review today (for the home screen). */
export function dueCount(idx: StatsIndex, sessions: SessionRecord[], s: Settings, now = Date.now()): number {
  const ids = reached(idx, sessions, s).filter((id) => stageExercise(stageById(id)) === 'notes');
  const seen = new Set<string>();
  let n = 0;
  for (const id of ids) {
    for (const i of stageItems(stageById(id))) {
      const k = `${i.clef}:${pitchId(i.pitch)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const st = getItem(idx, 'name', i.clef, pitchId(i.pitch));
      // Only notes that were already learned once (level ≥ 1) and whose interval has passed.
      if (st.attempts && st.level >= 1 && now >= st.dueAt) n++;
    }
  }
  return n;
}

function budget(plan: SessionPlan, minutes: number, index: number, total: number, title: string): SessionPlan {
  return {
    ...plan,
    title,
    config: { ...plan.config, kind: 'recommended', timeBudgetMs: minutes * MIN, count: plan.config.exercise === 'rhythm' ? 99 : 999, daily: { index, total } },
  };
}

/** The 10-minute daily plan: four short blocks, shaped by the mood of the day. */
export function dailyPlan(mood: Mood, idx: StatsIndex, sessions: SessionRecord[], s: Settings): SessionPlan[] {
  const ids = reached(idx, sessions, s);
  const notesStage = lastOf(ids, 'notes', 't1');
  const melodyStage = lastOf(ids, 'sequence', 's1');
  const rhythmStage = lastOf(ids, 'rhythm', 'r1');
  if (mood === 'play') {
    const mel = stagePractice(melodyStage, 'name', s);
    mel.config.content = 'known';
    const listen = listenPlan(idx, sessions, s);
    const rh = stagePractice(rhythmStage, 'name', s);
    const keys = stagePractice(melodyStage, 'key', s);
    keys.config.content = 'known';
    return [
      budget(mel, 3, 0, 4, 'מנגינות מוכרות'),
      budget(listen, 2, 1, 4, 'שומעים ומוצאים'),
      budget(rh, 2, 2, 4, 'מקצב'),
      budget(keys, 3, 3, 4, 'מנגינה על המקלדת'),
    ];
  }
  const names = stagePractice(notesStage, 'name', s);
  const keys = stagePractice(notesStage, 'key', s);
  if (mood === 'strengthen') {
    const rn = reviewPool(idx, sessions, s, 'name');
    const rk = reviewPool(idx, sessions, s, 'key');
    if (rn.length) names.pool = rn;
    if (rk.length) keys.pool = rk;
  }
  const mel = stagePractice(melodyStage, 'name', s);
  if (mood === 'strengthen') mel.config.content = 'known';
  const rh = stagePractice(rhythmStage, 'name', s);
  return [
    budget(names, 2, 0, 4, mood === 'strengthen' ? 'חיזוק · שמות התווים' : 'שמות התווים'),
    budget(keys, 3, 1, 4, mood === 'strengthen' ? 'חיזוק · מקלדת' : 'על המקלדת'),
    budget(mel, 3, 2, 4, 'קריאת מנגינה'),
    budget(rh, 2, 3, 4, 'מקצב'),
  ];
}

/** Minutes practised today (sum of session durations, capped per session). */
export function minutesToday(sessions: SessionRecord[], now = Date.now()): number {
  const k = dayKey(now);
  return sessions.filter((x) => dayKey(x.endedAt) === k)
    .reduce((a, x) => a + Math.min(15, (x.endedAt - x.startedAt) / MIN), 0);
}

// ---------- Hear and find ----------

export interface ListenQuestion {
  clef: Clef;
  target: Pitch;
  /** Three positions on the staff in display order (one is the target). */
  options: Pitch[];
}

/** Target plus two near distractors (1–2 steps away, so the ear has to do real work). */
export function listenQuestion(pool: { clef: Clef; pitch: Pitch }[], rng: () => number, last?: string): ListenQuestion {
  const cand = pool.filter((p) => pitchId(p.pitch) !== last);
  const pick = (cand.length ? cand : pool)[Math.floor(rng() * (cand.length || pool.length))];
  const d = diatonic(pick.pitch);
  const inPool = new Set(pool.filter((p) => p.clef === pick.clef).map((p) => diatonic(p.pitch)));
  const offsets = [-2, -1, 1, 2].filter((o) => inPool.has(d + o) || inPool.size < 4);
  const shuffled = offsets.sort(() => rng() - 0.5).slice(0, 2);
  while (shuffled.length < 2) shuffled.push(shuffled.length ? -shuffled[0] : 1);
  const opts = [d, d + shuffled[0], d + shuffled[1]].sort((a, b) => a - b).map((x) => fromDiatonic(x));
  return { clef: pick.clef, target: { ...pick.pitch, accidental: 0 }, options: opts };
}

export function listenPlan(idx: StatsIndex, sessions: SessionRecord[], s: Settings): SessionPlan {
  const ids = reached(idx, sessions, s).filter((id) => stageExercise(stageById(id)) === 'notes' && !stageById(id).ranges.some((r) => r.accidentals || r.key));
  const id = ids.length ? ids[ids.length - 1] : 't1';
  return {
    title: 'שומעים ומוצאים',
    config: { kind: 'free', exercise: 'listen', mode: 'practice', skill: 'ear', stageId: undefined, ranges: stageById(id).ranges, count: 12, timeLimitMs: null, autoAdvance: true },
    pool: stageItems(stageById(id)).map((i) => ({ ...i, skill: 'ear' as Skill })),
    reviewPool: [],
  };
}

// ---------- Mistakes workshop ----------

export interface Confusion {
  key: string;
  clef: Clef;
  /** The note that was shown. */
  target: string;
  /** What was answered instead (letter, or pitch id for the keyboard). */
  answer: string;
  count: number;
  kind: 'clef' | 'adjacent' | 'octave' | 'accidental' | 'other';
  skill: Skill;
}

/** Recurring confusions from the last 30 days (at least two of the same kind). */
export function confusions(attempts: Attempt[], now = Date.now()): Confusion[] {
  const map = new Map<string, Confusion>();
  for (const a of attempts) {
    if (a.correct || a.answer == null || a.ts < now - 30 * DAY || a.error === 'timeout' || (a.skill !== 'name' && a.skill !== 'key')) continue;
    let answer = a.answer;
    if (a.skill === 'key' && /^\d+$/.test(answer)) {
      const m = Number(answer);
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      answer = `${names[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
    }
    const key = `${a.skill}:${a.clef}:${a.pitch}:${answer}`;
    const c = map.get(key) ?? { key, clef: a.clef, target: a.pitch, answer, count: 0, kind: (a.error ?? 'other') as Confusion['kind'], skill: a.skill };
    c.count++;
    map.set(key, c);
  }
  return [...map.values()].filter((c) => c.count >= 2).sort((a, b) => b.count - a.count);
}

/** A focused drill: the two confused notes plus their neighbours, in the same clef. */
export function confusionPlan(c: Confusion, s: Settings): SessionPlan {
  const t = parsePitch(c.target);
  const pitches = new Map<string, Pitch>();
  pitches.set(pitchId(t), t);
  let other: Pitch | null = null;
  try {
    if (/\d$/.test(c.answer)) other = parsePitch(c.answer);
    else if (/^[A-G]$/.test(c.answer)) {
      // Same letter nearest to the target.
      const base = { letter: c.answer as Pitch['letter'], octave: t.octave, accidental: 0 as const };
      const cands = [base, { ...base, octave: t.octave - 1 }, { ...base, octave: t.octave + 1 }];
      other = cands.reduce((b, x) => (Math.abs(diatonic(x) - diatonic(t)) < Math.abs(diatonic(b) - diatonic(t)) ? x : b));
    }
  } catch { other = null; }
  if (other) pitches.set(pitchId(other), other);
  for (const p of [...pitches.values()]) {
    for (const o of [-1, 1]) { const n = fromDiatonic(diatonic(p) + o); pitches.set(pitchId(n), n); }
  }
  const skill: Skill = c.skill === 'ear' ? 'name' : c.skill;
  const pool: PoolItem[] = [...pitches.values()].map((pitch) => ({ skill, clef: c.clef, pitch }));
  // The two confused notes appear twice as often.
  const focus = pool.filter((p) => pitchId(p.pitch) === c.target || (other && pitchId(p.pitch) === pitchId(other)));
  return {
    title: 'סדנת טעויות',
    config: { kind: 'mistakes', mode: 'practice', skill, count: 14, timeLimitMs: null, autoAdvance: s.autoAdvance },
    pool: [...pool, ...focus],
    reviewPool: [],
  };
}

export function confusionText(c: Confusion): string {
  const clef = c.clef === 'treble' ? 'סול' : 'פה';
  switch (c.kind) {
    case 'clef': return `ב${clef === 'סול' ? 'מפתח סול' : 'מפתח פה'} קראת את ${c.target} כאילו המפתח השני. מבט על המפתח לפני כל תו פותר את זה.`;
    case 'adjacent': return `${c.target} ו־${c.answer} שכנים — קו ורווח צמודים. ספרי מהעוגן הקרוב.`;
    case 'octave': return `האות נכונה, האוקטבה לא. ${c.target} — חפשי את ה־C שמתחתיו.`;
    case 'accidental': return `שימי לב לסימן ♯ או ♭ שלפני ${c.target}.`;
    default: return `${c.target} נענה כ־${c.answer}.`;
  }
}

// ---------- Weekly summary ----------

export interface WeekSummary {
  from: number;
  notes: number;
  prevNotes: number;
  accuracy: number | null;
  prevAccuracy: number | null;
  medianRt: number | null;
  prevMedianRt: number | null;
  days: number;
  minutes: number;
  improved: { pitch: string; clef: Clef; from: number; to: number } | null;
  weakest: { pitch: string; clef: Clef; acc: number } | null;
}

export function weekSummary(attempts: Attempt[], sessions: SessionRecord[], now = Date.now()): WeekSummary {
  const ws = weekStart(now);
  const prevWs = ws - 7 * DAY;
  const cur = attempts.filter((a) => a.ts >= ws && a.skill !== 'ear');
  const prev = attempts.filter((a) => a.ts >= prevWs && a.ts < ws && a.skill !== 'ear');
  const acc = (xs: Attempt[]) => (xs.length ? xs.filter((a) => a.correct).length / xs.length : null);
  const med = (xs: Attempt[]) => median(xs.filter((a) => a.correct && a.rtMs != null && a.skill === 'name').map((a) => a.rtMs!));
  const byNote = (xs: Attempt[]) => {
    const m = new Map<string, number[]>();
    for (const a of xs) if (a.skill === 'name' && a.correct && a.rtMs != null) m.set(`${a.clef}|${a.pitch}`, [...(m.get(`${a.clef}|${a.pitch}`) ?? []), a.rtMs]);
    return m;
  };
  const pc = byNote(cur);
  const pp = byNote(prev);
  let improved: WeekSummary['improved'] = null;
  for (const [k, xs] of pc) {
    const before = pp.get(k);
    if (!before || xs.length < 3 || before.length < 3) continue;
    const a = median(before)!;
    const b = median(xs)!;
    if (b < a && (!improved || a - b > improved.from - improved.to)) {
      const [clef, pitch] = k.split('|');
      improved = { pitch, clef: clef as Clef, from: a, to: b };
    }
  }
  const accBy = new Map<string, { ok: number; n: number }>();
  for (const a of cur) {
    if (a.skill !== 'name') continue;
    const k = `${a.clef}|${a.pitch}`;
    const s = accBy.get(k) ?? { ok: 0, n: 0 };
    s.n++; if (a.correct) s.ok++;
    accBy.set(k, s);
  }
  let weakest: WeekSummary['weakest'] = null;
  for (const [k, v] of accBy) {
    if (v.n < 4) continue;
    const r = v.ok / v.n;
    if (r < 0.9 && (!weakest || r < weakest.acc)) { const [clef, pitch] = k.split('|'); weakest = { pitch, clef: clef as Clef, acc: r }; }
  }
  const curSessions = sessions.filter((x) => x.endedAt >= ws);
  return {
    from: ws,
    notes: cur.filter((a) => a.correct).length,
    prevNotes: prev.filter((a) => a.correct).length,
    accuracy: acc(cur), prevAccuracy: acc(prev),
    medianRt: med(cur), prevMedianRt: med(prev),
    days: new Set(curSessions.map((x) => dayKey(x.endedAt))).size,
    minutes: Math.round(curSessions.reduce((a, x) => a + Math.min(15, (x.endedAt - x.startedAt) / MIN), 0)),
    improved, weakest,
  };
}

// ---------- Weekly reading check ----------

/** Same conditions each week: 16 unseen notes of an original melody in the widest treble range learned. */
export function weeklyCheckPlan(idx: StatsIndex, sessions: SessionRecord[], s: Settings): SessionPlan {
  const t2 = stageProgress(stageById('t2'), 'name', idx, sessions, s);
  const range = atLeast(t2.status, 'passed') ? { clef: 'treble' as Clef, from: 'C4', to: 'C5' } : { clef: 'treble' as Clef, from: 'C4', to: 'G4' };
  return {
    title: 'בדיקת קריאה שבועית',
    config: {
      kind: 'stage-practice', exercise: 'sequence', mode: 'test', skill: 'name', stageId: undefined, ranges: [range], count: 16,
      timeLimitMs: 6000, autoAdvance: true, look: 4, content: 'original', weeklyCheck: true,
    },
    pool: [], reviewPool: [],
  };
}

export const isWeeklyCheck = (x: SessionRecord) => !!x.config.weeklyCheck;

export function weeklyCheckDue(sessions: SessionRecord[], now = Date.now()): boolean {
  if (sessions.length < 3) return false;
  return !sessions.some((x) => isWeeklyCheck(x) && x.endedAt >= weekStart(now));
}

// ---------- Couple challenge ----------

/** The same 20 notes for everyone today (no personal adaptation), so two people can compare. */
export function coupleChallenge(now = Date.now()): SessionPlan {
  const k = dayKey(now);
  let seed = 7;
  for (const ch of k) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const day = new Date(now).getDay();
  const ranges = day % 2 === 0
    ? [{ clef: 'treble' as Clef, from: 'C4', to: 'C5' }]
    : [{ clef: 'treble' as Clef, from: 'C4', to: 'G4' }, { clef: 'bass' as Clef, from: 'F3', to: 'C4' }];
  const pool: PoolItem[] = ranges.flatMap((r) => {
    const out: PoolItem[] = [];
    for (let d = diatonic(parsePitch(r.from)); d <= diatonic(parsePitch(r.to)); d++) out.push({ skill: 'name', clef: r.clef, pitch: fromDiatonic(d) });
    return out;
  });
  return {
    title: 'אתגר זוגי',
    seed: seed || 1,
    config: { kind: 'daily', couple: true, mode: 'test', skill: 'name', count: 20, timeLimitMs: 4000, autoAdvance: true, ranges },
    pool, reviewPool: [],
  };
}

// ---------- Musical ending ----------

/** A short phrase (2 bars) built only from the notes practised in this session. */
export function endingPhrase(attempts: Attempt[], seed = Date.now()): { clef: Clef; notes: MelodyNote[] } | null {
  const named = attempts.map((a) => ({ clef: a.clef, p: parsePitch(a.pitch) }));
  if (named.length < 4) return null;
  const clef: Clef = named.filter((x) => x.clef === 'treble').length >= named.length / 2 ? 'treble' : 'bass';
  const ps = named.filter((x) => x.clef === clef).map((x) => ({ ...x.p, accidental: 0 as const }));
  const ds = [...new Set(ps.map(diatonic))].sort((a, b) => a - b);
  if (ds.length < 2) return null;
  const lo = fromDiatonic(ds[0]);
  const hi = fromDiatonic(ds[ds.length - 1]);
  const m = generateMelody(clef, pitchId(lo), pitchId(hi), seededRng(seed % 2147483647 || 1), 2);
  // Keep only pitches that were practised (snap to the nearest practised step).
  const notes = m.rhythmic.map((n) => {
    if (!n.pitch) return n;
    const d = diatonic(n.pitch);
    const near = ds.reduce((b, x) => (Math.abs(x - d) < Math.abs(b - d) ? x : b));
    return { ...n, pitch: fromDiatonic(near) };
  });
  return { clef, notes };
}

export function phraseMidi(notes: MelodyNote[]): { midi: number | null; beats: number }[] {
  return notes.map((n) => ({ midi: n.pitch ? midi(n.pitch) : null, beats: n.beats }));
}

// ---------- The melody that grows with you ----------

export const GROWING_SONG = 'ode';

/** Ode to Joy, first phrase, as rhythm bars. */
export const ODE_RHYTHM = ['q q q q', 'q q q q', 'q q q q', 'qd 8 h'];

export interface GrowingLevel {
  id: string;
  title: string;
  hint: string;
}

export const GROWING_LEVELS: GrowingLevel[] = [
  { id: 'names', title: 'קוראים את השמות', hint: 'כל התווים כרבעים — רק לזהות' },
  { id: 'keys', title: 'על המקלדת', hint: 'אותה מנגינה, הפעם מוצאים את הקלידים' },
  { id: 'rhythm', title: 'המקצב של המנגינה', hint: 'מקישים את המקצב של המשפט הראשון' },
  { id: 'hands', title: 'שתי ידיים', hint: 'המנגינה ביד ימין, C ו־G ביד שמאל — על שתי חמשות' },
];

export function growingLevelDone(sessions: SessionRecord[], level: string): number | null {
  const mine = sessions.filter((x) => x.config.songIds?.includes(GROWING_SONG) && (
    level === 'names' ? x.config.exercise === 'sequence' && x.config.skill === 'name'
      : level === 'keys' ? x.config.exercise === 'sequence' && x.config.skill === 'key'
        : level === 'rhythm' ? x.config.exercise === 'rhythm' : level === 'hands' ? x.config.exercise === 'grand' : false));
  if (!mine.length) return null;
  return Math.max(...mine.map((x) => x.summary.rhythm ? x.summary.rhythm.timingAccuracy : x.summary.accuracy));
}
