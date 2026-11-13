// Achievements shared with the whole family (each family has its own): one line each time someone finishes something new.
// Like the study times, they are open by the family's choice, and hold only a name, a course and a title.
import { COURSE_INFO, USER_ID, USERS } from './course';
import { dbUrl } from './familySync';
import { pushProgress } from './progressSync';

export interface Win { user: string; course: string; title: string; kind: 'lesson' | 'skill' | 'grammar' | 'reading'; at: number; style: number }

const g = (user: string, f: string, m: string) => (USERS.find((u) => u.id === user)?.she ?? true ? f : m);

/** Cheering lines. {n} is the name, {t} what was done ("שיעור על המונה ליזה"), {c} the course. */
const STYLES: ((n: string, t: string, c: string, u: string) => string)[] = [
  (n, t, _c, u) => `${n} ${g(u, 'סיימה', 'סיים')} ${t}, כל הכבוד!`,
  (n, t, _c, u) => `עוד צעד קדימה: ${n} ${g(u, 'השלימה', 'השלים')} ${t}!`,
  (n, t, _c, u) => `${n} ${g(u, 'למדה', 'למד')} משהו חדש היום: ${t}. איזה יופי!`,
  (n, t, _c, u) => `יש! ${n} ${g(u, 'סיימה', 'סיים')} ${t} 🎉`,
  (n, t, _c, u) => `מחיאות כפיים ל${n}, ${g(u, 'שסיימה', 'שסיים')} ${t} 👏`,
  (n, t, _c, u) => `${n} ${g(u, 'ממשיכה', 'ממשיך')} לטפס: ${t} ${g(u, 'מאחוריה', 'מאחוריו')}!`,
  (n, t, _c, u) => `ידע חדש בבית! ${n} ${g(u, 'סיימה', 'סיים')} ${t}.`,
  (n, t, _c, u) => `${n} ${g(u, 'התמידה', 'התמיד')} ו${g(u, 'סיימה', 'סיים')} ${t}. גאים בך!`,
  (n, t) => `כוכב של היום: ${n}, עם ${t} ⭐`,
  (n, t, _c, u) => `${n} ${g(u, 'כבשה', 'כבש')} עוד פסגה: ${t}!`,
  (n, t, _c, u) => `איזה כיף לראות: ${n} ${g(u, 'סיימה', 'סיים')} ${t}. ככה ממשיכים!`,
  (n, t, _c, u) => `${n} ${g(u, 'הוסיפה', 'הוסיף')} לבנה לחומה: ${t} 🧱`,
  (n, t, _c, u) => `חדשות טובות: ${n} ${g(u, 'סיימה', 'סיים')} ${t}!`,
  (n, t, _c, u) => `${n} ${g(u, 'יודעת', 'יודע')} עכשיו יותר: ${t} הושלם!`,
  (n, t) => `תנו כיף ל${n}! ${t} ✓`,
  (n, t, _c, u) => `${n} לא ${g(u, 'עוצרת', 'עוצר')}: גם ${t} הושלם 🚀`,
];

const LEAD: Record<Win['kind'], string> = { lesson: 'שיעור על', skill: 'נושא חדש בחשבון:', grammar: 'נושא בדקדוק אנגלית:', reading: 'קטע קריאה באנגלית:' };
export const whatOf = (w: Win) => `${LEAD[w.kind]} ${w.title}`;
export const lineOf = (w: Win) => STYLES[w.style % STYLES.length](USERS.find((u) => u.id === w.user)?.name ?? '', whatOf(w), w.course, w.user);

/** Records an achievement of the signed-in user. Without a network it is lost, which is acceptable for a cheer. */
export function pushWin(kind: Win['kind'], title: string) {
  pushProgress();
  if (!dbUrl() || !USER_ID) return;
  const win: Win = { user: USER_ID, course: COURSE_INFO.short ?? COURSE_INFO.name, title, kind, at: Date.now(), style: Math.floor(Math.random() * STYLES.length) };
  void fetch(`${dbUrl()}/wins.json`, { method: 'POST', body: JSON.stringify(win) }).catch(() => undefined);
}

export const readWins = async (): Promise<Win[]> => {
  const d = (await (await fetch(`${dbUrl()}/wins.json`)).json()) as Record<string, Win> | null;
  // Achievements are kept for two weeks. Whoever opens the screen removes older ones for everyone.
  const old = Date.now() - KEEP_DAYS * 864e5;
  for (const [k, w] of Object.entries(d ?? {})) if (!w || !(w.at > old)) void fetch(`${dbUrl()}/wins/${k}.json`, { method: 'DELETE' }).catch(() => undefined);
  return Object.values(d ?? {}).filter((w) => w && w.user && w.title && w.at > old && USERS.some((u) => u.id === w.user)).sort((a, b) => b.at - a.at);
};
export const KEEP_DAYS = 14;
export const STYLE_COUNT = STYLES.length;
