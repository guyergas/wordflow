// Progress in the words track, kept apart from the letters so that it never changes a letter's stage.
import { LESSONS, Lang, LittleWord, WORDS } from './data';

export type Kind = 'meet' | 'choose' | 'build' | 'write';
export interface WStep { kind: Kind; id: string }
export interface WProgress { lessons: Record<string, number>; words: Record<string, { ok: number; bad: number }> }
export const emptyProgress = (): WProgress => ({ lessons: {}, words: {} });

const shuffle = <T,>(a: T[], rnd: () => number) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
export const REPEAT = { choose: 2, build: 2, write: 1 };

/** A lesson: meet each word, then choose each one a few times, then build it, then write it with an example above. */
export function lessonSteps(words: LittleWord[], rnd: () => number = Math.random): WStep[] {
  const phase = (kind: Kind, n: number) => shuffle(words.flatMap((w) => Array.from({ length: n }, () => ({ kind, id: w.id }))), rnd);
  return [...words.map((w) => ({ kind: 'meet' as Kind, id: w.id })), ...phase('choose', REPEAT.choose), ...phase('build', REPEAT.build), ...phase('write', REPEAT.write)];
}

/** Practice: words from lessons already done, the weaker ones more often, and the exercise kinds mixed. */
export function practiceSteps(lang: Lang, p: WProgress, count = 12, rnd: () => number = Math.random): WStep[] {
  const learned = LESSONS[lang].filter((l) => p.lessons[l.id]).flatMap((l) => l.words);
  if (!learned.length) return [];
  const weight = (w: LittleWord) => { const s = p.words[w.id]; return 1 + (s ? s.bad * 2 / (1 + s.ok) : 1); };
  const kinds: Kind[] = ['choose', 'build', 'write', 'choose', 'build'];
  const out: WStep[] = [];
  for (let i = 0; i < count; i++) {
    const total = learned.reduce((a, w) => a + weight(w), 0);
    let r = rnd() * total, pick = learned[0];
    for (const w of learned) { r -= weight(w); if (r <= 0) { pick = w; break; } }
    if (out.length && out[out.length - 1].id === pick.id && learned.length > 1) { i--; continue; }
    out.push({ kind: kinds[Math.floor(rnd() * kinds.length)], id: pick.id });
  }
  return out;
}

export const record = (p: WProgress, id: string, ok: boolean): WProgress => {
  const s = p.words[id] ?? { ok: 0, bad: 0 };
  return { ...p, words: { ...p.words, [id]: ok ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 } } };
};
export const finishLesson = (p: WProgress, id: string): WProgress => ({ ...p, lessons: { ...p.lessons, [id]: (p.lessons[id] ?? 0) + 1 } });
export const doneShort = (lang: Lang, p: WProgress) => LESSONS[lang].filter((l) => !l.long).every((l) => p.lessons[l.id]);
export const wordOf = (lang: Lang, id: string) => WORDS[lang].find((w) => w.id === id)!;

/** Three written words to choose from: the right one and two others that can be read too, of similar length. */
export function chooseOptions(lang: Lang, id: string, readable: (w: LittleWord) => boolean, rnd: () => number = Math.random): LittleWord[] {
  const w = wordOf(lang, id);
  const pool = WORDS[lang].filter((x) => x.id !== id && readable(x));
  const near = pool.filter((x) => Math.abs(x.text.length - w.text.length) <= 1 && [...x.text].some((c) => w.text.includes(c)));
  return shuffle([w, ...shuffle(near.length >= 2 ? near : pool, rnd).slice(0, 2)], rnd);
}
