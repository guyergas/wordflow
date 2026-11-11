import { describe, expect, it } from 'vitest';
import { PASSAGES, wordsNeeded } from './readingTexts';

const GRADES = ['ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
describe('reading', () => {
  it('every text is complete, and the texts open in order and grow toward ninth grade', () => {
    expect(new Set(PASSAGES.map((p) => p.id)).size).toBe(PASSAGES.length);
    PASSAGES.forEach((p, i) => {
      expect(p.qs.length, p.id).toBeGreaterThanOrEqual(3);
      for (const [q, right, wrong] of p.qs) {
        expect(q.length, p.id).toBeGreaterThan(0);
        expect(wrong.length, q).toBeGreaterThanOrEqual(2);
        expect(new Set([right, ...wrong]).size, q).toBe(wrong.length + 1);
      }
      expect(GRADES, p.id).toContain(p.grade);
      if (i > 0) {
        expect(wordsNeeded(i), p.id).toBeGreaterThan(wordsNeeded(i - 1));
        expect(GRADES.indexOf(p.grade), p.id).toBeGreaterThanOrEqual(GRADES.indexOf(PASSAGES[i - 1].grade));
      }
    });
  });
});
