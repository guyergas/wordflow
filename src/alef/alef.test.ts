import { describe, expect, it } from 'vitest';
import { answer, advance, buildPlan, choices, initial, meet, nextLetter, secure, shaky, SHAKY_LIMIT, validStep, writeStage } from './engine';
import { judge, FREE, TRACE } from './ink';
import { FINALS, frameOf, HEBREW_AUDIO, LETTER, LETTERS, lookAlikes, Pt, WORDS } from './letters';

const ink = (id: string) => LETTER[id].strokes.map((s) => s.p);
const wobble = (lines: Pt[][], a = 5): Pt[][] => lines.map((l) => l.flatMap((p, i) => { if (!i) return [p]; const [x0, y0] = l[i - 1], out: Pt[] = []; for (let k = 1; k <= 8; k++) { const t = k / 8; out.push([x0 + (p[0] - x0) * t + Math.sin(k * 1.7) * a, y0 + (p[1] - y0) * t + Math.cos(k * 2.3) * a]); } return out; }));

describe('letters', () => {
  it('has the whole alef-bet with final forms, once each', () => {
    expect(LETTERS.length).toBe(27);
    expect(new Set(LETTERS.map((l) => l.id)).size).toBe(27);
    for (const c of 'אבגדהוזחטיכךלמםנןסעפףצץקרשת') expect(LETTER[c], c).toBeTruthy();
  });
  it('teaches each base letter before the letter built on it', () => {
    LETTERS.forEach((l, i) => { if (l.base) expect(LETTERS.findIndex((o) => o.id === l.base), l.id).toBeLessThan(i); });
  });
  it('has picture words that really contain the letter', () => {
    for (const l of LETTERS) { expect(WORDS[l.id].length, l.id).toBeGreaterThanOrEqual(3); for (const w of WORDS[l.id]) expect(w[0], l.id).toContain(l.id); }
  });
  it('moves writing from dashed, to beside a model, to alone', () => {
    expect([0, 1, 2, 3].map(writeStage)).toEqual(['trace', 'copy', 'write', 'write']);
  });
  it('keeps final forms for the end', () => {
    expect(LETTERS.slice(-5).map((l) => l.id).sort().join('')).toBe([...FINALS].sort().join(''));
    expect(choices(initial('א'), 'י', () => 0.5).some((c) => FINALS.includes(c))).toBe(false);
  });
  it('gives every sentence a recording', () => {
    for (const l of LETTERS) { expect(HEBREW_AUDIO).toContain(l.recipe); expect(HEBREW_AUDIO).toContain(l.say); }
  });
});

describe('judging a drawing', () => {
  it('accepts every letter drawn correctly, and with a shaky hand', () => {
    for (const l of LETTERS) {
      expect(judge(ink(l.id), l, FREE).ok, l.id).toBe(true);
      expect(judge(wobble(ink(l.id)), l, FREE).ok, `${l.id} shaky`).toBe(true);
      expect(judge(wobble(ink(l.id)), l, TRACE).ok, `${l.id} trace`).toBe(true);
    }
  }, 120000);
  it('accepts a letter drawn to the side of the middle', () => {
    for (const l of LETTERS) expect(judge(ink(l.id).map((s) => s.map(([x, y]): Pt => [x + 20, y + 6])), l, FREE).ok, l.id).toBe(true);
  }, 120000);
  it('tells look-alikes apart, which is the point of the course', () => {
    for (const l of LETTERS) for (const o of lookAlikes(l.id)) expect(judge(ink(o), l, FREE).ok, `${o} drawn for ${l.id}`).toBe(false);
  }, 120000);
  it('tells every pair of letters apart', () => {
    const passed: string[] = [];
    for (const l of LETTERS) for (const o of LETTERS) if (l !== o && judge(ink(o.id), l, FREE).ok) passed.push(`${o.id}→${l.id}`);
    expect(passed).toEqual([]);
  }, 120000);
  it('names the missing line', () => {
    const d = LETTER['ד'];
    expect(judge(ink('ר'), d, FREE).missing).toEqual([2]);
  });
  it('rejects a scribble and an empty page', () => {
    expect(judge([], LETTER['ר']).ok).toBe(false);
    expect(judge([[[0, 0], [100, 100], [0, 100], [100, 0], [50, 160]]], LETTER['ר']).ok).toBe(false);
  });
});

