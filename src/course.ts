// Which course this device is on. It is read once at startup, and changing it reloads the app.
// A new course only needs a line here: it then appears in the picker, the switcher and the summary.
export type CourseId = 'en' | 'th' | 'math';
export interface CourseInfo { id: CourseId; name: string; hello: string; note: string; storageKey: string; defaultMinutes: number }
export const COURSES: CourseInfo[] = [
  { id: 'en', name: 'אנגלית', hello: 'Hello', note: 'מילים, איות ומשפטים', storageKey: 'wordflow.v1', defaultMinutes: 15 },
  { id: 'th', name: 'תאית', hello: 'sà-wàt-dii', note: 'מילים וביטויים ליום־יום, עם הקלטות', storageKey: 'wordflow.th.v1', defaultMinutes: 0 },
  { id: 'math', name: 'חשבון', hello: '7×8', note: 'מתחילים מהבסיס ומתקדמים בקצב אישי', storageKey: 'wordflow.math.v1', defaultMinutes: 15 },
];

const KEY = 'wordflow.course';
const valid = (v: string | null): v is CourseId => COURSES.some((c) => c.id === v);

function read(): CourseId | null {
  let asked: string | null = null;
  try { asked = new URLSearchParams(location.search).get('course'); } catch { /* no page here */ }
  try {
    if (valid(asked)) { localStorage.setItem(KEY, asked); return asked; }
    const saved = localStorage.getItem(KEY);
    if (valid(saved)) return saved;
    // A device that was already learning English stays exactly where it was.
    if (localStorage.getItem('wordflow.v1')) return 'en';
  } catch { /* storage is optional */ }
  return valid(asked) ? asked : null;
}

const found = read();
export const COURSE_CHOSEN = found !== null;
export const COURSE_ID: CourseId = found ?? 'en';
export const IS_THAI = COURSE_ID === 'th';
export const IS_MATH = COURSE_ID === 'math';
export const HAS_SPELLING = !IS_THAI;
export const STORAGE_KEY = COURSES.find((c) => c.id === COURSE_ID)!.storageKey;

/** English speaks to a girl and Thai speaks to a man. Thai wording goes second. */
export const x = (english: string, thai: string) => (IS_THAI ? thai : english);

export function switchCourse(id: CourseId) {
  try { localStorage.setItem(KEY, id); } catch { /* the choice lasts until the next launch */ }
  try {
    const url = new URL(location.href);
    url.searchParams.set('course', id);
    location.replace(url.toString());
  } catch { location.reload(); }
}
