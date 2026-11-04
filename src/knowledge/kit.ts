import { CourseId } from '../course';

export type QuizQ = [question: string, right: string, wrong: string[], why: string];
export interface Lesson { id: string; course: CourseId; level: 0 | 1 | 2; title: string; wiki: string; text: string; idea: string; qs: QuizQ[]; keys: QuizQ[] }
export const L = (course: CourseId, id: string, level: 0 | 1 | 2, title: string, wiki: string, text: string, idea: string, qs: QuizQ[], keys: QuizQ[]): Lesson => ({ id: `${course}.${id}`, course, level, title, wiki, text, idea, qs, keys });
type Rest = Parameters<typeof L> extends [CourseId, ...infer R] ? R : never;
export const bind = (c: CourseId) => (...a: Rest): Lesson => L(c, ...a);