describe('the plan', () => {
  const pass = (st: ReturnType<typeof initial>, id: string, day: number) => answer(answer(st, id, 'see', true, day), id, 'write', true, day);
  it('starts with the first letter and the full introduction', () => {
    const p = buildPlan(initial('עומר'), 100);
    expect(p.steps.map((s) => s.t)).toEqual(['meet', ...Array(10).fill('find'), ...Array(10).fill('trace'), ...Array(10).fill('word')]);
    expect(p.steps[0].id).toBe('י');
  });
  it('repeats a review exercise several times', () => {
    const st = meet(initial('א'), 'י', 100);
    const p = buildPlan(st, 100, { extra: true, rnd: () => 0.9 });
    expect(p.steps.filter((s) => s.t === 'find').length).toBe(10);
    expect(p.steps.filter((s) => s.t === 'trace').length).toBe(10);
  });
  it('drops a saved exercise that no longer exists', () => {
    expect(validStep({ t: 'build' as 'meet', id: 'י' })).toBe(false);
    expect(validStep({ t: 'trace', id: 'י' })).toBe(true);
  });
  it('frames each letter tightly, with room for the lines', () => {
    for (const l of LETTERS) { const [, y, , h] = frameOf(l).split(' ').map(Number); expect(y).toBeLessThan(0); expect(y + h).toBeGreaterThan(100); }
    expect(frameOf(LETTER['י']).split(' ')[2]).toBe('100');
  });
  it('warm-up and boost bring no new letter', () => {
    let st = initial('א');
    for (const id of ['י', 'ו', 'ן', 'ר']) st = meet(st, id, 100);
    st = answer(st, 'ר', 'see', true, 100);
    for (const o of [{ warm: true }, { boost: true }]) {
      const p = buildPlan(st, 101, o);
      expect(p.extra).toBe(true); expect(p.steps.length).toBeGreaterThan(0);
      expect(p.steps.some((s) => s.t === 'meet')).toBe(false);
      expect(p.steps.every((s) => st.letters[s.id])).toBe(true);
    }
    const weak = new Set(buildPlan(st, 101, { boost: true }).steps.map((s) => s.id));
    expect(weak.has('ר')).toBe(false);
  });
  it('gives one new letter a day, and another only when asked', () => {
    let st = meet(initial('א'), 'י', 100);
    expect(buildPlan(st, 100).steps.some((s) => s.t === 'meet')).toBe(false);
    expect(buildPlan(st, 100, { bonus: true }).steps.some((s) => s.t === 'meet')).toBe(true);
  });
  it('holds new letters back while three are shaky', () => {
    let st = initial('א');
    for (const id of ['י', 'ו', 'ן', 'ר']) st = meet(st, id, 100);
    expect(shaky(st).length).toBe(SHAKY_LIMIT);
    const p = buildPlan(st, 101);
    expect(p.steps.some((s) => s.t === 'meet')).toBe(false);
    expect(p.steps.length).toBeGreaterThan(0);
  });
  it('makes a letter secure only over separate days', () => {
    let st = meet(initial('א'), 'י', 100);
    st = pass(st, 'י', 100); st = pass(st, 'י', 100);
    expect(secure(st.letters['י'])).toBe(false);
    st = pass(st, 'י', 101);
    expect(secure(st.letters['י'])).toBe(false);
    st = pass(st, 'י', 103);
    expect(secure(st.letters['י'])).toBe(true);
  });
  it('brings a missed letter back the next day', () => {
    let st = meet(initial('א'), 'י', 100);
    st = pass(st, 'י', 100); st = pass(st, 'י', 101);
    st = answer(st, 'י', 'write', false, 103);
    expect(st.letters['י'].write).toEqual({ box: 1, due: 104 });
  });
  it('can reach the end of the alef-bet', () => {
    let st = initial('א'), day = 100;
    for (let g = 0; g < 400 && nextLetter(st); g++, day++) {
      let p = buildPlan(st, day);
      for (const s of p.steps) {
        if (s.t === 'meet') st = meet(st, s.id, day);
        if (s.t === 'find' || s.t === 'word') st = answer(st, s.id, 'see', true, day);
        if (s.t === 'trace' || s.t === 'copy' || s.t === 'write') st = answer(st, s.id, 'write', true, day);
      }
      st = advance(st);
    }
    expect(nextLetter(st)).toBeUndefined();
    expect(day - 100).toBeLessThan(80);
  });
  it('offers look-alikes in the find game, with the answer among them', () => {
    let st = initial('א');
    for (const id of ['ר', 'ד']) st = meet(st, id, 100);
    const c = choices(st, 'ד', () => 0.5);
    expect(c).toContain('ד'); expect(c).toContain('ר'); expect(new Set(c).size).toBe(c.length);
  });
});
