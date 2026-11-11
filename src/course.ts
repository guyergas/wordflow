// Which course this device is on. It is read once at startup, and changing it reloads the app.
// A new course only needs a line here: it then appears in the picker, the switcher and the summary.
export type CourseId = 'en' | 'th' | 'math' | 'hist' | 'geo' | 'sci' | 'art' | 'nature' | 'sport' | 'heb' | 'jud' | 'food' | 'alef' | 'tots' | 'tinyen' | 'notes';
export interface CourseInfo { id: CourseId; name: string; hello: string; note: string; storageKey: string; defaultMinutes: number; short?: string; newLabel: string; knowledge?: boolean; alef?: boolean; tots?: boolean; tinyen?: boolean; notes?: boolean }
const K = (id: CourseId, name: string, short: string, hello: string, note: string): CourseInfo => ({ id, name, short, hello, note, storageKey: `wordflow.${id}.v1`, defaultMinutes: 0, newLabel: 'שיעורים חדשים', knowledge: true });
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
  K('food', 'תזונה', 'תזונה', 'C', 'איך הגוף משתמש באוכל, ומדע במטבח'),
  { id: 'alef', name: 'עברית לקטנטנים', short: 'עברית לקטנטנים', hello: 'אב', note: 'לזהות ולכתוב את האותיות, קו אחרי קו', storageKey: 'wordflow.alef.v1', defaultMinutes: 0, newLabel: 'אותיות חדשות', alef: true },
  { id: 'tots', name: 'חשבון לקטנטנים', short: 'חשבון לקטנטנים', hello: '1+1', note: 'מספרים, ספירה, חיבור וחיסור לגיל 5-6', storageKey: 'wordflow.tots.v1', defaultMinutes: 0, newLabel: 'דברים חדשים', tots: true },
  { id: 'tinyen', name: 'אנגלית לקטנטנים', short: 'אנגלית לקטנטנים', hello: 'ABC', note: 'ה־ABC: לזהות ולכתוב אותיות, עם מילים קלות', storageKey: 'wordflow.tinyen.v1', defaultMinutes: 0, newLabel: 'אותיות חדשות', tinyen: true },
  { id: 'notes', name: 'קריאת תווים בפסנתר', short: 'תווים', hello: '♩', note: 'לקרוא תווים ולנגן על המסך', storageKey: 'wordflow.notes.v1', defaultMinutes: 0, newLabel: 'שיעורים', notes: true },
];

const KEY = 'wordflow.course';
const valid = (v: string | null): v is CourseId => COURSES.some((c) => c.id === v);
// The alef-bet was briefly two courses, one per child. Each child now has a device, so an old link or device moves to the one course.
const current = (v: string | null) => (v === 'omer' || v === 'ido' ? 'alef' : v);
function moveOld(v: string | null) {
  if (v !== 'omer' && v !== 'ido') return;
  try { const old = localStorage.getItem(`wordflow.${v}.v1`); if (old && !localStorage.getItem('wordflow.alef.v1')) localStorage.setItem('wordflow.alef.v1', old); } catch { /* storage is optional */ }
}

// Each member of the family has courses of their own and separate progress in each, on the same device.
export const USERS = [{ id: 'guy', name: 'גיא', she: false }, { id: 'dikla', name: 'דיקלה', she: true }, { id: 'ayala', name: 'איילה', she: true }, { id: 'ofir', name: 'אופיר', she: true }, { id: 'omer', name: 'עומר', she: false }, { id: 'ido', name: 'עידו', she: false }];
const USER_KEY = 'wordflow.user', MOVED_KEY = 'wordflow.moved';
const uKey = (u: string, k: string) => `wordflow.u.${u}.${k}`;
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* this visit only */ } };
const listOf = (raw: string | null): CourseId[] => { try { return (JSON.parse(raw ?? '[]') as string[]).map(current).filter(valid); } catch { return []; } };

