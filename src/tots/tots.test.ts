import { describe, expect, it } from 'vitest';
import { answer, answerChoices, advance, buildPlan, ceiling, initial, makeTask, meet, nextSkill, noteMiss, record, secure, shaky, SHAKY_LIMIT, statusOf, Step, topMisses, TState, WRITING } from './engine';
import { judge, FREE, TRACE } from '../alef/ink';
import { Pt } from '../alef/letters';
import { ALL_DIGITS, DIGITS, SAY, SKILL, SKILLS, TOTS_AUDIO, LIKE } from './numbers';

const ink = (n: number) => DIGITS[n].strokes.map((s) => s.p);
const wobble = (lines: Pt[][], a = 4): Pt[][] => lines.map((l) => l.map(([x, y], i): Pt => [x + Math.sin(i * 1.7) * a, y + Math.cos(i * 2.3) * a]));
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const withAll = () => SKILLS.reduce((s, k) => meet(s, k.id, 100), initial('א'));

describe('writing digits', () => {
  const nums = Object.keys(DIGITS).map(Number);
  it('accepts every digit drawn well, and with a shaky hand', () => {
    for (const n of nums) {
      expect(judge(ink(n), DIGITS[n], FREE, ALL_DIGITS).ok, String(n)).toBe(true);
      expect(judge(wobble(ink(n)), DIGITS[n], FREE, ALL_DIGITS).ok, `${n} shaky`).toBe(true);
      expect(judge(wobble(ink(n)), DIGITS[n], TRACE, ALL_DIGITS).ok, `${n} trace`).toBe(true);
    }
  }, 60000);
  it('tells every pair of digits apart', () => {
    const passed: string[] = [];
    for (const a of nums) for (const b of nums) if (a !== b && judge(ink(b), DIGITS[a], FREE, ALL_DIGITS).ok) passed.push(`${b}→${a}`);
    expect(passed).toEqual([]);
  }, 60000);
});

describe('what digits look like', () => {
  it('gives every digit a familiar picture, said in every writing task and when it is met', () => {
    for (let n = 0; n <= 10; n++) {
      expect(LIKE[n].pic.length).toBeGreaterThan(0);
      for (const say of [SAY.meet(n), SAY.trace(n), SAY.copy(n), SAY.memory(n), SAY.write(n)]) { expect(say).toContain(LIKE[n].say); expect(TOTS_AUDIO).toContain(say); }
    }
  });
});

describe('the path', () => {
  it('uses only numbers already met, in every skill', () => {
    const seen = new Set<number>();
    for (const s of SKILLS) {
      if (s.kind === 'num') seen.add(s.n);
      else if (s.kind === 'seq' && s.n === 20) expect(seen.has(10)).toBe(true);
      else expect(seen.has(s.n === 3 ? 3 : s.n), s.id).toBe(true);
    }
  });
  it('starts with the number one, shown first', () => {
    const p = buildPlan(initial('א'), 100);
    expect(p.steps[0]).toMatchObject({ t: 'meet', id: 'n1' });
    expect(p.steps.filter((s) => WRITING.includes(s.t)).length).toBe(10);
    expect(p.steps.filter((s) => s.t !== 'meet' && !WRITING.includes(s.t)).length).toBe(20);
  });
  it('mixes kinds of exercise', () => {
    const p = buildPlan(initial('א'), 100, { rnd: seeded(5) }), kinds = p.steps.slice(1).map((s) => WRITING.includes(s.t) ? 'w' : s.t);
    expect(kinds.filter((k, i) => i > 0 && k === kinds[i - 1]).length).toBeLessThan(6);
  });
  it('gives one new thing a day, and holds back while four are shaky', () => {
    let st = meet(initial('א'), 'n1', 100);
    expect(buildPlan(st, 100).steps.some((s) => s.t === 'meet')).toBe(false);
    expect(buildPlan(st, 100, { bonus: true }).steps.some((s) => s.t === 'meet')).toBe(true);
    for (const id of ['n2', 'n3', 'n4']) st = meet(st, id, 100);
    expect(shaky(st).length).toBe(SHAKY_LIMIT);
    expect(buildPlan(st, 101).steps.some((s) => s.t === 'meet')).toBe(false);
  });
  it('makes a number secure only when it is known and written over days', () => {
    let st = meet(initial('א'), 'n1', 100);
    const pass = (s: TState, d: number) => answer(answer(s, 'n1', 'see', true, d), 'n1', 'write', true, d);
    st = pass(st, 100); st = pass(st, 101);
    expect(secure(SKILL.n1, st.skills.n1)).toBe(false);
    st = pass(st, 103);
    expect(secure(SKILL.n1, st.skills.n1)).toBe(true);
  });
  it('reaches the end of the path', () => {
    let st = initial('א'), day = 100;
    for (let g = 0; g < 400 && nextSkill(st); g++, day++) {
      for (const s of buildPlan(st, day).steps) {
        if (s.t === 'meet') st = meet(st, s.id, day);
        else st = answer(st, s.id, WRITING.includes(s.t) ? 'write' : 'see', true, day);
      }
      st = advance(st);
    }
    expect(nextSkill(st)).toBeUndefined();
    expect(day - 100).toBeLessThan(70);
  });
  it('free practice brings nothing new', () => {
    const st = meet(meet(initial('א'), 'n1', 100), 'n2', 100);
    for (const o of [{ warm: true }, { boost: true }]) {
      const p = buildPlan(st, 101, o);
      expect(p.extra).toBe(true); expect(p.steps.some((s) => s.t === 'meet')).toBe(false); expect(p.steps.length).toBeGreaterThan(0);
    }
  });
  it('marks what is hard and remembers the mistakes', () => {
    let st = meet(initial('א'), 'add5', 100);
    for (const ok of [true, false, false, true]) st = record(st, 'add5', 'see', ok);
    st = noteMiss(noteMiss(st, 'add5', '3+2'), 'add5', '3+2');
    expect(statusOf(st, 'add5')).toBe('hard');
    expect(topMisses(st.skills.add5)).toEqual(['3+2']);
    expect(st.skills.add5.see.box).toBe(0);
  });
});

