import { describe, expect, it } from 'vitest';
import { WORDS, WORD, LEVELS } from './words';
import {
  applyPlacement, buildPlan, clozeOf, dayLog, grade, initialState, isKnown, KNOWN_BOX, LEARNING_CAP, freshMetric, newAllowance,
  options, recordRecognition, recordSpelling, spellDiff, State, tileSet, trapsAt, ws, freshWord,
} from './engine';

const T = 20000;

function simulateDay(st: State, day: number, correct: (kind: string) => boolean = () => true): State {
  let s: State = { ...st, plan: buildPlan(st, day) };
  for (const step of s.plan!.steps) {
    if (step.kind === 'intro' || step.kind === 'match') continue;
    if (['tiles', 'gaps', 'type'].includes(step.kind)) s = recordSpelling(s, step.id, correct(step.kind), day);
    else s = recordRecognition(s, step.id, correct(step.kind), day, step.part);
  }
  return s;
}

describe('word bank', () => {
  it('has 8 levels with complete, usable entries', () => {
    expect(LEVELS).toHaveLength(8);
    expect(WORDS.length).toBeGreaterThan(450);
    for (const w of WORDS) {
      expect(w.en, w.id).toMatch(/^[a-z]+$/);
      expect(w.he.length, w.id).toBeGreaterThan(0);
      expect(['n', 'v', 'a', 'd', 'o'], w.id).toContain(w.pos);
      expect(clozeOf(w), `${w.id} must appear in its sentence`).toContain('_____');
    }
  });
  it('ids and words are unique', () => { expect(new Set(WORDS.map((w) => w.en)).size).toBe(WORDS.length); });
  it('every word can produce 4 options with different meanings', () => {
    const st = initialState();
    for (const w of WORDS) {
      const o = options(st, w.id, 4);
      expect(o).toHaveLength(4);
      expect(new Set(o.map((x) => x.he)).size).toBe(4);
      expect(new Set(o.map((x) => x.en)).size, w.id).toBe(4);
    }
  });
});

describe('two independent measures', () => {
  it('a spelling mistake leaves recognition alone, and the reverse', () => {
    const id = 'friend';
    let st = initialState();
    st = { ...st, words: { [id]: { ...freshWord(), met: T, r: { ...freshMetric(), box: 4 }, s: { ...freshMetric(), box: 4 } } } };
    const a = recordSpelling(st, id, false, T);
    expect(ws(a, id).r.box).toBe(4);
    expect(ws(a, id).r.flag).toBe(false);
    expect(ws(a, id).s.flag).toBe(true);
    const b = recordRecognition(st, id, false, T, 'boost');
    expect(ws(b, id).s.box).toBe(4);
    expect(ws(b, id).s.flag).toBe(false);
    expect(ws(b, id).r.flag).toBe(true);
  });
  it('bad spelling never slows new words', () => {
    let st = { ...initialState(), onboarded: true };
    for (let d = 0; d < 10; d++) st = simulateDay(st, T + d, (k) => !['tiles', 'gaps', 'type'].includes(k));
    let good = { ...initialState(), onboarded: true };
    for (let d = 0; d < 10; d++) good = simulateDay(good, T + d);
    const met = (x: State) => WORDS.filter((w) => ws(x, w.id).met !== null).length;
    expect(met(st)).toBe(met(good));
  });
});

describe('promotion and flags', () => {
  it('promotes only once a day', () => {
    let m = freshMetric();
    m = grade(m, true, T); m = grade(m, true, T); m = grade(m, true, T);
    expect(m.box).toBe(1);
  });
  it('a word needs at least 3 separate days to be established', () => {
    let st = initialState();
    const id = 'friend';
    st = recordRecognition(st, id, true, T, 'new');
    expect(isKnown(ws(st, id))).toBe(false);
    st = recordRecognition(st, id, true, T + 1, 'boost');
    expect(isKnown(ws(st, id))).toBe(false);
    st = recordRecognition(st, id, true, T + 3, 'boost');
    expect(ws(st, id).r.box).toBe(KNOWN_BOX);
    expect(isKnown(ws(st, id))).toBe(true);
  });
  it('first wrong answer on a new word is not flagged; later ones are; two good days clear it', () => {
    let st = initialState();
    st = recordRecognition(st, 'friend', false, T, 'new');
    expect(ws(st, 'friend').r.flag).toBe(false);
    st = recordRecognition(st, 'friend', false, T + 1, 'boost');
    expect(ws(st, 'friend').r.flag).toBe(true);
    st = recordRecognition(st, 'friend', true, T + 2, 'boost');
    expect(ws(st, 'friend').r.flag).toBe(true);
    st = recordRecognition(st, 'friend', true, T + 3, 'boost');
    expect(ws(st, 'friend').r.flag).toBe(false);
  });
});

