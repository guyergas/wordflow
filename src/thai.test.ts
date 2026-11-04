import { describe, expect, it, vi } from 'vitest';
import { audioName, THAI_AUDIO, THAI_LEVELS, THAI_SENTENCES, THAI_WORDS } from './thai';

describe('Thai bank', () => {
  it('has one Hebrew meaning, one Thai text and one transliteration per word', () => {
    for (const key of ['he', 'th', 'en', 'id'] as const) expect(new Set(THAI_WORDS.map((w) => w[key])).size).toBe(THAI_WORDS.length);
  });
  it('fills all fifteen chapters', () => {
    expect(THAI_LEVELS).toHaveLength(15);
    THAI_LEVELS.forEach((_, i) => expect(THAI_WORDS.filter((w) => w.level === i).length).toBeGreaterThan(5));
  });
  it('keeps every field filled, with Thai script and a Latin transliteration', () => {
    for (const w of THAI_WORDS) {
      expect(w.he.trim()).toBe(w.he);
      expect(w.th).toMatch(/^[฀-๿ ]+$/);
      expect(w.en).not.toMatch(/[฀-๿֐-׿]/);
      expect(w.en).toBe(w.en.toLowerCase());
    }
  });
  it('gives every recording its own file name', () => {
    expect(new Set(THAI_AUDIO.map((a) => audioName(a.th))).size).toBe(THAI_AUDIO.length);
  });
  it('builds sentences with at least two pieces', () => {
    for (const s of THAI_SENTENCES) expect(s.en.split(/\s+/).length).toBeGreaterThanOrEqual(2);
  });
});

describe('Thai mode', () => {
  const load = async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', { getItem: (k: string) => (k === 'wordflow.course' ? 'th' : null), setItem: () => undefined });
    return { engine: await import('./engine'), words: await import('./words'), sentences: await import('./sentences') };
  };

  it('never plans a spelling exercise', async () => {
    const { engine, words } = await load();
    expect(words.WORDS).toHaveLength(THAI_WORDS.length);
    const SPELL = ['tiles', 'gaps', 'memo', 'type'];
    let st = engine.initialState();
    for (const w of words.WORDS.slice(0, 40)) st = { ...st, words: { ...st.words, [w.id]: { ...engine.freshWord(), met: 100, r: { ...engine.freshMetric(), box: 2, due: 100 }, s: { ...engine.freshMetric(), flag: true } } } };
    for (const plan of [engine.buildPlan(st, 110), engine.buildPlan(st, 110, { extra: true }), engine.buildPlan(st, 110, { short: true })]) {
      expect(plan.steps.some((s) => SPELL.includes(s.kind))).toBe(false);
    }
    expect(engine.spellCandidates(st, 110)).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('starts sentence practice from the patterns and adds phrases after they are met', async () => {
    const { engine, sentences } = await load();
    const st = engine.initialState();
    const first = sentences.sentencePlan(st, 100, 30);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((s) => !(s as { word?: string }).word)).toBe(true);
    const phrase = sentences.SENTENCES.find((s) => (s as { word?: string }).word) as { id: string; word: string };
    const later = { ...st, words: { [phrase.word]: { ...engine.freshWord(), met: 100 } } };
    expect(sentences.sentencePlan(later, 100, 300).some((s) => s.id === phrase.id)).toBe(true);
    vi.unstubAllGlobals();
  });
});
