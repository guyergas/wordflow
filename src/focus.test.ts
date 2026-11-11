import { describe, expect, it } from 'vitest';
import * as alef from './alef/engine';
import * as tots from './tots/engine';
import * as tiny from './tinyen/engine';

const T = 20000;
describe('focused review from the board', () => {
  it('alef-bet: only the chosen letter, as free practice', () => {
    let st = alef.initial('x');
    for (let d = 0; d < 3; d++) { const p = alef.buildPlan(st, T + d); for (const s of p.steps) if (s.t === 'meet') st = alef.meet(st, s.id, T + d); }
    const id = Object.keys(st.letters)[0];
    const p = alef.buildPlan(st, T + 3, { focus: id });
    expect(p.steps.length).toBeGreaterThan(3);
    expect(p.steps.every((s) => s.id === id)).toBe(true);
    expect(p.extra).toBe(true);
  });
  it('little ones math: only the chosen number', () => {
    let st = tots.initial('x');
    const first = tots.buildPlan(st, T).steps.find((s) => s.t === 'meet')!;
    st = tots.meet(st, first.id, T);
    const p = tots.buildPlan(st, T + 1, { focus: first.id });
    expect(p.steps.length).toBeGreaterThan(3);
    expect(p.steps.every((s) => s.id === first.id)).toBe(true);
    expect(p.extra).toBe(true);
  });
  it('little ones English: only the chosen letter', () => {
    let st = tiny.initial('x');
    const first = tiny.buildPlan(st, T).steps.find((s) => s.t === 'meet')!;
    st = tiny.meet(st, first.id, T);
    const p = tiny.buildPlan(st, T + 1, { focus: first.id });
    expect(p.steps.length).toBeGreaterThan(3);
    expect(p.steps.every((s) => s.id === first.id)).toBe(true);
    expect(p.extra).toBe(true);
  });
  it('an unlearned item falls back to the normal plan', () => {
    expect(tiny.buildPlan(tiny.initial('x'), T, { focus: 'Z' }).extra).toBeFalsy();
  });
});