describe('daily plan', () => {
  const placed = () => applyPlacement(initialState(), {}, 3, T);

  it('has three parts in order, and part 3 always exists', () => {
    const plan = buildPlan(placed(), T);
    const parts = plan.steps.map((s) => s.part);
    expect(parts[0]).toBe('warm');
    expect(parts.lastIndexOf('warm')).toBeLessThan(parts.indexOf('new'));
    expect(parts.includes('new')).toBe(true);
    expect(plan.newIds).toHaveLength(4);
  });
  it('first two parts stay short even with a huge backlog', () => {
    let st = placed();
    for (const w of WORDS.slice(0, 120)) st = recordRecognition(st, w.id, false, T - 1, 'boost');
    const plan = buildPlan(st, T);
    expect(plan.steps.filter((s) => s.part !== 'new').length).toBeLessThanOrEqual(13);
    expect(plan.steps.filter((s) => s.part === 'new').length).toBeGreaterThan(0);
  });
  it('closes the gate at the cap and consolidates instead of adding', () => {
    let st = { ...initialState(), onboarded: true };
    const ids = WORDS.slice(0, LEARNING_CAP).map((w) => w.id);
    for (const id of ids) st = recordRecognition(st, id, true, T - 1, 'new');
    expect(newAllowance(st, T)).toBe(0);
    const plan = buildPlan(st, T);
    expect(plan.consolidating).toBe(true);
    expect(plan.newIds.every((id) => ids.includes(id))).toBe(true);
    expect(plan.steps.some((s) => s.part === 'new')).toBe(true);
  });
  it('all-correct pace is 4 new words a day, with the pool never above the cap', () => {
    let st = { ...initialState(), onboarded: true };
    const counts: number[] = [];
    for (let d = 0; d < 14; d++) {
      st = simulateDay(st, T + d);
      counts.push(WORDS.filter((w) => ws(st, w.id).met !== null).length);
      const learning = WORDS.filter((w) => { const x = ws(st, w.id); return x.met !== null && x.r.box < KNOWN_BOX; }).length;
      expect(learning).toBeLessThanOrEqual(LEARNING_CAP);
    }
    expect(counts[13]).toBeGreaterThanOrEqual(40);
  });
  it('a learner who keeps failing recognition gets far fewer new words', () => {
    let st = { ...initialState(), onboarded: true };
    let good = { ...initialState(), onboarded: true };
    for (let d = 0; d < 14; d++) {
      st = simulateDay(st, T + d, (k) => ['tiles', 'gaps', 'type'].includes(k) || (T + d) % 2 === 0 ? true : false);
      good = simulateDay(good, T + d);
    }
    const met = (x: State) => WORDS.filter((w) => ws(x, w.id).met !== null).length;
    expect(met(st)).toBeLessThan(met(good));
  });
  it('no word repeats across parts as different questions', () => {
    const plan = buildPlan(placed(), T);
    const w1 = plan.steps.filter((s) => s.part === 'warm' && s.kind !== 'match').map((s) => s.id);
    expect(new Set(w1).size).toBe(w1.length);
    for (const id of plan.newIds) expect(w1).not.toContain(id);
  });
  it('spelling waits until the word was seen on an earlier day', () => {
    const st = recordRecognition({ ...initialState(), onboarded: true }, 'friend', true, T, 'new');
    const today = buildPlan(st, T);
    expect(today.steps.some((s) => s.id === 'friend' && ['tiles', 'gaps', 'type'].includes(s.kind))).toBe(false);
    const seen = recordRecognition(st, 'friend', true, T + 1, 'boost');
    const later = buildPlan(seen, T + 2);
    expect(later.steps.some((s) => s.id === 'friend' && s.kind === 'tiles')).toBe(true);
  });
});

describe('placement', () => {
  it('assumes recognition below the start level but leaves spelling unmeasured', () => {
    const st = applyPlacement(initialState(), { friend: false }, 2, T);
    const w = ws(st, WORDS.find((x) => x.level === 1)!.id);
    expect(isKnown(w)).toBe(true);
    expect(w.s.ok + w.s.no).toBe(0);
    expect(isKnown(ws(st, 'friend'))).toBe(false);
  });
  it('does not flood the first day with due words', () => {
    const st = applyPlacement(initialState(), {}, 4, T);
    expect(WORDS.filter((w) => ws(st, w.id).met !== null && ws(st, w.id).r.due <= T + 1).length).toBeLessThan(25);
  });
});

describe('spelling helpers', () => {
  it('diff finds the wrong letters', () => {
    expect(spellDiff('friend', 'friend')).toEqual([]);
    expect(spellDiff('friend', 'freind')).not.toEqual([]);
    expect(spellDiff('necessary', 'neccessary').length).toBeGreaterThan(0);
    expect(spellDiff('cat', '')).toEqual([0, 1, 2]);
  });
  it('maps errors to traps', () => {
    expect(trapsAt('necessary', [5])).toContain('double');
    expect(trapsAt('knee', [0])).toContain('silent');
    expect(trapsAt('believe', [3])).toContain('ie');
    expect(trapsAt('cat', [1])).toEqual([]);
  });
  it('tiles rebuild the word', () => {
    for (const w of WORDS) {
      const t = tileSet(w.en, 'tiles');
      expect([...t.letters].sort().join('')).toBe([...w.en].sort().join(''));
      const g = tileSet(w.en, 'gaps');
      const miss = [...w.en].filter((_, i) => !g.given[i]);
      for (const c of miss) expect(g.letters).toContain(c);
    }
  });
});

it('logs each day', () => {
  const st = recordSpelling(recordRecognition(initialState(), 'friend', true, T, 'new'), 'friend', false, T);
  const l = dayLog(st, T);
  expect([l.rOk, l.sNo, l.fresh]).toEqual([1, 1, 1]);
  expect(WORD.friend.he).toBe('חבר');
});
