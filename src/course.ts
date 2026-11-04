// Which language this device is learning. It is read once at startup, and changing it reloads the app.
export type CourseId = 'en' | 'th';

const KEY = 'wordflow.course';
const valid = (v: string | null): v is CourseId => v === 'en' || v === 'th';

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
export const HAS_SPELLING = !IS_THAI;
export const STORAGE_KEY = IS_THAI ? 'wordflow.th.v1' : 'wordflow.v1';

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
