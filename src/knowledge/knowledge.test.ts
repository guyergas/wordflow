import { describe, expect, it } from 'vitest';
import { COURSES } from '../course';
import { answerKey, buildPlan, dayLog, finishLesson, finishReview, initial, isSolid, lessonsOf, LESSON, pickQs } from './engine';
import { DEEP } from './deep';
import { NEW_LESSONS } from './new-lessons';
import { shortParagraphs } from './kit';
import { LESSONS } from './lessons';
import { guessable } from './answer-length';

const T = 20000;
describe('lesson bank', () => {
  it('each knowledge course has lessons at every level', () => {
    const list = COURSES.filter((c) => c.knowledge);
    expect(list).toHaveLength(10);
    for (const c of list) { const l = lessonsOf(c.id); expect(l.length, c.id).toBeGreaterThanOrEqual(30); expect(new Set(l.map((x) => x.level)).size, c.id).toBe(3); }
  });
  it('marked sentences are balanced, and full-length lessons have several', () => {
    for (const l of LESSONS) expect(l.text.split('[[').length, l.id).toBe(l.text.split(']]').length);
    for (const l of NEW_LESSONS) { expect(l.text.split('[[').length - 1, l.id).toBeGreaterThanOrEqual(5); expect(l.text.split(/\s+/).length, l.id).toBeGreaterThanOrEqual(600); }
    for (const id of Object.keys(DEEP)) expect(DEEP[id].text.split('[[').length - 1, id).toBeGreaterThanOrEqual(5);
  });
  it('lessons at the full standard cannot be guessed by answer length', () => {
    // Older lessons are fixed a few at a time (docs/answer-length.md); a lesson written or lengthened to about 1,000 words must already pass.
    for (const l of LESSONS) if (l.text.split(/\s+/).length >= 950) expect(guessable(l), `${l.id}: run npx tsx scripts/answer-length.ts`).toBe(false);
  });
  it('short paragraphs keep every word and every mark whole', () => {
    for (const l of LESSONS) {
      const parts = shortParagraphs(l.text);
      expect(parts.join(' ').replace(/\s+/g, ' '), l.id).toBe(l.text.replace(/\s+/g, ' '));
      for (const t of parts) expect(t.split('[[').length, l.id).toBe(t.split(']]').length);
    }
  });
  it('every lesson is complete', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) {
      const words = l.text.split(/\s+/).length;
      expect(words, `${l.id} length`).toBeGreaterThanOrEqual(100);
      expect(words, `${l.id} length`).toBeLessThanOrEqual(2200);
      expect(l.qs.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.keys.length, l.id).toBeGreaterThanOrEqual(1);
      for (const [q, right, wrong, why] of [...l.qs, ...l.keys]) {
        expect(q.length, l.id).toBeGreaterThan(5);
        expect(why.length, `${l.id}: ${q}`).toBeGreaterThan(0);
        expect(wrong.length, `${l.id}: ${q}`).toBeGreaterThanOrEqual(2);
        expect(new Set([right, ...wrong]).size, `${l.id}: ${q}`).toBe(wrong.length + 1);
      }
    }
  });
});
describe('learning rules', () => {
  const id = lessonsOf('geo')[0].id;
  it('a day has one topic, and no spaced review on the first day', () => {
    const p = buildPlan(initial(), T, {}, 'geo');
    expect(p.steps.map((s) => s.t)).toEqual(['lesson']);
  });
  it('a topic not understood takes the place of a new one the next day', () => {
    const st = finishLesson(initial(), id, 1, 3, T);
    expect(buildPlan(st, T + 1, {}, 'geo').steps.filter((s) => s.t === 'lesson')).toEqual([{ t: 'lesson', id }]);
  });
  it('a passed lesson counts as new once, and its key points return the next day', () => {
    let st = finishLesson(initial(), id, 3, 3, T);
    expect(dayLog(st, T).fresh).toBe(1);
    expect(buildPlan(st, T, {}, 'geo').steps.some((s) => s.t === 'key')).toBe(false);
    expect(buildPlan(st, T + 1, {}, 'geo').steps.some((s) => s.t === 'key')).toBe(true);
    st = finishLesson(st, id, 3, 3, T + 1);
    expect(dayLog(st, T + 1).fresh).toBe(0);
  });
  it('a day starts by recalling the previous lesson, then reading, and review questions come after', () => {
    const st = finishLesson(initial(), id, 3, 3, T);
    const kinds = buildPlan(st, T + 1, {}, 'geo').steps.map((s) => s.t);
    expect(kinds.slice(0, 2)).toEqual(['recall', 'lesson']);
    expect(kinds.at(-1)).toBe('key');
  });
  it('a lesson not understood returns the next day', () => {
    const st = finishLesson(initial(), id, 1, 3, T);
    expect(buildPlan(st, T + 1, {}, 'geo').steps.some((s) => s.t === 'lesson' && s.id === id)).toBe(true);
    expect(st.lessons[id].pass).toBe(false);
  });
  it('solid needs key points remembered on separate days', () => {
    let st = finishLesson(initial(), id, 3, 3, T);
    const keys = LESSON[id].keys.map((_, i) => `${id}#${i}`);
    for (const d of [1, 3, 6]) for (const k of keys) { st = answerKey(st, k, true, T + d); st = answerKey(st, k, true, T + d); }
    expect(isSolid(st, LESSON[id])).toBe(true);
    st = answerKey(st, keys[0], false, T + 9);
    expect(isSolid(st, LESSON[id])).toBe(false);
  });
});

describe('recall and review lessons', () => {
  const c = COURSES.find((x) => lessonsOf(x.id as never).length >= 6)!.id as never;
  const read = (n: number, day0 = 100) => { let st = initial(); lessonsOf(c).slice(0, n).forEach((l, i) => { st = finishLesson(st, l.id, 10, 10, day0 + i); }); return st; };
  it('a day opens with questions on the previous lesson, then the new one', () => {
    const st = read(2), p = buildPlan(st, 102, { rnd: () => 0.5 }, c);
    expect(p.steps[0]).toEqual({ t: 'recall', id: lessonsOf(c)[1].id });
    expect(p.steps[1].t).toBe('lesson');
    const after = finishReview(st, p.steps[0], 4, 5, 102);
    expect(buildPlan(after, 103, { rnd: () => 0.5 }, c).steps.some((x) => x.t === 'recall')).toBe(false);
  });
  it('after five lessons comes a review day with no new text', () => {
    const st = read(5), p = buildPlan(st, 105, { rnd: () => 0.5 }, c);
    expect(p.steps.some((x) => x.t === 'lesson' || x.t === 'recall')).toBe(false);
    const r = p.steps.find((x) => x.t === 'review')!;
    expect(r.t === 'review' && r.ids.length).toBe(5);
    const after = finishReview(st, r, 12, 15, 105);
    expect(buildPlan(after, 106, { rnd: () => 0.5 }, c).steps.some((x) => x.t === 'lesson')).toBe(true);
  });
  it('picks distinct questions, the same ones for the same day', () => {
    const id = lessonsOf(c)[0].id, a = pickQs(id, 5, 7);
    expect(new Set(a.map((x) => x[1])).size).toBe(Math.min(5, LESSON[id].qs.length));
    expect(pickQs(id, 5, 7)).toEqual(a);
  });
});

