// Builds session configurations and question pools.

import type { Clef, KeySig } from '../music/pitch';
import { parsePitch } from '../music/pitch';
import type { Attempt, MelodyContent, SessionConfig, SessionRecord, Settings } from '../storage/types';
import { itemsForRanges, RECOMMENDED_ORDER, Skill, stageById, stageExercise, stageItems } from './curriculum';
import { PoolItem } from './exercise';
import { atLeast, dayKey, getItem, recommend, stageProgress, StatsIndex, targetFor } from './stats';
import { pitchId } from '../music/pitch';

export interface SessionPlan {
  config: SessionConfig;
  pool: PoolItem[];
  reviewPool: PoolItem[];
  seed?: number;
  title: string;
}

const withSkill = (skill: Skill) => (i: { clef: Clef; pitch: PoolItem['pitch'] }): PoolItem => ({ ...i, skill });

export function stagePractice(stageId: string, skill: Skill, s: Settings, kind: SessionConfig['kind'] = 'stage-practice'): SessionPlan {
  const st = stageById(stageId);
  const ex = stageExercise(st);
  if (ex === 'interval') {
    return {
      title: `מרווחים · ${st.title}`,
      config: { kind, exercise: 'interval', mode: 'practice', skill: 'interval', stageId, ranges: st.ranges, maxInterval: st.maxInterval ?? 3, count: 20, timeLimitMs: null, autoAdvance: s.autoAdvance },
      pool: [], reviewPool: [],
    };
  }
  if (ex === 'grand') {
    return {
      title: `${skill === 'key' ? 'שתי ידיים על המקלדת' : 'שתי ידיים'} · ${st.title.replace('שתי ידיים: ', '')}`,
      config: { kind, exercise: 'grand', mode: 'practice', skill, stageId, ranges: st.ranges, grandMode: st.grandMode ?? 'pairs', count: 32, timeLimitMs: null, autoAdvance: true },
      pool: [], reviewPool: [],
    };
  }
  if (ex === 'sequence') {
    return {
      title: `${skill === 'key' ? 'מנגינה על המקלדת' : 'קריאת מנגינה'} · ${st.title}`,
      config: { kind, exercise: 'sequence', mode: 'practice', skill, stageId, ranges: st.ranges, count: 32, timeLimitMs: null, autoAdvance: true, look: 4, content: 'mixed' },
      pool: [], reviewPool: [],
    };
  }
  if (ex === 'rhythm') {
    return {
      title: `מקצב · ${st.title}`,
      config: { kind, exercise: 'rhythm', mode: 'practice', skill: 'name', stageId, count: 4, timeLimitMs: null, autoAdvance: true, rhythmLevel: st.rhythmLevel ?? 1, bpm: st.bpm ?? 70, metronome: true },
      pool: [], reviewPool: [],
    };
  }
  return {
    title: `${skill === 'key' ? 'מקלדת' : skill === 'finger' ? 'אצבעות' : 'זיהוי'} · ${st.title}`,
    config: { kind, mode: 'practice', skill, stageId, count: s.sessionLength, timeLimitMs: null, adaptiveTime: true, autoAdvance: s.autoAdvance, ...(st.anchors ? { anchors: true } : {}) },
    pool: stageItems(st).map(withSkill(skill)),
    reviewPool: [],
  };
}

export function stageTest(stageId: string, skill: Skill, s: Settings): SessionPlan {
  const st = stageById(stageId);
  const ex = stageExercise(st);
  const limit = Math.round(targetFor(skill, s) * 3);
  if (ex === 'interval') {
    return {
      title: `מבחן שליטה · מרווחים · ${st.title}`,
      config: { kind: 'stage-test', exercise: 'interval', mode: 'test', skill: 'interval', stageId, ranges: st.ranges, maxInterval: st.maxInterval ?? 3, count: 20, timeLimitMs: limit, autoAdvance: true },
      pool: [], reviewPool: [],
    };
  }
  if (ex === 'grand') {
    return {
      title: `מבחן שליטה · שתי ידיים · ${st.title.replace('שתי ידיים: ', '')}`,
      config: { kind: 'stage-test', exercise: 'grand', mode: 'test', skill, stageId, ranges: st.ranges, grandMode: st.grandMode ?? 'pairs', count: 32, timeLimitMs: limit, autoAdvance: true },
      pool: [], reviewPool: [],
    };
  }
  if (ex === 'sequence') {
    return {
      title: `מבחן שליטה · ${skill === 'key' ? 'מנגינה על המקלדת' : 'קריאת מנגינה'} · ${st.title}`,
      config: {
        kind: 'stage-test', exercise: 'sequence', mode: 'test', skill, stageId, ranges: st.ranges, count: 32,
        timeLimitMs: Math.round((skill === 'key' ? 1.5 : 1) * s.fluencyTargetMs * 3), autoAdvance: true, look: 4, content: 'original',
      },
      pool: [], reviewPool: [],
    };
  }
  if (ex === 'rhythm') {
    return {
      title: `מבחן שליטה · מקצב · ${st.title}`,
      config: { kind: 'stage-test', exercise: 'rhythm', mode: 'test', skill: 'name', stageId, count: 6, timeLimitMs: null, autoAdvance: true, rhythmLevel: st.rhythmLevel ?? 1, bpm: st.bpm ?? 70, metronome: true },
      pool: [], reviewPool: [],
    };
  }
  const items = stageItems(st);
  return {
    title: `מבחן שליטה · ${skill === 'key' ? 'מקלדת' : skill === 'finger' ? 'אצבעות' : 'זיהוי'} · ${st.title}`,
    config: {
      kind: 'stage-test', mode: 'test', skill, stageId,
      count: Math.min(30, Math.max(20, items.length * 3)),
      timeLimitMs: limit,
      autoAdvance: true,
    },
    pool: items.map(withSkill(skill)),
    reviewPool: [],
  };
}

