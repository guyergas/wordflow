// Lists knowledge questions whose right answer stands out as the longest, so it can be guessed without reading.
// Usage: npx tsx scripts/answer-length.ts [count]   prints the next lessons to fix and the overall share.
import { LESSONS } from '../src/knowledge/lessons';

const giveaway = (right: string, wrong: string[]) => wrong.length > 0 && right.length > Math.max(...wrong.map((w) => w.length)) * 1.15;
const all = LESSONS.flatMap((l) => [...l.qs, ...l.keys].map((q) => ({ l, q })));
const bad = all.filter(({ q }) => giveaway(q[1], q[2]));
const longest = all.filter(({ q }) => q[2].every((w) => q[1].length >= w.length)).length;
const lessons = [...new Set(bad.map((x) => x.l.id))];
console.log(JSON.stringify({ questions: all.length, rightIsLongest: `${Math.round((longest / all.length) * 100)}%`, giveaways: bad.length, lessonsLeft: lessons.length, next: lessons.slice(0, Number(process.argv[2] ?? 5)) }, null, 1));
