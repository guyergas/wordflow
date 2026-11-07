import { describe, expect, it } from 'vitest';
import { seeded, SKILLS, STATIONS, DOMAINS, TRAPS, Question } from './skills';
import { GRADE5_FLOOR, outgrown, advance, answerPlacement, applyPlacement, buildPlan, checkTyped, hintFor, initialMath, isChoiceRight, isOpen, isLearning, makeQuestion, MathState, nextNew, parseValue, placementDone, placementStep, queueRetry, recordAnswer, sameValue, shown, ss, startPlacement, PACE } from './engine';

const T = 20000;
const RUNS = 400;

const plain = (s: string) => s.replace(/\[\[|\]\]/g, '');
/** Works out an expression on its own, without using the code that made the answer. */
function evaluate(raw: string): number {
  const t = raw.replace(/,/g, '').replace(/(\d+)\/(\d+)/g, '($1/$2)').replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-').replace(/\s/g, '');
  if (!/^[\d+\-*/%().]+$/.test(t)) throw new Error(`cannot read ${raw}`);
  return new Function(`return (${t})`)() as number;
}
const num = (a: string) => { const v = parseValue(a); if (!v) throw new Error(`bad answer ${a}`); return v.n / v.d; };

function verify(q: Question, id: string) {
  const big = q.big ? plain(q.big) : '';
  if (q.concept) return;
  if (q.eq) { expect(evaluate(q.eq), `${id}: ${q.prompt}`).toBeCloseTo(num(q.answer), 8); return; }
  if (big.includes('▢') && big.includes('=')) {
    const [l, r] = big.replace('▢', q.answer).split('=');
    expect(evaluate(l), `${id}: ${big}`).toBeCloseTo(evaluate(r), 8);
    return;
  }
  if (big.includes('▢')) {
    const [l, r] = big.split('▢');
    const a = evaluate(l), b = evaluate(r);
    expect(q.answer, `${id}: ${big}`).toBe(a > b ? '>' : a < b ? '<' : '=');
    return;
  }
  expect(evaluate(big), `${id}: ${big}`).toBeCloseTo(num(q.answer), 8);
}

describe('every generated question', () => {
  for (const s of SKILLS) {
    for (const m of ['u', 'e'] as const) {
      if (!s[m]) continue;
      it(`${s.id}/${m}`, () => {
        for (let seed = 1; seed <= RUNS; seed++) {
          for (const mode of ['choice', 'type'] as const) {
            const q = makeQuestion({ skill: s.id, measure: m, seed, support: true, mode });
            verify(q, s.id);
            expect(q.steps.length, s.id).toBeGreaterThan(0);
            expect(JSON.stringify(q)).not.toMatch(/undefined|NaN|Infinity/);
            for (const [v, t] of q.wrong ?? []) { if (t) expect(TRAPS[t]).toBeTruthy(); expect(sameValue(v, q.answer) && !q.exact, `${s.id}: wrong answer equals the answer in ${q.big ?? q.prompt}: ${v}`).toBe(false); }
            if (q.choices) {
              expect(new Set(q.choices.map((c) => plain(c.label))).size, `${s.id}: duplicate choices ${JSON.stringify(q.choices)}`).toBe(q.choices.length);
              expect(q.choices.length, s.id).toBeGreaterThanOrEqual(2);
              expect(q.choices.filter((c) => isChoiceRight(q, c.label)).length, `${s.id}: ${JSON.stringify(q)}`).toBe(1);
            } else {
              expect(checkTyped(q, q.answer), `${s.id}: ${q.answer}`).toBe(true);
            }
          }
        }
      });
      it(`${s.id}/${m}: the hint shows other numbers`, () => {
        for (let seed = 1; seed <= 60; seed++) {
          const step = { skill: s.id, measure: m, seed };
          const q = makeQuestion({ ...step, support: true, mode: 'type' });
          const h = hintFor(step, q);
          expect(JSON.stringify([h.big, h.prompt, h.fig]) !== JSON.stringify([q.big, q.prompt, q.fig]), s.id).toBe(true);
          if (!q.concept) expect(sameValue(h.answer, q.answer), `${s.id}: ${h.big} and ${q.big}`).toBe(false);
        }
      });
    }
  }
});

