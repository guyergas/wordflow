import { describe, expect, it } from 'vitest';
import { diatonic, parsePitch, pitchId } from '../music/pitch';
import { DEFAULT_SETTINGS, type Attempt } from '../storage/types';
import { confusionPlan, confusions, coupleChallenge, dailyPlan, endingPhrase, listenQuestion, weekSummary, weeklyCheckDue } from './extras';

const S = DEFAULT_SETTINGS;
function seeded(seed = 1) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
let t = Date.now() - 1000 * 60 * 60;
const att = (p: Partial<Attempt>): Attempt => ({ sessionId: 's', ts: (t += 1000), skill: 'name', clef: 'treble', pitch: 'C4', answer: 'C', correct: true, rtMs: 900, timeLimitMs: null, mode: 'practice', hints: 0, ...p });

describe('daily plan', () => {
  it('has four timed blocks adding up to 10 minutes, for every mood', () => {
    for (const mood of ['new', 'strengthen', 'play'] as const) {
      const plans = dailyPlan(mood, new Map(), [], S);
      expect(plans).toHaveLength(4);
      expect(plans.reduce((a, p) => a + (p.config.timeBudgetMs ?? 0), 0)).toBe(10 * 60_000);
      plans.forEach((p, i) => expect(p.config.daily).toEqual({ index: i, total: 4 }));
    }
    expect(dailyPlan('play', new Map(), [], S).some((p) => p.config.mode === 'test')).toBe(false);
  });
});

describe('hear and find', () => {
  it('offers the target and two close positions, all different', () => {
    const pool = ['C4', 'D4', 'E4', 'F4', 'G4'].map((p) => ({ clef: 'treble' as const, pitch: parsePitch(p) }));
    for (let s = 1; s < 50; s++) {
      const q = listenQuestion(pool, seeded(s));
      const ids = q.options.map(pitchId);
      expect(new Set(ids).size).toBe(3);
      expect(ids).toContain(pitchId(q.target));
      for (const o of q.options) expect(Math.abs(diatonic(o) - diatonic(q.target))).toBeLessThanOrEqual(2);
    }
  });
});

describe('mistakes workshop', () => {
  it('finds repeated confusions and builds a focused drill on both notes', () => {
    const attempts = [
      att({ pitch: 'E4', answer: 'G', correct: false, error: 'clef' }),
      att({ pitch: 'E4', answer: 'G', correct: false, error: 'clef' }),
      att({ pitch: 'F4', answer: 'E', correct: false, error: 'adjacent' }),
    ];
    const c = confusions(attempts);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ target: 'E4', answer: 'G', count: 2, kind: 'clef' });
    const plan = confusionPlan(c[0], S);
    const ids = plan.pool.map((p) => pitchId(p.pitch));
    expect(ids).toContain('E4');
    expect(ids).toContain('G4');
  });
});

describe('weekly', () => {
  it('summarises the week and spots the most improved note', () => {
    const now = Date.now();
    const lastWeek = now - 8 * 86_400_000;
    const a: Attempt[] = [];
    for (let i = 0; i < 5; i++) a.push(att({ ts: lastWeek + i, pitch: 'F4', rtMs: 3000 }));
    for (let i = 0; i < 5; i++) a.push(att({ ts: now - 1000 + i, pitch: 'F4', rtMs: 1200 }));
    const w = weekSummary(a, [], now);
    expect(w.notes).toBe(5);
    expect(w.improved?.pitch).toBe('F4');
  });
  it('the reading check is due once per week after a few sessions', () => {
    expect(weeklyCheckDue([])).toBe(false);
  });
});

describe('couple challenge and musical ending', () => {
  it('is identical for everyone on the same day', () => {
    const a = coupleChallenge(Date.parse('2026-10-27T10:00:00'));
    const b = coupleChallenge(Date.parse('2026-10-27T20:00:00'));
    expect(a.seed).toBe(b.seed);
    expect(a.pool.map((p) => pitchId(p.pitch))).toEqual(b.pool.map((p) => pitchId(p.pitch)));
    expect(a.config.couple).toBe(true);
  });
  it('the ending phrase uses only practised notes and fills two bars', () => {
    const attempts = ['C4', 'E4', 'G4', 'E4', 'C4'].map((p) => att({ pitch: p }));
    const ph = endingPhrase(attempts, 42)!;
    expect(ph.notes.reduce((a, n) => a + n.beats, 0)).toBe(8);
    for (const n of ph.notes) expect(['C4', 'E4', 'G4']).toContain(pitchId(n.pitch!));
  });
});