/** The home screen's main button: follows the recommendation, with ~25% review of earlier material. */
export function recommendedSession(idx: StatsIndex, sessions: SessionRecord[], s: Settings): SessionPlan {
  const rec = recommend(idx, sessions, s);
  if (rec.action === 'test') return stageTest(rec.stageId, rec.skill, s);
  const plan = stagePractice(rec.stageId, rec.skill, s, 'recommended');
  if (stageExercise(stageById(rec.stageId)) !== 'notes') return plan;
  plan.title = 'אימון מומלץ';
  const reviewPool: PoolItem[] = [];
  const upto = RECOMMENDED_ORDER.indexOf(rec.stageId);
  for (const id of RECOMMENDED_ORDER.slice(0, upto + 1)) {
    for (const skill of ['name', 'key'] as Skill[]) {
      if (id === rec.stageId && skill === rec.skill) continue;
      if (stageExercise(stageById(id)) !== 'notes') continue;
      for (const it of stageItems(stageById(id))) {
        if (getItem(idx, skill, it.clef, pitchId(it.pitch)).attempts > 0) reviewPool.push({ ...it, skill });
      }
    }
  }
  plan.reviewPool = dedupe(reviewPool);
  return plan;
}

function dedupe(xs: PoolItem[]): PoolItem[] {
  const seen = new Set<string>();
  return xs.filter((x) => {
    const k = `${x.skill}:${x.clef}:${pitchId(x.pitch)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export interface FreeOptions {
  /** Default 'notes'. */
  exercise?: 'notes' | 'sequence' | 'rhythm';
  skill: Skill | 'mixed';
  clef: Clef | 'mixed';
  treble: { from: string; to: string };
  bass: { from: string; to: string };
  count: number;
  timeLimitMs: number | null;
  adaptiveTime: boolean;
  mode: 'practice' | 'test';
  /** Include ♯ and ♭ notes. */
  accidentals?: boolean;
  look?: number;
  content?: MelodyContent;
  rhythmLevel?: number;
  bpm?: number;
  metronome?: boolean;
  rounds?: number;
}

export const DEFAULT_FREE: FreeOptions = {
  skill: 'name', clef: 'treble',
  treble: { from: 'C4', to: 'C5' }, bass: { from: 'C3', to: 'C4' },
  count: 20, timeLimitMs: null, adaptiveTime: false, mode: 'practice', accidentals: false,
  exercise: 'notes', look: 4, content: 'mixed', rhythmLevel: 1, bpm: 70, metronome: true, rounds: 4,
};

export function freeSession(o: FreeOptions, s: Settings): SessionPlan {
  const ex = o.exercise ?? 'notes';
  const label = o.mode === 'test' ? 'מבחן' : 'תרגול';
  if (ex === 'rhythm') {
    return {
      title: `${label} מקצב`,
      config: { kind: 'free', exercise: 'rhythm', mode: o.mode, skill: 'name', count: o.rounds ?? 4, timeLimitMs: null, autoAdvance: true, rhythmLevel: o.rhythmLevel ?? 1, bpm: o.bpm ?? 70, metronome: o.metronome ?? true },
      pool: [], reviewPool: [],
    };
  }
  if (ex === 'sequence') {
    const ranges = [
      ...(o.clef !== 'bass' ? [{ clef: 'treble' as Clef, ...o.treble }] : []),
      ...(o.clef !== 'treble' ? [{ clef: 'bass' as Clef, ...o.bass }] : []),
    ];
    return {
      title: `${label} · מנגינות`,
      config: {
        kind: 'free', exercise: 'sequence', mode: o.mode, skill: o.skill === 'key' ? 'key' : 'name', ranges, count: o.count < 16 ? 16 : o.count,
        timeLimitMs: o.timeLimitMs, autoAdvance: true, look: o.look ?? 4, content: o.mode === 'test' && (o.content ?? 'mixed') === 'mixed' ? 'original' : (o.content ?? 'mixed'),
      },
      pool: [], reviewPool: [],
    };
  }
  const ranges = [
    ...(o.clef !== 'bass' ? [{ clef: 'treble' as Clef, ...o.treble, accidentals: !!o.accidentals }] : []),
    ...(o.clef !== 'treble' ? [{ clef: 'bass' as Clef, ...o.bass, accidentals: !!o.accidentals }] : []),
  ];
  const items = itemsForRanges(ranges);
  const skills: Skill[] = o.skill === 'mixed' ? ['name', 'key'] : [o.skill];
  return {
    title: o.mode === 'test' ? 'מבחן חופשי' : 'תרגול חופשי',
    config: {
      kind: 'free', mode: o.mode, skill: skills[0], ranges, clefs: ranges.map((r) => r.clef), count: o.count,
      timeLimitMs: o.adaptiveTime ? null : o.timeLimitMs, adaptiveTime: o.mode === 'practice' && o.adaptiveTime,
      autoAdvance: s.autoAdvance,
    },
    pool: skills.flatMap((sk) => items.map(withSkill(sk))),
    reviewPool: [],
  };
}

/** Same 20 notes for everyone today; range grows with your progress. */
export function dailyChallenge(idx: StatsIndex, sessions: SessionRecord[], s: Settings, now = Date.now()): SessionPlan {
  const rec = recommend(idx, sessions, s);
  const upto = RECOMMENDED_ORDER.indexOf(rec.stageId);
  const learned = RECOMMENDED_ORDER.slice(0, upto + 1).filter((id) => stageExercise(stageById(id)) === 'notes' && !stageById(id).ranges.some((r) => r.accidentals || r.key || r.only)).filter((id) => {
    const p = stageProgress(stageById(id), 'name', idx, sessions, s);
    return atLeast(p.status, 'learning');
  });
  const stageId = learned.length ? learned[learned.length - 1] : 't1';
  // Mixed stages cover everything learned so far; pick the widest one the user has reached.
  const mixed = [...learned].reverse().find((id) => id.startsWith('m'));
  const st = stageById(mixed && RECOMMENDED_ORDER.indexOf(mixed) >= RECOMMENDED_ORDER.indexOf(stageId) - 2 ? mixed : stageId);
  const key = dayKey(now);
  let seed = 0;
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    title: 'אתגר היום',
    seed: seed || 1,
    config: {
      kind: 'daily', mode: 'test', skill: 'name', stageId: st.id, count: 20,
      timeLimitMs: 3000, autoAdvance: true,
    },
    pool: stageItems(st).map(withSkill('name')),
    reviewPool: [],
  };
}

export function dailyDone(sessions: SessionRecord[], now = Date.now()): SessionRecord | undefined {
  const k = dayKey(now);
  return sessions.filter((x) => x.config.kind === 'daily' && dayKey(x.endedAt) === k).sort((a, b) => b.summary.score - a.summary.score)[0];
}

export function seededRng(seed: number): () => number {
  let x = seed % 2147483647 || 1;
  return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
}

/** "Practice the notes I got wrong": single-note practice on exactly those notes. */
export function mistakesSession(attempts: Attempt[], s: Settings): SessionPlan | null {
  const seen = new Set<string>();
  const pool: PoolItem[] = [];
  for (const a of attempts) {
    if (a.correct || (a.skill !== 'name' && a.skill !== 'key' && a.skill !== 'finger')) continue;
    const k = `${a.skill}:${a.clef}:${a.pitch}:${a.meta ?? ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    pool.push({ skill: a.skill, clef: a.clef, pitch: parsePitch(a.pitch), ...(a.meta?.startsWith('key:') ? { keySig: a.meta.slice(4) as KeySig } : {}) });
  }
  if (!pool.length) return null;
  return {
    title: 'תרגול התווים שטעיתי בהם',
    config: { kind: 'mistakes', mode: 'practice', skill: pool[0].skill, count: Math.max(8, Math.min(20, pool.length * 4)), timeLimitMs: null, autoAdvance: s.autoAdvance },
    pool, reviewPool: [],
  };
}