const savedUser = get(USER_KEY);
export const USER_ID = USERS.some((u) => u.id === savedUser) ? savedUser! : null;
export const USER_NAME = USERS.find((u) => u.id === USER_ID)?.name ?? '';
/** Wording for the person using the app: feminine for a girl or woman, and before anyone has signed in. */
export const g = (she: string, he: string) => (USERS.find((u) => u.id === USER_ID)?.she ?? true ? she : he);
/** A setting of the person using the app. Before anyone has signed in, it is the device's old setting. */
export const userKey = (k: string) => (USER_ID ? uKey(USER_ID, k) : `wordflow.${k}`);
let enrolled = USER_ID ? listOf(get(uKey(USER_ID, 'courses'))) : [];
export const enrolledCourses = () => enrolled;
export const myCourses = () => (USER_ID ? COURSES.filter((c) => enrolled.includes(c.id)) : COURSES);
export const storageKeyOf = (c: CourseInfo) => (USER_ID ? uKey(USER_ID, `data.${c.id}`) : c.storageKey);
const setEnrolled = (list: CourseId[]) => { enrolled = list; if (USER_ID) put(uKey(USER_ID, 'courses'), JSON.stringify(list)); };
// Omer and Ido get each little ones' course once, and can leave it like any other.
if ((USER_ID === 'omer' || USER_ID === 'ido') && enrolled.length) {
  for (const [flag, id] of [['gotTots', 'tots'], ['gotTinyEn', 'tinyen']] as const) {
    if (get(uKey(USER_ID, flag))) continue;
    put(uKey(USER_ID, flag), '1');
    if (!enrolled.includes(id)) setEnrolled([...enrolled, id]);
  }
}

function read(): CourseId | null {
  let asked: string | null = null;
  try { asked = new URLSearchParams(location.search).get('course'); } catch { /* no page here */ }
  moveOld(asked); asked = current(asked);
  { const was = get(KEY); moveOld(was); if (current(was) !== was) put(KEY, 'alef'); }
  if (USER_ID) {
    if (valid(asked)) { if (!enrolled.includes(asked)) setEnrolled([...enrolled, asked]); put(uKey(USER_ID, 'course'), asked); return asked; }
    const saved = get(uKey(USER_ID, 'course'));
    return valid(saved) && enrolled.includes(saved) ? saved : enrolled[0] ?? null;
  }
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
export const IS_TOTS = !!COURSE_INFO.tots;
export const IS_TINYEN = !!COURSE_INFO.tinyen;
export const IS_NOTES = !!COURSE_INFO.notes;
export const HAS_SPELLING = !IS_THAI;
export const STORAGE_KEY = storageKeyOf(COURSE_INFO);

/** Whatever was learned on this device before there were users. It goes to the first person who signs in. */
export const oldProgress = () => (get(MOVED_KEY) ? [] : COURSES.filter((c) => get(c.storageKey)));
function moveOldProgress(user: string) {
  if (get(MOVED_KEY)) return;
  const list = oldProgress();
  list.forEach((c) => put(uKey(user, `data.${c.id}`), get(c.storageKey)!));
  if (list.length) {
    const was = current(get(KEY)) as CourseId;
    put(uKey(user, 'courses'), JSON.stringify(list.map((c) => c.id)));
    if (list.some((c) => c.id === was)) put(uKey(user, 'course'), was);
    for (const k of ['schedule', 'goals']) { const v = get(`wordflow.${k}`); if (v) put(uKey(user, k), v); }
  }
  put(MOVED_KEY, '1');
}

const go = (course: string | null) => {
  try {
    const url = new URL(location.href);
    if (course) url.searchParams.set('course', course); else url.searchParams.delete('course');
    location.replace(url.toString());
  } catch { location.reload(); }
};
export function signIn(user: string) { moveOldProgress(user); put(USER_KEY, user); go(null); }
export function signOut() { try { localStorage.removeItem(USER_KEY); } catch { /* the choice lasts until the next launch */ } go(null); }
export function joinCourses(list: CourseId[]) { setEnrolled([...enrolled, ...list.filter((c) => !enrolled.includes(c))]); if (list[0]) switchCourse(list[0]); }
/** Leaving a course keeps its progress, which returns on joining again. */
export function leaveCourse(id: CourseId) {
  const rest = enrolled.filter((c) => c !== id);
  if (!rest.length) return;
  setEnrolled(rest);
  if (id === COURSE_ID) switchCourse(rest[0]);
}

/** English speaks to a girl and Thai speaks to a man. Thai wording goes second. */
export const x = (english: string, thai: string) => (IS_THAI ? thai : english);

export function switchCourse(id: CourseId) {
  put(USER_ID ? uKey(USER_ID, 'course') : KEY, id);
  go(id);
}
