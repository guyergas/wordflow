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
  it('ends polite speech with khráp in both Thai and transliteration', () => {
    for (const w of THAI_WORDS) expect(w.th.endsWith('ครับ')).toBe(w.en.endsWith(' khráp'));
    for (const w of THAI_WORDS.filter((x) => x.he.endsWith('?') && x.he !== 'האם?')) expect(w.en).toMatch(/ khráp$/);
    expect(THAI_WORDS.find((w) => w.he === 'כן')!.en).toBe('châi khráp');
    expect(THAI_WORDS.find((w) => w.he === 'קפה')!.en).toBe('kaa-fae');
  });
  it('keeps word ids when the polite ending is added', () => {
    expect(THAI_WORDS.find((w) => w.he === 'כן')!.id).toBe(`t${audioName('ใช่')}`);
  });
  it('has no repeated sentence', () => {
    expect(new Set(THAI_SENTENCES.map((s) => s.id)).size).toBe(THAI_SENTENCES.length);
    expect(new Set(THAI_SENTENCES.map((s) => s.th)).size).toBe(THAI_SENTENCES.length);
    expect(THAI_SENTENCES.filter((s) => s.topic === 'ask').every((s) => s.en.endsWith(' khráp'))).toBe(true);
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

  it('returns words that were never practiced to new, and keeps real practice', async () => {
    const { engine, words } = await load();
    const [a, b, c] = words.WORDS;
    const base = engine.initialState();
    const st = { ...base, startLevel: 3, plan: engine.buildPlan(base, 100), words: {
      [a.id]: { ...engine.freshWord(), met: 100, assumed: true, r: { ...engine.freshMetric(), box: 3, due: 100 } },
      [b.id]: { ...engine.freshWord(), met: 100, r: { ...engine.freshMetric(), box: 1, due: 100 } },
      [c.id]: { ...engine.freshWord(), met: 100, r: { ...engine.freshMetric(), box: 1, ok: 1, due: 101 } },
    } };
    const fixed = engine.dropUnpracticed(st);
    expect(Object.keys(fixed.words)).toEqual([c.id]);
    expect(fixed.plan).toBeNull();
    expect(engine.dropUnpracticed(fixed)).toBe(fixed);
    const proved = { ...base, words: { [a.id]: { ...engine.freshWord(), met: 100, assumed: true, r: { ...engine.freshMetric(), box: 3, due: 103, last: 100 } } } };
    expect(engine.dropUnpracticed(proved)).toBe(proved);
    const plan = engine.buildPlan(fixed, 100);
    const old = plan.steps.filter((s) => s.part !== 'new').map((s) => s.id);
    expect(old.includes(a.id) || old.includes(b.id)).toBe(false);
    vi.unstubAllGlobals();
  });

  it('prefers words already met as wrong answers', async () => {
    const { engine, words } = await load();
    const met = words.WORDS.slice(100, 106);
    const st = { ...engine.initialState(), words: Object.fromEntries(met.map((w) => [w.id, { ...engine.freshWord(), met: 100 }])) };
    const opts = engine.options(st, met[0].id, 4);
    expect(opts.every((o) => met.includes(o))).toBe(true);
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
