// The math content: stations 1-7 are the basics, and 8-10 are data, angles and the bridge into middle school.
// A skill generates a fresh question each time, so she cannot succeed by remembering an answer.
// Text inside [[...]] is math: it reads left to right, and a/b is drawn as a fraction.
export type Rnd = () => number;
export type Domain = 'num' | 'frac' | 'shape';
export type Measure = 'u' | 'e';

export type Fig =
  | { t: 'line'; from: number; to: number; step: number; mark?: number; start?: number; jump?: number }
  | { t: 'fracline'; den: number; mark: number }
  | { t: 'bar'; parts: number; shaded: number }
  | { t: 'array'; rows: number; cols: number }
  | { t: 'hundred'; shaded: number }
  | { t: 'grid'; w: number; h: number }
  | { t: 'rect'; w: number; h: number; unit: string }
  | { t: 'tri'; b: number; h: number; unit: string }
  | { t: 'lshape'; w: number; h: number; cutW: number; cutH: number; unit: string }
  | { t: 'box'; a: number; b: number; c: number; unit: string }
  | { t: 'chart'; bars: { label: string; value: number }[]; step: number };

export interface Choice { label: string; trap?: TrapId }
export interface Question {
  measure: Measure; prompt: string; big?: string; answer: string;
  exact?: boolean; choices?: Choice[]; wrong?: [string, TrapId?][];
  fig?: Fig; needFig?: boolean; pencil?: boolean; read?: boolean; dot?: boolean; frac?: boolean;
  steps: string[]; eq?: string; concept?: boolean;
}

export const TRAPS = {
  carry: { name: 'נשיאה בחיבור', explain: 'כשסכום של ספרות מגיע ל־10 ומעלה, מעבירים 1 לטור הבא.' },
  borrow: { name: 'פריטה בחיסור', explain: 'כשהספרה למעלה קטנה יותר, לא מחליפים סדר. לוקחים 1 מהטור הבא.' },
  place: { name: 'ערך המקום', explain: 'אותה ספרה שווה יותר ככל שהיא משמאל: יחידות, עשרות, מאות.' },
  op: { name: 'בחירת הפעולה', explain: 'כדאי לקרוא שוב ולשאול: הכמות גדלה, קטנה, או שמחלקים אותה?' },
  order: { name: 'סדר פעולות', explain: 'כפל וחילוק קודמים לחיבור וחיסור, אלא אם יש סוגריים.' },
  table: { name: 'לוח הכפל', explain: 'כדאי לבנות מכפלה ממה שכבר ידוע, למשל 7×8 הוא 7×4 ועוד 7×4.' },
  remainder: { name: 'שארית', explain: 'השארית תמיד קטנה מהמספר שמחלקים בו.' },
  fracCross: { name: 'חיבור מונים ומכנים', explain: 'מחברים חלקים שווים. המכנה אומר מה גודל החלק, ולכן לא מחברים אותו.' },
  fracDen: { name: 'מכנה גדול נראה שבר גדול', explain: 'ככל שמחלקים ליותר חלקים, כל חלק קטן יותר.' },
  fracExpand: { name: 'הרחבה וצמצום', explain: 'בהרחבה ובצמצום עושים את אותה פעולה גם למונה וגם למכנה.' },
  fracMul: { name: 'כפל בשברים', explain: 'בכפל שברים כופלים מונה במונה ומכנה במכנה, ולא צריך מכנה משותף.' },
  fracDiv: { name: 'חילוק בשברים', explain: 'חילוק בשבר הוא כפל בשבר ההפוך.' },
  decLen: { name: 'עשרוני ארוך נראה גדול', explain: 'משווים ספרה אחר ספרה מהנקודה. 0.5 גדול מ־0.25, כי 5 עשיריות הן יותר מ־2 עשיריות.' },
  decPoint: { name: 'מקום הנקודה', explain: 'כדאי לאמוד קודם בערך כמה יצא, וכך לבדוק איפה הנקודה.' },
  percent: { name: 'אחוזים', explain: 'אחוז הוא חלק ממאה. 25% הם רבע, ו־10% הם עשירית.' },
  areaPerim: { name: 'שטח מול היקף', explain: 'היקף הוא האורך מסביב. שטח הוא כמה משבצות יש בפנים.' },
  triHalf: { name: 'שטח משולש', explain: 'משולש הוא חצי ממלבן עם אותו בסיס ואותו גובה, ולכן מחלקים ב־2.' },
  unit: { name: 'המרת יחידות', explain: 'יחידה קטנה יותר דורשת מספר גדול יותר: 1 מטר הוא 100 סנטימטרים.' },
  volume: { name: 'נפח מול שטח פנים', explain: 'נפח הוא כמה קוביות נכנסות. כופלים אורך, רוחב וגובה.' },
} as const;
export type TrapId = keyof typeof TRAPS;

export const STATIONS: { id: number; name: string; blurb: string; domain: Domain }[] = [
  { id: 1, name: 'חיבור וחיסור', blurb: 'עובדות, עשרות ואחדות', domain: 'num' },
  { id: 2, name: 'כפל וחילוק', blurb: 'משמעות ולוח הכפל', domain: 'num' },
  { id: 3, name: 'מספרים גדולים', blurb: 'מאונך, שארית וסדר פעולות', domain: 'num' },
  { id: 4, name: 'שברים: ההתחלה', blurb: 'מה זה שבר ואיך משווים', domain: 'frac' },
  { id: 5, name: 'פעולות בשברים', blurb: 'מרחיבים, מצמצמים ומחשבים', domain: 'frac' },
  { id: 6, name: 'עשרוניים ואחוזים', blurb: 'שלוש דרכים לכתוב חלק', domain: 'frac' },
  { id: 7, name: 'צורות ומדידה', blurb: 'יחידות, שטח, היקף ונפח', domain: 'shape' },
  { id: 8, name: 'נתונים וזוויות', blurb: 'ממוצע, טבלאות ומעלות', domain: 'shape' },
  { id: 9, name: 'מספרים שליליים וחזקות', blurb: 'מתחת לאפס, ריבועים ושורשים', domain: 'num' },
  { id: 10, name: 'ביטויים ומשוואות', blurb: 'אות במקום מספר', domain: 'num' },
  // Junior high, grades 7-9. Skills are added to these stations over time (docs/math-junior-high.md); an empty station is skipped.
  { id: 11, name: 'אלגברה: ביטויים', blurb: 'פילוג, כינוס ופתיחת סוגריים', domain: 'num' },
  { id: 12, name: 'משוואות ואי־שוויונות', blurb: 'משוואות מכל הסוגים ובעיות מילוליות', domain: 'num' },
  { id: 13, name: 'פונקציה קווית', blurb: 'שיפוע, נקודות וגרפים', domain: 'num' },
  { id: 14, name: 'מערכת משוואות', blurb: 'שתי משוואות, שני נעלמים', domain: 'num' },
  { id: 15, name: 'חזקות ושורשים', blurb: 'חוקי חזקות, כתיב מדעי ושורשים', domain: 'num' },
  { id: 16, name: 'ביטויים ריבועיים', blurb: 'נוסחאות כפל מקוצר, פירוק ומשוואה ריבועית', domain: 'num' },
  { id: 17, name: 'יחס, פרופורציה ואחוזים', blurb: 'פרופורציה, שינוי באחוזים וריבית', domain: 'frac' },
  { id: 18, name: 'זוויות ומשולשים', blurb: 'ישרים מקבילים, סכום זוויות ומשולשים', domain: 'shape' },
  { id: 19, name: 'פיתגורס ומעגל', blurb: 'משפט פיתגורס, היקף ושטח עיגול', domain: 'shape' },
  { id: 20, name: 'גופים ודמיון', blurb: 'נפח ושטח פנים, משולשים דומים', domain: 'shape' },
  { id: 21, name: 'סטטיסטיקה והסתברות', blurb: 'חציון, שכיח והסתברות פשוטה', domain: 'shape' },
];
export const DOMAINS: { id: Domain; name: string }[] = [
  { id: 'num', name: 'מספרים ופעולות' }, { id: 'frac', name: 'שברים, עשרוניים ואחוזים' }, { id: 'shape', name: 'צורות ומדידה' },
];

