import { describe, expect, it } from 'vitest';
import { REVIEW_MAX, answer, advance, buildPlan, choices, initial, meet, huntCells, nextLetter, noteMix, pairsOf, record, secure, statusOf, topMix, shaky, SHAKY_LIMIT, validStep, WRITING, writeStage } from './engine';
import { judge, FREE, TRACE } from './ink';
import { FINALS, firstWords, frameOf, HEBREW_AUDIO, LETTER, LETTERS, lookAlikes, PAIRS, Pt, SAY, spots, WORDS, SONG_ORDER, SONG_TIMES, songLead } from './letters';

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
    for (const l of LETTERS) { expect(WORDS[l.id].length, l.id).toBeGreaterThanOrEqual(3); for (const w of WORDS[l.id]) expect(spots(w[0], l.id).length, `${l.id} in ${w[0]}`).toBeGreaterThan(0); }
  });
  it('asks only about the opening, exact middle or closing letter', () => {
    expect(spots('תות', 'ו')).toEqual([{ at: 1, where: 'middle' }]);
    expect(spots('שמש', 'ש').map((s) => s.where)).toEqual(['first', 'last']);
    expect(spots('בננה', 'נ')).toEqual([]);
  });
  it('moves writing from dashed, to beside a model, to alone', () => {
    expect([0, 1, 2, 3].map(writeStage)).toEqual(['trace', 'copy', 'write', 'write']);
  });
  it('keeps final forms for the end', () => {
    expect(LETTERS.slice(-5).map((l) => l.id).sort().join('')).toBe([...FINALS].sort().join(''));
    expect(choices(initial('א'), 'י', () => 0.5).some((c) => FINALS.includes(c))).toBe(false);
  });
  it('says the name and how to write it in every writing exercise', () => {
    for (const l of LETTERS) for (const say of [SAY.trace(l), SAY.copy(l), SAY.write(l)]) { expect(say).toContain(l.say); expect(say).toContain(l.recipe); expect(HEBREW_AUDIO).toContain(say); }
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

describe('the song', () => {
  it('knows where all 22 letters are sung, in order, without overlap', () => {
    expect(SONG_TIMES.length).toBe(22);
    SONG_TIMES.forEach(([a, b], i) => { expect(b).toBeGreaterThan(a); if (i) expect(a).toBeGreaterThanOrEqual(SONG_TIMES[i - 1][1]); expect(b - a).toBeLessThanOrEqual(1.3); });
  });
  it('plays up to three letters before the one asked, and nothing of it', () => {
    expect(songLead('א')).toBeNull();
    expect(songLead('ך')).toBeNull();
    const k = SONG_ORDER.indexOf('ה'), lead = songLead('ה')!;
    expect(lead[0]).toBe(SONG_TIMES[k - 3][0]);
    expect(lead[1]).toBeLessThanOrEqual(SONG_TIMES[k][0]);
  });
  it('asks with the song only after a letter was met', () => {
    let st = meet(initial('א'), 'ד', 100);
    expect(buildPlan(st, 100, { extra: true }).steps.some((s) => s.t === 'song')).toBe(false);
    st = answer(st, 'ד', 'see', true, 100);
    const kinds = new Set(Array.from({ length: 6 }, () => buildPlan(st, 100, { extra: true }).steps.map((s) => s.t)).flat());
    expect(kinds.has('song')).toBe(true);
  });
});

describe('the plan', () => {
  const pass = (st: ReturnType<typeof initial>, id: string, day: number) => answer(answer(st, id, 'see', true, day), id, 'write', true, day);
  it('starts with the first letter and the full introduction', () => {
    const p = buildPlan(initial('עומר'), 100);
    expect(p.steps[0].t).toBe('meet');
    const write = p.steps.filter((s) => WRITING.includes(s.t)), see = p.steps.slice(1).filter((s) => !WRITING.includes(s.t));
    expect(write.length).toBe(10); expect(write.every((s) => s.t === 'trace')).toBe(true);
    expect(see.length).toBe(20);
    expect(new Set(see.map((s) => s.t))).toEqual(new Set(['find', 'word', 'hunt', 'sound']));
  });
  it('repeats a review exercise several times', () => {
    const st = meet(initial('א'), 'י', 100);
    const p = buildPlan(st, 100, { extra: true, rnd: () => 0.9 });
    expect(p.steps.filter((s) => WRITING.includes(s.t)).length).toBe(10);
    expect(p.steps.filter((s) => !WRITING.includes(s.t)).length).toBe(10);
  });
  it('varies writing once a letter is written beside a model', () => {
    let st = meet(initial('א'), 'ד', 100);
    st = { ...st, letters: { ...st.letters, 'ד': { ...st.letters['ד'], write: { box: 2, due: 100 } } } };
    const kinds = new Set(buildPlan(st, 100, { extra: true }).steps.map((s) => s.t));
    for (const k of ['memory', 'write', 'opening'] as const) expect(kinds.has(k), k).toBe(true);
  });
  it('asks about a pair only when both letters were met', () => {
    let st = meet(initial('א'), 'ר', 100);
    expect(pairsOf(st, 'ר')).toEqual([]);
    st = meet(st, 'ד', 100);
    expect(pairsOf(st, 'ר').map((p) => p[0])).toEqual(['ד']);
  });
  it('fills a hunt with five to find among sixteen', () => {
    const st = meet(meet(initial('א'), 'ר', 100), 'ד', 100), cells = huntCells(st, 'ד');
    expect(cells.length).toBe(16); expect(cells.filter((c) => c === 'ד').length).toBe(5);
  });
  it('has a word opening with every letter that is not final, and recordings for all questions', () => {
    for (const l of LETTERS) if (!FINALS.includes(l.id)) expect(firstWords(l.id).length, l.id).toBeGreaterThan(0);
    for (const p of PAIRS) { expect(HEBREW_AUDIO).toContain(p[2]); expect(LETTER[p[0]]).toBeTruthy(); expect(LETTER[p[1]]).toBeTruthy(); }
    for (const l of LETTERS) { expect(HEBREW_AUDIO).toContain(SAY.sound(l)); expect(HEBREW_AUDIO).toContain(SAY.hunt(l)); expect(HEBREW_AUDIO).toContain(SAY.memory(l)); }
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
  it('marks a letter hard from its misses, and remembers what it was mistaken for', () => {
    let st = meet(initial('א'), 'ד', 100);
    expect(statusOf(st, 'ד')).toBe('learning'); expect(statusOf(st, 'ר')).toBe('new');
    for (const ok of [true, false, false, true]) st = record(st, 'ד', 'see', ok);
    st = noteMix(noteMix(noteMix(st, 'ד', 'ר'), 'ד', 'ר'), 'ד', 'ה');
    expect(statusOf(st, 'ד')).toBe('hard');
    expect(topMix(st.letters['ד'])).toEqual(['ר', 'ה']);
    expect(st.letters['ד'].see).toEqual({ box: 0, due: 100 });
  });
  it('gives one new letter a day, and another only when asked', () => {
    let st = meet(initial('א'), 'י', 100);
    expect(buildPlan(st, 100).steps.some((s) => s.t === 'meet')).toBe(false);
    expect(buildPlan(st, 100, { bonus: true }).steps.some((s) => s.t === 'meet')).toBe(true);
  });
  it('young letters do not hold back a new one, but three hard letters do', () => {
    let st = initial('א');
    for (const id of ['י', 'ו', 'ן', 'ר']) st = meet(st, id, 100);
    expect(shaky(st).length).toBe(SHAKY_LIMIT);
    expect(buildPlan(st, 101).steps[0].t).toBe('meet');
    for (const id of ['י', 'ו', 'ן']) for (let i = 0; i < 4; i++) st = record(st, id, 'see', false);
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
      const p = buildPlan(st, day);
      st = { ...st, plan: { ...p, at: p.steps.length - 1 } };
      for (const s of p.steps) {
        if (s.t === 'meet') st = meet(st, s.id, day);
        if (s.t !== 'meet' && !WRITING.includes(s.t)) st = answer(st, s.id, 'see', true, day);
        if (WRITING.includes(s.t)) st = answer(st, s.id, 'write', true, day);
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

describe('short reviews and a long review day', () => {
  const D = 500;
  const known = (n: number, met = D - 3) => Object.fromEntries(LETTERS.slice(0, n).map((l) => [l.id, { see: { box: 3, due: D }, write: { box: 4, due: D }, met }]));
  it('a day with a new letter starts with it, and the review is short and comes after', () => {
    const st = { ...initial('עידו'), letters: known(4) };
    const p = buildPlan(st, D, { rnd: () => 0.3 }), next = LETTERS[4].id;
    expect(p.steps[0]).toMatchObject({ t: 'meet', id: next });
    const firstOther = p.steps.findIndex((s) => s.id !== next);
    expect(p.steps.slice(firstOther).every((s) => s.id !== next)).toBe(true);
    expect(p.steps.length - firstOther).toBeLessThanOrEqual(REVIEW_MAX);
  });
  it('the warm-up asks about every letter already known', () => {
    const st = { ...initial('עומר'), letters: known(4) };
    for (let i = 0; i < 10; i++) expect(new Set(buildPlan(st, D, { warm: true }).steps.map((s) => s.id)).size).toBe(4);
  });
  it('after six letters comes a long review with no new letter, once', () => {
    const st = { ...initial('עידו'), letters: known(6) };
    const p = buildPlan(st, D, { rnd: () => 0.3 });
    expect(p.review).toBe(6);
    expect(p.steps.some((s) => s.t === 'meet')).toBe(false);
    expect(new Set(p.steps.map((s) => s.id)).size).toBe(6);
    const done = advance({ ...st, plan: { ...p, at: p.steps.length - 1 } });
    expect(done.reviews).toEqual([6]);
    expect(buildPlan({ ...st, reviews: [6] }, D, { rnd: () => 0.3 }).steps[0].t).toBe('meet');
  });
});

