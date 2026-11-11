import { describe, expect, it } from 'vitest';
import { afterGrammar, nextGrammar } from './GrammarCard';
import { GRAMMAR } from './topics';

describe('grammar', () => {
  it('every topic is complete and comes in order of words known', () => {
    let words = 0;
    expect(new Set(GRAMMAR.map((t) => t.id)).size).toBe(GRAMMAR.length);
    for (const t of GRAMMAR) {
      expect(t.words, t.id).toBeGreaterThanOrEqual(words); words = t.words;
      expect(t.qs.length, t.id).toBeGreaterThanOrEqual(25);
      for (const [s, right, wrong, why] of t.qs) {
        expect(s, t.id).toContain('___');
        expect(wrong.length, s).toBeGreaterThanOrEqual(1);
        expect(new Set([right, ...wrong]).size, s).toBe(wrong.length + 1);
        expect(why.length, s).toBeGreaterThan(0);
      }
    }
  });
  const T = 20000, empty = { topics: {}, last: 0 };
  it('waits for enough words, and spaces new topics', () => {
    expect(nextGrammar(empty, 10, T)).toBeNull();
    expect(nextGrammar(empty, 40, T)?.topic.id).toBe(GRAMMAR[0].id);
    const s = afterGrammar(empty, GRAMMAR[0].id, 10, 10, T, false);
    expect(nextGrammar(s, 500, T)).toBeNull();
    expect(nextGrammar(s, 500, T + 1)?.review).toBe(true);
  });
  it('a good review pushes the topic further, and a weak one brings it back tomorrow', () => {
    let s = afterGrammar(empty, 'plural', 10, 10, T, false);
    s = afterGrammar(s, 'plural', 5, 5, T + 1, true);
    expect(s.topics.plural.due).toBe(T + 4);
    s = afterGrammar(s, 'plural', 1, 5, T + 4, true);
    expect(s.topics.plural.due).toBe(T + 5);
  });
});

it('no topic repeats a sentence', () => {
  for (const t of GRAMMAR) expect(new Set(t.qs.map((q) => q[0])).size, t.id).toBe(t.qs.length);
});
