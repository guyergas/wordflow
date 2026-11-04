import { describe, expect, it } from 'vitest';
import { parsePitch, pitchId } from '../music/pitch';
import { DEFAULT_SETTINGS, type Attempt } from '../storage/types';
import { stageById, stageItems } from './curriculum';
import { balancedList, evaluateKey, evaluateName, Generator, hint, PoolItem, pitchFromMidi, summarize } from './exercise';
import { buildIndex, getItem, recommend, stageProgress } from './stats';

const S = DEFAULT_SETTINGS;

function seeded(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

const pool = (id: string, skill: 'name' | 'key' = 'name'): PoolItem[] =>
  stageItems(stageById(id)).map((i) => ({ ...i, skill }));

let t = 1_700_000_000_000;
function att(p: Partial<Attempt>): Attempt {
  t += 1000;
  return {
    sessionId: 's', ts: t, skill: 'name', clef: 'treble', pitch: 'C4', answer: 'C', correct: true,
    rtMs: 900, timeLimitMs: null, mode: 'practice', hints: 0, ...p,
  };
}

describe('evaluation', () => {
  const q = { n: 0, skill: 'name' as const, clef: 'treble' as const, pitch: parsePitch('E4'), timeLimitMs: null };
  it('name answers and error types', () => {
    expect(evaluateName(q, 'E').correct).toBe(true);
    expect(evaluateName(q, 'F').error).toBe('adjacent');
    // E4 in treble sits on the bottom line; in bass that line is G.
    expect(evaluateName(q, 'G').error).toBe('clef');
    expect(evaluateName(q, null).error).toBe('timeout');
  });
  it('key answers require the exact octave', () => {
    const k = { ...q, skill: 'key' as const };
    expect(evaluateKey(k, 64).correct).toBe(true);
    expect(evaluateKey(k, 76).error).toBe('octave');
    expect(evaluateKey(k, 65).error).toBe('adjacent');
  });
  it('spells black keys as sharps', () => {
    expect(pitchId(pitchFromMidi(61))).toBe('C#4');
    expect(pitchId(pitchFromMidi(60))).toBe('C4');
  });
});

describe('hints never reveal the target name', () => {
  for (const it_ of pool('m3')) {
    it(`${it_.clef} ${pitchId(it_.pitch)}`, () => {
      const q = { n: 0, skill: 'name' as const, clef: it_.clef, pitch: it_.pitch, timeLimitMs: null };
      for (const l of [1, 2, 3] as const) {
        const h = hint(q, l);
        expect(h.text).not.toMatch(new RegExp(`\\b${pitchId(it_.pitch)}\\b`));
        if (h.anchor) expect(pitchId(h.anchor)).not.toBe(pitchId(it_.pitch));
      }
    });
  }
});

describe('adaptive generator', () => {
  it('never repeats the same note twice in a row', () => {
    const g = new Generator({ mode: 'practice', count: 300, pool: pool('t1'), timeLimitMs: null, adaptiveTime: false, idx: new Map(), settings: S, rng: seeded(3) });
    const h: { q: ReturnType<typeof g.next>; correct: boolean }[] = [];
    for (let i = 0; i < 300; i++) h.push({ q: g.next(h), correct: true });
    for (let i = 1; i < h.length; i++) expect(pitchId(h[i].q.pitch)).not.toBe(pitchId(h[i - 1].q.pitch));
  });

  it('weights weak notes up but keeps strong notes in rotation', () => {
    const attempts: Attempt[] = [];
    for (const p of ['C4', 'D4', 'E4', 'G4']) for (let i = 0; i < 20; i++) attempts.push(att({ pitch: p, answer: p[0] }));
    for (let i = 0; i < 20; i++) attempts.push(att({ pitch: 'F4', correct: i % 2 === 0, answer: i % 2 ? 'G' : 'F', error: i % 2 ? 'adjacent' : undefined }));
    const idx = buildIndex(attempts, S);
    const g = new Generator({ mode: 'practice', count: 10_000, pool: pool('t1'), timeLimitMs: null, adaptiveTime: false, idx, settings: S, rng: seeded(7) });
    const counts: Record<string, number> = {};
    const h: { q: ReturnType<typeof g.next>; correct: boolean }[] = [];
    for (let i = 0; i < 3000; i++) {
      const q = g.next(h, t);
      h.push({ q, correct: true });
      counts[pitchId(q.pitch)] = (counts[pitchId(q.pitch)] ?? 0) + 1;
    }
    expect(counts.F4).toBeGreaterThan(counts.C4 * 1.5);
    for (const p of ['C4', 'D4', 'E4', 'G4']) expect(counts[p]).toBeGreaterThan(3000 * 0.08);
  });

  it('adapts time limits only for stable items', () => {
    const attempts: Attempt[] = [];
    for (let i = 0; i < 10; i++) attempts.push(att({ pitch: 'C4', rtMs: 1000 }));
    const idx = buildIndex(attempts, S);
    const g = new Generator({ mode: 'practice', count: 50, pool: [{ skill: 'name', clef: 'treble', pitch: parsePitch('C4') }, { skill: 'name', clef: 'treble', pitch: parsePitch('D4') }], timeLimitMs: null, adaptiveTime: true, idx, settings: S, rng: seeded(2) });
    const h: { q: ReturnType<typeof g.next>; correct: boolean }[] = [];
    for (let i = 0; i < 20; i++) h.push({ q: g.next(h), correct: true });
    expect(h.filter((x) => pitchId(x.q.pitch) === 'C4').every((x) => x.q.timeLimitMs === 2200)).toBe(true);
    expect(h.filter((x) => pitchId(x.q.pitch) === 'D4').every((x) => x.q.timeLimitMs === null)).toBe(true);
  });

  it('test lists are balanced with no back-to-back repeats', () => {
    const list = balancedList(pool('t1'), 25, seeded(5));
    expect(list).toHaveLength(25);
    const c: Record<string, number> = {};
    list.forEach((x) => (c[pitchId(x.pitch)] = (c[pitchId(x.pitch)] ?? 0) + 1));
    expect(Object.values(c).every((v) => v === 5)).toBe(true);
    for (let i = 1; i < list.length; i++) expect(pitchId(list[i].pitch)).not.toBe(pitchId(list[i - 1].pitch));
  });
});

describe('progress tracking', () => {
  it('trouble in one clef does not touch the other clef', () => {
    const attempts: Attempt[] = [];
    for (const it_ of pool('t1')) for (let i = 0; i < 8; i++) attempts.push(att({ clef: 'treble', pitch: pitchId(it_.pitch) }));
    const before = stageProgress(stageById('t1'), 'name', buildIndex(attempts, S), [], S);
    for (let i = 0; i < 30; i++) attempts.push(att({ clef: 'bass', pitch: 'A3', correct: false, answer: 'C', error: 'clef' }));
    const after = stageProgress(stageById('t1'), 'name', buildIndex(attempts, S), [], S);
    expect(after).toEqual(before);
    expect(before.status).toBe('ready');
  });

  it('knowledge and fluency are tracked separately', () => {
    const idx = buildIndex([att({ rtMs: 5000 }), att({ rtMs: 5000 }), att({ rtMs: 5000 })], S);
    const it_ = getItem(idx, 'name', 'treble', 'C4');
    expect(it_.acc).toBeGreaterThan(0.75);
    expect(it_.medianRt).toBe(5000);
  });

  it('recommends the first stage, then a test once ready', () => {
    expect(recommend(new Map(), [], S)).toMatchObject({ stageId: 't1', action: 'practice' });
    const attempts: Attempt[] = [];
    for (const it_ of pool('t1')) for (let i = 0; i < 8; i++) attempts.push(att({ pitch: pitchId(it_.pitch) }));
    expect(recommend(buildIndex(attempts, S), [], S)).toMatchObject({ stageId: 't1', action: 'test' });
  });

  it('summary computes pass/fail from accuracy and median speed', () => {
    const fast = Array.from({ length: 20 }, (_, i) => att({ correct: i !== 0, rtMs: 900 }));
    expect(summarize(fast, S, true).passed).toBe(true);
    const slow = Array.from({ length: 20 }, () => att({ rtMs: 3500 }));
    expect(summarize(slow, S, true).passed).toBe(false);
    expect(summarize(fast, S).score).toBeGreaterThan(summarize(slow, S).score);
  });
});

describe('regressions', () => {
  it('error streaks do not lock a brand-new learner onto the first notes', () => {
    const g = new Generator({ mode: 'practice', count: 400, pool: pool('t2'), timeLimitMs: null, adaptiveTime: false, idx: new Map(), settings: S, rng: seeded(11) });
    const h: { q: ReturnType<typeof g.next>; correct: boolean }[] = [];
    for (let i = 0; i < 400; i++) h.push({ q: g.next(h), correct: false });
    const seen = new Set(h.map((x) => pitchId(x.q.pitch)));
    expect(seen.size).toBe(8);
  });

  it('easy win comes once per error streak, from a note the learner knows', () => {
    const attempts: Attempt[] = [];
    for (let i = 0; i < 12; i++) attempts.push(att({ pitch: 'E4', answer: 'E', rtMs: 700 }));
    const idx = buildIndex(attempts, S);
    const g = new Generator({ mode: 'practice', count: 50, pool: pool('t1'), timeLimitMs: null, adaptiveTime: false, idx, settings: S, rng: seeded(4) });
    const h: { q: ReturnType<typeof g.next>; correct: boolean }[] = [];
    h.push({ q: g.next(h), correct: false });
    h.push({ q: g.next(h), correct: false });
    const third = g.next(h);
    expect(pitchId(third.pitch)).toBe('E4');
  });
});

describe('sharps and flats', () => {
  const q = (p: string) => ({ n: 0, skill: 'name' as const, clef: 'treble' as const, pitch: parsePitch(p), timeLimitMs: null });
  it('a black-key button accepts both spellings', () => {
    expect(evaluateName(q('F#4'), 'F#').correct).toBe(true);
    expect(evaluateName(q('Gb4'), 'F#').correct).toBe(true);
    expect(evaluateName(q('Db4'), 'C#').correct).toBe(true);
    expect(evaluateName(q('Bb4'), 'A#').correct).toBe(true);
  });
  it('flags ♯/♭ mistakes separately', () => {
    expect(evaluateName(q('F#4'), 'F').error).toBe('accidental');
    expect(evaluateName(q('Gb4'), 'G').error).toBe('accidental');
    expect(evaluateName(q('F4'), 'F#').error).toBe('accidental');
    expect(evaluateName(q('E4'), 'D#').error).toBe('accidental'); // D♯/E♭ button for E natural
    expect(evaluateName(q('F#4'), 'G#').error).toBe('adjacent');
  });
  it('keyboard: missing the black key is an accidental error', () => {
    const k = (p: string) => ({ ...q(p), skill: 'key' as const });
    expect(evaluateKey(k('F#4'), 66).correct).toBe(true);
    expect(evaluateKey(k('Gb4'), 66).correct).toBe(true);
    expect(evaluateKey(k('F#4'), 65).error).toBe('accidental');
    expect(evaluateKey(k('Bb4'), 71).error).toBe('accidental');
  });
  it('accidental stages contain the right spellings and nothing odd', () => {
    const ids = stageItems(stageById('a1')).map((i) => pitchId(i.pitch));
    expect([...ids].sort()).toEqual(['C4', 'C#4', 'D4', 'Db4', 'D#4', 'E4', 'Eb4', 'F4', 'F#4', 'G4', 'Gb4', 'G#4', 'A4', 'Ab4', 'A#4', 'B4', 'Bb4', 'C5'].sort());
    expect(ids.some((x) => /^(Cb|Fb|E#|B#)/.test(x))).toBe(false);
  });
});
