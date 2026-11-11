// Lists lessons whose right answers can be guessed by length: any answer clearly the longest, or the right answer the longest in more than 40% of the questions.
// Usage: npx tsx scripts/answer-length.ts [count] [course]   prints the next lessons to fix and the overall share; with a course, only its lessons.
import { LESSONS } from '../src/knowledge/lessons';
import { giveaway, guessable, rightLongest } from '../src/knowledge/answer-length';

const all = LESSONS.flatMap((l) => [...l.qs, ...l.keys]);
// In order, like the lessons: a lesson's place within its course first, then the course order.
const ORDER = ['geo', 'sci', 'nature', 'hist', 'art', 'sport', 'heb', 'jud', 'food'];
const rank = (id: string) => LESSONS.filter((l) => l.course === id.split('.')[0]).findIndex((l) => l.id === id);
const lessons = LESSONS.filter(guessable).filter((l) => !process.argv[3] || l.course === process.argv[3]).map((l) => l.id).sort((a, b) => rank(a) - rank(b) || ORDER.indexOf(a.split('.')[0]) - ORDER.indexOf(b.split('.')[0]));
console.log(JSON.stringify({ questions: all.length, rightIsLongest: `${Math.round((all.filter(rightLongest).length / all.length) * 100)}%`, giveaways: all.filter(giveaway).length, lessonsLeft: lessons.length, next: lessons.slice(0, Number(process.argv[2] ?? 5)) }, null, 1));