// ---------- Small helpers ----------
export function seeded(seed: number): Rnd {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ri = (r: Rnd, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const pick = <T,>(r: Rnd, a: readonly T[]): T => a[Math.floor(r() * a.length)];
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
const n = (v: number) => String(v);
export const fmt = (v: number) => (Math.abs(v) >= 1000 ? v.toLocaleString('en-US') : String(v));
const f = (a: number, b: number) => `${a}/${b}`;
const reduced = (a: number, b: number) => { const g = gcd(a, b); return b / g === 1 ? n(a / g) : f(a / g, b / g); };
/** A decimal from an integer count of tenths, hundredths and so on, with no floating point. */
export function dec(v: number, places: number): string {
  const s = String(Math.abs(v)).padStart(places + 1, '0');
  const whole = s.slice(0, s.length - places), part = s.slice(s.length - places).replace(/0+$/, '');
  return (v < 0 ? '-' : '') + whole + (part ? `.${part}` : '');
}
const PLACE = ['יחידות', 'עשרות', 'מאות', 'אלפים', 'עשרות אלפים', 'מאות אלפים'];
const digits = (v: number) => [...String(v)].reverse().map(Number);

function addSteps(a: number, b: number): string[] {
  const x = digits(a), y = digits(b), out: string[] = [];
  let c = 0;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const s = (x[i] ?? 0) + (y[i] ?? 0) + c;
    out.push(`${PLACE[i]}: [[${x[i] ?? 0}+${y[i] ?? 0}${c ? '+1' : ''}=${s}]]${s >= 10 ? `. כותבים [[${s % 10}]] ומעבירים [[1]] לטור הבא` : ''}`);
    c = s >= 10 ? 1 : 0;
  }
  if (c) out.push(`נשאר [[1]] בטור הבא, וכותבים אותו בתחילת המספר`);
  return out;
}
function subSteps(a: number, b: number): string[] {
  const x = digits(a), y = digits(b), out: string[] = [];
  let br = 0;
  for (let i = 0; i < x.length; i++) {
    const top = x[i] - br, bot = y[i] ?? 0;
    if (!bot && !br && i >= y.length) continue;
    if (top < bot) { out.push(`${PLACE[i]}: [[${top}]] קטן מ־[[${bot}]], לוקחים [[1]] מהטור הבא: [[${top + 10}−${bot}=${top + 10 - bot}]]`); br = 1; }
    else { out.push(`${PLACE[i]}: [[${top}−${bot}=${top - bot}]]`); br = 0; }
  }
  return out;
}
function mulSteps(a: number, d: number): string[] {
  const x = digits(a), out: string[] = [];
  let c = 0;
  x.forEach((v, i) => {
    const s = v * d + c;
    out.push(`${PLACE[i]}: [[${v}×${d}${c ? `+${c}` : ''}=${s}]]${s >= 10 && i < x.length - 1 ? `. כותבים [[${s % 10}]] ומעבירים [[${Math.floor(s / 10)}]]` : ''}`);
    c = Math.floor(s / 10);
  });
  return out;
}
function divSteps(a: number, d: number): string[] {
  const out: string[] = [];
  let cur = 0;
  for (const ch of String(a)) {
    cur = cur * 10 + Number(ch);
    if (cur < d && !out.length) continue;
    const q = Math.floor(cur / d);
    out.push(`[[${d}]] נכנס ב־[[${cur}]] [[${q}]] פעמים. [[${q}×${d}=${q * d}]], ונשאר [[${cur - q * d}]]`);
    cur -= q * d;
  }
  return out;
}

const THINGS = ['גולות', 'מדבקות', 'קלפים', 'עפרונות', 'ספרים', 'תפוחים'];
const KIDS = ['נועה', 'מאיה', 'תמר', 'יעל', 'שירה', 'רוני'];

type Opt = Partial<Question> & { big?: string; ans: string; steps: string[] };
const calc = ({ ans, ...o }: Opt): Question => ({ measure: 'e', prompt: 'כמה זה?', answer: ans, ...o });
const conceptQ = (prompt: string, ans: string, others: (string | [string, TrapId])[], steps: string[], o: Partial<Question> = {}): Question => {
  const seen = new Map<string, Choice>([[ans, { label: ans }]]);
  for (const x of others) { const c: Choice = typeof x === 'string' ? { label: x } : { label: x[0], trap: x[1] }; if (!seen.has(c.label)) seen.set(c.label, c); }
  return { measure: 'u', prompt, answer: ans, concept: true, steps, choices: [...seen.values()], ...o };
};

export interface Skill { id: string; station: number; title: string; needs: string[]; e?: (r: Rnd) => Question; u?: (r: Rnd) => Question }

function cmpAnswer(a: number, b: number) { return a > b ? '>' : a < b ? '<' : '='; }
const CMP = ['>', '<', '='];

export const SKILLS: Skill[] = [
  // ---------- Station 1 ----------
  { id: 'add20', station: 1, title: 'חיבור עד 20', needs: [], e: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 2, 11);
    const to10 = 10 - a;
    return calc({ big: `[[${a}+${b}]]`, ans: n(a + b), wrong: [[n(a + b - 1)], [n(a + b + 1)], [n(Math.abs(a - b)), 'op']],
      steps: b > to10 ? [`משלימים ל־[[10]]: [[${a}+${to10}=10]]`, `נשאר להוסיף [[${b - to10}]]`] : [`סופרים קדימה [[${b}]] צעדים מ־[[${a}]]`], fig: { t: 'line', from: 0, to: 20, step: 1, start: a, jump: b } });
  } },
  { id: 'sub20', station: 1, title: 'חיסור עד 20', needs: ['add20'], e: (r) => {
    const b = ri(r, 2, 9), s = ri(r, b + 1, 20);
    return calc({ big: `[[${s}−${b}]]`, ans: n(s - b), wrong: [[n(s - b + 1)], [n(s - b - 1)], [n(s + b), 'op']],
      steps: [`מתחילים מ־[[${s}]] וחוזרים [[${b}]] צעדים אחורה`, `אפשר לבדוק בחיבור: התוצאה ועוד [[${b}]] צריכה לתת [[${s}]]`], fig: { t: 'line', from: 0, to: 20, step: 1, start: s, jump: -b } });
  } },
  { id: 'missing', station: 1, title: 'המספר החסר', needs: ['add20', 'sub20'], u: (r) => {
    const a = ri(r, 3, 12), b = ri(r, 3, 9), s = a + b;
    const pool = [n(b), n(s), n(a + b + 1), n(Math.max(1, b - 1))];
    return { measure: 'u', prompt: 'איזה מספר חסר?', big: `[[${a}+▢=${s}]]`, answer: n(b), choices: [...new Set(pool)].map((label) => ({ label })), wrong: [[n(s), 'op']],
      steps: [`מחפשים כמה חסר מ־[[${a}]] עד [[${s}]]`, `זה תרגיל חיסור: [[${s}−${a}]]`] };
  } },
  { id: 'tens', station: 1, title: 'עשרות שלמות', needs: ['add20', 'sub20'], e: (r) => {
    const a = ri(r, 2, 8), b = ri(r, 1, 9 - a), plus = r() < 0.6;
    if (plus) return calc({ big: `[[${a * 10}+${b * 10}]]`, ans: n((a + b) * 10), wrong: [[n(a + b)], [n((a + b) * 10 + 10)]], steps: [`חושבים בעשרות: [[${a}+${b}=${a + b}]] עשרות`] });
    return calc({ big: `[[${(a + b) * 10}−${b * 10}]]`, ans: n(a * 10), wrong: [[n(a)], [n((a + 1) * 10)]], steps: [`חושבים בעשרות: [[${a + b}−${b}=${a}]] עשרות`] });
  } },
  { id: 'place2', station: 1, title: 'עשרות ויחידות', needs: ['tens'], u: (r) => {
    const t = ri(r, 1, 9), u = ri(r, 1, 9), v = t * 10 + u, askT = r() < 0.6 && t !== u;
    if (askT) return conceptQ(`כמה שווה הספרה ${t} במספר [[${v}]]?`, n(t * 10), [[n(t), 'place'], n(v), n(t + u)].filter((x) => (typeof x === 'string' ? x : x[0]) !== n(t * 10)) as (string | [string, TrapId])[], [`הספרה [[${t}]] נמצאת במקום העשרות`, `לכן היא שווה [[${t}]] עשרות`]);
    return conceptQ(`כמה עשרות שלמות יש ב־[[${v}]]?`, n(t), [[n(t * 10), 'place'], n(u + 10), n(t + u)].filter((x) => (typeof x === 'string' ? x : x[0]) !== n(t)) as (string | [string, TrapId])[], [`[[${v}]] הוא [[${t * 10}]] ועוד [[${u}]]`, `[[${t * 10}]] הן [[${t}]] עשרות`]);
  } },
  { id: 'add100', station: 1, title: 'חיבור עד 100', needs: ['tens', 'place2'], e: (r) => {
    const au = ri(r, 3, 9), bu = ri(r, 10 - au, 9), at = ri(r, 1, 5), bt = ri(r, 1, 8 - at);
    const a = at * 10 + au, b = bt * 10 + bu, s = a + b;
    return calc({ big: `[[${a}+${b}]]`, ans: n(s), pencil: true, wrong: [[n(s - 10), 'carry'], [n(s + 10)], [n((at + bt) * 100 + (au + bu)), 'carry']], steps: addSteps(a, b) });
  } },
  { id: 'sub100', station: 1, title: 'חיסור עד 100', needs: ['add100'], e: (r) => {
    const bu = ri(r, 4, 9), au = ri(r, 0, bu - 1), bt = ri(r, 1, 6), at = ri(r, bt + 1, 9);
    const a = at * 10 + au, b = bt * 10 + bu, d = a - b;
    return calc({ big: `[[${a}−${b}]]`, ans: n(d), pencil: true, wrong: [[n((at - bt) * 10 + (bu - au)), 'borrow'], [n(d + 10)], [n(d - 1)]], steps: subSteps(a, b) });
  } },
  { id: 'word1', station: 1, title: 'שאלות בחיבור ובחיסור', needs: ['sub100'], e: (r) => {
    const k = pick(r, KIDS), t = pick(r, THINGS), a = ri(r, 24, 68), b = ri(r, 11, 23);
    if (r() < 0.5) return calc({ prompt: `ל${k} היו ${a} ${t}. היא קיבלה עוד ${b}. כמה ${t} יש לה עכשיו?`, ans: n(a + b), eq: `${a}+${b}`, read: true, pencil: true, wrong: [[n(a - b), 'op']], steps: [`היא קיבלה עוד, ולכן הכמות גדלה: מחברים`, `[[${a}+${b}]]`] });
    return calc({ prompt: `ל${k} היו ${a} ${t}. היא נתנה ${b} לחברה. כמה נשארו לה?`, ans: n(a - b), eq: `${a}-${b}`, read: true, pencil: true, wrong: [[n(a + b), 'op']], steps: [`היא נתנה, ולכן הכמות קטנה: מחסרים`, `[[${a}−${b}]]`] });
  } },
  // ---------- Station 2 ----------
  { id: 'mulmean', station: 2, title: 'מה זה כפל', needs: ['add20'], u: (r) => {
    const a = ri(r, 2, 5), b = ri(r, 3, 6);
    return conceptQ(`איזה תרגיל מתאים לנקודות?`, `[[${a}×${b}]]`, [[`[[${a}+${b}]]`, 'op'], `[[${a + 1}×${b}]]`, `[[${a}×${b + 1}]]`], [`יש [[${a}]] שורות`, `בכל שורה [[${b}]] נקודות`, `זה [[${b}]] שחוזר [[${a}]] פעמים: [[${a}×${b}]]`], { fig: { t: 'array', rows: a, cols: b }, needFig: true });
  } },
  { id: 'mul25', station: 2, title: 'כפול 2, 5 ו־10', needs: ['mulmean'], e: (r) => {
    const a = pick(r, [2, 5, 10]), b = ri(r, 2, 10);
    return calc({ big: `[[${a}×${b}]]`, ans: n(a * b), wrong: [[n(a + b), 'op'], [n(a * (b + 1)), 'table'], [n(a * (b - 1)), 'table']], steps: [a === 10 ? `כפול [[10]] מוסיף אפס בסוף` : a === 5 ? `כפול [[5]] הוא חצי מכפול [[10]]` : `כפול [[2]] הוא המספר ועוד עצמו`], fig: { t: 'array', rows: Math.min(a, b), cols: Math.max(a, b) } });
  } },
  { id: 'mul34', station: 2, title: 'כפול 3 ו־4', needs: ['mul25'], e: (r) => {
    const a = pick(r, [3, 4]), b = ri(r, 2, 10);
    return calc({ big: `[[${a}×${b}]]`, ans: n(a * b), wrong: [[n(a + b), 'op'], [n(a * b + a), 'table'], [n(a * b - a), 'table']], steps: [a === 4 ? `כפול [[4]] הוא פעמיים כפול [[2]]` : `כפול [[3]] הוא כפול [[2]] ועוד פעם אחת`], fig: { t: 'array', rows: a, cols: b } });
  } },
  { id: 'mul69', station: 2, title: 'כפול 6, 7, 8 ו־9', needs: ['mul34'], e: (r) => {
    const a = pick(r, [6, 7, 8, 9]), b = ri(r, 3, 9), half = Math.floor(b / 2);
    return calc({ big: `[[${a}×${b}]]`, ans: n(a * b), wrong: [[n(a * b + a), 'table'], [n(a * b - a), 'table'], [n(a * b + 2), 'table']], steps: [`מפרקים למכפלות מוכרות: [[${a}×${half}]] ועוד [[${a}×${b - half}]]`, `[[${a * half}+${a * (b - half)}]]`] });
  } },
  { id: 'div', station: 2, title: 'חילוק', needs: ['mul34'], e: (r) => {
    const d = ri(r, 2, 9), q = ri(r, 2, 9), a = d * q;
    return calc({ big: `[[${a}:${d}]]`, ans: n(q), wrong: [[n(q + 1), 'table'], [n(q - 1), 'table'], [n(a - d), 'op']], steps: [`מחפשים מספר שכפול [[${d}]] נותן [[${a}]]`, `בודקים: [[▢×${d}=${a}]]`] });
  } },
  { id: 'word2', station: 2, title: 'שאלות בכפל ובחילוק', needs: ['mul69', 'div'], e: (r) => {
    const t = pick(r, THINGS), a = ri(r, 3, 9), b = ri(r, 3, 9);
    if (r() < 0.5) return calc({ prompt: `יש ${a} שקיות, ובכל שקית ${b} ${t}. כמה ${t} יש בסך הכול?`, ans: n(a * b), eq: `${a}*${b}`, read: true, wrong: [[n(a + b), 'op']], steps: [`אותה כמות חוזרת בכל שקית, ולכן כופלים`, `[[${a}×${b}]]`] });
    return calc({ prompt: `יש ${a * b} ${t}, ומחלקים אותם שווה בשווה ל־${a} ילדות. כמה מקבלת כל ילדה?`, ans: n(b), eq: `${a * b}/${a}`, read: true, wrong: [[n(a * b - a), 'op']], steps: [`מחלקים לחלקים שווים, ולכן מחלקים`, `[[${a * b}:${a}]]`] });
  } },
  // ---------- Station 3 ----------
  { id: 'place4', station: 3, title: 'אלפים ומאות', needs: ['place2'], u: (r) => {
    const v = ri(r, 1, 9) * 1000 + ri(r, 1, 9) * 100 + ri(r, 1, 9) * 10 + ri(r, 1, 9);
    const hundreds = Math.floor(v / 100) % 10;
    const opts = [...new Set([n(hundreds * 100), n(hundreds), n(hundreds * 10), n(hundreds * 1000)])];
    return conceptQ(`כמה שווה הספרה שבמקום המאות במספר [[${fmt(v)}]]?`, n(hundreds * 100), opts.slice(1).map((o) => [o, 'place'] as [string, TrapId]), [`סופרים מימין: יחידות, עשרות, מאות`, `במקום המאות נמצאת הספרה [[${hundreds}]]`, `לכן היא שווה [[${hundreds}]] מאות`]);
  } },
  { id: 'addbig', station: 3, title: 'חיבור במאונך', needs: ['add100', 'place4'], e: (r) => {
    const a = ri(r, 1200, 6800), b = ri(r, 1100, 2999);
    return calc({ big: `[[${fmt(a)}+${fmt(b)}]]`, ans: n(a + b), pencil: true, wrong: [[n(a + b - 100), 'carry'], [n(a + b - 10), 'carry']], steps: addSteps(a, b) });
  } },
  { id: 'subbig', station: 3, title: 'חיסור במאונך', needs: ['sub100', 'addbig'], e: (r) => {
    const b = ri(r, 1100, 3999), a = b + ri(r, 1200, 4800);
    return calc({ big: `[[${fmt(a)}−${fmt(b)}]]`, ans: n(a - b), pencil: true, wrong: [[n(a - b + 100), 'borrow'], [n(a - b + 10), 'borrow']], steps: subSteps(a, b) });
  } },
  { id: 'mul1', station: 3, title: 'כפל במספר אחד', needs: ['mul69', 'addbig'], e: (r) => {
    const a = ri(r, 24, 489), d = ri(r, 3, 9);
    return calc({ big: `[[${a}×${d}]]`, ans: n(a * d), pencil: true, wrong: [[n(a * d - 10), 'carry'], [n(a * d + 10)]], steps: mulSteps(a, d) });
  } },
  { id: 'mul2', station: 3, title: 'כפל בשתי ספרות', needs: ['mul1'], e: (r) => {
    const a = ri(r, 13, 89), t = ri(r, 1, 6), u = ri(r, 2, 9), b = t * 10 + u;
    return calc({ big: `[[${a}×${b}]]`, ans: n(a * b), pencil: true, wrong: [[n(a * u + a * t), 'place'], [n(a * b + 10)]], steps: [`מפרקים את [[${b}]] ל־[[${t * 10}]] ועוד [[${u}]]`, `[[${a}×${u}=${a * u}]]`, `[[${a}×${t * 10}=${a * t * 10}]]`, `מחברים: [[${a * u}+${a * t * 10}]]`] });
  } },
  { id: 'longdiv', station: 3, title: 'חילוק ארוך', needs: ['div', 'mul1'], e: (r) => {
    const d = ri(r, 3, 9), q = ri(r, 12, 98), a = d * q;
    return calc({ big: `[[${a}:${d}]]`, ans: n(q), pencil: true, wrong: [[n(q + 10)], [n(q - 1), 'table']], steps: divSteps(a, d) });
  } },
  { id: 'rem', station: 3, title: 'חילוק עם שארית', needs: ['div'], e: (r) => {
    const d = ri(r, 3, 9), q = ri(r, 2, 9), m = ri(r, 1, d - 1), a = d * q + m;
    return calc({ prompt: 'מה השארית?', big: `[[${a}:${d}]]`, ans: n(m), eq: `${a}%${d}`, pencil: true, wrong: [[n(q), 'remainder'], [n(m + d), 'remainder']], steps: [`המכפלה הגדולה ביותר של [[${d}]] שלא עוברת את [[${a}]] היא [[${d * q}]]`, `[[${a}−${d * q}]]`] });
  } },
  { id: 'order', station: 3, title: 'סדר פעולות', needs: ['mul69'], e: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 2, 6), c = ri(r, 2, 6);
    if (r() < 0.5) return calc({ big: `[[${a}+${b}×${c}]]`, ans: n(a + b * c), wrong: [[n((a + b) * c), 'order']], steps: [`כפל קודם: [[${b}×${c}=${b * c}]]`, `[[${a}+${b * c}]]`] });
    return calc({ big: `[[(${a}+${b})×${c}]]`, ans: n((a + b) * c), wrong: [[n(a + b * c), 'order']], steps: [`סוגריים קודם: [[${a}+${b}=${a + b}]]`, `[[${a + b}×${c}]]`] });
  } },
  { id: 'word3', station: 3, title: 'שאלות בשני שלבים', needs: ['order', 'mul1', 'subbig'], e: (r) => {
    const k = pick(r, KIDS), c = ri(r, 3, 8), p = pick(r, [6, 8, 12, 15]), have = c * p + ri(r, 10, 60);
    return calc({ prompt: `ל${k} יש ${have} שקלים. היא קנתה ${c} חולצות, ${p} שקלים כל אחת. כמה שקלים נשארו לה?`, ans: n(have - c * p), eq: `${have}-${c}*${p}`, read: true, pencil: true, wrong: [[n(c * p), 'op'], [n(have + c * p), 'op']], steps: [`קודם כמה שילמה: [[${c}×${p}=${c * p}]]`, `ואז כמה נשאר: [[${have}−${c * p}]]`] });
  } },
  // ---------- Station 4 ----------
  { id: 'fracmean', station: 4, title: 'מה זה שבר', needs: [], u: (r) => {
    const d = ri(r, 2, 8), a = ri(r, 1, d - 1), others: (string | [string, TrapId])[] = [`[[${f(d, a)}]]`, `[[${f(a, d + 1)}]]`];
    if (d - a !== a) others.push(`[[${f(d - a, d)}]]`); else others.push(`[[${f(a + 1, d + 1)}]]`);
    return conceptQ('איזה חלק מהפס צבוע?', `[[${f(a, d)}]]`, others, [`הפס מחולק ל־[[${d}]] חלקים שווים: זה המכנה, למטה`, `[[${a}]] חלקים צבועים: זה המונה, למעלה`], { fig: { t: 'bar', parts: d, shaded: a }, needFig: true });
  } },
  { id: 'fracline', station: 4, title: 'שבר על הציר', needs: ['fracmean'], u: (r) => {
    const d = pick(r, [3, 4, 5, 6, 8]), a = ri(r, 1, d - 1);
    return conceptQ('איזה שבר מסומן על הציר?', `[[${f(a, d)}]]`, [`[[${f(a, d + 1)}]]`, `[[${f(a + 1, d + 1)}]]`, `[[${f(d, d + 1)}]]`], [`בין [[0]] ל־[[1]] יש [[${d}]] קטעים שווים`, `הנקודה נמצאת אחרי [[${a}]] קטעים`], { fig: { t: 'fracline', den: d, mark: a }, needFig: true });
  } },
  { id: 'fraccmp', station: 4, title: 'השוואת שברים', needs: ['fracmean'], u: (r) => {
    if (r() < 0.5) { const d = ri(r, 4, 9), a = ri(r, 1, d - 2), b = ri(r, a + 1, d - 1);
      return { measure: 'u', prompt: 'איזה סימן מתאים?', big: `[[${f(a, d)} ▢ ${f(b, d)}]]`, answer: '<', choices: CMP.map((label) => ({ label })), steps: [`המכנה שווה, ולכן החלקים באותו גודל`, `משווים כמה חלקים יש: [[${a}]] לעומת [[${b}]]`] }; }
    const a = ri(r, 1, 3), d1 = ri(r, a + 1, 6), d2 = ri(r, d1 + 1, 10);
    return { measure: 'u', prompt: 'איזה סימן מתאים?', big: `[[${f(a, d1)} ▢ ${f(a, d2)}]]`, answer: '>', choices: [{ label: '>' }, { label: '<', trap: 'fracDen' }, { label: '=' }], steps: [`המונה שווה, ולכן יש אותו מספר חלקים`, `ככל שהמכנה גדול יותר, כל חלק קטן יותר`] };
  } },
  { id: 'fracequiv', station: 4, title: 'שברים שקולים', needs: ['fraccmp', 'mul34'], e: (r) => {
    const d = pick(r, [2, 3, 4, 5]), a = ri(r, 1, d - 1), k = ri(r, 2, 4);
    return calc({ prompt: 'איזה מספר חסר?', big: `[[${f(a, d)}=▢/${d * k}]]`, ans: n(a * k), wrong: [[n(a + d * k - d), 'fracExpand'], [n(a), 'fracExpand']], steps: [`המכנה הוכפל פי [[${k}]]`, `עושים אותו דבר למונה: [[${a}×${k}]]`], fig: { t: 'bar', parts: d * k, shaded: a * k } });
  } },
  { id: 'fracof', station: 4, title: 'חלק מכמות', needs: ['fracmean', 'div'], e: (r) => {
    const d = pick(r, [2, 3, 4, 5, 6]), q = ri(r, 2, 9), a = ri(r, 1, d - 1), t = pick(r, THINGS);
    return calc({ prompt: `יש ${d * q} ${t}. כמה הם [[${f(a, d)}]] מהם?`, ans: n(a * q), eq: `${d * q}*${a}/${d}`, wrong: [[n(q), 'op'], [n(d * q - a), 'op']], steps: [`מחלקים ל־[[${d}]] חלקים שווים: [[${d * q}:${d}=${q}]]`, `לוקחים [[${a}]] חלקים: [[${a}×${q}]]`] });
  } },
  { id: 'fracsame', station: 4, title: 'חיבור וחיסור, אותו מכנה', needs: ['fracequiv'], e: (r) => {
    const d = ri(r, 5, 12), a = ri(r, 1, d - 3), b = ri(r, 1, d - a - 1), plus = r() < 0.5;
    if (plus) return calc({ big: `[[${f(a, d)}+${f(b, d)}]]`, ans: f(a + b, d), frac: true, wrong: [[f(a + b, d + d), 'fracCross']], steps: [`המכנה נשאר [[${d}]]`, `מחברים מונים: [[${a}+${b}]]`] });
    return calc({ big: `[[${f(a + b, d)}−${f(b, d)}]]`, ans: f(a, d), frac: true, wrong: [[f(a, 1), 'fracCross']], steps: [`המכנה נשאר [[${d}]]`, `מחסרים מונים: [[${a + b}−${b}]]`] });
  } },
  // ---------- Station 5 ----------
  { id: 'factors', station: 5, title: 'מחלקים וכפולות', needs: ['div', 'rem'], u: (r) => {
    const d = pick(r, [2, 3, 4, 5, 6, 9, 10]), m = ri(r, 3, 12), v = d * m;
    const near = [v + 1, v + 2, v - 1].filter((x) => x % d !== 0).slice(0, 3);
    return conceptQ(`איזה מספר מתחלק ב־[[${d}]] בלי שארית?`, `[[${v}]]`, near.map((x) => `[[${x}]]`), [`מחפשים מספר שמופיע בכפולות של [[${d}]]`, `[[${d}×${m}=${v}]]`]);
  } },
  { id: 'reduce', station: 5, title: 'צמצום שברים', needs: ['fracequiv', 'factors'], e: (r) => {
    const d0 = pick(r, [3, 4, 5, 7, 8, 9]);
    let a0 = ri(r, 1, d0 - 1); while (gcd(a0, d0) !== 1) a0 = ri(r, 1, d0 - 1);
    const k = ri(r, 2, 6);
    return calc({ prompt: 'צמצמי עד הסוף', big: `[[${f(a0 * k, d0 * k)}]]`, ans: f(a0, d0), exact: true, frac: true, wrong: [[f(a0 * k - k + 1, d0 * k - k + 1), 'fracExpand']], eq: `${a0 * k}/${d0 * k}`, steps: [`מחפשים מספר שמחלק גם את [[${a0 * k}]] וגם את [[${d0 * k}]]: [[${k}]]`, `מחלקים את שניהם: [[${a0 * k}:${k}]] ו־[[${d0 * k}:${k}]]`] });
  } },
  { id: 'fracdiff', station: 5, title: 'חיבור וחיסור, מכנים שונים', needs: ['fracsame', 'reduce'], e: (r) => {
    const [d1, d2] = pick(r, [[2, 3], [2, 4], [3, 4], [2, 5], [4, 6], [3, 6], [5, 10], [2, 8], [3, 5], [4, 8]]), L = lcm(d1, d2);
    const a = ri(r, 1, d1 - 1), b = ri(r, 1, d2 - 1), A = a * L / d1, B = b * L / d2, plus = r() < 0.6 || A === B;
    if (plus) return calc({ big: `[[${f(a, d1)}+${f(b, d2)}]]`, ans: reduced(A + B, L), frac: true, pencil: true, wrong: [[reduced(a + b, d1 + d2), 'fracCross']], steps: [`מכנה משותף: [[${L}]]`, `[[${f(a, d1)}=${f(A, L)}]] ו־[[${f(b, d2)}=${f(B, L)}]]`, `מחברים מונים: [[${A}+${B}]], על המכנה [[${L}]]`] });
    const hi = Math.max(A, B), lo = Math.min(A, B), [ha, hd, la, ld] = A > B ? [a, d1, b, d2] : [b, d2, a, d1];
    return calc({ big: `[[${f(ha, hd)}−${f(la, ld)}]]`, ans: reduced(hi - lo, L), frac: true, pencil: true, steps: [`מכנה משותף: [[${L}]]`, `[[${f(ha, hd)}=${f(hi, L)}]] ו־[[${f(la, ld)}=${f(lo, L)}]]`, `מחסרים מונים: [[${hi}−${lo}]], על המכנה [[${L}]]`] });
  } },
  { id: 'fracwhole', station: 5, title: 'שבר כפול מספר שלם', needs: ['fracsame', 'fracof'], e: (r) => {
    const d = ri(r, 3, 9), a = ri(r, 1, d - 1), w = ri(r, 2, 6);
    return calc({ big: `[[${f(a, d)}×${w}]]`, ans: reduced(a * w, d), frac: true, wrong: [[f(a * w, d * w), 'fracMul']], steps: [`כופלים רק את המונה: [[${a}×${w}=${a * w}]]`, `המכנה נשאר [[${d}]]`] });
  } },
  { id: 'fracmul', station: 5, title: 'כפל שברים', needs: ['fracwhole', 'reduce'], e: (r) => {
    const d1 = ri(r, 2, 6), d2 = ri(r, 2, 6), a = ri(r, 1, d1 - 1), b = ri(r, 1, d2 - 1);
    return calc({ big: `[[${f(a, d1)}×${f(b, d2)}]]`, ans: reduced(a * b, d1 * d2), frac: true, pencil: true, wrong: [[reduced(a * d2 + b * d1, d1 * d2), 'fracMul']], steps: [`מונה כפול מונה: [[${a}×${b}=${a * b}]]`, `מכנה כפול מכנה: [[${d1}×${d2}=${d1 * d2}]]`] });
  } },
  { id: 'fracdiv', station: 5, title: 'חילוק שברים', needs: ['fracmul'], e: (r) => {
    const d1 = ri(r, 2, 6), d2 = ri(r, 2, 6), a = ri(r, 1, d1 - 1), b = ri(r, 1, d2 - 1);
    return calc({ big: `[[${f(a, d1)}:${f(b, d2)}]]`, ans: reduced(a * d2, d1 * b), frac: true, pencil: true, wrong: [[reduced(a * b, d1 * d2), 'fracDiv']], steps: [`הופכים את השבר השני: [[${f(d2, b)}]]`, `כופלים: [[${f(a, d1)}×${f(d2, b)}]]`] });
  } },
  // ---------- Station 6 ----------
  { id: 'decplace', station: 6, title: 'עשיריות ומאיות', needs: ['place4', 'fracmean'], u: (r) => {
    const t = ri(r, 1, 9), h = ri(r, 1, 9), w = ri(r, 0, 9);
    if (t === h) return conceptQ(`איך כותבים [[${h}]] מאיות כמספר עשרוני?`, `[[0.0${h}]]`, [`[[0.${h}]]`, `[[${h}]]`, `[[${h}.0]]`].map((x): [string, TrapId] => [x, 'decPoint']), [`מאיות הן הספרה השנייה אחרי הנקודה`]);
    return conceptQ(`מה מקום הספרה ${h} במספר [[${w}.${t}${h}]]?`, 'מאיות', [['עשיריות', 'place'], ['יחידות', 'place'], ['עשרות', 'place']], [`הספרה הראשונה אחרי הנקודה היא עשיריות`, `הספרה השנייה אחרי הנקודה היא מאיות`]);
  } },
  { id: 'deccmp', station: 6, title: 'השוואת עשרוניים', needs: ['decplace'], u: (r) => {
    const w = ri(r, 0, 9), big1 = ri(r, 3, 9), small1 = ri(r, 1, big1 - 1), small2 = ri(r, 1, 9), flip = r() < 0.5;
    const A = `${w}.${big1}`, B = `${w}.${small1}${small2}`;
    return { measure: 'u', prompt: 'איזה סימן מתאים?', big: `[[${flip ? B : A} ▢ ${flip ? A : B}]]`, answer: flip ? '<' : '>', choices: [{ label: '>', trap: flip ? 'decLen' : undefined }, { label: '<', trap: flip ? undefined : 'decLen' }, { label: '=' }], steps: [`היחידות שוות: [[${w}]]`, `משווים עשיריות: [[${big1}]] לעומת [[${small1}]]`] };
  } },
  { id: 'decadd', station: 6, title: 'חיבור וחיסור עשרוניים', needs: ['deccmp', 'addbig', 'subbig'], e: (r) => {
    const a = ri(r, 110, 899), b = ri(r, 11, 99), plus = r() < 0.5;
    const A = dec(a, 2), B = dec(b, 1);
    return plus
      ? calc({ big: `[[${A}+${B}]]`, ans: dec(a + b * 10, 2), dot: true, pencil: true, wrong: [[dec(a + b, 2), 'decPoint']], steps: [`מסדרים נקודה מתחת לנקודה: [[${B}]] הוא [[${dec(b * 10, 2).padEnd(4, '0')}]]`, `מחברים ספרה ספרה כרגיל`] })
      : calc({ big: `[[${dec(a + b * 10, 2)}−${B}]]`, ans: A, dot: true, pencil: true, wrong: [[dec(a + b * 9, 2), 'decPoint']], steps: [`מסדרים נקודה מתחת לנקודה`, `מחסרים ספרה ספרה כרגיל`] });
  } },
  { id: 'dec10', station: 6, title: 'כפל וחילוק ב־10 וב־100', needs: ['decplace'], e: (r) => {
    const v = ri(r, 12, 987), k = pick(r, [10, 100]), z = k === 10 ? 1 : 2;
    if (r() < 0.5) return calc({ big: `[[${dec(v, 2)}×${k}]]`, ans: dec(v * k, 2), dot: true, wrong: [[dec(v, 2 - z + 2), 'decPoint']], steps: [`כופלים ב־[[${k}]]: הנקודה זזה ${z === 1 ? 'מקום אחד' : 'שני מקומות'} ימינה`] });
    return calc({ big: `[[${dec(v, 1)}:${k}]]`, ans: dec(v, 1 + z), dot: true, wrong: [[dec(v * k, 1), 'decPoint']], steps: [`מחלקים ב־[[${k}]]: הנקודה זזה ${z === 1 ? 'מקום אחד' : 'שני מקומות'} שמאלה`] });
  } },
  { id: 'decmul', station: 6, title: 'כפל עשרוניים', needs: ['dec10', 'mul1'], e: (r) => {
    const a = ri(r, 12, 95), b = ri(r, 2, 9), both = r() < 0.4;
    if (both) return calc({ big: `[[${dec(a, 1)}×${dec(b, 1)}]]`, ans: dec(a * b, 2), dot: true, pencil: true, wrong: [[dec(a * b, 1), 'decPoint']], steps: [`מתעלמות רגע מהנקודות: [[${a}×${b}=${a * b}]]`, `בתרגיל יש שתי ספרות אחרי הנקודה, ולכן גם בתוצאה`] });
    return calc({ big: `[[${dec(a, 1)}×${b}]]`, ans: dec(a * b, 1), dot: true, pencil: true, wrong: [[n(a * b), 'decPoint']], steps: [`מתעלמות רגע מהנקודה: [[${a}×${b}=${a * b}]]`, `בתרגיל יש ספרה אחת אחרי הנקודה, ולכן גם בתוצאה`] });
  } },
  { id: 'decdiv', station: 6, title: 'חילוק עשרוני במספר שלם', needs: ['dec10', 'longdiv'], e: (r) => {
    const d = ri(r, 2, 9), q = ri(r, 12, 95), a = d * q;
    return calc({ big: `[[${dec(a, 1)}:${d}]]`, ans: dec(q, 1), dot: true, pencil: true, wrong: [[n(q), 'decPoint']], steps: [`מחלקים כרגיל: [[${a}:${d}=${q}]]`, `הנקודה נשארת באותו מקום: ספרה אחת אחריה`] });
  } },
  { id: 'fdp', station: 6, title: 'שבר, עשרוני ואחוז', needs: ['decplace', 'fracequiv'], u: (r) => {
    const [a, d, de, p] = pick(r, [[1, 2, '0.5', 50], [1, 4, '0.25', 25], [3, 4, '0.75', 75], [1, 5, '0.2', 20], [2, 5, '0.4', 40], [1, 10, '0.1', 10], [3, 10, '0.3', 30], [7, 10, '0.7', 70]] as [number, number, string, number][]);
    const others = [10, 20, 25, 40, 50, 75].filter((x) => x !== p);
    const o = others.sort(() => r() - 0.5).slice(0, 3);
    if (r() < 0.5) return conceptQ(`כמה אחוזים הם [[${f(a, d)}]]?`, `[[${p}%]]`, o.map((x): [string, TrapId] => [`[[${x}%]]`, 'percent']), [`מרחיבים למכנה [[100]]: [[${f(a, d)}=${f(p, 100)}]]`, `חלקי מאה הם אחוזים`], { fig: { t: 'hundred', shaded: p } });
    return conceptQ(`איזה מספר שווה ל־[[${p}%]]?`, `[[${de}]]`, o.map((x): [string, TrapId] => [`[[${dec(x, 2)}]]`, 'percent']), [`[[${p}%]] הם [[${p}]] חלקי [[100]]`, `כמספר עשרוני: [[${dec(p, 2)}]]`], { fig: { t: 'hundred', shaded: p } });
  } },
  { id: 'pctof', station: 6, title: 'אחוז מכמות', needs: ['fdp', 'fracof'], e: (r) => {
    const p = pick(r, [10, 20, 25, 50, 75]), base = pick(r, [20, 40, 60, 80, 100, 120, 200, 400]);
    const t = p === 10 ? `[[10%]] הם חלק עשירי` : p === 20 ? `[[20%]] הם חמישית` : p === 25 ? `[[25%]] הם רבע` : p === 50 ? `[[50%]] הם חצי` : `[[75%]] הם שלושה רבעים`;
    return calc({ big: `[[${p}%]] מ־[[${base}]]`, ans: n(base * p / 100), eq: `${base}*${p}/100`, wrong: [[n(base - base * p / 100), 'percent'], [n(p), 'percent']], steps: [t, `[[${base}×${p}:100]]`] });
  } },
  { id: 'pctword', station: 6, title: 'שאלות באחוזים', needs: ['pctof'], e: (r) => {
    const p = pick(r, [10, 20, 25, 50]), price = pick(r, [40, 60, 80, 100, 120, 200]), off = price * p / 100;
    return calc({ prompt: `חולצה עולה ${price} שקלים, ויש הנחה של [[${p}%]]. כמה משלמים?`, ans: n(price - off), eq: `${price}-${price}*${p}/100`, read: true, pencil: true, wrong: [[n(off), 'percent'], [n(price - p), 'percent']], steps: [`קודם ההנחה: [[${p}%]] מ־[[${price}]] הם [[${off}]]`, `מורידים מהמחיר: [[${price}−${off}]]`] });
  } },
  // ---------- Station 7 ----------
  { id: 'units', station: 7, title: 'יחידות מידה', needs: [], e: (r) => {
    const k = pick(r, [['מטרים', 'סנטימטרים', 100], ['קילומטרים', 'מטרים', 1000], ['קילוגרמים', 'גרמים', 1000], ['שעות', 'דקות', 60]] as [string, string, number][]), v = ri(r, 2, 9);
    return calc({ prompt: `כמה ${k[1]} הם ${v} ${k[0]}?`, ans: n(v * k[2]), eq: `${v}*${k[2]}`, wrong: [[n(v), 'unit'], [n(v * (k[2] === 100 ? 10 : 100)), 'unit']], steps: [`בכל אחד יש [[${fmt(k[2])}]]`, `[[${v}×${k[2]}]]`] });
  } },
  { id: 'poly', station: 7, title: 'מצולעים', needs: [], u: (r) => {
    const items = [
      ['כמה צלעות יש למחומש?', '5', ['4', '6', '8'], ['מחומש: [[5]] צלעות וחמישה קודקודים']],
      ['כמה צלעות יש למשושה?', '6', ['5', '7', '8'], ['משושה: [[6]] צלעות']],
      ['איזו טענה נכונה?', 'כל ריבוע הוא מלבן', ['כל מלבן הוא ריבוע', 'לריבוע יש 3 זוויות ישרות', 'למלבן אין זוויות ישרות'], ['בריבוע ובמלבן יש ארבע זוויות ישרות', 'בריבוע גם כל הצלעות שוות']],
      ['כמה קודקודים יש למרובע?', '4', ['3', '5', '8'], ['מרובע: [[4]] צלעות ו־[[4]] קודקודים']],
      ['איך נקרא משולש שכל צלעותיו שוות?', 'שווה צלעות', ['שווה שוקיים בלבד', 'ישר זווית', 'קהה זווית'], ['כשכל שלוש הצלעות שוות, המשולש שווה צלעות']],
    ] as [string, string, string[], string[]][];
    const [p, a, o, s] = pick(r, items);
    return conceptQ(p, a, o, s);
  } },
  { id: 'perim', station: 7, title: 'היקף מלבן', needs: ['units', 'add100'], e: (r) => {
    const w = ri(r, 3, 15), h = ri(r, 2, 12);
    return calc({ prompt: 'מה ההיקף של המלבן, בס״מ?', ans: n(2 * (w + h)), eq: `2*(${w}+${h})`, wrong: [[n(w * h), 'areaPerim'], [n(w + h), 'areaPerim']], fig: { t: 'rect', w, h, unit: 'ס״מ' }, needFig: true, steps: [`היקף הוא האורך מסביב: ארבע צלעות`, `[[${w}+${h}+${w}+${h}]]`] });
  } },
  { id: 'area', station: 7, title: 'שטח מלבן', needs: ['perim', 'mul69'], e: (r) => {
    const w = ri(r, 3, 9), h = ri(r, 2, 8);
    return calc({ prompt: 'מה השטח של המלבן, בסמ״ר?', ans: n(w * h), eq: `${w}*${h}`, wrong: [[n(2 * (w + h)), 'areaPerim'], [n(w + h), 'areaPerim']], fig: { t: 'grid', w, h }, needFig: true, steps: [`בכל שורה [[${w}]] משבצות, ויש [[${h}]] שורות`, `[[${w}×${h}]]`] });
  } },
  { id: 'areaperim', station: 7, title: 'מתי שטח ומתי היקף', needs: ['area'], u: (r) => {
    const items = [['כדי לדעת כמה גדר צריך מסביב לגינה, מחשבים...', 'היקף', 'שטח'], ['כדי לדעת כמה דשא צריך לכל הגינה, מחשבים...', 'שטח', 'היקף'], ['כדי לדעת כמה סרט צריך מסביב לתמונה, מחשבים...', 'היקף', 'שטח'], ['כדי לדעת כמה שטיח צריך לכל החדר, מחשבים...', 'שטח', 'היקף']];
    const [p, a, b] = pick(r, items);
    return conceptQ(p, a, [[b, 'areaPerim'], 'נפח'], [a === 'היקף' ? 'מדובר באורך שמסביב, ולכן היקף' : 'מדובר בכל מה שבפנים, ולכן שטח']);
  } },
  { id: 'triarea', station: 7, title: 'שטח משולש', needs: ['area'], e: (r) => {
    const b = 2 * ri(r, 2, 8), h = ri(r, 3, 10);
    return calc({ prompt: 'מה שטח המשולש, בסמ״ר?', ans: n(b * h / 2), eq: `${b}*${h}/2`, pencil: true, wrong: [[n(b * h), 'triHalf'], [n(b + h), 'areaPerim']], fig: { t: 'tri', b, h, unit: 'ס״מ' }, needFig: true, steps: [`המלבן שסביב המשולש: [[${b}×${h}=${b * h}]]`, `המשולש הוא חצי ממנו: [[${b * h}:2]]`] });
  } },
  { id: 'lshape', station: 7, title: 'שטח צורה מורכבת', needs: ['area'], e: (r) => {
    const w = ri(r, 7, 12), h = ri(r, 6, 10), cw = ri(r, 2, w - 3), ch = ri(r, 2, h - 3);
    return calc({ prompt: 'מה שטח הצורה, בסמ״ר?', ans: n(w * h - cw * ch), eq: `${w}*${h}-${cw}*${ch}`, pencil: true, wrong: [[n(w * h), 'areaPerim'], [n(2 * (w + h)), 'areaPerim']], fig: { t: 'lshape', w, h, cutW: cw, cutH: ch, unit: 'ס״מ' }, needFig: true, steps: [`המלבן השלם: [[${w}×${h}=${w * h}]]`, `החלק החסר: [[${cw}×${ch}=${cw * ch}]]`, `מחסרים: [[${w * h}−${cw * ch}]]`] });
  } },
  { id: 'volume', station: 7, title: 'נפח תיבה', needs: ['area', 'mul1'], e: (r) => {
    const a = ri(r, 2, 8), b = ri(r, 2, 6), c = ri(r, 2, 6);
    return calc({ prompt: 'מה נפח התיבה, בסמ״ק?', ans: n(a * b * c), eq: `${a}*${b}*${c}`, pencil: true, wrong: [[n(2 * (a * b + a * c + b * c)), 'volume'], [n(a + b + c), 'volume']], fig: { t: 'box', a, b, c, unit: 'ס״מ' }, needFig: true, steps: [`קוביות בשכבה אחת: [[${a}×${b}=${a * b}]]`, `יש [[${c}]] שכבות: [[${a * b}×${c}]]`] });
  } },
  // ---------- Added to earlier stations, from the curriculum ----------
  { id: 'round', station: 3, title: 'עיגול ואומדן', needs: ['add100'], e: (r) => {
    const toH = r() < 0.5, base = toH ? 100 : 10, v = ri(r, 12, 98) * 10 + ri(r, 1, 9) + (toH ? 0 : 0), ans = Math.round(v / base) * base;
    return calc({ prompt: `מה המספר [[${v}]] מעוגל ל${toH ? 'מאות' : 'עשרות'} הקרובות?`, ans: n(ans), eq: `${ans}`, wrong: [[n(ans === Math.floor(v / base) * base ? ans + base : ans - base), 'place'], [n(v), 'place']], steps: [`מסתכלים על הספרה שאחרי ${toH ? 'המאות' : 'העשרות'}`, 'מ־[[5]] ומעלה מעגלים למעלה, ומתחת ל־[[5]] מעגלים למטה'] });
  } },
  { id: 'time', station: 7, title: 'זמן ושעון', needs: ['sub100'], e: (r) => {
    const h = ri(r, 7, 15), m = pick(r, [10, 15, 20, 30, 40]), d = pick(r, [30, 40, 50, 80, 90]), tot = m + d, end = `${h + Math.floor(tot / 60)}:${String(tot % 60).padStart(2, '0')}`, mins = d;
    return calc({ prompt: `שיעור מתחיל ב־[[${h}:${String(m).padStart(2, '0')}]] ונגמר ב־[[${end}]]. כמה דקות הוא נמשך?`, ans: n(mins), eq: `${mins}`, wrong: [[n(mins + 40), 'unit'], [n(tot % 60 || 60), 'unit']], steps: ['בשעה יש [[60]] דקות', `מ־[[${h}:${String(m).padStart(2, '0')}]] סופרים עד [[${end}]]: [[${mins}]] דקות`] });
  } },
  { id: 'mixed', station: 4, title: 'מספר מעורב', needs: ['mul25'], u: (r) => {
    const w = ri(r, 1, 4), d = ri(r, 2, 8), a = ri(r, 1, d - 1), top = w * d + a;
    return conceptQ(`כמה חלקים של [[1/${d}]] יש ב־[[${w}]] שלמים ועוד [[${a}/${d}]]?`, `[[${top}]]`, [`[[${w + a + d}]]`, `[[${w * d}]]`, `[[${top + d}]]`], [`בכל שלם יש [[${d}]] חלקים: [[${w}×${d}=${w * d}]]`, `מוסיפים עוד [[${a}]]: [[${top}]]`]);
  } },
  { id: 'ratio', station: 6, title: 'יחס', needs: ['div'], e: (r) => {
    const a = ri(r, 1, 4), b = ri(r, a + 1, 6), k = ri(r, 2, 9), t = pick(r, THINGS);
    return calc({ prompt: `היחס בין ${t} אדומים לכחולים הוא [[${a}:${b}]]. יש [[${a * k}]] אדומים. כמה כחולים יש?`, ans: n(b * k), eq: `${a * k}/${a}*${b}`, pencil: true, wrong: [[n(a * k + b - a), 'op'], [n(a * k), 'op']], steps: [`[[${a * k}]] הם [[${k}]] פעמים [[${a}]]`, `לכן גם הכחולים [[${k}]] פעמים [[${b}]]: [[${b * k}]]`] });
  } },
  { id: 'price', station: 6, title: 'הנחה ומחיר', needs: ['pctof'], e: (r) => {
    const p = ri(r, 2, 15) * 20, c = pick(r, [10, 20, 25, 50]), off = p * c / 100;
    return calc({ prompt: `מוצר עולה [[${p}]] שקלים, ויש עליו הנחה של [[${c}%]]. כמה משלמים?`, ans: n(p - off), eq: `${p}-${p}*${c}/100`, pencil: true, read: true, wrong: [[n(off), 'percent'], [n(p + off), 'percent']], steps: [`ההנחה: [[${c}%]] מ־[[${p}]] הם [[${off}]]`, `[[${p}−${off}=${p - off}]]`] });
  } },
  { id: 'scale', station: 7, title: 'קנה מידה', needs: ['mul1', 'units'], e: (r) => {
    const cm = ri(r, 2, 9), km = pick(r, [2, 5, 10, 20]);
    return calc({ prompt: `במפה, כל סנטימטר מייצג [[${km}]] ק״מ. המרחק במפה הוא [[${cm}]] ס״מ. מה המרחק במציאות, בק״מ?`, ans: n(cm * km), eq: `${cm}*${km}`, wrong: [[n(cm + km), 'op'], [n(km), 'op']], steps: ['כופלים את המרחק במפה בכמה שכל סנטימטר מייצג', `[[${cm}×${km}=${cm * km}]]`] });
  } },
  { id: 'paral', station: 7, title: 'שטח מקבילית', needs: ['area'], e: (r) => {
    const b = ri(r, 3, 12), h = ri(r, 2, 9), side = h + ri(r, 1, 3);
    return calc({ prompt: `למקבילית בסיס [[${b}]] ס״מ, גובה [[${h}]] ס״מ וצלע משופעת [[${side}]] ס״מ. מה השטח, בסמ״ר?`, ans: n(b * h), eq: `${b}*${h}`, wrong: [[n(b * side), 'areaPerim'], [n(2 * (b + side)), 'areaPerim']], steps: ['שטח מקבילית הוא בסיס כפול גובה, ולא כפול הצלע המשופעת', `[[${b}×${h}=${b * h}]]`] });
  } },
  { id: 'surface', station: 7, title: 'שטח פנים של תיבה', needs: ['volume'], e: (r) => {
    const a = ri(r, 2, 8), b = ri(r, 2, 6), c = ri(r, 2, 6), ans = 2 * (a * b + a * c + b * c);
    return calc({ prompt: `לתיבה מידות [[${a}]], [[${b}]] ו־[[${c}]] ס״מ. מה שטח הפנים, בסמ״ר?`, ans: n(ans), eq: `2*(${a}*${b}+${a}*${c}+${b}*${c})`, pencil: true, wrong: [[n(a * b * c), 'volume'], [n(a * b + a * c + b * c), 'volume']], fig: { t: 'box', a, b, c, unit: 'ס״מ' }, steps: ['לתיבה [[6]] פאות, שלושה זוגות שווים', `[[2×(${a}×${b}+${a}×${c}+${b}×${c})=${ans}]]`] });
  } },
  // ---------- Station 8 ----------
  { id: 'table', station: 8, title: 'קריאה מטבלה', needs: ['add100'], e: (r) => {
    const names = ['נועה', 'מאיה', 'תמר'], v = [ri(r, 4, 19), ri(r, 20, 39), ri(r, 40, 60)], t = pick(r, THINGS);
    const row = names.map((x, i) => `${x}: [[${v[i]}]]`).join(', ');
    return calc({ prompt: `כמה ${t} יש לכל ילדה: ${row}. כמה יותר יש לתמר מלנועה?`, ans: n(v[2] - v[0]), eq: `${v[2]}-${v[0]}`, wrong: [[n(v[2] + v[0]), 'op'], [n(v[1] - v[0]), 'op']], steps: ['מוצאים את שני המספרים בטבלה', `[[${v[2]}−${v[0]}=${v[2] - v[0]}]]`] });
  } },
  { id: 'chart', station: 8, title: 'קריאה מגרף', needs: ['table'], e: (r) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי'], step = pick(r, [2, 5, 10]), bars = days.map((label) => ({ label, value: ri(r, 1, 8) * step }));
    bars[1].value = bars[0].value === step * 8 ? step : bars[0].value + step * ri(r, 1, 8 - bars[0].value / step);
    const hi = bars[1].value, lo = bars[0].value;
    return calc({ prompt: 'הגרף מראה כמה ספרים הושאלו מהספרייה בכל יום. כמה ספרים הושאלו בימים ראשון ושני יחד?', ans: n(hi + lo), eq: `${hi}+${lo}`, wrong: [[n(hi - lo), 'op'], [n(hi), 'op']], fig: { t: 'chart', bars, step }, needFig: true, steps: ['קוראים את גובה כל עמודה מול המספרים שבצד', `ראשון: [[${lo}]]. שני: [[${hi}]]`, `[[${lo}+${hi}=${lo + hi}]]`] });
  } },
  { id: 'prob', station: 8, title: 'סיכוי', needs: ['fracmean'], u: (r) => {
    const a = ri(r, 1, 5), b = ri(r, 1, 5), t = a + b;
    return conceptQ(`בשקית יש [[${a}]] כדורים אדומים ו־[[${b}]] כדורים כחולים. מוציאים כדור אחד בלי להסתכל. מה הסיכוי שיהיה אדום?`, `[[${a}/${t}]]`, [`[[${b}/${t}]]`, `[[${a}/${b}]]`, `[[1/${t + 1}]]`], [`סופרים את כל הכדורים: [[${t}]]`, 'הסיכוי הוא מספר הכדורים האדומים חלקי סך הכדורים']);
  } },
  { id: 'coord', station: 8, title: 'מערכת צירים', needs: [], u: (r) => {
    const x = ri(r, 1, 9), y = ri(r, 1, 9), o = x === y ? x + 1 : y;
    return conceptQ(`נקודה נמצאת [[${x}]] צעדים ימינה על ציר ה־[[x]] ו־[[${o}]] צעדים למעלה על ציר ה־[[y]]. מה הזוג שלה?`, `[[(${x},${o})]]`, [`[[(${o},${x})]]`, `[[(${x},${x})]]`, `[[(${o},${o})]]`], ['כותבים קודם את [[x]], ואחריו את [[y]]']);
  } },
  { id: 'mean', station: 8, title: 'ממוצע', needs: ['div'], e: (r) => {
    const k = ri(r, 3, 5), avg = ri(r, 4, 20), v = Array.from({ length: k }, () => avg);
    for (let i = 0; i + 1 < k; i += 2) { const d = ri(r, 1, Math.min(3, avg - 1)); v[i] += d; v[i + 1] -= d; }
    const sum = avg * k;
    return calc({ prompt: `מה הממוצע של המספרים [[${v.join(', ')}]]?`, ans: n(avg), eq: `(${v.join('+')})/${k}`, pencil: true, wrong: [[n(sum), 'op'], [n(Math.max(...v)), 'op']], steps: [`מחברים הכול: [[${v.join('+')}=${sum}]]`, `מחלקים במספר הנתונים: [[${sum}÷${k}=${avg}]]`] });
  } },
  { id: 'angletype', station: 8, title: 'סוגי זוויות', needs: [], u: (r) => {
    const d = pick(r, [[pick(r, [25, 40, 60, 75, 85]), 'חדה'], [90, 'ישרה'], [pick(r, [100, 120, 135, 160]), 'קהה'], [180, 'שטוחה']] as [number, string][]);
    return conceptQ(`איזו זווית היא בת [[${d[0]}]] מעלות?`, d[1], ['חדה', 'ישרה', 'קהה', 'שטוחה'].filter((x) => x !== d[1]), ['חדה: פחות מ־[[90]]. ישרה: בדיוק [[90]]. קהה: בין [[90]] ל־[[180]]. שטוחה: [[180]]']);
  } },
  { id: 'trisum', station: 8, title: 'סכום זוויות במשולש', needs: ['angletype'], e: (r) => {
    const a = ri(r, 3, 9) * 10, b = ri(r, 3, 8) * 10, c = 180 - a - b;
    return calc({ prompt: `במשולש יש זוויות של [[${a}]] ושל [[${b}]] מעלות. כמה מעלות יש בזווית השלישית?`, ans: n(c), eq: `180-${a}-${b}`, wrong: [[n(360 - a - b), 'op'], [n(a + b), 'op']], steps: ['סכום הזוויות במשולש הוא [[180]] מעלות', `[[180−${a}−${b}=${c}]]`] });
  } },
  { id: 'parallel', station: 8, title: 'מקבילים ומאונכים', needs: [], u: (r) => {
    const items = [['איך נקראים שני קווים שלעולם לא נפגשים?', 'מקבילים', ['מאונכים', 'נחתכים'], ['קווים מקבילים נשארים באותו מרחק ולא נפגשים']], ['איך נקראים שני קווים שנפגשים בזווית ישרה?', 'מאונכים', ['מקבילים', 'שווים'], ['קווים מאונכים יוצרים זווית של [[90]] מעלות']], ['כמה זוגות של צלעות מקבילות יש במלבן?', '2', ['1', '4'], ['כל צלע מקבילה לצלע שמולה, ולכן יש [[2]] זוגות']]] as [string, string, string[], string[]][];
    const [p, a, o, s] = pick(r, items);
    return conceptQ(p, a, o, s);
  } },
  // ---------- Station 9 ----------
  { id: 'negline', station: 9, title: 'מספרים מתחת לאפס', needs: ['sub100'], u: (r) => {
    const a = -ri(r, 1, 9), b = -ri(r, 10, 20), c = ri(r, 1, 9);
    return conceptQ(`איזה מספר הוא הקטן ביותר: [[${a}]], [[${b}]] או [[${c}]]?`, `[[${b}]]`, [`[[${a}]]`, `[[${c}]]`], ['על ציר המספרים, מה שמשמאל קטן יותר', 'מתחת לאפס: ככל שהמספר רחוק יותר מאפס, הוא קטן יותר']);
  } },
  { id: 'negadd', station: 9, title: 'חיבור וחיסור עם שליליים', needs: ['negline'], u: (r) => {
    const a = ri(r, 2, 9), b = ri(r, a + 1, a + 9), ans = a - b;
    return conceptQ(`כמה זה [[${a}−${b}]]?`, `[[${ans}]]`, [`[[${b - a}]]`, `[[${a + b}]]`, `[[${ans - 2}]]`], [`מתחילים ב־[[${a}]] על הציר, והולכים [[${b}]] צעדים שמאלה`, `מגיעים ל־[[${ans}]]`], { pencil: true });
  } },
  { id: 'negmul', station: 9, title: 'כפל עם שליליים', needs: ['negadd', 'mul69'], u: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 2, 9), both = r() < 0.5, ans = both ? a * b : -a * b;
    const q = both ? `[[(−${a})×(−${b})]]` : `[[(−${a})×${b}]]`;
    return conceptQ(`כמה זה ${q}?`, `[[${ans}]]`, [`[[${-ans}]]`, `[[${both ? a + b : -a - b}]]`, `[[${ans + (both ? 1 : -1)}]]`], ['שני סימנים זהים נותנים תוצאה חיובית. סימנים שונים נותנים תוצאה שלילית', `[[${a}×${b}=${a * b}]], ומוסיפים את הסימן`]);
  } },
  { id: 'power', station: 9, title: 'חזקות', needs: ['mul69'], e: (r) => {
    const b = ri(r, 2, 5), e = b > 3 ? 2 : ri(r, 2, 4), ans = b ** e;
    return calc({ prompt: `[[${b}]] בחזקת [[${e}]] הוא [[${b}]] כפול עצמו [[${e}]] פעמים. כמה זה?`, ans: n(ans), eq: Array(e).fill(b).join('*'), wrong: [[n(b * e), 'table'], [n(b + e), 'op']], steps: [`[[${Array(e).fill(b).join('×')}=${ans}]]`, 'חזקה אינה כפל בסיס במעריך'] });
  } },
  { id: 'root', station: 9, title: 'שורש ריבועי', needs: ['power'], e: (r) => {
    const b = ri(r, 2, 12);
    return calc({ prompt: `איזה מספר כפול עצמו נותן [[${b * b}]]?`, ans: n(b), eq: `${b}`, wrong: [[n(b * b), 'op'], [n(b + 1), 'table']], steps: ['שורש של מספר הוא המספר שכפול עצמו נותן אותו', `[[${b}×${b}=${b * b}]]`] });
  } },
  // ---------- Station 10 ----------
  { id: 'subst', station: 10, title: 'הצבה בביטוי', needs: ['order'], e: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 1, 20), x = ri(r, 2, 9);
    return calc({ prompt: `אם [[x=${x}]], כמה שווה [[${a}x+${b}]]?`, ans: n(a * x + b), eq: `${a}*${x}+${b}`, wrong: [[n((a + x) + b), 'order'], [n(a * (x + b)), 'order']], steps: [`[[${a}x]] פירושו [[${a}]] כפול [[x]]`, `[[${a}×${x}+${b}=${a * x + b}]]`] });
  } },
  { id: 'like', station: 10, title: 'כינוס איברים', needs: ['subst'], u: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 1, 9), c = ri(r, 1, 9);
    return conceptQ(`מה שווה ל־[[${a}x+${b}x+${c}]]?`, `[[${a + b}x+${c}]]`, [`[[${a + b + c}x]]`, `[[${a * b}x+${c}]]`, `[[${a + b}+${c}x]]`], [`מחברים רק איברים מאותו סוג: [[${a}x+${b}x=${a + b}x]]`, `את [[${c}]] משאירים לבד`]);
  } },
  { id: 'eq1', station: 10, title: 'משוואה בצעד אחד', needs: ['subst'], e: (r) => {
    const x = ri(r, 2, 15), a = ri(r, 2, 9), mul = r() < 0.5, b = ri(r, 3, 30);
    return mul
      ? calc({ prompt: `מה הערך של [[x]] אם [[${a}x=${a * x}]]?`, ans: n(x), eq: `${a * x}/${a}`, wrong: [[n(a * x - a), 'op'], [n(a * a * x), 'op']], steps: ['עושים פעולה הפוכה לכפל: מחלקים את שני האגפים', `[[${a * x}÷${a}=${x}]]`] })
      : calc({ prompt: `מה הערך של [[x]] אם [[x+${b}=${x + b}]]?`, ans: n(x), eq: `${x + b}-${b}`, wrong: [[n(x + 2 * b), 'op'], [n(b), 'op']], steps: ['עושים פעולה הפוכה לחיבור: מחסרים משני האגפים', `[[${x + b}−${b}=${x}]]`] });
  } },
  { id: 'eq2', station: 10, title: 'משוואה בשני צעדים', needs: ['eq1'], e: (r) => {
    const x = ri(r, 2, 12), a = ri(r, 2, 9), b = ri(r, 1, 20), c = a * x + b;
    return calc({ prompt: `מה הערך של [[x]] אם [[${a}x+${b}=${c}]]?`, ans: n(x), eq: `(${c}-${b})/${a}`, pencil: true, wrong: [[n(c - b), 'op'], [n((c + b) / a === Math.floor((c + b) / a) ? (c + b) / a : x + 1), 'op']], steps: [`קודם מחסרים [[${b}]]: [[${a}x=${c - b}]]`, `אחר כך מחלקים ב־[[${a}]]: [[x=${x}]]`] });
  } },
  { id: 'eqword', station: 10, title: 'בעיות במשוואה', needs: ['eq2'], e: (r) => {
    const x = ri(r, 3, 12), k = pick(r, KIDS), a = ri(r, 2, 5), b = ri(r, 2, 15), t = pick(r, THINGS);
    return calc({ prompt: `ל${k} יש [[x]] שקיות של [[${a}]] ${t}, ועוד [[${b}]] ${t} בנפרד. בסך הכול [[${a * x + b}]] ${t}. כמה שקיות יש לה?`, ans: n(x), eq: `(${a * x + b}-${b})/${a}`, pencil: true, read: true, wrong: [[n(a * x), 'op'], [n(a * x + b - a), 'op']], steps: [`כותבים משוואה: [[${a}x+${b}=${a * x + b}]]`, `מחסרים [[${b}]] ומחלקים ב־[[${a}]]: [[x=${x}]]`] });
  } },
];
export const SKILL: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