describe('content map', () => {
  it('prerequisites exist, come earlier, and nothing is stuck', () => {
    const seen = new Set<string>();
    for (const s of SKILLS) { for (const n of s.needs) expect(seen.has(n), `${s.id} needs ${n}`).toBe(true); seen.add(s.id); }
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length);
  });
  it('every station has at least four skills to test', () => {
    for (const st of STATIONS) expect(SKILLS.filter((s) => s.station === st.id).length, st.name).toBeGreaterThanOrEqual(4);
    expect(DOMAINS).toHaveLength(3);
  });
  it('the words shown to a child never mention a grade', () => {
    for (const s of [...STATIONS, ...SKILLS]) expect(JSON.stringify({ a: (s as { name?: string }).name, b: (s as { title?: string }).title })).not.toMatch(/כיתה/);
  });
});

describe('answers', () => {
  const base: Question = { measure: 'e', prompt: '', answer: '1/2', steps: ['x'] };
  it('accepts equal values in another form', () => {
    expect(checkTyped(base, '0.5')).toBe(true);
    expect(checkTyped(base, '2/4')).toBe(true);
    expect(checkTyped(base, '.5')).toBe(true);
    expect(checkTyped(base, '1/3')).toBe(false);
    expect(checkTyped(base, '')).toBe(false);
    expect(checkTyped(base, '1/0')).toBe(false);
    expect(checkTyped({ ...base, answer: '1234' }, '1,234')).toBe(true);
  });
  it('asks for the reduced form when the question says so', () => {
    expect(checkTyped({ ...base, exact: true }, '2/4')).toBe(false);
    expect(checkTyped({ ...base, exact: true }, '1/2')).toBe(true);
  });
  it('never wraps math twice', () => { expect(shown('[[1/2]]')).toBe('[[1/2]]'); expect(shown('מאיות')).toBe('מאיות'); });
  it('recognizes a choice shown as math', () => { expect(isChoiceRight({ ...base, answer: '1234' }, shown('1234'))).toBe(true); });
});

describe('placement', () => {
  const run = (answers: (station: number) => boolean | 'notyet') => {
    let p = startPlacement(5);
    for (let i = 0; i < 200 && !placementDone(p); i++) { makeQuestion(placementStep(p)); p = answerPlacement(p, answers(p.station)); }
    expect(placementDone(p)).toBe(true);
    return p;
  };
  it('stops each area separately', () => {
    const p = run((s) => (s === 1 ? true : s === 2 ? false : s < 5 ? true : s === 5 ? false : true));
    expect(p.start).toEqual({ num: 2, frac: 5, shape: 9 });
  });
  it('a learner who passes everything goes all the way', () => { expect(run(() => true).start).toEqual({ num: 11, frac: 7, shape: 9 }); });
  it('checks again before stopping: one bad round is not enough', () => {
    let p = startPlacement(5);
    [false, false, false, false].forEach((a) => { p = answerPlacement(p, a); });
    expect([p.station, p.round, p.d]).toEqual([1, 1, 0]);
    [true, true, true, false].forEach((a) => { p = answerPlacement(p, a); });
    expect(p.station).toBe(2);
  });
  it('not yet stops the area right away and is not a mistake', () => {
    const p = answerPlacement(startPlacement(5), 'notyet');
    expect(p.start.num).toBe(1);
    expect(p.d).toBe(1);
  });
  it('passed skills become known on condition, and a low start sets a calm pace', () => {
    const st = applyPlacement(initialMath(), { ...startPlacement(1), start: { num: 2, frac: 4, shape: 7 } }, T);
    expect(ss(st, 'add100').assumed).toBe(true);
    expect(ss(st, 'mulmean').met).toBe(null);
    expect(ss(st, 'fracmean').met).toBe(null);
    expect(st.settings.pace).toBe('calm');
    expect(nextNew(st)?.id).toBe('mulmean');
  });
  it('placement questions show no helping picture by default', () => { expect(placementStep(startPlacement(1)).support).toBe(false); });
  it('every question marked for paper has a hint with other numbers, in the run too', () => {
    for (const s of SKILLS) for (const m of ['u', 'e'] as const) { if (!s[m]) continue; for (let seed = 1; seed < 40; seed++) {
      const step = { skill: s.id, measure: m, seed }, q = makeQuestion({ ...step, support: false, mode: 'type' });
      expect(q.pencil, s.id).toBe(true);
      if (q.pencil) expect(hintFor(step, q).steps.length, s.id).toBeGreaterThan(0);
    } }
  });
});

