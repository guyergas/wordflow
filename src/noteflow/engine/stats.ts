// Progress Tracking — derives every metric from raw attempts. Pure functions (unit-tested).

import type { Attempt, ErrorType, SessionRecord, Settings } from '../storage/types';
import { itemBased, RECOMMENDED_ORDER, Skill, Stage, stageById, stageExercise, stageItems, stageSkills, STAGES } from './curriculum';
import { pitchId } from '../music/pitch';

export const RECENT_WINDOW = 20;
const DAY = 86_400_000;
/** Spaced-repetition intervals (days) by strength level. */
export const INTERVALS = [0, 1, 3, 7, 16, 35, 80];

export function itemKey(skill: Skill, clef: string, pitch: string): string {
  return `${skill}:${clef}:${pitch}`;
}

export interface ItemStats {
  key: string;
  attempts: number;
  correct: number;
  recent: boolean[];
  recentRts: number[];   // correct answers only
  acc: number;           // Bayesian estimate over recent window
  medianRt: number | null;
  meanRt: number | null;
  sdRt: number | null;
  lastSeen: number;
  level: number;
  lastLevelUp: number;
  dueAt: number;
  errors: Partial<Record<ErrorType, number>>;
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

export function sd(xs: number[]): number | null {
  const m = mean(xs);
  if (m === null || xs.length < 2) return null;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

export function targetFor(skill: Skill, settings: Pick<Settings, 'fluencyTargetMs'>): number {
  const k = skill === 'key' || skill === 'interval' ? 1.5 : skill === 'finger' ? 1.25 : 1;
  return settings.fluencyTargetMs * k;
}

/** Short Hebrew label for what a stage + skill practises. */
export function skillLabel(st: Stage, skill: Skill): string {
  const ex = stageExercise(st);
  if (ex === 'rhythm') return 'מקצב';
  if (ex === 'finger') return 'אצבעות';
  if (ex === 'interval') return 'מרווחים';
  if (ex === 'sequence') return skill === 'key' ? 'מנגינה על המקלדת' : 'קריאת מנגינה';
  if (ex === 'grand') return skill === 'key' ? 'שתי ידיים על המקלדת' : 'שתי ידיים · שמות';
  return skill === 'key' ? 'מקלדת' : 'שמות התווים';
}

function emptyItem(key: string): ItemStats {
  return {
    key, attempts: 0, correct: 0, recent: [], recentRts: [], acc: 0.5, medianRt: null, meanRt: null,
    sdRt: null, lastSeen: 0, level: 0, lastLevelUp: 0, dueAt: 0, errors: {},
  };
}

/** Fold one attempt into item stats (attempts must arrive in time order). */
export function foldAttempt(it: ItemStats, a: Attempt, settings: Pick<Settings, 'fluencyTargetMs'>): void {
  it.attempts++;
  if (a.correct) it.correct++;
  it.recent.push(a.correct);
  if (it.recent.length > RECENT_WINDOW) it.recent.shift();
  if (a.correct && a.rtMs != null) {
    it.recentRts.push(a.rtMs);
    if (it.recentRts.length > RECENT_WINDOW) it.recentRts.shift();
  }
  if (a.error) it.errors[a.error] = (it.errors[a.error] ?? 0) + 1;

  // Hints and manual replays don't prove fluent reading; the automatic note sound (a learner's choice) does not block credit.
  const fluent = a.correct && a.hints === 0 && a.rtMs != null && a.rtMs <= targetFor(a.skill, settings);
  if (fluent && a.ts - it.lastLevelUp >= 0.5 * DAY) {
    it.level = Math.min(INTERVALS.length - 1, it.level + 1);
    it.lastLevelUp = a.ts;
  } else if (!a.correct) {
    it.level = Math.max(0, it.level - 1);
  }
  it.lastSeen = a.ts;
  it.dueAt = a.ts + INTERVALS[it.level] * DAY;

  const c = it.recent.filter(Boolean).length;
  it.acc = (c + 1) / (it.recent.length + 2);
  it.medianRt = median(it.recentRts);
  it.meanRt = mean(it.recentRts);
  it.sdRt = sd(it.recentRts);
}

export type StatsIndex = Map<string, ItemStats>;

export function buildIndex(attempts: Attempt[], settings: Pick<Settings, 'fluencyTargetMs'>): StatsIndex {
  const idx: StatsIndex = new Map();
  const sorted = [...attempts].sort((a, b) => a.ts - b.ts);
  for (const a of sorted) addToIndex(idx, a, settings);
  return idx;
}

export function addToIndex(idx: StatsIndex, a: Attempt, settings: Pick<Settings, 'fluencyTargetMs'>): void {
  const k = itemKey(a.skill, a.clef, a.pitch);
  let it = idx.get(k);
  if (!it) { it = emptyItem(k); idx.set(k, it); }
  foldAttempt(it, a, settings);
}

export function getItem(idx: StatsIndex, skill: Skill, clef: string, pitch: string): ItemStats {
  return idx.get(itemKey(skill, clef, pitch)) ?? emptyItem(itemKey(skill, clef, pitch));
}

/**
 * 0..1 mastery of one item — knowledge (accuracy) and fluency (speed) kept as separate parts,
 * damped until there is enough evidence.
 */
export function itemMastery(it: ItemStats, skill: Skill, settings: Pick<Settings, 'fluencyTargetMs' | 'masteryAccuracy'>): number {
  if (!it.attempts) return 0;
  const accPart = clamp((it.acc - 0.5) / (settings.masteryAccuracy - 0.5), 0, 1);
  const speedPart = it.medianRt == null ? 0 : clamp(targetFor(skill, settings) / it.medianRt, 0, 1);
  const evidence = Math.min(1, it.attempts / 8);
  return (0.6 * accPart + 0.4 * speedPart) * evidence;
}

export function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

export type StageStatus = 'new' | 'learning' | 'ready' | 'passed' | 'mastered';

export const STATUS_LABEL: Record<StageStatus, string> = {
  new: 'עוד לא התחלת',
  learning: 'בלמידה',
  ready: 'מוכנה למבחן',
  passed: 'עבר מבחן',
  mastered: 'שולטת',
};

export interface StageProgress {
  status: StageStatus;
  progress: number; // 0..1
  passes: number[];
}

export function stagePasses(sessions: SessionRecord[], stageId: string, skill: Skill): number[] {
  return sessions
    .filter((s) => s.config.kind === 'stage-test' && s.config.stageId === stageId && s.config.skill === skill && s.summary.passed)
    .map((s) => s.endedAt)
    .sort((a, b) => a - b);
}

function masteredFrom(passes: number[]): boolean {
  return passes.length >= 2 && passes[passes.length - 1] - passes[0] >= 20 * 3_600_000;
}

/** Melody and rhythm stages: progress comes from whole sessions, not single notes. */
function sessionStageProgress(stage: Stage, skill: Skill, sessions: SessionRecord[]): StageProgress {
  const mine = sessions.filter((x) => x.config.stageId === stage.id && x.config.skill === skill);
  const passes = stagePasses(sessions, stage.id, skill);
  const metric = (x: SessionRecord) => (x.summary.rhythm ? x.summary.rhythm.timingAccuracy : x.summary.accuracy);
  const practice = mine.filter((x) => x.config.mode === 'practice' && x.summary.total >= 8);
  const lastTwo = practice.slice(-2);
  let status: StageStatus = mine.length ? 'learning' : 'new';
  if (lastTwo.length === 2 && lastTwo.every((x) => metric(x) >= (x.summary.rhythm ? 0.8 : 0.85))) status = 'ready';
  if (passes.length) status = 'passed';
  if (masteredFrom(passes)) status = 'mastered';
  const recent = mine.slice(-3);
  const progress = status === 'mastered' ? 1 : recent.length ? (mean(recent.map((x) => x.summary.score / 100)) ?? 0) * Math.min(1, mine.length / 3) : 0;
  return { status, progress, passes };
}

export function stageProgress(
  stage: Stage, skill: Skill, idx: StatsIndex, sessions: SessionRecord[],
  settings: Pick<Settings, 'fluencyTargetMs' | 'masteryAccuracy'>,
): StageProgress {
  if (!itemBased(stage)) return sessionStageProgress(stage, skill, sessions);
  const items = stageItems(stage).map((i) => getItem(idx, skill, i.clef, pitchId(i.pitch)));
  const progress = mean(items.map((it) => itemMastery(it, skill, settings))) ?? 0;
  const passes = stagePasses(sessions, stage.id, skill);
  let status: StageStatus = 'new';
  if (items.some((it) => it.attempts > 0)) status = 'learning';
  if (items.every((it) => it.attempts >= 5 && it.acc >= 0.8)) status = 'ready';
  if (passes.length) status = 'passed';
  if (masteredFrom(passes)) status = 'mastered';
  return { status, progress: status === 'mastered' ? Math.max(progress, 1) : progress, passes };
}

const ORDER: StageStatus[] = ['new', 'learning', 'ready', 'passed', 'mastered'];
export const atLeast = (s: StageStatus, min: StageStatus) => ORDER.indexOf(s) >= ORDER.indexOf(min);

export interface Recommendation {
  stageId: string;
  skill: Skill;
  action: 'practice' | 'test';
  reason: string;
}

/** What to do next: first recommended stage whose prerequisites are passed and which isn't passed itself. */
export function recommend(
  idx: StatsIndex, sessions: SessionRecord[], settings: Pick<Settings, 'fluencyTargetMs' | 'masteryAccuracy'>,
): Recommendation {
  const prog = (id: string, skill: Skill) => stageProgress(stageById(id), skill, idx, sessions, settings);
  const label = skillLabel;
  for (const id of RECOMMENDED_ORDER) {
    const st = stageById(id);
    if (!st.after.every((p) => atLeast(prog(p, 'name').status, 'passed'))) continue;
    for (const skill of stageSkills(st)) {
      const p = prog(id, skill);
      if (atLeast(p.status, 'passed')) continue;
      if (p.status === 'ready') {
        return { stageId: id, skill, action: 'test', reason: `${label(st, skill)}: התרגול יציב — הגיע הזמן למבחן שליטה` };
      }
      const reason = skill === 'key' && stageExercise(st) === 'notes' ? 'מוצאים את התווים האלה על המקלדת'
        : p.status === 'new' ? `השלב הבא במסלול: ${st.title}` : `ממשיכים לחזק: ${st.title}`;
      return { stageId: id, skill, action: 'practice', reason };
    }
  }
  // Everything passed: consolidate retention on the first stage not yet mastered.
  for (const id of RECOMMENDED_ORDER) {
    for (const skill of stageSkills(stageById(id))) {
      const p = prog(id, skill);
      if (p.status !== 'mastered') {
        return { stageId: id, skill, action: 'test', reason: 'מבחן חוזר כדי לוודא שהידע נשמר לאורך זמן' };
      }
    }
  }
  return { stageId: 'm3', skill: 'name', action: 'practice', reason: 'חזרה כללית לשמירה על הכושר' };
}

export function stagesUpTo(stageId: string): Stage[] {
  const i = RECOMMENDED_ORDER.indexOf(stageId);
  return RECOMMENDED_ORDER.slice(0, Math.max(0, i)).map(stageById);
}

export function allStages(): Stage[] {
  return STAGES;
}

/** Sunday-based week start in local time. */
export function weekStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function practiceDaysThisWeek(sessions: SessionRecord[], now = Date.now()): string[] {
  const ws = weekStart(now);
  return [...new Set(sessions.filter((s) => s.endedAt >= ws).map((s) => dayKey(s.endedAt)))];
}

export interface Records {
  bestStreak: number;
  fastestMedianName: number | null;   // best session median (≥10 correct, name skill)
  bestTestScore: number | null;
  totalNotes: number;
}

export function computeRecords(attempts: Attempt[], sessions: SessionRecord[]): Records {
  let best = 0;
  let cur = 0;
  for (const a of [...attempts].sort((x, y) => x.ts - y.ts)) {
    cur = a.correct ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  const named = sessions.filter((s) => s.config.skill === 'name' && s.summary.correct >= 10 && s.summary.medianRt != null);
  const tests = sessions.filter((s) => s.config.mode === 'test');
  return {
    bestStreak: best,
    fastestMedianName: named.length ? Math.min(...named.map((s) => s.summary.medianRt!)) : null,
    bestTestScore: tests.length ? Math.max(...tests.map((s) => s.summary.score)) : null,
    totalNotes: attempts.filter((a) => a.correct).length,
  };
}
