// Which reading texts still need questions (docs/english-reading.md). The first ten texts come first, because learners reach them first.
import { PASSAGES } from '../src/readingTexts';

const TARGET = 15, FIRST = 10;
const short = PASSAGES.map((p, i) => ({ id: p.id, index: i, grade: p.grade, questions: p.qs.length })).filter((p) => p.questions < TARGET);
const high = short.filter((p) => p.index < FIRST), low = short.filter((p) => p.index >= FIRST);
console.log(JSON.stringify({ high: high.slice(0, 2), low: high.length ? [] : low.slice(0, 1), textsLeft: short.length }, null, 1));