describe('exercises', () => {
  const kinds = (id: string): Step['t'][] => { const s = SKILL[id]; return s.kind === 'num' ? (s.n === 0 ? ['count', 'find'] : ['count', 'find', 'match']) : s.kind === 'seq' ? ['next', 'before'] : s.kind === 'more' ? ['more', 'less'] : s.kind === 'add' ? ['add', 'addEq'] : s.kind === 'sub' ? ['sub', 'subEq'] : ['bond']; };
  it('always offers the right answer, once, with a true sum, and a recording', () => {
    const st = withAll(), rnd = seeded(11);
    for (const s of SKILLS) for (const t of kinds(s.id)) for (let i = 0; i < 80; i++) {
      const k = makeTask(st, { t, id: s.id, n: i }, rnd), where = `${s.id} ${t}`;
      expect(k.options.filter((v) => v === k.answer).length, where).toBe(1);
      expect(new Set(k.options).size, where).toBe(k.options.length);
      expect(k.options.length, where).toBeGreaterThanOrEqual(2);
      expect(TOTS_AUDIO, `${where}: ${k.say}`).toContain(k.say);
      expect(TOTS_AUDIO, `${where}: ${k.rightSay}`).toContain(k.rightSay);
      if (k.op === '+') { expect(k.a! + k.b!).toBe(k.answer); expect(k.answer).toBeLessThanOrEqual(s.n); expect(k.a!).toBeGreaterThan(0); expect(k.b!).toBeGreaterThan(0); }
      if (k.op === '−') { expect(k.a! - k.b!).toBe(k.answer); expect(k.a!).toBeLessThanOrEqual(s.n); expect(k.answer).toBeGreaterThanOrEqual(1); }
      if (k.size) expect(k.filled! + k.answer).toBe(k.size);
      if (k.line) { const gap = k.line.indexOf(null), other = k.line.findIndex((v) => v !== null); expect(k.line[other]! + gap - other, where).toBe(k.answer); }
      for (const v of k.options) expect(TOTS_AUDIO).toContain(SAY.notThis(v));
    }
  }, 60000);
  it('never asks about numbers a child has not met, when counting', () => {
    const st = meet(meet(initial('א'), 'n1', 100), 'n2', 100);
    expect(ceiling(st)).toBe(2);
    for (let i = 0; i < 40; i++) expect(Math.max(...makeTask(st, { t: 'count', id: 'n2', n: i }).options)).toBeLessThanOrEqual(3);
  });
  it('gives close choices in order of size', () => {
    const c = answerChoices(4, 0, 10, () => 0.1);
    expect(c).toEqual([3, 4, 5]);
    expect(answerChoices(0, 0, 3, () => 0.1)).toContain(0);
  });
});
