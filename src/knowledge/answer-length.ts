// When can a child guess the right answer by its length alone? Used by scripts/answer-length.ts and the tests.
import type { Lesson, QuizQ } from './kit';

/** The right answer is clearly the longest option. */
export const giveaway = (q: QuizQ) => q[2].length > 0 && q[1].length > Math.max(...q[2].map((w) => w.length)) * 1.15;
/** The right answer is at least as long as every wrong one. */
export const rightLongest = (q: QuizQ) => q[2].every((w) => q[1].length >= w.length);
/** With three options, picking the longest should win only about a third of the time. */
export const MAX_LONGEST_SHARE = 0.4;
export const guessable = (l: Pick<Lesson, 'qs' | 'keys'>) => {
  const qs = [...l.qs, ...l.keys];
  return qs.some(giveaway) || qs.filter(rightLongest).length > qs.length * MAX_LONGEST_SHARE;
};
