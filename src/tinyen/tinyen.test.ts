import { describe, expect, it } from 'vitest';
import { advance, answer, buildPlan, huntCells, initial, meet, nextBatch, noteMiss, others, pairCards, secure, shaky, SHAKY_LIMIT, statusOf, topMisses, yesNoPicture } from './engine';
import { ALL_WORDS, BATCHES, EN, TINY_EN_AUDIO, WORD } from './words';

describe('words', () => {
  it('gives each word one meaning and its own picture', () => {
    expect(new Set(ALL_WORDS.map((w) => w.en)).size).toBe(ALL_WORDS.length);
    expect(new Set(ALL_WORDS.map((w) => w.pic)).size).toBe(ALL_WORDS.length);
    expect(ALL_WORDS.length).toBeGreaterThan(70);
  });
  it('teaches at most three words at a time', () => {
    for (const b of BATCHES) { expect(b.words.length).toBeLessThanOrEqual(3); expect(b.words.length).toBeGreaterThan(0); }
  });
  it('has a recording for all a child can hear in English', () => {
    for (const w of ALL_WORDS) for (const t of [w.en, w.ask, EN.yes(w.en)]) expect(TINY_EN_AUDIO).toContain(t);
  });
});

describe('the plan', () => {
  it('starts by meeting three words, then mixed games', () => {
    const p = buildPlan(initial('א'), 100);
    expect(p.steps.slice(0, 3).map((s) => s.t)).toEqual(['meet', 'meet', 'meet']);
    expect(p.steps.length).toBe(27);
    expect(new Set(p.steps.slice(3).map((s) => s.t))).toEqual(new Set(['listen', 'yesno', 'hunt', 'pairs']));
    const kinds = p.steps.slice(3).map((s) => s.t);
    expect(kinds.filter((k, i) => i > 0 && k === kinds[i - 1]).length).toBeLessThan(8);
  });
  it('holds back new words while four groups are shaky, and allows more only on request', () => {
    let st = meet(initial('א'), BATCHES[0].id, 100);
    expect(buildPlan(st, 100).steps.some((s) => s.t === 'meet')).toBe(false);
    expect(buildPlan(st, 100, { bonus: true }).steps.some((s) => s.t === 'meet')).toBe(true);
    for (const b of BATCHES.slice(1, 4)) st = meet(st, b.id, 100);
    expect(shaky(st).length).toBe(SHAKY_LIMIT);
    expect(buildPlan(st, 101).steps.some((s) => s.t === 'meet')).toBe(false);
  });
  it('secures a group only over separate days', () => {
    const id = BATCHES[0].id;
    let st = meet(initial('א'), id, 100);
    st = answer(answer(st, id, true, 100), id, true, 100);
    expect(st.batches[id].see.box).toBe(1);
    st = answer(st, id, true, 101); st = answer(st, id, true, 103);
    expect(secure(st.batches[id])).toBe(true);
  });
  it('free practice moves no stage, yet counts mistakes', () => {
    const id = BATCHES[0].id;
    let st = meet(initial('א'), id, 100);
    const p = buildPlan(st, 101, { boost: true });
    expect(p.extra).toBe(true); expect(p.steps.some((s) => s.t === 'meet')).toBe(false);
    for (let i = 0; i < 4; i++) st = answer(st, id, false, 101, true);
    expect(st.batches[id].see.box).toBe(0); expect(st.batches[id].see.due).toBe(100);
    expect(statusOf(st, id)).toBe('hard');
    expect(topMisses(noteMiss(st, id, 'red').batches[id])).toEqual(['red']);
  });
  it('reaches the end of the words', () => {
    let st = initial('א'), day = 100;
    for (let g = 0; g < 400 && nextBatch(st); g++, day++) {
      for (const s of buildPlan(st, day).steps) st = s.t === 'meet' ? meet(st, s.id, day) : answer(st, s.id, true, day);
      st = advance(st);
    }
    expect(nextBatch(st)).toBeUndefined();
    expect(day - 100).toBeLessThan(90);
  });
});

describe('games', () => {
  const st = meet(initial('א'), BATCHES[0].id, 100), cat = WORD.cat, red = WORD.red;
  it('offers other pictures, never the same one', () => {
    for (const w of ALL_WORDS) { const o = others(st, w, 2); expect(o.length).toBe(2); expect(o.map((x) => x.pic)).not.toContain(w.pic); expect(new Set(o.map((x) => x.pic)).size).toBe(2); }
  });
  it('prefers words from the same group', () => { expect(others(st, red, 2).every((w) => BATCHES[0].words.includes(w))).toBe(true); });
  it('fills a hunt with four to find among twelve, and pairs in twos', () => {
    const h = huntCells(st, cat); expect(h.length).toBe(12); expect(h.filter((c) => c === cat).length).toBe(4);
    const p = pairCards(st, cat); expect(p.length).toBe(6); for (const c of p) expect(p.filter((x) => x === c).length).toBe(2);
  });
  it('tells the truth in the yes or no game', () => {
    for (let i = 0; i < 40; i++) { const y = yesNoPicture(st, cat); expect(y.shown === cat).toBe(y.match); }
  });
});
