import { CourseId } from '../course';

export type QuizQ = [question: string, right: string, wrong: string[], why: string];
export interface Lesson { id: string; course: CourseId; level: 0 | 1 | 2; title: string; wiki: string; text: string; idea: string; qs: QuizQ[]; keys: QuizQ[] }
export const L = (course: CourseId, id: string, level: 0 | 1 | 2, title: string, wiki: string, text: string, idea: string, qs: QuizQ[], keys: QuizQ[]): Lesson => ({ id: `${course}.${id}`, course, level, title, wiki, text, idea, qs, keys });
type Rest = Parameters<typeof L> extends [CourseId, ...infer R] ? R : never;
export const bind = (c: CourseId) => (...a: Rest): Lesson => L(c, ...a);

/** Splits long paragraphs into short ones of two or three sentences, so a text is comfortable to read on a phone. Never inside a marked sentence. */
export function shortParagraphs(text: string, words = 32): string[] {
  const out: string[] = [];
  for (const para of text.split('\n\n')) {
    const sentences = para.match(/(\[\[[\s\S]*?\]\]|[^[]|\[(?!\[))+?(?:[.?!]״?(?=\s|$)|$)(?:\]\])?/g)?.map((x) => x.trim()).filter(Boolean) ?? [para];
    let now = '';
    for (const x of sentences) {
      now = now ? `${now} ${x}` : x;
      if (now.split(/\s+/).length >= words) { out.push(now); now = ''; }
    }
    if (now) out.push(now);
  }
  return out;
}
