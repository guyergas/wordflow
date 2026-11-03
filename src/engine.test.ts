import { describe, expect, it } from 'vitest';
import { WORDS, WORD, LEVELS } from './words';
import { classified, recordSentence, SENTENCES, sentencePlan, tokens, unknownWords } from './sentences';
import {
  applyPlacement, buildPlan, clozeOf, dayLog, grade, initialState, isKnown, KNOWN_BOX, LEARNING_CAP, freshMetric, newAllowance,
  spellingPlan, practicePlan, restorePaused, options, recordRecognition, resolveCheck, nextNewWords, buildPlan as bp, recordSpelling, givenLetters, spellAlign, spellDiff, State, tileSet, trapsAt, ws, freshWord,
} from './engine';

const T = 20000;

function simulateDay(st: State, day: number, correct: (kind: string) => boolean = () => true): State {
  let s: State = { ...st, plan: buildPlan(st, day) };
  for (let i = 0; i < s.plan!.steps.length; i++) {
    const step = s.plan!.steps[i];
    s = { ...s, plan: { ...s.plan!, at: i } };
    if (step.kind === 'check') { s = resolveCheck(s, step.id, false, day); continue; }
    if (step.kind === 'intro' || step.kind === 'match') continue;
    if (['tiles', 'gaps', 'memo', 'type'].includes(step.kind)) s = recordSpelling(s, step.id, correct(step.kind), day);
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
    for (let d = 0; d < 10; d++) st = simulateDay(st, T + d, (k) => !['tiles', 'gaps', 'memo', 'type'].includes(k));
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
    expect(plan.steps.filter((s) => s.part !== 'new').length).toBeLessThanOrEqual(14);
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
      st = simulateDay(st, T + d, (k) => ['tiles', 'gaps', 'memo', 'type'].includes(k) || (T + d) % 2 === 0 ? true : false);
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
    expect(today.steps.some((s) => s.id === 'friend' && ['tiles', 'gaps', 'memo', 'type'].includes(s.kind))).toBe(false);
    const seen = recordRecognition(st, 'friend', true, T + 1, 'boost');
    const later = buildPlan(seen, T + 2);
    expect(later.steps.some((s) => s.id === 'friend' && s.kind === 'gaps')).toBe(true);
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

describe('truly new words', () => {
  const start = (extra = {}): State => { const st = { ...initialState(), onboarded: true }; return { ...st, plan: bp(st, T, extra) }; };
  const at = (s: State, kind: string): State => ({ ...s, plan: { ...s.plan!, at: s.plan!.steps.findIndex((x) => x.kind === kind) } });

  it('a word she already knows is replaced by another in the same round', () => {
    let s = at(start(), 'check');
    const first = s.plan!.newIds[0];
    s = resolveCheck(s, first, true, T);
    expect(s.plan!.newIds).not.toContain(first);
    expect(s.plan!.newIds).toHaveLength(4);
    expect(s.plan!.alreadyKnown).toEqual([first]);
    expect(isKnown(ws(s, first))).toBe(true);
    expect(ws(s, first).s.ok + ws(s, first).s.no).toBe(0);
    expect(ws(s, first).r.due).toBe(T + 3);
  });
  it('practice steps are only for words that really are new', () => {
    let s = start();
    const known = s.plan!.newIds[0];
    for (let i = 0; i < s.plan!.steps.length; i++) {
      const step = s.plan!.steps[i];
      if (step.kind !== 'check') continue;
      s = { ...s, plan: { ...s.plan!, at: i } };
      s = resolveCheck(s, step.id, step.id === known, T);
    }
    const meaning = s.plan!.steps.filter((x) => x.kind === 'meaning').map((x) => x.id);
    expect(meaning).toHaveLength(4);
    expect(meaning).not.toContain(known);
    expect(s.plan!.steps.filter((x) => x.kind === 'check')).toHaveLength(5);
    expect(s.plan!.steps.at(-1)!.kind).toBe('match');
  });
  it('a known word does not fill the new-words pool', () => {
    let s = at(start(), 'check');
    for (const id of [...s.plan!.newIds]) s = resolveCheck(s, id, true, T);
    expect(newAllowance(s, T)).toBe(4);
  });
});

describe('extra rounds of new words', () => {
  it('a bonus round brings 4 more words and only a short review', () => {
    let st: State = { ...initialState(), onboarded: true };
    st = simulateDay(st, T);
    const metBefore = nextNewWords(st, 1)[0].id;
    const plan = bp(st, T, { bonus: true });
    expect(plan.newIds).toHaveLength(4);
    expect(plan.newIds[0]).toBe(metBefore);
    expect(plan.steps.filter((x) => x.part === 'warm')).toHaveLength(0);
    expect(plan.steps.filter((x) => x.part === 'boost').length).toBeLessThanOrEqual(4);
  });
  it('extra rounds raise the pace, and the recognition gate still holds', () => {
    let st: State = { ...initialState(), onboarded: true };
    let one: State = { ...initialState(), onboarded: true };
    const met = (x: State) => WORDS.filter((w) => ws(x, w.id).met !== null).length;
    const pool = (x: State) => WORDS.filter((w) => { const y = ws(x, w.id); return y.met !== null && y.r.box < KNOWN_BOX; }).length;
    const round = (x: State, day: number, opts: object) => {
      let s: State = { ...x, plan: bp(x, day, opts) };
      for (let i = 0; i < s.plan!.steps.length; i++) {
        const step = s.plan!.steps[i];
        s = { ...s, plan: { ...s.plan!, at: i } };
        if (step.kind === 'check') s = resolveCheck(s, step.id, false, day);
        else if (['tiles', 'gaps', 'memo', 'type'].includes(step.kind)) s = recordSpelling(s, step.id, true, day);
        else if (step.kind !== 'intro' && step.kind !== 'match') s = recordRecognition(s, step.id, true, day, step.part);
      }
      return s;
    };
    for (let d = 0; d < 21; d++) {
      one = round(one, T + d, {});
      st = round(st, T + d, {});
      for (let r = 0; r < 2 && newAllowance(st, T + d) > 0; r++) st = round(st, T + d, { bonus: true });
      expect(pool(st)).toBeLessThanOrEqual(LEARNING_CAP);
    }
    expect(met(st)).toBeGreaterThan(met(one));
  });
});

describe('sentences', () => {
  it('every word in every sentence is classified', () => {
    const bad = SENTENCES.flatMap((s) => tokens(s.en).filter((t) => !classified(t)).map((t) => `${t} (${s.en})`));
    expect(bad).toEqual([]);
  });
  it('unique sentences with translations', () => {
    expect(SENTENCES.length).toBeGreaterThanOrEqual(80);
    expect(new Set(SENTENCES.map((s) => s.en)).size).toBe(SENTENCES.length);
    for (const s of SENTENCES) expect(s.he.length).toBeGreaterThan(0);
  });
  it('prefers sentences made only of words she knows', () => {
    const st = applyPlacement(initialState(), {}, 1, T);
    const plan = sentencePlan(st, T);
    expect(plan).toHaveLength(6);
    for (const s of plan) expect(unknownWords(st, s)).toEqual([]);
  });
  it('falls back to the fewest unfamiliar words, and reviews come first', () => {
    const st = initialState();
    const counts = sentencePlan(st, T).map((s) => unknownWords(st, s).length);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    const after = recordSentence(st, 's3', false, T);
    expect(sentencePlan(after, T + 1)[0].id).toBe('s3');
  });
  it('sentence results do not touch word measures', () => {
    const st = recordRecognition(initialState(), 'friend', true, T, 'new');
    const after = recordSentence(st, 's3', false, T);
    expect(ws(after, 'friend')).toEqual(ws(st, 'friend'));
  });
});

describe('free practice', () => {
  const learned = () => {
    let st: State = applyPlacement(initialState(), {}, 1, T - 10);
    st = { ...st, plan: bp(st, T) };
    for (const id of ['knight', 'castle', 'sword']) st = recordRecognition(st, id, true, T, 'new');
    return st;
  };
  it("includes today's words together with older ones", () => {
    const ids = practicePlan(learned(), T).steps.map((x) => x.id);
    expect(ids).toHaveLength(10);
    expect(ids).toEqual(expect.arrayContaining(['knight', 'castle', 'sword']));
    expect(ids.some((id) => !['knight', 'castle', 'sword'].includes(id))).toBe(true);
    expect(new Set(ids).size).toBe(10);
  });
  it('does not rush a word through the gate', () => {
    let st = learned();
    for (let i = 0; i < 5; i++) st = recordRecognition(st, 'knight', true, T, 'boost');
    expect(ws(st, 'knight').r.box).toBe(1);
  });
  it("a slip on a word met today does not mark it", () => {
    const st = recordRecognition(learned(), 'knight', false, T, 'boost');
    expect(ws(st, 'knight').r.flag).toBe(false);
    expect(ws(st, 'knight').r.box).toBe(1);
    const sp = recordSpelling(learned(), 'knight', false, T);
    expect(ws(sp, 'knight').s.flag).toBe(false);
  });
  it('an unfinished round comes back after practice', () => {
    const st = learned();
    const held = { ...st, paused: st.plan, plan: practicePlan(st, T) };
    const back = restorePaused(held);
    expect(back.plan).toBe(st.plan);
    expect(back.paused).toBeNull();
  });
  it('has nothing to practice before any word was met', () => {
    expect(practicePlan(initialState(), T).steps).toHaveLength(0);
  });
});

describe('spelling round', () => {
  it('starts with known words and shows them before hiding', () => {
    const st = applyPlacement(initialState(), {}, 1, T - 5);
    const plan = spellingPlan(st, T);
    expect(plan.steps).toHaveLength(8);
    expect(plan.steps.every((x) => x.kind === 'memo')).toBe(true);
    expect(plan.steps.every((x) => isKnown(ws(st, x.id)))).toBe(true);
    expect(plan.extra).toBe(true);
  });
  it('words marked for spelling come first, stronger words are written from sound', () => {
    let st = applyPlacement(initialState(), {}, 1, T - 5);
    st = recordSpelling(st, 'music', false, T - 1);
    st = { ...st, words: { ...st.words, friend: { ...ws(st, 'friend'), s: { ...freshMetric(), box: 4, ok: 3, due: T } } } };
    const plan = spellingPlan(st, T);
    expect(plan.steps[0].id).toBe('music');
    expect(plan.steps.find((x) => x.id === 'friend')?.kind).toBe('type');
  });
  it('spelling results leave recognition alone', () => {
    const st = applyPlacement(initialState(), {}, 1, T - 5);
    const after = recordSpelling(st, 'friend', false, T);
    expect(ws(after, 'friend').r).toEqual(ws(st, 'friend').r);
  });
  it('still offers something early on, from words being learned', () => {
    const st = recordRecognition(initialState(), 'friend', true, T, 'new');
    expect(spellingPlan(st, T).steps.map((x) => x.id)).toEqual(['friend']);
  });
});

describe('pointing at the right letters', () => {
  it('swapped letters mark both, and nothing else', () => {
    expect(spellAlign('friend', 'freind')).toEqual({ target: [2, 3], typed: [2, 3] });
  });
  it('one wrong letter marks just that letter', () => {
    expect(spellAlign('friend', 'friemd')).toEqual({ target: [4], typed: [4] });
    expect(spellAlign('friend', 'friena')).toEqual({ target: [5], typed: [5] });
  });
  it('a missing letter marks the letter that is missing', () => {
    expect(spellAlign('friend', 'frend').target).toEqual([2]);
  });
  it('an extra letter marks the extra typed letter', () => {
    expect(spellAlign('cat', 'catt').typed.length).toBe(1);
    expect(spellAlign('cat', 'catt').target.length).toBe(1);
  });
});

describe('letters fade as the word gets stronger', () => {
  const hidden = (w: string, box: number) => givenLetters(w, box).filter((g) => !g).length;
  it('hides more letters at each level, and all of them at the end', () => {
    for (const w of ['friend', 'beautiful', 'responsibility']) {
      expect(hidden(w, 0)).toBeLessThan(hidden(w, 1));
      expect(hidden(w, 1)).toBeLessThan(hidden(w, 2));
      expect(hidden(w, 2)).toBeLessThan(hidden(w, 3));
      expect(hidden(w, 3)).toBe(w.length);
    }
  });
  it('a first try on a word leaves most letters and the first one', () => {
    for (let i = 0; i < 30; i++) {
      const g = givenLetters('friend', 0);
      expect(g[0]).toBe(true);
      expect(g.filter(Boolean).length).toBeGreaterThanOrEqual(4);
    }
  });
  it('works for every word at every level, always asking for at least one letter', () => {
    for (const w of WORDS) for (const box of [0, 1, 2, 3]) expect(hidden(w.en, box)).toBeGreaterThan(0);
  });
  it('a new spelling word never starts as a full scramble', () => {
    const st = recordRecognition(initialState(), 'friend', true, T - 2, 'new');
    const t = tileSet('friend', 'gaps', undefined, ws(st, 'friend').s.box);
    expect(t.letters.length).toBeLessThan(6);
    expect(t.given.filter(Boolean).length).toBeGreaterThanOrEqual(4);
  });
});
