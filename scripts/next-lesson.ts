// Prints which lesson to write next, one at a time across the courses. Build and run: see docs/lesson-writing.md
import { LESSONS } from '../src/knowledge/lessons';
import { DEEP } from '../src/knowledge/deep';
import { NEW_LESSONS } from '../src/knowledge/new-lessons';

// Optional: `--course <id>` limits the answer to one course, so that one agent per course can work in parallel.
const ci = process.argv.indexOf('--course'), ONLY = ci > 0 ? process.argv[ci + 1] : undefined;
const mine = (id: string) => !ONLY || id.split('.')[0] === ONLY;
const ORDER = ['geo', 'sci', 'nature', 'hist', 'art', 'sport', 'heb', 'jud', 'food'], TARGET: Record<string, number> = { geo: 75, sci: 80, hist: 95, heb: 72, jud: 80 }; // sci, hist, heb and jud are higher so that every topic in docs/new-topics.md gets a lesson
const targetOf = (c: string) => TARGET[c] ?? 60;
const full = (c: string) => Object.keys(DEEP).filter((id) => id.startsWith(`${c}.`)).length + NEW_LESSONS.filter((l) => l.course === c).length;
const counts = ORDER.map((c) => ({ c, n: full(c) }));
// The parent asked to improve existing lessons before adding new ones:
// first lengthen the existing full lessons below the standard in docs/lesson-writing.md
// (more questions, answers that cannot be guessed by length), then expand the short lessons, and only then write new ones.
const MIN_WORDS = 950, MIN_QS = 18;
// The parent asked that the work always go in order: a lesson's place within its course comes first
// (the first lesson of every course, then the second of every course, and so on), then the course order.
const rank = (id: string) => LESSONS.filter((l) => l.course === id.split('.')[0]).findIndex((l) => l.id === id);
const byOrder = (a: { id: string }, b: { id: string }) => rank(a.id) - rank(b.id) || ORDER.indexOf(a.id.split('.')[0]) - ORDER.indexOf(b.id.split('.')[0]);
const words = (t: string) => t.split(/\s+/).length;
const allFull = [
  ...Object.entries(DEEP).map(([id, d]) => ({ id, file: `src/knowledge/deep/${id.split('.')[0]}.ts`, words: words(d.text), qs: d.qs.length })),
  ...NEW_LESSONS.map((l) => ({ id: l.id, file: 'src/knowledge/new-lessons.ts', words: words(l.text), qs: l.qs.length })),
].filter((x) => LESSONS.some((l) => l.id === x.id && !l.only));
const thin = allFull.filter((x) => (x.words < MIN_WORDS || x.qs < MIN_QS) && mine(x.id)).sort(byOrder);
if (thin.length) {
  const t = thin[0], l = LESSONS.find((x) => x.id === t.id)!;
  console.log(JSON.stringify({ kind: 'lengthen', ...t, title: l.title, level: l.level, idea: l.idea, keys: l.keys, left: thin.length, counts }, null, 1));
  process.exit(0);
}
const short = LESSONS.filter((l) => !DEEP[l.id] && !NEW_LESSONS.includes(l) && !l.only && mine(l.id));
if (short.length) {
  const l = [...short].sort(byOrder)[0], c = l.course;
  console.log(JSON.stringify({ kind: 'expand', file: `src/knowledge/deep/${c}.ts`, id: l.id, level: l.level, title: l.title, idea: l.idea, keys: l.keys, text: l.text, counts }, null, 1));
  process.exit(0);
}
// The parent asked for the Hebrew grammar topics now, ahead of the rotation.
const GRAMMAR_FIRST = 16;
const hebNew = NEW_LESSONS.filter((l) => l.course === 'heb');
if (hebNew.length < GRAMMAR_FIRST && (!ONLY || ONLY === 'heb')) {
  const titles = LESSONS.filter((l) => l.course === 'heb').map((l) => l.title);
  console.log(JSON.stringify({ kind: 'new', course: 'heb', file: 'src/knowledge/new-lessons.ts', existingTitles: titles, counts }, null, 1));
  process.exit(0);
}
const open = counts.filter((x) => x.n < targetOf(x.c) && (!ONLY || x.c === ONLY));
if (!open.length) { console.log(JSON.stringify({ done: true, counts })); process.exit(0); }
const low = Math.min(...open.map((x) => x.n));
const course = open.find((x) => x.n === low)!.c;
const all = LESSONS.filter((l) => l.course === course).sort((a, b) => a.level - b.level);
const next = all.find((l) => !DEEP[l.id] && !NEW_LESSONS.includes(l) && !l.only);
console.log(JSON.stringify(next
  ? { kind: 'expand', file: `src/knowledge/deep/${course}.ts`, id: next.id, level: next.level, title: next.title, idea: next.idea, keys: next.keys, text: next.text, counts }
  : { kind: 'new', course, file: 'src/knowledge/new-lessons.ts', existingTitles: all.map((l) => l.title), counts }, null, 1));
