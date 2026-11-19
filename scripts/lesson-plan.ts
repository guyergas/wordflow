// Splits N agents between the knowledge courses that still have work, for one run: `--agents 8`.
// Every open course gets one agent first, then each extra agent goes to the course with the most work left per agent.
// Prints [{ course, skip }]; each agent runs `next-lesson --course <course> --skip <skip>`, so no two agents get the same lesson.
import { LESSONS } from '../src/knowledge/lessons';
import { DEEP } from '../src/knowledge/deep';
import { NEW_LESSONS } from '../src/knowledge/new-lessons';

const ai = process.argv.indexOf('--agents'), N = ai > 0 ? Number(process.argv[ai + 1]) : 8;
const COURSES = ['sci', 'hist', 'jud', 'econ'], TARGET: Record<string, number> = { econ: 30, sci: 80, hist: 77, jud: 76 };
const full = (c: string) => Object.keys(DEEP).filter((id) => id.startsWith(`${c}.`)).length + NEW_LESSONS.filter((l) => l.course === c).length;
const short = (c: string) => LESSONS.filter((l) => l.course === c && !DEEP[l.id] && !NEW_LESSONS.includes(l) && !l.only).length;
const left = Object.fromEntries(COURSES.map((c) => [c, Math.max(short(c), TARGET[c] - full(c))]));
const open = COURSES.filter((c) => left[c] > 0), slots: Record<string, number> = {};
for (const c of open.slice(0, N)) slots[c] = 1;
for (let i = open.length; i < N; i++) {
  const c = open.filter((x) => slots[x] < left[x]).sort((a, b) => left[b] / (slots[b] + 1) - left[a] / (slots[a] + 1))[0];
  if (!c) break;
  slots[c]++;
}
console.log(JSON.stringify({ left, agents: Object.entries(slots).flatMap(([course, n]) => Array.from({ length: n }, (_, skip) => ({ course, skip }))) }));