function doDay(st: MathState, day: number, ok: (id: string) => boolean = () => true): MathState {
  let s: MathState = { ...st, plan: buildPlan(st, day) };
  for (let guard = 0; s.plan && s.plan.at < s.plan.steps.length && guard < 80; guard++) {
    const step = s.plan.steps[s.plan.at];
    const correct = ok(step.skill);
    s = recordAnswer(s, step, { correct, hinted: false }, day);
    if (!correct) s = queueRetry(s, step);
    s = advance(s);
  }
  return s;
}

describe('daily plan and pace', () => {
  const started = (): MathState => applyPlacement(initialMath(), { ...startPlacement(1), start: { num: 1, frac: 4, shape: 7 } }, T - 1);
  it('teaches in order: example, then partly solved, then alone', () => {
    const kinds = buildPlan(started(), T).steps.filter((s) => s.part === 'new').map((s) => s.kind);
    expect(kinds[0]).toBe('worked');
    expect(kinds[1]).toBe('partial');
    expect(kinds.at(-1)).toBe('solve');
  });
  it('a closed skill stays closed until what it needs is settled', () => {
    const st = started();
    expect(isOpen(st, SKILLS.find((s) => s.id === 'sub100')!)).toBe(false);
  });
  it('never holds more skills in progress than the pace allows', () => {
    let st = started();
    st = { ...st, settings: { ...st.settings, pace: 'calm' } };
    for (let d = 0; d < 40; d++) {
      st = doDay(st, T + d);
      expect(SKILLS.filter((s) => isLearning(st, s.id)).length).toBeLessThanOrEqual(PACE.calm);
    }
    expect(SKILLS.filter((s) => ss(st, s.id).met !== null).length).toBeGreaterThan(8);
  });
  it('a learner who keeps failing a skill does not move past what stands on it', () => {
    let st = started();
    for (let d = 0; d < 25; d++) st = doDay(st, T + d, (id) => id !== 'add20');
    expect(ss(st, 'sub20').met).toBe(null);
    expect(ss(st, 'add20').e.ok).toBe(0);
  });
  it('sessions stay short', () => {
    let st = started();
    for (let d = 0; d < 30; d++) { st = doDay(st, T + d, (id) => id.length % 2 === 0); expect(buildPlan(st, T + d + 1).steps.length).toBeLessThanOrEqual(15); }
  });
});

