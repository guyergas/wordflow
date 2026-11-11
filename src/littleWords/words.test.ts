import { describe, expect, it } from 'vitest';
import { LESSONS, ORDER, WORDS, lessonOpen, shownForm } from './data';
import { chooseOptions, doneShort, emptyProgress, finishLesson, lessonSteps, practiceSteps } from './engine';

describe('little words', () => {
  for (const lang of ['he', 'en'] as const) {
    it(`${lang}: every word is made of letters the course teaches, 2 to 4 long, with a picture`, () => {
      for (const w of WORDS[lang]) {
        expect([...w.text].every((c) => ORDER[lang].includes(c) || ORDER[lang].includes(c.toUpperCase())), w.text).toBe(true);
        expect(w.text.length, w.text).toBeGreaterThanOrEqual(2);
        expect(w.text.length, w.text).toBeLessThanOrEqual(4);
        expect(w.long, w.text).toBe(w.text.length === 4);
        expect(w.pic.length, w.text).toBeGreaterThan(0);
      }
      expect(new Set(WORDS[lang].map((w) => w.id)).size).toBe(WORDS[lang].length);
    });
    it(`${lang}: lessons of at least 3 words, short words first, opening in the order letters are taught`, () => {
      const all = LESSONS[lang];
      expect(all.every((l) => l.words.length >= 3)).toBe(true);
      const firstLong = all.findIndex((l) => l.long);
      expect(all.slice(0, firstLong).every((l) => !l.long)).toBe(true);
      let met = new Set<string>(), opened = 0;
      for (const c of ORDER[lang]) {
        met = new Set([...met, c]);
        const now = all.filter((l) => !l.long && lessonOpen(lang, l, met, false)).length;
        expect(now).toBeGreaterThanOrEqual(opened);
        opened = now;
      }
      expect(opened).toBe(firstLong);
    });
    it(`${lang}: long words wait until every short lesson is done`, () => {
      const met = new Set(ORDER[lang]);
      const long = LESSONS[lang].find((l) => l.long)!;
      expect(lessonOpen(lang, long, met, false)).toBe(false);
      let p = emptyProgress();
      for (const l of LESSONS[lang].filter((x) => !x.long)) p = finishLesson(p, l.id);
      expect(doneShort(lang, p)).toBe(true);
      expect(lessonOpen(lang, long, met, true)).toBe(true);
    });
    it(`${lang}: a lesson meets, chooses, builds and writes each word, in that order`, () => {
      const l = LESSONS[lang][0], s = lessonSteps(l.words);
      const order = s.map((x) => x.kind);
      expect(order.slice(0, l.words.length).every((k) => k === 'meet')).toBe(true);
      expect(order.lastIndexOf('choose')).toBeLessThan(order.indexOf('build'));
      expect(order.lastIndexOf('build')).toBeLessThan(order.indexOf('write'));
      for (const w of l.words) expect(s.filter((x) => x.id === w.id && x.kind === 'write').length).toBe(1);
    });
    it(`${lang}: practice uses only learned words and offers three readable choices`, () => {
      const p = finishLesson(emptyProgress(), LESSONS[lang][0].id);
      const ids = new Set(LESSONS[lang][0].words.map((w) => w.id));
      const steps = practiceSteps(lang, p, 30);
      expect(steps).toHaveLength(30);
      expect(steps.every((x) => ids.has(x.id))).toBe(true);
      expect(new Set(steps.map((x) => x.kind)).size).toBe(3);
      const met = new Set(ORDER[lang]);
      for (const w of WORDS[lang]) expect(new Set(chooseOptions(lang, w.id, (x) => !!shownForm(lang, x, met)).map((x) => x.id)).size).toBe(3);
    });
  }
  it('English is read in capitals until the small letters are learned', () => {
    const caps = new Set(ORDER.en.filter((c) => c === c.toUpperCase()));
    const cat = WORDS.en.find((w) => w.id === 'cat')!;
    expect(shownForm('en', cat, caps)).toBe('CAT');
    expect(shownForm('en', cat, new Set(ORDER.en))).toBe('cat');
  });
});
