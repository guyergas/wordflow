import { describe, expect, it } from 'vitest';
import { COURSES } from '../course';
import { answerKey, buildPlan, dayLog, finishLesson, initial, isSolid, lessonsOf, LESSON } from './engine';
import { DEEP } from './deep';
import { shortParagraphs } from './kit';
import { LESSONS } from './lessons';

const T = 20000;
describe('lesson bank', () => {
  it('each knowledge course has lessons at every level', () => {
    const list = COURSES.filter((c) => c.knowledge);
    expect(list).toHaveLength(9);
    for (const c of list) { const l = lessonsOf(c.id); expect(l.length, c.id).toBeGreaterThanOrEqual(30); expect(new Set(l.map((x) => x.level)).size, c.id).toBe(3); }
  });
  it('marked sentences are balanced, and full-length lessons have several', () => {
    for (const l of LESSONS) expect(l.text.split('[[').length, l.id).toBe(l.text.split(']]').length);
    for (const id of Object.keys(DEEP)) expect(DEEP[id].text.split('[[').length - 1, id).toBeGreaterThanOrEqual(5);
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
  it('a day with lessons starts with reading, and review questions come after', () => {
    const st = finishLesson(initial(), id, 3, 3, T);
    const kinds = buildPlan(st, T + 1, {}, 'geo').steps.map((s) => s.t);
    expect(kinds[0]).toBe('lesson');
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