describe('grading', () => {
  const started = () => applyPlacement(initialMath(), { ...startPlacement(1), start: { num: 1, frac: 4, shape: 7 } }, T - 1);
  const step = { part: 'boost' as const, kind: 'solve' as const, skill: 'add20', measure: 'e' as const, seed: 1, support: true, mode: 'type' as const };
  it('a correct answer after a hint is no mistake and no promotion', () => {
    const st = recordAnswer(started(), step, { correct: true, hinted: true }, T);
    const m = ss(st, 'add20').e;
    expect([m.box, m.no, m.flag, m.helped]).toEqual([0, 0, false, 1]);
  });
  it('a correct answer alone promotes once a day', () => {
    let st = recordAnswer(started(), step, { correct: true, hinted: false }, T);
    st = recordAnswer(st, step, { correct: true, hinted: false }, T);
    expect(ss(st, 'add20').e.box).toBe(1);
    st = recordAnswer(st, step, { correct: true, hinted: false }, T + 1);
    expect(ss(st, 'add20').e.box).toBe(2);
  });
  it('a retry is never counted', () => {
    const st = recordAnswer(started(), { ...step, retry: true }, { correct: false, hinted: false }, T);
    expect(ss(st, 'add20').e.no).toBe(0);
  });
  it('a mistake counts its trap and comes back once', () => {
    let st = started();
    st = { ...st, plan: { day: T, steps: [step], at: 0, newSkill: null, flagged: [] } };
    st = recordAnswer(st, step, { correct: false, hinted: false, trap: 'op' }, T);
    st = queueRetry(st, step);
    expect(st.traps.op).toBe(1);
    expect(st.plan!.steps).toHaveLength(2);
    expect(st.plan!.steps[1].retry).toBe(true);
    expect(ss(st, 'add20').e.flag).toBe(true);
  });
});

describe('the bridge stations', () => {
  it('every new question has one right answer and a way to solve it', () => {
    for (const s of SKILLS.filter((x) => x.station >= 8 || ["round", "time", "mixed", "ratio", "price", "scale", "paral", "surface", "prob", "coord"].includes(x.id))) for (let seed = 1; seed < 200; seed++) for (const gen of [s.e, s.u]) {
      if (!gen) continue;
      const q = gen(seeded(seed));
      expect(q.steps.length, s.id).toBeGreaterThan(0);
      if (q.choices) { expect(q.choices.some((c) => c.label === q.answer), s.id).toBe(true); expect(q.choices.length, `${s.id} ${seed}`).toBeGreaterThanOrEqual(2); }
      else expect(Number.isInteger(Number(q.answer)), `${s.id} ${q.answer}`).toBe(true);
      for (const [w] of q.wrong ?? []) expect(w, `${s.id} ${q.prompt}`).not.toBe('NaN');
    }
  });
});

describe('basic skills fade out', () => {
  const T = 20000;
  const solid = (box = 4) => ({ u: { box, due: T, flag: false, clear: 0, ok: 5, no: 0, helped: 0, last: -1 }, e: { box, due: T, flag: false, clear: 0, ok: 5, no: 0, helped: 0, last: -1 }, met: 1 });
  it('a skill is not reviewed once a skill built on it is solid', () => {
    const st: MathState = { ...initialMath(), onboarded: true, skills: { add20: solid(), sub20: solid() } };
    expect(outgrown(st, 'add20')).toBe(true);
    for (let i = 0; i < 20; i++) expect(buildPlan(st, T, { rnd: Math.random }).steps.some((x) => x.skill === 'add20')).toBe(false);
  });
  it('skills she was placed above never come back for review', () => {
    const st: MathState = { ...initialMath(), onboarded: true, skills: { add20: { ...solid(3), assumed: true } } };
    expect(buildPlan(st, T).steps.some((x) => x.skill === 'add20')).toBe(false);
  });
  it('a mistake still brings a basic skill back', () => {
    const st: MathState = { ...initialMath(), onboarded: true, skills: { add20: { ...solid(), e: { ...solid().e, flag: true } }, sub20: solid() } };
    expect(buildPlan(st, T).steps.some((x) => x.skill === 'add20')).toBe(true);
  });
});

describe('placement from fifth grade', () => {
  it('starts each area at its floor, and what lies below counts as known', () => {
    let p = startPlacement(5, GRADE5_FLOOR);
    expect(p.station).toBe(3);
    p = answerPlacement(p, 'notyet');
    expect(p.station).toBe(5);
    p = answerPlacement(answerPlacement(p, 'notyet'), 'notyet');
    expect(placementDone(p)).toBe(true);
    const st = applyPlacement({ ...initialMath(), placement: p }, p, 100);
    expect(st.skills.add20?.assumed).toBe(true);
    expect(st.skills.fracmean?.assumed).toBe(true);
    expect(st.skills.fracdiff).toBeUndefined();
  });
});

