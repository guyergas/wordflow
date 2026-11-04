// Which course this device is on. It is read once at startup, and changing it reloads the app.
// A new course only needs a line here: it then appears in the picker, the switcher and the summary.
export type CourseId = 'en' | 'th' | 'math' | 'hist' | 'geo' | 'sci' | 'art' | 'nature' | 'sport' | 'heb' | 'jud' | 'omer' | 'ido';
export interface CourseInfo { id: CourseId; name: string; hello: string; note: string; storageKey: string; defaultMinutes: number; short?: string; newLabel: string; knowledge?: boolean; alef?: boolean }
const K = (id: CourseId, name: string, short: string, hello: string, note: string): CourseInfo => ({ id, name, short, hello, note, storageKey: `wordflow.${id}.v1`, defaultMinutes: 0, newLabel: 'שיעורים חדשים', knowledge: true });
const A = (id: CourseId, kid: string): CourseInfo => ({ id, name: `א״ב של ${kid}`, short: `א״ב ${kid}`, hello: 'אב', note: 'לזהות ולכתוב את האותיות, קו אחרי קו', storageKey: `wordflow.${id}.v1`, defaultMinutes: 0, newLabel: 'אותיות חדשות', alef: true });
export const COURSES: CourseInfo[] = [
  { id: 'en', name: 'אנגלית', hello: 'Hello', note: 'מילים, איות ומשפטים', storageKey: 'wordflow.v1', defaultMinutes: 15, newLabel: 'מילים חדשות' },
  { id: 'th', name: 'תאית', hello: 'sà-wàt-dii', note: 'מילים וביטויים ליום־יום, עם הקלטות', storageKey: 'wordflow.th.v1', defaultMinutes: 0, newLabel: 'מילים חדשות' },
  { id: 'math', name: 'חשבון', hello: '7×8', note: 'מתחילים מהבסיס ומתקדמים בקצב אישי', storageKey: 'wordflow.math.v1', defaultMinutes: 15, newLabel: 'מיומנויות חדשות' },
  K('hist', 'היסטוריה ואזרחות', 'היסטוריה', '1948', 'אירועים, מנהיגים ואיך קובעים דברים'),
  K('geo', 'גאוגרפיה', 'גאוגרפיה', 'N', 'יבשות, ארצות, הרים ונהרות'),
  K('sci', 'מדע וטכנולוגיה', 'מדע', 'H₂O', 'איך הדברים עובדים'),
  K('art', 'תרבות ואמנות', 'תרבות', '♪', 'ספרות, ציור, מוזיקה וקולנוע'),
  K('nature', 'טבע ובעלי חיים', 'טבע', '~', 'מינים, מערכות טבע ותופעות'),
  K('sport', 'ספורט', 'ספורט', '42.195', 'ענפים, תחרויות ואנשים'),
  K('heb', 'שפה ועברית', 'עברית', 'א', 'שורשים, פתגמים וכללי לשון'),
  K('jud', 'יהדות ומסורת', 'יהדות', 'תנ״ך', 'חגים, מקורות והיסטוריה'),
  // One line per child, so each one keeps separate progress and separate time in the summary.
  A('omer', 'עומר'),
  A('ido', 'עידו'),
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
export const COURSE_INFO = COURSES.find((c) => c.id === COURSE_ID)!;
export const IS_KNOWLEDGE = !!COURSE_INFO.knowledge;
export const IS_ALEF = !!COURSE_INFO.alef;
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
