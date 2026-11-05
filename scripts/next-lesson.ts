// Prints which lesson to write next, one at a time across the courses. Build and run: see docs/lesson-writing.md
import { LESSONS } from '../src/knowledge/lessons';
import { DEEP } from '../src/knowledge/deep';
import { NEW_LESSONS } from '../src/knowledge/new-lessons';

const ORDER = ['geo', 'sci', 'nature', 'hist', 'art', 'sport', 'heb', 'jud', 'food'], TARGET: Record<string, number> = { geo: 75, sci: 75, hist: 75 };
const targetOf = (c: string) => TARGET[c] ?? 60;
const full = (c: string) => Object.keys(DEEP).filter((id) => id.startsWith(`${c}.`)).length + NEW_LESSONS.filter((l) => l.course === c).length;
const counts = ORDER.map((c) => ({ c, n: full(c) }));
// The parent asked for the Hebrew grammar topics now, ahead of the rotation.
const GRAMMAR_FIRST = 16;
const hebNew = NEW_LESSONS.filter((l) => l.course === 'heb');
if (hebNew.length < GRAMMAR_FIRST) {
  const titles = LESSONS.filter((l) => l.course === 'heb').map((l) => l.title);
  console.log(JSON.stringify({ kind: 'new', course: 'heb', file: 'src/knowledge/new-lessons.ts', existingTitles: titles, counts }, null, 1));
  process.exit(0);
}
const open = counts.filter((x) => x.n < targetOf(x.c));
if (!open.length) { console.log(JSON.stringify({ done: true, counts })); process.exit(0); }
const low = Math.min(...open.map((x) => x.n));
const course = open.find((x) => x.n === low)!.c;
const all = LESSONS.filter((l) => l.course === course).sort((a, b) => a.level - b.level);
const next = all.find((l) => !DEEP[l.id] && !NEW_LESSONS.includes(l) && !l.only);
console.log(JSON.stringify(next
  ? { kind: 'expand', file: `src/knowledge/deep/${course}.ts`, id: next.id, level: next.level, title: next.title, idea: next.idea, keys: next.keys, text: next.text, counts }
  : { kind: 'new', course, file: 'src/knowledge/new-lessons.ts', existingTitles: all.map((l) => l.title), counts }, null, 1));
