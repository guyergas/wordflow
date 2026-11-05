import { describe, expect, it } from 'vitest';
import { advance, answer, buildPlan, choices, huntCells, initial, meet, nextLetter, noteMiss, pairsOf, pictureChoices, secure, shaky, SHAKY_LIMIT, statusOf, topMisses, WRITING } from './engine';
import { judge, FREE, TRACE } from '../alef/ink';
import { Pt } from '../alef/letters';
import { ABC, EN, HE, LETTER, PAIRS, TINY_EN_AUDIO, TINY_HE_AUDIO, wordsOf } from './letters';

const ink = (id: string) => LETTER[id].strokes.map((s) => s.p);
const wobble = (lines: Pt[][], a = 4): Pt[][] => lines.map((l) => l.flatMap((p, i) => { if (!i) return [p]; const [x, y] = l[i - 1], out: Pt[] = []; for (let k = 1; k <= 4; k++) { const t = k / 4; out.push([x + (p[0] - x) * t + Math.sin(k * 1.7 + i) * a, y + (p[1] - y) * t + Math.cos(k * 2.3 + i) * a]); } return out; }));
const bigs = ABC.filter((l) => l.big), smalls = ABC.filter((l) => !l.big);

describe('letters', () => {
  it('has every capital and small letter once', () => {
    expect(ABC.length).toBe(52);
    expect(bigs.map((l) => l.id).sort().join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    expect(smalls.map((l) => l.id).sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz');
    expect(ABC.findIndex((l) => !l.big)).toBe(26);
  });
  it('gives each letter easy words that open with it, and recordings', () => {
    for (const l of ABC) {
      expect(wordsOf(l.id).length, l.id).toBeGreaterThanOrEqual(2);
      for (const w of wordsOf(l.id)) { expect(w[0][0].toUpperCase(), w[0]).toBe(l.id.toUpperCase()); expect(TINY_EN_AUDIO).toContain(EN.isFor(l.id, w[0])); expect(TINY_EN_AUDIO).toContain(w[0]); }
      expect(TINY_EN_AUDIO).toContain(EN.name(l.id)); expect(TINY_EN_AUDIO).toContain(EN.yes(l.id)); expect(TINY_HE_AUDIO).toContain(l.recipe);
    }
    for (const t of Object.values(HE)) expect(TINY_HE_AUDIO).toContain(t);
  });
});

describe('writing', () => {
  for (const [name, set] of [['capitals', bigs], ['small letters', smalls]] as const) {
    it(`accepts ${name} drawn well and with a shaky hand`, () => {
      for (const l of set) {
        expect(judge(ink(l.id), l, FREE, set).ok, l.id).toBe(true);
        expect(judge(wobble(ink(l.id)), l, FREE, set).ok, `${l.id} shaky`).toBe(true);
        expect(judge(wobble(ink(l.id)), l, TRACE, set).ok, `${l.id} trace`).toBe(true);
      }
    }, 120000);
    it(`tells ${name} apart`, () => {
      const passed: string[] = [];
      for (const l of set) for (const o of set) if (l !== o && judge(ink(o.id), l, FREE, set).ok) passed.push(`${o.id}→${l.id}`);
      expect(passed).toEqual([]);
    }, 120000);
  }
});

describe('the plan', () => {
  it('starts with meeting one letter, then mixed tasks', () => {
    const p = buildPlan(initial('א'), 100);
    expect(p.steps[0]).toMatchObject({ t: 'meet', id: 'L' });
    expect(p.steps.filter((s) => WRITING.includes(s.t)).length).toBe(10);
    expect(new Set(p.steps.slice(1).filter((s) => !WRITING.includes(s.t)).map((s) => s.t))).toEqual(new Set(['find', 'word', 'hunt', 'picture']));
  });
  it('holds back new letters while four are shaky', () => {
    let st = meet(initial('א'), 'L', 100);
    expect(buildPlan(st, 100).steps.some((s) => s.t === 'meet')).toBe(false);
    expect(buildPlan(st, 100, { bonus: true }).steps.some((s) => s.t === 'meet')).toBe(true);
    for (const id of ['T', 'I', 'H']) st = meet(st, id, 100);
    expect(shaky(st).length).toBe(SHAKY_LIMIT);
    expect(buildPlan(st, 101).steps.some((s) => s.t === 'meet')).toBe(false);
  });
  it('secures a letter over separate days, and practice moves no stage', () => {
    let st = meet(initial('א'), 'L', 100);
    for (const d of [100, 101, 103]) st = answer(answer(st, 'L', 'see', true, d), 'L', 'write', true, d);
    expect(secure(st.letters.L)).toBe(true);
    const box = st.letters.L.write.box;
    st = answer(st, 'L', 'write', false, 104, true);
    expect(st.letters.L.write.box).toBe(box);
    expect(st.letters.L.wrote[1]).toBe(1);
  });
  it('asks to match small letters to capitals, only for small letters', () => {
    const st = meet(initial('א'), 'a', 100);
    expect(buildPlan(st, 100, { warm: true }).steps.some((s) => s.t === 'twin')).toBe(true);
    expect(buildPlan(meet(initial('א'), 'A', 100), 100, { warm: true }).steps.some((s) => s.t === 'twin')).toBe(false);
  });
  it('asks about look-alikes once both were met, and varies writing later', () => {
    let s = meet(initial('א'), 'F', 100);
    expect(pairsOf(s, 'F')).toEqual([]);
    s = meet(s, 'E', 100);
    expect(pairsOf(s, 'F').length).toBe(1);
    s = { ...s, letters: { ...s.letters, E: { ...s.letters.E, write: { box: 2, due: 100 } } } };
    expect(new Set(buildPlan({ ...s, letters: { E: s.letters.E } }, 100, { warm: true }).steps.map((x) => x.t))).toEqual(new Set(['find', 'word', 'hunt', 'picture', 'memory', 'write', 'opening']));
    for (const p of PAIRS) { expect(TINY_HE_AUDIO).toContain(p[2]); expect(LETTER[p[0]]).toBeTruthy(); expect(LETTER[p[1]]).toBeTruthy(); }
  });
  it('reaches the end of the ABC', () => {
    let st = initial('א'), day = 100;
    for (let g = 0; g < 500 && nextLetter(st); g++, day++) {
      for (const s of buildPlan(st, day).steps) st = s.t === 'meet' ? meet(st, s.id, day) : answer(st, s.id, WRITING.includes(s.t) ? 'write' : 'see', true, day);
      st = advance(st);
    }
    expect(nextLetter(st)).toBeUndefined();
    expect(day - 100).toBeLessThan(200);
  });
});

describe('games', () => {
  const st = ABC.slice(0, 6).reduce((s, l) => meet(s, l.id, 100), initial('א'));
  it('offers the letter once, with others of the same size', () => {
    for (const l of ABC) { const c = choices(st, l.id); expect(c.filter((x) => x === l.id).length).toBe(1); expect(new Set(c).size).toBe(3); expect(c.every((x) => LETTER[x].big === l.big)).toBe(true); }
  });
  it('fills a hunt, and offers pictures of which only one opens with the letter', () => {
    const h = huntCells(st, 'E'); expect(h.length).toBe(16); expect(h.filter((c) => c === 'E').length).toBe(5);
    for (const l of ABC) { const { right, options } = pictureChoices(st, l.id, 0); expect(options).toContain(right); expect(options.filter((w) => w[0][0].toUpperCase() === l.id.toUpperCase()).length).toBe(1); expect(options.length).toBe(3); }
  });
  it('records what a letter was mistaken for', () => {
    let s = meet(initial('א'), 'E', 100);
    for (let i = 0; i < 4; i++) s = answer(s, 'E', 'see', false, 100, true);
    expect(statusOf(s, 'E')).toBe('hard');
    expect(topMisses(noteMiss(s, 'E', 'F').letters.E)).toEqual(['F']);
  });
});
