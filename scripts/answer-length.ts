// Lists lessons whose right answers can be guessed by length: any answer clearly the longest, or the right answer the longest in more than 40% of the questions.
// Usage: npx tsx scripts/answer-length.ts [count]   prints the next lessons to fix and the overall share.
import { LESSONS } from '../src/knowledge/lessons';
import { giveaway, guessable, rightLongest } from '../src/knowledge/answer-length';

const all = LESSONS.flatMap((l) => [...l.qs, ...l.keys]);
const lessons = LESSONS.filter(guessable).map((l) => l.id);
console.log(JSON.stringify({ questions: all.length, rightIsLongest: `${Math.round((all.filter(rightLongest).length / all.length) * 100)}%`, giveaways: all.filter(giveaway).length, lessonsLeft: lessons.length, next: lessons.slice(0, Number(process.argv[2] ?? 5)) }, null, 1));
