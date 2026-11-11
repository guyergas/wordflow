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
  dist: { name: 'פילוג', explain: 'המספר שמחוץ לסוגריים כופל כל אחד מהאיברים שבפנים, ולא רק את הראשון.' },
  sign: { name: 'מינוס לפני סוגריים', explain: 'מינוס לפני סוגריים הופך את הסימן של כל איבר שבתוכם.' },
  prime: { name: 'ראשוני או פריק', explain: 'למספר ראשוני יש בדיוק שני מחלקים: 1 והוא עצמו. גם מספר אי־זוגי יכול להיות פריק, כמו 21=3×7.' },
  divRule: { name: 'סימני התחלקות', explain: 'ב־2, ב־5 וב־10 בודקים את ספרת היחידות. ב־3 וב־9 בודקים את סכום הספרות. ב־6 בודקים גם 2 וגם 3.' },
  symAxis: { name: 'ציר סימטריה', explain: 'ציר סימטריה מחלק צורה לשני חצאים שמתלכדים בקיפול. אלכסון של מלבן אינו ציר כזה.' },
  diag: { name: 'ספירת אלכסונים', explain: 'אלכסון מחבר שני קודקודים שאינם שכנים. מכל קודקוד יוצאים אלכסונים לכל הקודקודים חוץ ממנו ומשני שכניו, וכל אלכסון נספר פעמיים, פעם מכל קצה.' },
  solid: { name: 'פאות, מקצועות וקדקודים', explain: 'פאה היא משטח, מקצוע הוא קו שבו נפגשות שתי פאות, וקדקוד הוא נקודה שבה נפגשים מקצועות. סופרים כל אחד בנפרד, וגם את הבסיסים.' },
  triType: { name: 'סוגי משולשים', explain: 'לפי הצלעות: שלוש שוות הן שווה צלעות, ושתיים שוות הן שווה שוקיים. לפי הזוויות קובעת הזווית הגדולה: ישרה או קהה. רק כשכל שלוש הזוויות חדות, המשולש חד זווית.' },
  calendar: { name: 'ספירת ימים', explain: 'כשסופרים כמה ימים עוברים מתאריך לתאריך, לא סופרים את היום שממנו מתחילים. וכדאי לבדוק כמה ימים יש בחודש: 30 או 31.' },
  ineq: { name: 'סימן האי־שוויון', explain: 'כשכופלים או מחלקים את שני האגפים במספר שלילי, הופכים את כיוון הסימן. ובסימן < או > המספר שבגבול עצמו אינו פתרון.' },
  slope: { name: 'שיפוע', explain: 'שיפוע הוא השינוי ב־y חלקי השינוי ב־x. מחסרים באותו סדר נקודות למעלה ולמטה, ולא הופכים את השבר.' },
  lineform: { name: 'קריאת y=mx+b', explain: 'כשהמשוואה כתובה כ־y=mx+b, המספר שכופל את x הוא השיפוע, והמספר הבודד הוא ערך y בנקודת החיתוך עם ציר y, שבה x=0. אם לפני y יש מספר, מחלקים בו קודם.' },
  powlaw: { name: 'חוקי חזקות', explain: 'בכפל חזקות עם אותו בסיס מחברים את המעריכים, ובחילוק מחסרים אותם. את הבסיס לא כופלים. כופלים מעריכים רק בחזקה של חזקה, כמו (x²)³=x⁶.' },
  powneg: { name: 'חזקה אפס ושלילית', explain: 'כל מספר חוץ מ־0 בחזקת 0 שווה 1. מעריך שלילי לא הופך את התוצאה לשלילית: 2⁻³ הוא 1 חלקי 2³, כלומר 1/8.' },
  sci: { name: 'כתיב מדעי', explain: 'בכתיב מדעי המספר שלפני ה־10 הוא בין 1 ל־10. המעריך אומר בכמה מקומות זזה הנקודה: ימינה במעריך חיובי ושמאלה במעריך שלילי. סופרים מקומות, ולא את כל הספרות.' },
  rootsimp: { name: 'פישוט שורשים', explain: 'מפרקים את המספר שבשורש למכפלה של ריבוע שלם גדול ככל האפשר במספר אחר. את הריבוע מוציאים מהשורש כשורשו, למשל √(9×2)=3√2, ולא כ־9.' },
  sqsum: { name: 'כפל מקוצר', explain: '(a+b)² אינו a²+b². זה (a+b) כפול (a+b), ויש בו גם את האיבר האמצעי 2ab. רק ב־(a+b)(a−b) האיברים האמצעיים מבטלים זה את זה, ונשאר a²−b².' },
  trinom: { name: 'פירוק טרינום', explain: 'מחפשים שני מספרים שמכפלתם היא האיבר החופשי וסכומם הוא המקדם של x. בודקים את הסימנים: מכפלה שלילית פירושה שהמספרים בסימנים שונים.' },
  quadeq: { name: 'פתרונות ממכפלה', explain: 'מכפלה שווה 0 רק כשאחד הגורמים שווה 0. הפתרון הוא המספר שמאפס את הסוגר: מ־(x−3)=0 יוצא x=3, ולא −3. ולרוב יש שני פתרונות.' },
  quadform: { name: 'נוסחת השורשים', explain: 'הדיסקרימיננטה היא b²−4ac. כש־c שלילי, −4ac חיובי. כשהיא חיובית יש שני פתרונות, כשהיא 0 יש פתרון אחד, וכשהיא שלילית אין פתרון.' },
  parab: { name: 'קודקוד הפרבולה', explain: 'ב־y=(x−h)²+k הקודקוד הוא (h,k): מ־(x−3)² יוצא 3, ולא −3. ב־y=x²+bx+c שיעור ה־x של הקודקוד הוא −b חלקי 2, עם המינוס. בחיתוך עם ציר x מתקיים y=0, ובחיתוך עם ציר y מתקיים x=0.' },
  prop: { name: 'פרופורציה', explain: 'בפרופורציה שמים באותו מקום את אותו סוג כמות: אם בשבר הראשון הכמות למעלה והמחיר למטה, גם בשבר השני. במכפלה בהצלבה, אם a/b=c/d אז a×d=b×c. ביחס כופלים באותו מספר, ולא מוסיפים אותו.' },
  pctchg: { name: 'שינוי באחוזים', explain: 'שינוי באחוזים מחשבים ביחס לערך שלפני השינוי: מחלקים את השינוי בערך המקורי, ולא בחדש. עלייה ב־20% היא כפל ב־1.2, וירידה ב־20% היא כפל ב־0.8. לכן עלייה ב־20% ואחריה ירידה ב־20% לא מחזירות לאותו מחיר.' },
  pctrev: { name: 'חזרה למחיר המקורי', explain: 'האחוזים מחושבים מהמחיר המקורי, ולא מהחדש. לכן לא מוסיפים או מורידים אחוזים מהמחיר החדש, אלא מחלקים: אחרי הנחה של 20% נשארו 80% מהמחיר המקורי, ומחלקים ב־0.8.' },
  interest: { name: 'ריבית פשוטה ודריבית', explain: 'בריבית פשוטה הריבית מחושבת כל שנה מהסכום המקורי, ולכן היא שווה בכל שנה. בריבית דריבית היא מחושבת מהסכום שכבר כולל את הריבית של השנה הקודמת, ולכן בשנה השנייה מקבלים יותר.' },
  directinv: { name: 'יחס ישר או הפוך', explain: 'ביחס ישר שתי הכמויות גדלות יחד: פי 2 קילו, פי 2 מחיר, והמנה שלהן קבועה. ביחס הפוך כשאחת גדלה פי 2 השנייה קטנה פי 2, והמכפלה שלהן קבועה: יותר פועלים מסיימים בפחות ימים.' },
  extang: { name: 'זווית חיצונית', explain: 'זווית חיצונית במשולש שווה לסכום שתי הזוויות הפנימיות שאינן צמודות לה. היא משלימה ל־180 את הזווית הפנימית הצמודה לה, ולכן אינה שווה לה.' },
  isos: { name: 'זוויות במשולש שווה שוקיים', explain: 'במשולש שווה שוקיים שתי זוויות הבסיס שוות זו לזו, וזווית הראש שונה מהן. מחסרים את זווית הראש מ־180 ומחלקים את מה שנשאר ב־2, כי יש שתי זוויות בסיס.' },
  polyang: { name: 'סכום זוויות במצולע', explain: 'מצולע עם n צלעות מתחלק מקודקוד אחד ל־n−2 משולשים, ולכן סכום הזוויות שלו הוא (n−2)×180. לא כופלים ב־n, ורק במרובע הסכום הוא 360.' },
  congr: { name: 'משפטי חפיפה', explain: 'בצ.ז.צ הזווית נמצאת בין שתי הצלעות, ובז.צ.ז הצלע נמצאת בין שתי הזוויות. שלוש זוויות שוות לא מספיקות: למשולש גדול ולמשולש קטן יכולות להיות אותן זוויות.' },
  pyth: { name: 'משפט פיתגורס', explain: 'במשולש ישר זווית a²+b²=c², ו־c הוא היתר: הצלע שמול הזווית הישרה, והארוכה ביותר. לא מחברים את הצלעות עצמן, ובסוף לא שוכחים להוציא שורש. כשמחפשים ניצב מחסרים: c²−a².' },
  circle: { name: 'היקף מול שטח עיגול', explain: 'היקף מעגל הוא 2πr, כלומר π כפול הקוטר, ולא π כפול הרדיוס. שטח עיגול הוא πr²: מעלים בריבוע את הרדיוס, ולא את הקוטר. אם נתון קוטר, הרדיוס הוא חצי ממנו.' },
  sector: { name: 'קשת וגזרה', explain: 'קשת וגזרה הן חלק מהמעגל כולו, לפי הזווית חלקי 360. לקשת כופלים את ההיקף בחלק הזה, ולגזרה כופלים את השטח. לא מחלקים ב־180, ולא שוכחים לקחת רק חלק.' },
  prism: { name: 'נפח ושטח פנים של גוף', explain: 'נפח של מנסרה או של גליל הוא שטח הבסיס כפול הגובה. שטח הפנים הוא שני הבסיסים ועוד המעטפת, והמעטפת היא היקף הבסיס כפול הגובה. לא שוכחים אף אחד מהבסיסים.' },
  similar: { name: 'יחס דמיון', explain: 'במשולשים דומים כל הצלעות גדלות או קטנות פי אותו מספר. מחלקים צלע בצלע המתאימה לה כדי למצוא את היחס, וכופלים בו. לא מוסיפים את ההפרש, ומתאימים צלע לצלע לפי סדר האותיות.' },
  scalearea: { name: 'יחס שטחים ויחס נפחים', explain: 'כשהאורכים גדלים פי k, השטח גדל פי k² והנפח גדל פי k³. לא כופלים את השטח או את הנפח ביחס הדמיון עצמו: משולש גדול פי 2 באורכים גדול פי 4 בשטח.' },
  median: { name: 'חציון ושכיח', explain: 'כדי למצוא חציון מסדרים קודם את המספרים מהקטן לגדול, ולוקחים את האמצעי. כשמספר הנתונים זוגי, החציון הוא הממוצע של שני האמצעיים. שכיח הוא הערך שמופיע הכי הרבה פעמים, ולא מספר הפעמים שהוא מופיע.' },
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
/** Right triangles with whole sides: two legs, then the hypotenuse. */
const PYTH: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25]];

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
/** "במקום ה..." for each place, from the units up. */
const AT = ['היחידות', 'העשרות', 'המאות', 'האלפים', 'עשרות האלפים', 'מאות האלפים'];
const HE_UNITS = 'אבגדהוזחט', HE_TENS = 'יכלמנסעפצ', HE_HUNDREDS = 'קרשת';
const POLY_NAME: Record<number, string> = { 4: 'מרובע', 5: 'מחומש', 6: 'משושה', 7: 'משובע', 8: 'מתומן', 9: 'מתושע', 10: 'מעושר' };
const SOLID_PART = ['פאות', 'מקצועות', 'קדקודים'];
const WEEKDAY = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS: [string, number][] = [['ינואר', 31], ['פברואר', 28], ['מרץ', 31], ['אפריל', 30], ['מאי', 31], ['יוני', 30], ['יולי', 31], ['אוגוסט', 31], ['ספטמבר', 30], ['אוקטובר', 31], ['נובמבר', 30], ['דצמבר', 31]];
/** A unit and a smaller one: plural of each, singular of the larger, and how many small ones make a large one. */
const DEC_UNITS: [string, string, string, number][] = [['קילומטרים', 'מטרים', 'קילומטר', 1000], ['מטרים', 'סנטימטרים', 'מטר', 100], ['קילוגרמים', 'גרמים', 'קילוגרם', 1000]];
/** A number as shown in math, with a true minus sign. */
const sgn = (v: number) => (v < 0 ? `−${-v}` : String(v));
/** A signed term to follow another one: +3, −3, or nothing for 0. */
const term = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '');
/** A coefficient of x: x, −x, 3x, −3x. */
const kx = (k: number, x = 'x') => (k === 1 ? x : k === -1 ? `−${x}` : `${sgn(k)}${x}`);
/** A fraction a/b as shown in math, reduced, with its sign in front. */
const sfrac = (a: number, b: number) => (a % b === 0 ? sgn(a / b) : `${a * b < 0 ? '−' : ''}${reduced(Math.abs(a), Math.abs(b))}`);
const FLIP: Record<string, string> = { '<': '>', '>': '<' };
/** A number in brackets when it is negative, to follow an operation sign. */
const par = (v: number) => (v < 0 ? `(${sgn(v)})` : String(v));
/** A point (x,y) as shown in math. */
const pt = (x: number, y: number) => `(${sgn(x)},${sgn(y)})`;
/** The line y=mx+b as shown in math. */
const line = (m: number, b: number) => `y=${m === 0 ? '' : kx(m)}${m === 0 ? sgn(b) : term(b)}`;
/** An exponent as superscript digits: 3 → ³, −2 → ⁻². */
const sup = (v: number) => (v < 0 ? '⁻' : '') + [...String(Math.abs(v))].map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('');
const SOLID_HOW = ['פאה היא משטח: סופרים את הבסיסים ואת הפאות הצדדיות', 'מקצוע הוא קו שבו נפגשות שתי פאות', 'קדקוד הוא נקודה שבה נפגשים מקצועות'];

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
  // ---------- Station 11 ----------
  { id: 'dist', station: 11, title: 'פילוג (חוק הפילוג)', needs: ['like'], u: (r) => {
    const a = ri(r, 2, 9), b = ri(r, 1, 9), s = r() < 0.5 ? '+' : '−';
    return conceptQ(`מה שווה ל־[[${a}(x${s}${b})]]?`, `[[${a}x${s}${a * b}]]`, [[`[[${a}x${s}${b}]]`, 'dist'], [`[[x${s}${a * b}]]`, 'dist'], [`[[${a}x${s}${a + b}]]`, 'op']], [`כופלים את [[${a}]] בכל איבר שבסוגריים: [[${a}×x=${a}x]]`, `וגם [[${a}×${b}=${a * b}]], ולכן [[${a}x${s}${a * b}]]`]);
  } },
  { id: 'brackets', station: 11, title: 'פתיחת סוגריים עם מינוס', needs: ['dist'], u: (r) => {
    const k = r() < 0.5 ? 1 : ri(r, 2, 4), a = ri(r, k + 2, 9), c = ri(r, 1, 9), ks = k === 1 ? '' : String(k);
    return conceptQ(`מה שווה ל־[[${a}x−${ks}(x+${c})]]?`, `[[${a - k}x−${k * c}]]`, [[`[[${a - k}x+${k * c}]]`, 'sign'], [`[[${a + k}x+${k * c}]]`, 'sign'], ...(k === 1 ? [] : [[`[[${a - k}x−${c}]]`, 'dist'] as [string, TrapId]])], [`${k === 1 ? 'המינוס שלפני הסוגריים הופך את הסימן של כל איבר בפנים' : `המינוס שייך ל־[[${k}]], ולכן כופלים כל איבר בסוגריים ב־[[−${k}]]`}: [[−${ks}(x+${c})=−${ks}x−${k * c}]]`, `מכנסים: [[${a}x−${ks}x=${a - k}x]], ונשאר [[${a - k}x−${k * c}]]`]);
  } },
  { id: 'simplify', station: 11, title: 'פישוט ביטוי עם סוגריים', needs: ['brackets'], u: (r) => {
    const sg = (v: number) => (v < 0 ? `−${-v}` : String(v));
    const lin = (A: number, K: number) => `[[${A === 1 ? '' : A}x${K > 0 ? `+${K}` : K < 0 ? `−${-K}` : ''}]]`;
    const minus = r() < 0.5, a = ri(r, 3, 6), b = ri(r, 1, 6), c = minus ? ri(r, 2, a - 1) : ri(r, 2, 5), d = ri(r, 1, 6);
    if (minus) {
      const A = a - c, K = a * b - c * d;
      return conceptQ(`מה שווה ל־[[${a}(x+${b})−${c}(x+${d})]]?`, lin(A, K), [[lin(A, a * b + c * d), 'sign'], [lin(a + c, K), 'sign'], [lin(A, a * b - d), 'dist']], [`פותחים סוגריים: [[${a}(x+${b})=${a}x+${a * b}]], ו־[[−${c}(x+${d})=−${c}x−${c * d}]]`, `מכנסים: [[${a}x−${c}x=${A === 1 ? '' : A}x]] ו־[[${a * b}−${c * d}=${sg(K)}]]`]);
    }
    const A = a + c, K = a * b - c * d;
    return conceptQ(`מה שווה ל־[[${a}(x+${b})+${c}(x−${d})]]?`, lin(A, K), [[lin(A, a * b - d), 'dist'], [lin(A, a * b + c * d), 'sign'], [lin(A, b - d), 'dist']], [`פותחים סוגריים: [[${a}(x+${b})=${a}x+${a * b}]], ו־[[${c}(x−${d})=${c}x−${c * d}]]`, `מכנסים: [[${a}x+${c}x=${A}x]] ו־[[${a * b}−${c * d}=${sg(K)}]]`]);
  } },
  { id: 'factor1', station: 11, title: 'הוצאת גורם משותף', needs: ['dist'], u: (r) => {
    const g = ri(r, 2, 9), pairs = [[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [3, 5], [1, 4], [4, 5]], [p0, q0] = pick(r, pairs), swap = r() < 0.5, p = swap ? q0 : p0, q = swap ? p0 : q0;
    const two = r() < 0.5, u = two ? 'a' : 'x', v = two ? 'b' : '', t = (k: number, s: string) => `${k === 1 && s ? '' : k}${s}`;
    const expr = `${t(g * p, u)}+${t(g * q, v)}`, ans = `[[${g}(${t(p, u)}+${t(q, v)})]]`;
    return conceptQ(`מה מתקבל מ־[[${expr}]] אחרי הוצאת הגורם המשותף הגדול ביותר?`, ans, [[`[[${g}(${t(p, u)}+${t(g * q, v)})]]`, 'dist'], [`[[${t(g * p, '')}(${u}+${t(q, v)})]]`, 'dist'], [`[[${g}(${t(p + q, u)})]]`, 'op']], [`מחפשים את המספר הגדול ביותר שמחלק את [[${g * p}]] ואת [[${g * q}]]: זה [[${g}]]`, `מחלקים כל איבר ב־[[${g}]] וכותבים בסוגריים: ${ans}`, `בודקים בפילוג: [[${g}×${t(p, u)}=${t(g * p, u)}]] ו־[[${g}×${t(q, v)}=${t(g * q, v)}]]`]);
  } },
  // ---------- Station 12 ----------
  { id: 'eqboth', station: 12, title: 'משוואה עם נעלם בשני האגפים', needs: ['eq2'], e: (r) => {
    const x = ri(r, 1, 12), a = ri(r, 4, 9), c = ri(r, 1, a - 2), b = ri(r, 1, 15), k = a - c, d = k * x + b, cx = `${c === 1 ? '' : c}x`;
    const flip = (d + b) % k === 0 && (d + b) / k !== x ? (d + b) / k : x + k;
    return calc({ prompt: `מה הערך של [[x]] אם [[${a}x+${b}=${cx}+${d}]]?`, ans: n(x), eq: `(${d}-${b})/(${a}-${c})`, pencil: true, wrong: [[n(d - b), 'op'], [n(flip), 'sign']], steps: [`מחסרים [[${cx}]] משני האגפים, כדי שהנעלם יהיה רק בצד אחד: [[${k}x+${b}=${d}]]`, `מחסרים [[${b}]]: [[${k}x=${d - b}]]`, `מחלקים ב־[[${k}]]: [[x=${x}]]`] });
  } },
  { id: 'eqbrk', station: 12, title: 'משוואה עם סוגריים', needs: ['eqboth', 'brackets'], e: (r) => {
    const x = ri(r, 1, 10), a = ri(r, 3, 6), c = ri(r, 1, a - 2), b = ri(r, 1, 6), k = a - c, ab = a * b, d = k * x + ab, cx = `${c === 1 ? '' : c}x`;
    const half = (d - b) % k === 0 ? (d - b) / k : d - b;
    return calc({ prompt: `מה הערך של [[x]] אם [[${a}(x+${b})=${cx}+${d}]]?`, ans: n(x), eq: `(${d}-${ab})/(${a}-${c})`, pencil: true, wrong: [[n(half), 'dist'], [n(d - ab), 'op']], steps: [`פותחים סוגריים: [[${a}(x+${b})=${a}x+${ab}]]`, `מחסרים [[${cx}]] ו־[[${ab}]] משני האגפים: [[${k}x=${d - ab}]]`, `מחלקים ב־[[${k}]]: [[x=${x}]]`] });
  } },
  // ---------- Elementary gaps, from the Ministry's program ----------
  { id: 'bignum', station: 3, title: 'מספרים עד מיליון', needs: ['place4'], u: (r) => {
    const ds = Array.from({ length: 6 }, () => ri(r, 1, 9)), v = ds.reduce((s, d, i) => s + d * 10 ** i, 0), p = pick(r, [3, 4, 5]), d = ds[p];
    const val = (k: number) => `[[${fmt(d * 10 ** k)}]]`;
    return conceptQ(`כמה שווה הספרה שבמקום ${AT[p]} במספר [[${fmt(v)}]]?`, val(p), [[val(p - 1), 'place'], [val(p + 1), 'place'], [`[[${d}]]`, 'place']], [`סופרים מימין: ${PLACE.slice(0, p + 1).join(', ')}`, `במקום ${AT[p]} נמצאת הספרה [[${d}]]`, `לכן היא שווה ${val(p)}`]);
  }, e: (r) => {
    const p = pick(r, [3, 4, 5]), k = 10 ** p, ds = Array.from({ length: 6 }, () => ri(r, 1, 9));
    ds[p] = ri(r, 1, 8);
    const v = ds.reduce((s, d, i) => s + d * 10 ** i, 0);
    return calc({ prompt: `איזה מספר גדול ב־[[${fmt(k)}]] מ־[[${fmt(v)}]]?`, ans: n(v + k), eq: `${v}+${k}`, pencil: true, wrong: [[n(v + k / 10), 'place'], [n(v + k * 10), 'place']], steps: [`[[${fmt(k)}]] הוא [[1]] במקום ${AT[p]}`, `הספרה שבמקום ${AT[p]} גדלה מ־[[${ds[p]}]] ל־[[${ds[p] + 1}]], ושאר הספרות לא משתנות`, `[[${fmt(v)}+${fmt(k)}=${fmt(v + k)}]]`] });
  } },
  { id: 'gematria', station: 3, title: 'אותיות כמספרים (גימטריה)', needs: ['place4'], u: (r) => {
    const i = ri(r, 0, 21), L = (HE_UNITS + HE_TENS + HE_HUNDREDS)[i], k = i < 9 ? 0 : i < 18 ? 1 : 2, d = i < 18 ? (i % 9) + 1 : i - 17, v = d * 10 ** k;
    const group = ['היחידות', 'העשרות', 'המאות'][k];
    return conceptQ(`איזה מספר מסמנת האות ${L}?`, `[[${v}]]`, [[`[[${d * 10 ** ((k + 1) % 3)}]]`, 'place'], [`[[${d * 10 ** ((k + 2) % 3)}]]`, 'place'], `[[${i + 1}]]`], ['האותיות א עד ט הן היחידות, י עד צ הן העשרות, ו־ק עד ת הן המאות', `${L} היא האות ה־[[${d}]] בקבוצת ${group}, ולכן היא שווה [[${v}]]`]);
  }, e: (r) => {
    const h = ri(r, 1, 4), t = ri(r, 1, 9), u = ri(r, 1, 9), ans = h * 100 + t * 10 + u, special = t === 1 && (u === 5 || u === 6);
    const letters = HE_HUNDREDS[h - 1] + (special ? `ט${HE_UNITS[u]}` : HE_TENS[t - 1] + HE_UNITS[u - 1]), w = `${letters.slice(0, -1)}״${letters.slice(-1)}`;
    return calc({ prompt: `איזה מספר מסמנות האותיות ${w}?`, ans: n(ans), eq: `${h * 100}+${t * 10}+${u}`, wrong: [[n(h * 100 + t + u), 'place'], [n(h + t + u), 'place']], steps: [
      special ? `${letters[0]} שווה [[${h * 100}]], ואת [[${10 + u}]] כותבים ${u === 5 ? 'ט״ו' : 'ט״ז'}: [[9+${u + 1}]]` : `${letters[0]} שווה [[${h * 100}]], ${letters[1]} שווה [[${t * 10}]] ו־${letters[2]} שווה [[${u}]]`,
      `מחברים: [[${h * 100}+${t * 10}+${u}=${ans}]]`] });
  } },
  { id: 'zeroone', station: 3, title: 'תכונות ה־0 וה־1 בפעולות', needs: ['mul1'], u: (r) => {
    const a = ri(r, 12, 999), A = fmt(a), m = (v: number) => `[[${fmt(v)}]]`;
    const items: [string, number, (string | [string, TrapId])[], string[]][] = [
      [`${A}×0`, 0, [[m(a), 'op'], m(1)], [`[[${A}×0]] הוא [[0]] קבוצות של [[${A}]]`, 'כל מספר כפול [[0]] הוא [[0]]']],
      [`${A}×1`, a, [[m(0), 'op'], m(1)], [`[[${A}×1]] היא קבוצה אחת של [[${A}]]`, 'כל מספר כפול [[1]] נשאר אותו מספר']],
      [`${A}+0`, a, [[m(0), 'op'], m(a + 1)], ['חיבור [[0]] לא מוסיף כלום', 'המספר לא משתנה']],
      [`${A}−0`, a, [[m(0), 'op'], m(a - 1)], ['חיסור [[0]] לא מוריד כלום', 'המספר לא משתנה']],
      [`${A}:1`, a, [[m(1), 'op'], m(0)], ['מחלקים לקבוצה אחת, והכול נשאר בה', 'חילוק ב־[[1]] לא משנה את המספר']],
      [`0:${A}`, 0, [[m(a), 'op'], m(1)], [`מחלקים [[0]] ל־[[${A}]] קבוצות: אין מה לחלק`, '[[0]] מחולק בכל מספר הוא [[0]]']],
      [`${A}:${A}`, 1, [[m(0), 'op'], m(a)], ['מספר מחולק בעצמו הוא [[1]]', `בדיקה: [[${A}×1=${A}]]`]],
      [`${A}−${A}`, 0, [[m(1), 'op'], m(a)], ['מספר פחות עצמו הוא [[0]]', 'לא נשאר כלום']],
    ];
    const [q, ans, others, steps] = pick(r, items);
    return conceptQ(`כמה זה [[${q}]]?`, m(ans), others, steps);
  }, e: (r) => {
    const a = ri(r, 12, 99), b = ri(r, 2, 9), form = ri(r, 0, 2);
    if (form === 0) return calc({ big: `[[${a}×0+${b}]]`, ans: n(b), wrong: [[n(a + b), 'op'], [n(0), 'op']], steps: [`[[${a}×0=0]]: כל מספר כפול [[0]] הוא [[0]]`, `[[0+${b}=${b}]]`] });
    if (form === 1) return calc({ big: `[[${a}×1−${b}×0]]`, ans: n(a), wrong: [[n(a - b), 'op'], [n(0), 'op']], steps: [`[[${a}×1=${a}]] ו־[[${b}×0=0]]`, `[[${a}−0=${a}]]`] });
    return calc({ big: `[[0:${a}+${b}×1]]`, ans: n(b), wrong: [[n(a + b), 'op'], [n(b + 1), 'op']], steps: [`[[0:${a}=0]]: אין מה לחלק`, `[[${b}×1=${b}]], ו־[[0+${b}=${b}]]`] });
  } },
  { id: 'primes', station: 5, title: 'מספרים ראשוניים ופריקים', needs: ['factors'], u: (r) => {
    const PR = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53], ODD = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 57], EVEN = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    const some = (a: number[], k: number) => { const out: number[] = []; while (out.length < k) { const x = pick(r, a); if (!out.includes(x)) out.push(x); } return out; };
    const fac = (c: number) => { let p = 2; while (c % p) p++; return `[[${c}=${p}×${c / p}]]`; };
    if (r() < 0.5) {
      const p = pick(r, PR), cs = [...some(ODD, 2), pick(r, EVEN)], one = r() < 0.3;
      const others: [string, TrapId][] = [...cs.slice(0, one ? 2 : 3).map((c): [string, TrapId] => [`[[${c}]]`, 'prime']), ...(one ? [['[[1]]', 'prime'] as [string, TrapId]] : [])];
      return conceptQ('איזה מספר ראשוני?', `[[${p}]]`, others, ['למספר ראשוני יש בדיוק שני מחלקים: [[1]] והוא עצמו', `[[${p}]] מתחלק רק ב־[[1]] וב־[[${p}]]`, `האחרים לא: ${cs.slice(0, one ? 2 : 3).map(fac).join(', ')}${one ? ', ול־[[1]] יש רק מחלק אחד' : ''}`]);
    }
    const c = pick(r, ODD), ps = some(PR.filter((x) => x > 2), 3);
    return conceptQ('איזה מספר פריק?', `[[${c}]]`, ps.map((x): [string, TrapId] => [`[[${x}]]`, 'prime']), [`${fac(c)}, ולכן יש ל־[[${c}]] מחלק נוסף מלבד [[1]] והוא עצמו`, `מספר כזה נקרא פריק. ${ps.map((x) => `[[${x}]]`).join(', ')} ראשוניים`]);
  } },
  { id: 'divrules', station: 5, title: 'סימני התחלקות ב־2, 3, 5, 6, 9 ו־10', needs: ['factors'], u: (r) => {
    const d = pick(r, [2, 3, 5, 6, 9, 10]), v = d * ri(r, Math.ceil(102 / d), Math.floor(970 / d)), ds = digits(v), s = ds.reduce((a, b) => a + b, 0);
    let ends3 = 10 * ri(r, 10, 97) + 3; while (ends3 % 3 === 0) ends3 += 10;
    const near: Record<number, [number, boolean][]> = { 2: [[v + 1, true], [v + 3, true], [v - 1, false]], 5: [[v + 2, false], [v + 3, false], [v + 1, false]], 10: [[v + 5, true], [v + 2, false], [v + 1, false]], 3: [[ends3, true], [v + 1, false], [v + 2, false]], 9: [[v + 3, true], [v + 6, true], [v + 1, false]], 6: [[v + 2, true], [v + 3, true], [v + 1, false]] };
    const rule: Record<number, string> = { 2: 'מספר מתחלק ב־[[2]] אם ספרת היחידות שלו זוגית', 5: 'מספר מתחלק ב־[[5]] אם ספרת היחידות שלו [[0]] או [[5]]', 10: 'מספר מתחלק ב־[[10]] אם ספרת היחידות שלו [[0]]', 3: 'מספר מתחלק ב־[[3]] אם סכום הספרות שלו מתחלק ב־[[3]]', 9: 'מספר מתחלק ב־[[9]] אם סכום הספרות שלו מתחלק ב־[[9]]', 6: 'מספר מתחלק ב־[[6]] אם הוא מתחלק גם ב־[[2]] וגם ב־[[3]]' };
    const sum = `סכום הספרות של [[${v}]]: [[${[...ds].reverse().join('+')}=${s}]]`;
    const check = d === 2 || d === 5 || d === 10 ? `ספרת היחידות של [[${v}]] היא [[${ds[0]}]]` : d === 6 ? `[[${v}]] זוגי, ו${sum}` : sum;
    return conceptQ(`לפי סימני ההתחלקות, איזה מספר מתחלק ב־[[${d}]]?`, `[[${v}]]`, near[d].map(([x, t]): string | [string, TrapId] => (t ? [`[[${x}]]`, 'divRule'] : `[[${x}]]`)), [rule[d], check]);
  } },
  { id: 'symmetry', station: 7, title: 'ציר סימטריה', needs: ['poly'], u: (r) => {
    const items: [string, number, number[], string[]][] = [
      ['ריבוע', 4, [2, 8, 1], ['שני צירים עוברים דרך אמצעי הצלעות, ושניים לאורך האלכסונים', 'בסך הכול [[4]] צירים']],
      ['מלבן שאינו ריבוע', 2, [4, 1, 0], ['ציר אחד לאורך וציר אחד לרוחב, דרך אמצעי הצלעות', 'קיפול לאורך האלכסון לא מתלכד, ולכן האלכסונים אינם צירים']],
      ['משולש שווה צלעות', 3, [1, 6, 0], ['מכל קודקוד יוצא ציר אל אמצע הצלע שמולו', 'יש [[3]] קודקודים, ולכן [[3]] צירים']],
      ['משולש שווה שוקיים שאינו שווה צלעות', 1, [3, 2, 0], ['הציר יוצא מהקודקוד שבין השוקיים אל אמצע הבסיס', 'אין ציר נוסף, כי הבסיס שונה מהשוקיים']],
      ['מחומש משוכלל', 5, [10, 2, 4], ['במצולע משוכלל יש צירים כמספר הצלעות', 'יש [[5]] צלעות, ולכן [[5]] צירים']],
      ['משושה משוכלל', 6, [3, 12, 4], ['במצולע משוכלל יש צירים כמספר הצלעות', 'יש [[6]] צלעות, ולכן [[6]] צירים']],
      ['מקבילית שאינה מלבן ואינה מעוין', 0, [2, 1, 4], ['קיפול לאורך, לרוחב או באלכסון לא מתלכד', 'לכן אין לה ציר סימטריה: [[0]]']],
      ['מעוין שאינו ריבוע', 2, [4, 0, 1], ['שני האלכסונים של המעוין הם צירי סימטריה', 'קיפול דרך אמצעי הצלעות לא מתלכד']],
    ];
    const [name, ans, [w0, ...ws], steps] = pick(r, items);
    return conceptQ(`כמה צירי סימטריה יש ל${name}?`, `[[${ans}]]`, [[`[[${w0}]]`, 'symAxis'], ...ws.map((x) => `[[${x}]]`)], steps);
  } },
  { id: 'diagonals', station: 7, title: 'אלכסונים במצולע', needs: ['poly'], u: (r) => {
    const k = ri(r, 4, 10), name = POLY_NAME[k];
    return conceptQ(`כמה אלכסונים יוצאים מקודקוד אחד של ${name}?`, `[[${k - 3}]]`, [[`[[${k - 1}]]`, 'diag'], [`[[${k}]]`, 'diag'], `[[${k - 2}]]`], [`ל${name} יש [[${k}]] קודקודים`, `לא מעבירים אלכסון מהקודקוד לעצמו ולא לשני השכנים שלו: [[${k}−3=${k - 3}]]`]);
  }, e: (r) => {
    const k = ri(r, 4, 10), name = POLY_NAME[k], ans = k * (k - 3) / 2;
    return calc({ prompt: `כמה אלכסונים יש ל${name}?`, ans: n(ans), eq: `${k}*(${k}-3)/2`, pencil: true, wrong: [[n(k * (k - 3)), 'diag'], [n(k - 3), 'diag']], steps: [`מכל אחד מ־[[${k}]] הקודקודים יוצאים [[${k}−3=${k - 3}]] אלכסונים`, `[[${k}×${k - 3}=${k * (k - 3)}]], אבל כל אלכסון נספר פעמיים, פעם מכל קצה`, `מחלקים ב־[[2]]: [[${k * (k - 3)}:2=${ans}]]`] });
  } },
  { id: 'solids', station: 7, title: 'גופים: פאות, מקצועות וקדקודים', needs: ['volume'], u: (r) => {
    const items: [string, number[]][] = [['לקובייה', [6, 12, 8]], ['לפירמידה שבסיסה ריבוע', [5, 8, 5]], ['לפירמידה שבסיסה משולש', [4, 6, 4]], ['למנסרה שבסיסה משולש', [5, 9, 6]], ['למנסרה שבסיסה משושה', [8, 18, 12]]];
    const [name, v] = pick(r, items), p = ri(r, 0, 2), ans = v[p];
    const others = [...v.filter((x) => x !== ans).map((x): [string, TrapId] => [`[[${x}]]`, 'solid']), `[[${ans + 2}]]`, `[[${ans - 1}]]`];
    return conceptQ(`כמה ${SOLID_PART[p]} יש ${name}?`, `[[${ans}]]`, others.slice(0, 3), [`${SOLID_HOW[p]}`, `${name.slice(1)}: [[${v[0]}]] פאות, [[${v[1]}]] מקצועות ו־[[${v[2]}]] קדקודים`]);
  }, e: (r) => {
    const k = ri(r, 3, 8), prism = r() < 0.5, p = ri(r, 0, 2);
    const base = prism ? `למנסרה יש שני בסיסים, וכל אחד מהם מצולע בן [[${k}]] צלעות.` : `לפירמידה יש בסיס שהוא מצולע בן [[${k}]] צלעות.`;
    const ans = prism ? [k + 2, 3 * k, 2 * k][p] : [k + 1, 2 * k, k + 1][p];
    const eq = prism ? [`${k}+2`, `3*${k}`, `2*${k}`][p] : [`${k}+1`, `2*${k}`, `${k}+1`][p];
    const wrong: [string, TrapId][] = (prism ? [[k, 2 * k], [2 * k, k + 2], [k, 3 * k]][p] : [[k, k + 2], [k, 3 * k], [k, 2 * k]][p]).map((x) => [n(x), 'solid']);
    const steps = prism
      ? [[`פאה צדדית לכל צלע של הבסיס: [[${k}]]`, `ועוד שני הבסיסים: [[${k}+2=${k + 2}]]`], [`בכל בסיס [[${k}]] מקצועות, ובשני הבסיסים [[2×${k}=${2 * k}]]`, `ועוד [[${k}]] מקצועות צדדיים שמחברים בין הבסיסים: [[${2 * k}+${k}=${3 * k}]]`], [`בכל בסיס [[${k}]] קדקודים`, `בשני הבסיסים: [[2×${k}=${2 * k}]]`]][p]
      : [[`פאה צדדית לכל צלע של הבסיס: [[${k}]]`, `ועוד הבסיס: [[${k}+1=${k + 1}]]`], [`[[${k}]] מקצועות בבסיס, ועוד [[${k}]] מקצועות שעולים אל הקדקוד שבראש`, `[[${k}+${k}=${2 * k}]]`], [`[[${k}]] קדקודים בבסיס`, `ועוד הקדקוד שבראש: [[${k}+1=${k + 1}]]`]][p];
    return calc({ prompt: `${base} כמה ${SOLID_PART[p]} יש ל${prism ? 'מנסרה' : 'פירמידה'}?`, ans: n(ans), eq, pencil: true, read: true, wrong, steps });
  } },
  { id: 'calendar', station: 7, title: 'לוח השנה וחישובי זמן', needs: ['time'], u: (r) => {
    const i = ri(r, 0, 6), k = pick(r, [8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20]), q = Math.floor(k / 7), m = k % 7, day = (d: number) => WEEKDAY[(i + d) % 7];
    return conceptQ(`היום יום ${WEEKDAY[i]}. איזה יום יהיה בעוד [[${k}]] ימים?`, `יום ${day(k)}`, [[`יום ${day(k + 1)}`, 'calendar'], `יום ${day(k + 6)}`, `יום ${day(k + 2)}`], ['בכל [[7]] ימים חוזרים לאותו יום בשבוע', `[[${k}=${7 * q}+${m}]], ולכן מתקדמים [[${m}]] ימים מיום ${WEEKDAY[i]}: יום ${day(k)}`]);
  }, e: (r) => {
    if (r() < 0.5) {
      const y = ri(r, 2, 9), mo = ri(r, 1, 11), ans = 12 * y + mo;
      return calc({ prompt: `כמה חודשים יש ב־[[${y}]] שנים ו־[[${mo}]] חודשים?`, ans: n(ans), eq: `12*${y}+${mo}`, wrong: [[n(10 * y + mo), 'unit'], [n(y + mo), 'unit']], steps: ['בשנה יש [[12]] חודשים', `[[12×${y}=${12 * y}]], ועוד [[${mo}]]: [[${12 * y}+${mo}=${ans}]]`] });
    }
    const mi = pick(r, [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]), [name, len] = MONTHS[mi], next = MONTHS[mi + 1][0], d1 = ri(r, 10, len - 2), d2 = ri(r, 2, 25), left = len - d1, ans = left + d2;
    return calc({ prompt: `טיול יוצא ב־[[${d1}]] ב${name} וחוזר ב־[[${d2}]] ב${next}. כמה ימים עוברים מהיציאה עד החזרה? (ב${name} יש [[${len}]] ימים.)`, ans: n(ans), eq: `${len}-${d1}+${d2}`, pencil: true, read: true, wrong: [[n(ans + 1), 'calendar'], len === 31 ? [n(ans - 1), 'calendar'] : [n(left), 'op']], steps: [`עד סוף ${name}: [[${len}−${d1}=${left}]] ימים`, `ועוד [[${d2}]] ימים ב${next}: [[${left}+${d2}=${ans}]]`] });
  } },
  { id: 'decunits', station: 7, title: 'המרת מידות (ק״מ, מ׳, ס״מ, ק״ג, גרם)', needs: ['units', 'dec10'], e: (r) => {
    const [big, small, one, k] = pick(r, DEC_UNITS), p = k === 1000 && r() < 0.5 ? 2 : 1, digs = k === 1000 ? 3 : 2;
    let t = p === 1 ? ri(r, 11, 99) : ri(r, 101, 399);
    if (t % 10 === 0) t += 1;
    const v = dec(t, p), m = t * k / 10 ** p;
    if (r() < 0.5) return calc({ prompt: `כמה ${small} הם [[${v}]] ${big}?`, ans: n(m), eq: `${v}*${k}`, pencil: true, wrong: [[n(m / 10), 'decPoint'], [n(m * 10), 'decPoint']], steps: [`ב${one} אחד יש [[${fmt(k)}]] ${small}`, `מיחידה גדולה לקטנה כופלים: [[${v}×${fmt(k)}=${fmt(m)}]]`, `כופלים ב־[[${fmt(k)}]]: מזיזים את הנקודה [[${digs}]] מקומות ימינה`] });
    return calc({ prompt: `כמה ${big} הם [[${fmt(m)}]] ${small}?`, ans: v, eq: `${m}/${k}`, pencil: true, dot: true, wrong: [[dec(t, p + 1), 'decPoint'], [n(m * k), 'unit']], steps: [`ב${one} אחד יש [[${fmt(k)}]] ${small}`, `מיחידה קטנה לגדולה מחלקים: [[${fmt(m)}:${fmt(k)}=${v}]]`, `מחלקים ב־[[${fmt(k)}]]: מזיזים את הנקודה [[${digs}]] מקומות שמאלה`] });
  } },
  { id: 'tritype', station: 8, title: 'סוגי משולשים לפי צלעות וזוויות', needs: ['angletype'], u: (r) => {
    const order = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = ri(r, 0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const list = (xs: number[]) => `[[${xs[0]}]], [[${xs[1]}]] ו־[[${xs[2]}]]`;
    if (r() < 0.5) {
      const kind = ri(r, 0, 2), s = ri(r, 4, 9);
      const sides = kind === 0 ? [s, s, s] : kind === 1 ? order([s, s, pick(r, [s - 2, s - 1, s + 1, s + 2, s + 3])]) : (() => { const a = ri(r, 3, 6), b = a + ri(r, 1, 3); return order([a, b, b + ri(r, 1, a - 1)]); })();
      const ans = ['שווה צלעות', 'שווה שוקיים', 'שונה צלעות'][kind];
      const others: (string | [string, TrapId])[] = kind === 0 ? [['שווה שוקיים בלבד', 'triType'], 'שונה צלעות'] : kind === 1 ? [['שווה צלעות', 'triType'], 'שונה צלעות'] : [['שווה שוקיים', 'triType'], 'שווה צלעות'];
      const why = kind === 0 ? 'כל שלוש הצלעות שוות' : kind === 1 ? `שתי צלעות שוות: [[${sides[0] === sides[1] || sides[0] === sides[2] ? sides[0] : sides[1]}]], והשלישית שונה` : 'אין שתי צלעות שוות';
      return conceptQ(`אורכי הצלעות של משולש הם ${list(sides)} ס״מ. איזה משולש זה לפי הצלעות?`, ans, others, ['לפי הצלעות: שלוש שוות הן שווה צלעות, שתיים שוות הן שווה שוקיים, ואם אין שוות זה שונה צלעות', `כאן ${why}, ולכן ${ans}`]);
    }
    const kind = ri(r, 0, 2);
    const two = kind === 0 ? [ri(r, 10, 17) * 5, ri(r, 10, 17) * 5] : kind === 1 ? [90, ri(r, 4, 14) * 5] : (() => { const a = ri(r, 10, 15) * 10; return [a, ri(r, 2, Math.floor((170 - a) / 5)) * 5]; })();
    const angles = order([...two, 180 - two[0] - two[1]]), big = Math.max(...angles), ans = ['חד זווית', 'ישר זווית', 'קהה זווית'][kind];
    const others: (string | [string, TrapId])[] = kind === 0 ? [['ישר זווית', 'triType'], 'קהה זווית'] : kind === 1 ? [['חד זווית', 'triType'], 'קהה זווית'] : [['חד זווית', 'triType'], 'ישר זווית'];
    return conceptQ(`הזוויות של משולש הן ${list(angles)} מעלות. איזה משולש זה לפי הזוויות?`, ans, others, ['לפי הזוויות קובעת הזווית הגדולה: אם היא ישרה המשולש ישר זווית, ואם היא קהה הוא קהה זווית', `הזווית הגדולה כאן היא [[${big}]] מעלות, ${kind === 0 ? 'וגם היא חדה, ולכן כל שלוש הזוויות חדות' : kind === 1 ? 'זווית ישרה' : 'זווית קהה'}: ${ans}`]);
  } },
  { id: 'eqfrac', station: 12, title: 'משוואה עם שברים', needs: ['eqboth'], e: (r) => {
    if (r() < 0.5) {
      const a = ri(r, 2, 6), q = ri(r, 2, 9), b = ri(r, 1, 12), c = q + b, x = a * q;
      return calc({ prompt: `מה הערך של [[x]] אם [[x/${a}+${b}=${c}]]?`, ans: n(x), eq: `${a}*(${c}-${b})`, pencil: true, wrong: [[n(q), 'op'], [n(a * c - b), 'order']], steps: [`מחסרים [[${b}]] משני האגפים: [[x/${a}=${q}]]`, `כופלים את שני האגפים ב־[[${a}]]: [[x=${a}×${q}=${x}]]`] });
    }
    const [a, b] = pick(r, [[2, 3], [3, 4], [2, 5], [2, 6], [4, 6]]), L = lcm(a, b), s = ri(r, 1, 4), x = L * s, c = x / a + x / b, ka = L / a, kb = L / b;
    return calc({ prompt: `מה הערך של [[x]] אם [[x/${a}+x/${b}=${c}]]?`, ans: n(x), eq: `${L * c}/(${ka}+${kb})`, pencil: true, wrong: [[n(c * (a + b)), 'fracCross'], [n(L * c), 'op']], steps: [`כופלים את שני האגפים במכנה המשותף [[${L}]]: [[${ka}x+${kb}x=${L * c}]]`, `מכנסים: [[${ka + kb}x=${L * c}]]`, `מחלקים ב־[[${ka + kb}]]: [[x=${x}]]`] });
  } },
  { id: 'eqword2', station: 12, title: 'בעיה מילולית במשוואה (גילים, כסף, תנועה)', needs: ['eqbrk'], e: (r) => {
    const kind = ri(r, 0, 2), k = pick(r, KIDS);
    if (kind === 0) {
      const x = ri(r, 6, 14), d = ri(r, 20, 32), m = ri(r, 2, 6), S = 2 * x + d + 2 * m;
      return calc({ prompt: `האם מבוגרת מ${k} ב־[[${d}]] שנים. בעוד [[${m}]] שנים, סכום הגילים שלהן יהיה [[${S}]]. בת כמה ${k} היום?`, ans: n(x), eq: `(${S}-${d}-2*${m})/2`, pencil: true, read: true, wrong: [[n(x + d), 'op'], [n(x + m), 'op']], steps: [`הגיל של ${k} היום: [[x]], והגיל של האם: [[x+${d}]]. בעוד [[${m}]] שנים: [[x+${m}]] ו־[[x+${d + m}]]`, `משוואה: [[(x+${m})+(x+${d + m})=${S}]], ולכן [[2x+${d + 2 * m}=${S}]]`, `[[2x=${S - d - 2 * m}]], ולכן [[x=${x}]]`] });
    }
    if (kind === 1) {
      const x = ri(r, 2, 9), a = ri(r, 2, 5), b = ri(r, 2, 5), c = ri(r, 1, 4), T = (a + b) * x + b * c, slip = (T - c) / (a + b);
      const wrong: [string, TrapId][] = [[n(x + c), 'op'], ...(Number.isInteger(slip) && slip !== x ? [[n(slip), 'dist'] as [string, TrapId]] : [])];
      return calc({ prompt: `${k} קנתה [[${a}]] מחברות ו־[[${b}]] עטים. כל עט יקר ממחברת ב־[[${c}]] שקלים, ובסך הכול היא שילמה [[${T}]] שקלים. כמה שקלים עולה מחברת אחת?`, ans: n(x), eq: `(${T}-${b}*${c})/(${a}+${b})`, pencil: true, read: true, wrong, steps: [`מחיר מחברת: [[x]], ומחיר עט: [[x+${c}]]`, `משוואה: [[${a}x+${b}(x+${c})=${T}]], ולכן [[${a + b}x+${b * c}=${T}]]`, `[[${a + b}x=${T - b * c}]], ולכן [[x=${x}]]`] });
    }
    const x = 10 * ri(r, 4, 8), c = 10 * ri(r, 1, 3), t = ri(r, 2, 3), D = t * (2 * x + c);
    return calc({ prompt: `שתי רכבות יוצאות באותה שעה זו לקראת זו, משתי ערים שהמרחק ביניהן [[${D}]] ק״מ. הרכבת השנייה מהירה מהראשונה ב־[[${c}]] קמ״ש, והן נפגשות אחרי [[${t}]] שעות. מה המהירות של הרכבת הראשונה, בקמ״ש?`, ans: n(x), eq: `(${D}/${t}-${c})/2`, pencil: true, read: true, wrong: [[n(x + c), 'op'], [n(x + c / 2), 'op']], steps: [`המהירות של הראשונה: [[x]], ושל השנייה: [[x+${c}]]. בכל שעה הן מתקרבות זו לזו ב־[[2x+${c}]] ק״מ`, `משוואה: [[${t}(2x+${c})=${D}]], ולכן [[2x+${c}=${D / t}]]`, `[[2x=${D / t - c}]], ולכן [[x=${x}]]`] });
  } },
  { id: 'ineq', station: 12, title: 'אי־שוויון ופתרונו', needs: ['eqboth'], u: (r) => {
    const a = ri(r, 2, 5), neg = r() < 0.5, k = neg ? -a : a, q = neg ? ri(r, a + 1, a + 5) : ri(r, 1, 5), p = q + k;
    const x0 = pick(r, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), b = ri(r, 1, 12), d = k * x0 + b, op = pick(r, ['<', '>']), sol = neg ? FLIP[op] : op;
    const ans = `[[x${sol}${sgn(x0)}]]`;
    return conceptQ(`מה הפתרון של [[${kx(p)}+${b}${op}${kx(q)}${term(d)}]]?`, ans, [[`[[x${FLIP[sol]}${sgn(x0)}]]`, 'ineq'], [`[[x${sol}${sgn(k * x0)}]]`, 'op'], [`[[x${FLIP[sol]}${sgn(-x0)}]]`, 'ineq']], [
      `מעבירים את [[${kx(q)}]] לאגף השמאלי ואת [[${b}]] לימני, כמו במשוואה: [[${kx(k)}${op}${sgn(d - b)}]]`,
      neg ? `מחלקים ב־[[${k}]]. זה מספר שלילי, ולכן הופכים את כיוון הסימן: ${ans}` : `מחלקים ב־[[${k}]]. זה מספר חיובי, ולכן הסימן נשאר: ${ans}`]);
  }, e: (r) => {
    const a = ri(r, 2, 6), b = ri(r, 1, 12), s = ri(r, 1, a);
    if (r() < 0.5) {
      const ans = ri(r, 1, 9), c = b + a * ans + s;
      return calc({ prompt: `מה המספר השלם הגדול ביותר שמקיים [[${a}x+${b}<${c}]]?`, ans: n(ans), eq: `(${c}-${b}-${s})/${a}`, pencil: true, wrong: [[n(ans + 1), 'ineq'], [n(c - b), 'op']], steps: [`מחסרים [[${b}]] משני האגפים: [[${a}x<${c - b}]]`, `מחלקים ב־[[${a}]], מספר חיובי, והסימן נשאר: [[x<${sfrac(c - b, a)}]]`, `המספר השלם הגדול ביותר שקטן מ־[[${sfrac(c - b, a)}]] הוא [[${ans}]]`] });
    }
    const ans = ri(r, -4, 6), c = b - a * ans + s;
    return calc({ prompt: `מה המספר השלם הקטן ביותר שמקיים [[${b}−${a}x<${sgn(c)}]]?`, ans: n(ans), eq: `(${b}-(${c})+${s})/${a}`, pencil: true, wrong: [[n(ans - 1), 'ineq'], [n(ans + 1), 'op']], steps: [`מחסרים [[${b}]] משני האגפים: [[−${a}x<${sgn(c - b)}]]`, `מחלקים ב־[[−${a}]], מספר שלילי, ולכן הופכים את הסימן: [[x>${sfrac(b - c, a)}]]`, `המספר השלם הקטן ביותר שגדול מ־[[${sfrac(b - c, a)}]] הוא [[${ans}]]`] });
  } },
  // ---------- Station 13 ----------
  { id: 'slope', station: 13, title: 'שיפוע משתי נקודות', needs: ['coord', 'negadd'], u: (r) => {
    const x1 = ri(r, -5, 4), dx = ri(r, 1, 5), y1 = ri(r, -6, 6), m = ri(r, -3, 3), x2 = x1 + dx, y2 = y1 + m * dx;
    const ans = m > 0 ? 'חיובי' : m < 0 ? 'שלילי' : 'אפס';
    const why = m > 0 ? `[[x]] גדל ב־[[${dx}]] וגם [[y]] גדל, ב־[[${m * dx}]]: הישר עולה, והשיפוע חיובי` : m < 0 ? `[[x]] גדל ב־[[${dx}]] ו־[[y]] קטן ב־[[${-m * dx}]]: הישר יורד, והשיפוע שלילי` : `[[x]] גדל ב־[[${dx}]] ו־[[y]] לא משתנה: הישר אופקי, והשיפוע אפס`;
    return conceptQ(`הישר עובר דרך הנקודות [[(${sgn(x1)},${sgn(y1)})]] ו־[[(${sgn(x2)},${sgn(y2)})]]. איך השיפוע שלו?`, ans, ['חיובי', 'שלילי', 'אפס'].filter((x) => x !== ans).map((x): [string, TrapId] => [x, 'slope']), ['הולכים משמאל לימין, מהנקודה שה־[[x]] שלה קטן יותר', why]);
  }, e: (r) => {
    const m = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4]), d = ri(r, 1, 4), swap = r() < 0.5, ax = ri(r, -5, 4), ay = ri(r, -6, 6);
    const [x1, y1, x2, y2] = swap ? [ax + d, ay + m * d, ax, ay] : [ax, ay, ax + d, ay + m * d], dx = x2 - x1, dy = y2 - y1;
    const wrong: [string, TrapId][] = [[n(-m), 'slope'], ...(Math.abs(m) > 1 ? [[`${m < 0 ? '-' : ''}1/${Math.abs(m)}`, 'slope'] as [string, TrapId]] : []), ...(d > 1 ? [[n(dy), 'op'] as [string, TrapId]] : [])];
    return calc({ prompt: `מה השיפוע של הישר שעובר דרך הנקודות [[(${sgn(x1)},${sgn(y1)})]] ו־[[(${sgn(x2)},${sgn(y2)})]]?`, ans: n(m), eq: `(${y2}-(${y1}))/(${x2}-(${x1}))`, pencil: true, wrong, steps: [`השינוי ב־[[y]]: [[${sgn(y2)}−${par(y1)}=${sgn(dy)}]]`, `השינוי ב־[[x]], באותו סדר: [[${sgn(x2)}−${par(x1)}=${sgn(dx)}]]`, `השיפוע הוא השינוי ב־[[y]] חלקי השינוי ב־[[x]]: [[${par(dy)}÷${par(dx)}=${sgn(m)}]]`] });
  } },
  { id: 'linefn', station: 13, title: 'y=mx+b: שיפוע ונקודת חיתוך עם ציר y', needs: ['slope'], u: (r) => {
    const m = pick(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), b = pick(r, [-9, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((v) => Math.abs(v) !== Math.abs(m)));
    const mx = `${m > 0 ? '+' : '−'}${Math.abs(m) === 1 ? '' : Math.abs(m)}x`, eqn = r() < 0.5 ? `y=${kx(m)}${term(b)}` : `y=${sgn(b)}${mx}`;
    const say = (s: number, x: number, y: number) => `שיפוע [[${sgn(s)}]], חיתוך עם ציר [[y]] ב־[[(${sgn(x)},${sgn(y)})]]`;
    return conceptQ(`מה השיפוע של הישר [[${eqn}]], ובאיזו נקודה הוא חותך את ציר ה־[[y]]?`, say(m, 0, b), [[say(b, 0, m), 'lineform'], [say(m, 0, -b), 'lineform'], [say(m, b, 0), 'lineform']], [`המספר שכופל את [[x]] הוא השיפוע: [[${sgn(m)}]]`, `על ציר ה־[[y]] מתקיים [[x=0]], ולכן [[y=${sgn(b)}]]: הנקודה [[(0,${sgn(b)})]]`]);
  }, e: (r) => {
    const m = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4]), b = pick(r, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6].filter((v) => v !== m)), c = ri(r, 2, 4), slope = r() < 0.5;
    const ans = slope ? m : b, eqn = `${c}y=${kx(c * m)}${term(c * b)}`;
    return calc({ prompt: slope ? `מה השיפוע של הישר [[${eqn}]]?` : `הישר [[${eqn}]] חותך את ציר ה־[[y]] בנקודה [[(0,y)]]. מה ערך ה־[[y]]?`, ans: n(ans), eq: `${c * ans}/${c}`, pencil: true, wrong: [[n(c * ans), 'lineform'], [n(slope ? b : m), 'lineform']], steps: [`מחלקים את שני האגפים ב־[[${c}]]: [[y=${kx(m)}${term(b)}]]`, slope ? `המספר שכופל את [[x]] הוא השיפוע: [[${sgn(m)}]]` : `מציבים [[x=0]]: [[y=${sgn(b)}]]. זו נקודת החיתוך עם ציר ה־[[y]]`] });
  } },
  { id: 'lineval', station: 13, title: 'ערך הפונקציה ונקודה על הישר', needs: ['linefn'], u: (r) => {
    const m = pick(r, [-3, -2, -1, 2, 3, 4]), b = pick(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), k = pick(r, [-3, -2, -1, 1, 2, 3, 4]), y = m * k + b;
    return conceptQ(`איזו נקודה נמצאת על הישר [[${line(m, b)}]]?`, `[[${pt(k, y)}]]`, [`[[${pt(y, k)}]]`, `[[${pt(k, m * k - b)}]]`, `[[${pt(k + 1, y)}]]`], [`מציבים את ה־[[x]] של הנקודה ובודקים אם יוצא ה־[[y]] שלה`, `[[${sgn(m)}×${par(k)}${term(b)}=${sgn(y)}]], ולכן הנקודה [[${pt(k, y)}]] על הישר`]);
  }, e: (r) => {
    const m = pick(r, [-3, -2, 2, 3, 4, 5]), b = pick(r, [-7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 6]), k = pick(r, [-4, -3, -2, -1, 2, 3, 4, 5]), y = m * k + b, f = `f(x)=${kx(m)}${term(b)}`;
    if (r() < 0.5) return calc({ prompt: `נתונה הפונקציה [[${f}]]. כמה זה [[f(${sgn(k)})]]?`, ans: n(y), eq: `${m}*(${k})+(${b})`, pencil: true, wrong: [[n(m * k - b)], [n(m + k + b), 'op']], steps: [`מציבים [[x=${sgn(k)}]] במקום [[x]]`, `[[${sgn(m)}×${par(k)}${term(b)}=${sgn(m * k)}${term(b)}=${sgn(y)}]]`] });
    const back = (y + b) / m;
    const wrong: [string, TrapId?][] = [[n(m * y + b), 'op'], ...(Number.isInteger(back) && back !== k ? [[n(back)] as [string, TrapId?]] : [])];
    return calc({ prompt: `נתונה הפונקציה [[${f}]]. לאיזה [[x]] מתקיים [[f(x)=${sgn(y)}]]?`, ans: n(k), eq: `(${y}-(${b}))/(${m})`, pencil: true, wrong, steps: [`כותבים משוואה: [[${kx(m)}${term(b)}=${sgn(y)}]]`, `${b > 0 ? 'מחסרים' : 'מוסיפים'} [[${Math.abs(b)}]]: [[${kx(m)}=${sgn(y - b)}]]`, `מחלקים ב־[[${sgn(m)}]]: [[x=${sgn(k)}]]`] });
  } },
  { id: 'lineeq', station: 13, title: 'משוואת ישר דרך שתי נקודות', needs: ['linefn'], u: (r) => {
    const m = pick(r, [-3, -2, -1, 1, 2, 3]), b = pick(r, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6].filter((v) => v !== m)), x1 = pick(r, [-3, -2, -1, 1, 2, 3]), x2 = x1 + ri(r, 1, 3), y1 = m * x1 + b, y2 = m * x2 + b;
    return conceptQ(`מה המשוואה של הישר שעובר דרך הנקודות [[${pt(x1, y1)}]] ו־[[${pt(x2, y2)}]]?`, `[[${line(m, b)}]]`, [[`[[${line(-m, y1 + m * x1)}]]`, 'slope'], `[[${line(m, y1 + m * x1)}]]`, [`[[${line(b, m)}]]`, 'lineform']], [
      `השיפוע: [[(${sgn(y2)}−${par(y1)})÷(${sgn(x2)}−${par(x1)})=${sgn(y2 - y1)}÷${x2 - x1}=${sgn(m)}]]`,
      `מציבים את [[${pt(x1, y1)}]] ב־[[y=${kx(m)}+b]]: [[${sgn(y1)}=${sgn(m * x1)}+b]], ולכן [[b=${sgn(b)}]]`,
      `המשוואה: [[${line(m, b)}]]`]);
  }, e: (r) => {
    const m = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4]), b = pick(r, [-7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7].filter((v) => v !== m)), x1 = pick(r, [-3, -2, -1, 1, 2, 3, 4]), x2 = x1 + ri(r, 1, 3), y1 = m * x1 + b, y2 = m * x2 + b;
    return calc({ prompt: `ישר עובר דרך הנקודות [[${pt(x1, y1)}]] ו־[[${pt(x2, y2)}]]. המשוואה שלו היא [[y=mx+b]]. מה הערך של [[b]]?`, ans: n(b), eq: `${y1}-(${m})*(${x1})`, pencil: true, wrong: [[n(y1 + m * x1)], [n(m), 'lineform']], steps: [`השיפוע: [[(${sgn(y2)}−${par(y1)})÷(${sgn(x2)}−${par(x1)})=${sgn(m)}]]`, `מציבים את [[${pt(x1, y1)}]]: [[${sgn(y1)}=${sgn(m)}×${par(x1)}+b]]`, `[[b=${sgn(y1)}−${par(m * x1)}=${sgn(b)}]]`] });
  } },
  { id: 'lineint', station: 13, title: 'חיתוך שני ישרים וחיתוך עם הצירים', needs: ['lineeq'], u: (r) => {
    const x0 = pick(r, [-3, -2, -1, 1, 2, 3, 4]), y0 = pick(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), m1 = pick(r, [-3, -2, -1, 1, 2, 3]), m2 = pick(r, [-3, -2, -1, 1, 2, 3].filter((v) => v !== m1)), b1 = y0 - m1 * x0, b2 = y0 - m2 * x0;
    return conceptQ(`באיזו נקודה נחתכים הישרים [[${line(m1, b1)}]] ו־[[${line(m2, b2)}]]?`, `[[${pt(x0, y0)}]]`, [`[[${pt(y0, x0)}]]`, [`[[${pt(-x0, -m1 * x0 + b1)}]]`, 'sign'], [`[[${pt(0, b1)}]]`, 'lineform']], [
      `בנקודת החיתוך ה־[[y]] שווה בשני הישרים: [[${kx(m1)}${term(b1)}=${kx(m2)}${term(b2)}]]`,
      `מעבירים אגפים: [[${kx(m1 - m2)}=${sgn(b2 - b1)}]], ולכן [[x=${sgn(x0)}]]`,
      `מציבים בישר הראשון: [[y=${sgn(m1)}×${par(x0)}${term(b1)}=${sgn(y0)}]], והנקודה [[${pt(x0, y0)}]]`]);
  }, e: (r) => {
    const m = pick(r, [-4, -3, -2, 2, 3, 4]), x0 = pick(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), b = -m * x0;
    return calc({ prompt: `הישר [[${line(m, b)}]] חותך את ציר ה־[[x]] בנקודה [[(x,0)]]. מה ערך ה־[[x]]?`, ans: n(x0), eq: `-(${b})/(${m})`, pencil: true, wrong: [[n(b), 'lineform'], [n(-x0), 'sign']], steps: [`על ציר ה־[[x]] מתקיים [[y=0]]: [[0=${kx(m)}${term(b)}]]`, `מעבירים אגפים: [[${kx(m)}=${sgn(-b)}]]`, `מחלקים ב־[[${sgn(m)}]]: [[x=${sgn(x0)}]]`] });
  } },
  // ---------- Station 14 ----------
  { id: 'sysadd', station: 14, title: 'מערכת משוואות בשיטת החיבור', needs: ['eqbrk'], u: (r) => {
    const b = ri(r, 1, 5), a1 = ri(r, 1, 5), a2 = pick(r, [1, 2, 3, 4, 5].filter((v) => v !== a1)), c1 = ri(r, 1, 20), c2 = ri(r, 1, 20), opp = r() < 0.5, by = kx(b, 'y');
    const add = 'מחברים את שתי המשוואות', sub = 'מחסרים את המשוואה השנייה מהראשונה';
    return conceptQ(`במערכת [[${kx(a1)}+${by}=${c1}]] ו־[[${kx(a2)}${opp ? '−' : '+'}${by}=${c2}]] רוצים להיפטר מ־[[y]]. מה עושים?`, opp ? add : sub, [[opp ? sub : add, 'sign'], ['כופלים את שתי המשוואות זו בזו', 'op']], [
      `המקדמים של [[y]] הם [[${b}]] ו־[[${opp ? sgn(-b) : b}]]`,
      opp ? `הם נגדיים, ולכן בחיבור הם מתבטלים: [[${by}−${by}=0]]` : `הם שווים, ולכן בחיסור הם מתבטלים: [[${by}−${by}=0]]`]);
  }, e: (r) => {
    const x = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), y = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), b = ri(r, 1, 4), a1 = ri(r, 1, 4), a2 = ri(r, 1, 4), c1 = a1 * x + b * y, c2 = a2 * x - b * y, by = kx(b, 'y'), askY = r() < 0.5;
    const sys = `[[${kx(a1)}+${by}=${sgn(c1)}]] ו־[[${kx(a2)}−${by}=${sgn(c2)}]]`;
    const sum = `מחברים את שתי המשוואות, ו־[[${by}]] מתבטל: [[${kx(a1 + a2)}=${sgn(c1 + c2)}]], ולכן [[x=${sgn(x)}]]`;
    if (!askY) {
      const wrong: [string, TrapId?][] = [[n(c1 + c2), 'op'], [n(y)], [n(-x), 'sign']];
      return calc({ prompt: `במערכת ${sys}, מה הערך של [[x]]?`, ans: n(x), eq: `(${c1}+(${c2}))/${a1 + a2}`, pencil: true, wrong: wrong.filter(([v]) => v !== n(x)), steps: [sum, `בודקים בשנייה: [[${sgn(a2)}×${par(x)}−${b}×${par(y)}=${sgn(c2)}]]`] });
    }
    const wrong: [string, TrapId?][] = [[n(-y), 'sign'], [n(x)], [n(c1 - a1 * x), 'op']];
    return calc({ prompt: `במערכת ${sys}, מה הערך של [[y]]?`, ans: n(y), eq: `(${c1}-(${a1 * x}))/${b}`, pencil: true, wrong: wrong.filter(([v]) => v !== n(y)), steps: [sum, `מציבים בראשונה: [[${sgn(a1 * x)}+${by}=${sgn(c1)}]], ולכן [[${by}=${sgn(c1 - a1 * x)}]]`, `[[y=${sgn(y)}]]`] });
  } },
  { id: 'syssub', station: 14, title: 'מערכת משוואות בשיטת ההצבה', needs: ['sysadd'], u: (r) => {
    const k = pick(r, [-2, -1, 1, 2, 3]), b = ri(r, 2, 4), c = pick(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), a = pick(r, [1, 2, 3, 4, 5, 6].filter((v) => v + b * k !== 0 && v - b * k !== 0 && v + k !== 0)), d = ri(r, 1, 20);
    const res = (A: number, C: number) => `[[${kx(A)}${term(C)}=${d}]]`;
    return conceptQ(`במערכת [[y=${kx(k)}${term(c)}]] ו־[[${kx(a)}+${b}y=${d}]] מציבים את [[y]] במשוואה השנייה. איזו משוואה מתקבלת אחרי פתיחת הסוגריים?`, res(a + b * k, b * c), [[res(a + b * k, c), 'dist'], [res(a + k, c), 'dist'], [res(a - b * k, -b * c), 'sign']], [
      `כותבים במקום [[y]] את מה שהוא שווה לו, בסוגריים: [[${kx(a)}+${b}(${kx(k)}${term(c)})=${d}]]`,
      `פותחים סוגריים: [[${b}]] כופל את שני האיברים, [[${b}×${kx(k)}=${kx(b * k)}]] ו־[[${b}×${par(c)}=${sgn(b * c)}]]`,
      `מכנסים: ${res(a + b * k, b * c)}`]);
  }, e: (r) => {
    const x = pick(r, [-3, -2, -1, 1, 2, 3, 4, 5]), k = pick(r, [-2, -1, 1, 2, 3]), b = ri(r, 1, 4), c = pick(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), a = pick(r, [1, 2, 3, 4, 5].filter((v) => v + b * k !== 0)), y = k * x + c, d = a * x + b * y, A = a + b * k;
    const sys = `[[y=${kx(k)}${term(c)}]] ו־[[${kx(a)}+${kx(b, 'y')}=${sgn(d)}]]`, bs = b === 1 ? '' : String(b);
    const st = [`מציבים את [[y]] במשוואה השנייה: [[${kx(a)}+${bs}(${kx(k)}${term(c)})=${sgn(d)}]]`, `פותחים סוגריים ומכנסים: [[${kx(A)}${term(b * c)}=${sgn(d)}]], ולכן [[x=${sgn(x)}]]`];
    if (r() < 0.5) {
      const slip = (d - c) / A, wrong: [string, TrapId?][] = [[n(y)], ...(b > 1 && Number.isInteger(slip) ? [[n(slip), 'dist'] as [string, TrapId]] : []), [n(-x), 'sign']];
      return calc({ prompt: `במערכת ${sys}, מה הערך של [[x]]?`, ans: n(x), eq: `(${d}-(${b * c}))/(${A})`, pencil: true, wrong: wrong.filter(([v]) => v !== n(x)), steps: st });
    }
    const wrong: [string, TrapId?][] = [[n(x)], [n(k * x), 'op'], [n(-y), 'sign']];
    return calc({ prompt: `במערכת ${sys}, מה הערך של [[y]]?`, ans: n(y), eq: `${k}*(${x})+(${c})`, pencil: true, wrong: wrong.filter(([v]) => v !== n(y)), steps: [...st, `מציבים את [[x]] במשוואה הראשונה: [[y=${sgn(k)}×${par(x)}${term(c)}=${sgn(y)}]]`] });
  } },
  { id: 'sysword', station: 14, title: 'בעיה מילולית בשני נעלמים', needs: ['syssub'], e: (r) => {
    const kind = ri(r, 0, 2);
    if (kind === 0) {
      const [k1, k2] = [pick(r, KIDS.slice(0, 3)), pick(r, KIDS.slice(3))], t = pick(r, THINGS), y = ri(r, 5, 20), D = ri(r, 2, 10), x = y + D, S = x + y;
      const wrong: [string, TrapId?][] = [[n(y), 'op'], [n(S - D), 'op']];
      return calc({ prompt: `ל${k1} ול${k2} יש יחד [[${S}]] ${t}. ל${k1} יש [[${D}]] ${t} יותר מאשר ל${k2}. כמה ${t} יש ל${k1}?`, ans: n(x), eq: `(${S}+${D})/2`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(x)), steps: [`ל${k1} יש [[x]] ול${k2} יש [[y]]: [[x+y=${S}]] ו־[[x−y=${D}]]`, `מחברים את המשוואות: [[2x=${S + D}]]`, `[[x=${x}]]`] });
    }
    if (kind === 1) {
      const x = ri(r, 2, 12), y = ri(r, 2, 12), p = 5 * ri(r, 6, 12), q = 5 * ri(r, 2, 5), N = x + y, M = p * x + q * y;
      const wrong: [string, TrapId?][] = [[n(y), 'op'], [n(M - q * N), 'op']];
      return calc({ prompt: `בהצגה נמכרו [[${N}]] כרטיסים. כרטיס למבוגר עולה [[${p}]] שקלים, וכרטיס לילד [[${q}]] שקלים. בסך הכול שולמו [[${M}]] שקלים. כמה כרטיסים למבוגרים נמכרו?`, ans: n(x), eq: `(${M}-${q}*${N})/(${p}-${q})`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(x)), steps: [`מבוגרים: [[x]], ילדים: [[y]]. [[x+y=${N}]] ו־[[${p}x+${q}y=${M}]]`, `מהראשונה [[y=${N}−x]], ומציבים: [[${p}x+${q}(${N}−x)=${M}]], ולכן [[${p - q}x+${q * N}=${M}]]`, `[[${p - q}x=${M - q * N}]], ולכן [[x=${x}]]`] });
    }
    const x = ri(r, 3, 15), y = ri(r, 2, 12), H = x + y, L = 2 * x + 4 * y;
    const wrong: [string, TrapId?][] = [[n(x), 'op'], [n(L - 2 * H), 'op'], [n(L / 4)]];
    return calc({ prompt: `בחווה יש תרנגולות וארנבות. סופרים [[${H}]] ראשים ו־[[${L}]] רגליים. כמה ארנבות יש בחווה?`, ans: n(y), eq: `(${L}-2*${H})/2`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(y) && Number.isInteger(Number(v))), steps: [`תרנגולות: [[x]], ארנבות: [[y]]. לכל אחת ראש אחד: [[x+y=${H}]]. לתרנגולת [[2]] רגליים ולארנבת [[4]]: [[2x+4y=${L}]]`, `כופלים את הראשונה ב־[[2]] ומחסרים: [[2y=${L - 2 * H}]]`, `[[y=${y}]]`] });
  } },
  // ---------- Station 15 ----------
  { id: 'powlaw', station: 15, title: 'חוקי חזקות: כפל וחילוק חזקות', needs: ['power'], u: (r) => {
    const a = pick(r, [2, 3, 5, 7, 10]), m = ri(r, 2, 6), n2 = ri(r, 2, 5);
    if (r() < 0.5) return conceptQ(`מה שווה ל־[[${a}${sup(m)}×${a}${sup(n2)}]]?`, `[[${a}${sup(m + n2)}]]`, [[`[[${a}${sup(m * n2)}]]`, 'powlaw'], [`[[${a * a}${sup(m + n2)}]]`, 'powlaw'], [`[[${a * a}${sup(m * n2)}]]`, 'powlaw']], ['בכפל חזקות עם אותו בסיס מחברים את המעריכים, והבסיס נשאר', `יש [[${m}]] גורמים של [[${a}]] ועוד [[${n2}]] גורמים: [[${m}+${n2}=${m + n2}]], ולכן [[${a}${sup(m + n2)}]]`]);
    const big = m + n2;
    return conceptQ(`מה שווה ל־[[${a}${sup(big)}÷${a}${sup(n2)}]]?`, `[[${a}${sup(m)}]]`, [[`[[${a}${sup(big + n2)}]]`, 'powlaw'], [`[[1${sup(m)}]]`, 'powlaw'], ...(big % n2 === 0 && big / n2 !== m ? [[`[[${a}${sup(big / n2)}]]`, 'powlaw'] as [string, TrapId]] : [])], ['בחילוק חזקות עם אותו בסיס מחסרים את המעריכים, והבסיס נשאר', `[[${big}−${n2}=${m}]], ולכן [[${a}${sup(m)}]]`]);
  }, e: (r) => {
    const kind = ri(r, 0, 2), b = pick(r, ['x', 'a', '2', '3', '5']), m = ri(r, 2, 6), k = ri(r, 2, 5);
    const ask = (ex: string) => `כשכותבים את [[${ex}]] כחזקה אחת של [[${b}]], מה המעריך?`;
    const keep = (ans: number, w: [string, TrapId?][]) => w.filter(([v]) => v !== n(ans) && Number(v) > 0);
    if (kind === 0) return calc({ prompt: ask(`${b}${sup(m)}×${b}${sup(k)}`), ans: n(m + k), eq: `${m}+${k}`, wrong: keep(m + k, [[n(m * k), 'powlaw'], [n(Math.abs(m - k)), 'powlaw']]), steps: ['בכפל חזקות עם אותו בסיס מחברים את המעריכים', `[[${b}${sup(m)}×${b}${sup(k)}=${b}${sup(m + k)}]], כי [[${m}+${k}=${m + k}]]`] });
    if (kind === 1) {
      const top = m + k;
      return calc({ prompt: ask(`${b}${sup(top)}÷${b}${sup(k)}`), ans: n(m), eq: `${top}-${k}`, wrong: keep(m, [[n(top + k), 'powlaw'], ...(top % k === 0 ? [[n(top / k), 'powlaw'] as [string, TrapId]] : [])]), steps: ['בחילוק חזקות עם אותו בסיס מחסרים את המעריכים', `[[${b}${sup(top)}÷${b}${sup(k)}=${b}${sup(m)}]], כי [[${top}−${k}=${m}]]`] });
    }
    return calc({ prompt: ask(`(${b}${sup(m)})${sup(k)}`), ans: n(m * k), eq: `${m}*${k}`, wrong: keep(m * k, [[n(m + k), 'powlaw'], [n(m ** k)]]), steps: [`[[(${b}${sup(m)})${sup(k)}]] הוא [[${b}${sup(m)}]] כפול עצמו [[${k}]] פעמים`, `מחברים [[${k}]] פעמים את [[${m}]], כלומר כופלים את המעריכים: [[${m}×${k}=${m * k}]]`] });
  } },
  { id: 'powneg', station: 15, title: 'חזקה אפס וחזקה שלילית', needs: ['powlaw'], u: (r) => {
    if (r() < 0.35) {
      const a = pick(r, [2, 3, 7, 10, 25, 100, 347]);
      return conceptQ(`כמה זה [[${a}⁰]]?`, '[[1]]', [['[[0]]', 'powneg'], [`[[${a}]]`, 'powneg']], [`[[${a}${sup(3)}÷${a}${sup(3)}=${a}${sup(3 - 3)}=${a}⁰]], ומספר מחולק בעצמו הוא [[1]]`, 'לכן כל מספר חוץ מ־0 בחזקת 0 שווה [[1]]']);
    }
    const [a, k] = pick(r, [[2, 2], [2, 3], [2, 4], [3, 2], [3, 3], [4, 2], [5, 2], [10, 2], [10, 3]]), p = a ** k;
    return conceptQ(`כמה זה [[${a}${sup(-k)}]]?`, `[[1/${p}]]`, [[`[[−${p}]]`, 'powneg'], [`[[−${a * k}]]`, 'powneg'], [`[[1/${a * k}]]`, 'powneg']], [`מעריך שלילי פירושו אחד חלקי החזקה: [[${a}${sup(-k)}=1÷${a}${sup(k)}]]`, `[[${a}${sup(k)}=${p}]], ולכן [[1/${p}]]`]);
  }, e: (r) => {
    const kind = ri(r, 0, 2);
    if (kind === 0) {
      const a = ri(r, 2, 12), m = ri(r, 2, 5);
      return calc({ prompt: `כמה זה [[${a}${sup(m)}÷${a}${sup(m)}]]? אפשר לכתוב אותו גם כ־[[${a}⁰]]`, ans: '1', eq: `${a ** m}/${a ** m}`, wrong: [['0', 'powneg'], [n(a), 'powneg']], steps: [`מחסרים מעריכים: [[${a}${sup(m)}÷${a}${sup(m)}=${a}⁰]]`, `וכל מספר מחולק בעצמו הוא [[1]], ולכן [[${a}⁰=1]]`] });
    }
    const [a, k] = pick(r, [[2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [4, 2], [5, 2], [10, 1], [10, 2]]), p = a ** k;
    if (kind === 1) return calc({ prompt: `[[${a}${sup(-k)}]] שווה ל־[[1]] חלקי מספר. מה המספר?`, ans: n(p), eq: `${p}`, wrong: [[n(-p), 'powneg'], ...(k > 1 && a * k !== p ? [[n(a * k), 'powneg'] as [string, TrapId]] : [])], steps: [`מעריך שלילי פירושו אחד חלקי החזקה: [[${a}${sup(-k)}=1÷${a}${sup(k)}]]`, `[[${a}${sup(k)}=${p}]], ולכן [[${a}${sup(-k)}=1/${p}]]. התוצאה חיובית: המינוס במעריך לא הופך את הסימן`] });
    const m = k + ri(r, 1, 2);
    return calc({ prompt: `כמה זה [[${a}${sup(m)}×${a}${sup(-k)}]]?`, ans: n(a ** (m - k)), eq: `${a ** m}/${p}`, wrong: [[n(a ** (m + k)), 'powneg'], [n(a ** m), 'powneg']], steps: [`מחברים מעריכים: [[${m}+(−${k})=${m - k}]]`, `[[${a}${sup(m - k)}=${a ** (m - k)}]]`] });
  } },
  { id: 'sci', station: 15, title: 'כתיב מדעי', needs: ['powneg'], u: (r) => {
    const d1 = ri(r, 1, 9), d2 = ri(r, 0, 9), D = d2 ? d1 * 10 + d2 : d1, m = d2 ? `${d1}.${d2}` : `${d1}`, neg = r() < 0.4, k = neg ? -ri(r, 2, 5) : ri(r, 3, 7);
    const shift = d2 ? 1 : 0, num = neg ? dec(D, shift - k) : fmt(D * 10 ** (k - shift)), big = d2 ? `${D}` : `${d1}0`;
    const s10 = (e: number) => `10${sup(e)}`;
    return conceptQ(`איך כותבים את [[${num}]] בכתיב מדעי?`, `[[${m}×${s10(k)}]]`, [[`[[${big}×${s10(k - 1)}]]`, 'sci'], [`[[${m}×${s10(neg ? k - 1 : k + 1)}]]`, 'sci'], [`[[${m}×${s10(-k)}]]`, 'sci']], ['בכתיב מדעי המספר שלפני ה־10 הוא בין [[1]] ל־[[10]]', neg ? `מזיזים את הנקודה ימינה עד אחרי הספרה [[${d1}]]: [[${-k}]] מקומות, ולכן המעריך [[${sgn(k)}]]` : `מזיזים את הנקודה שמאלה עד אחרי הספרה [[${d1}]]: [[${k}]] מקומות, ולכן המעריך [[${k}]]`]);
  }, e: (r) => {
    const d1 = ri(r, 1, 9), d2 = ri(r, 1, 9), D = d1 * 10 + d2, m = `${d1}.${d2}`;
    if (r() < 0.5) {
      const k = ri(r, 2, 6), v = D * 10 ** (k - 1);
      return calc({ prompt: `כמה זה [[${m}×10${sup(k)}]] במספר רגיל?`, ans: n(v), eq: `${D}*${10 ** (k - 1)}`, pencil: true, wrong: [[n(v * 10), 'sci'], [n(v / 10), 'sci']], steps: [`[[10${sup(k)}]] מזיז את הנקודה [[${k}]] מקומות ימינה`, `[[${m}]] הופך ל־[[${fmt(v)}]]: אחרי הספרה [[${d2}]] מוסיפים ${k === 2 ? 'אפס אחד' : `[[${k - 1}]] אפסים`}`] });
    }
    const neg = r() < 0.5, k = neg ? -ri(r, 2, 5) : ri(r, 3, 7), num = neg ? dec(D, 1 - k) : fmt(D * 10 ** (k - 1));
    return calc({ prompt: `כשכותבים את [[${num}]] בכתיב מדעי, [[${m}×10ⁿ]], מה המעריך [[n]]?`, ans: n(k), eq: `${k}`, wrong: [[n(neg ? k - 1 : k + 1), 'sci'], [n(-k), 'sci']], steps: ['בכתיב מדעי המספר שלפני ה־10 הוא בין [[1]] ל־[[10]]', neg ? `מזיזים את הנקודה ימינה עד אחרי הספרה [[${d1}]]: [[${-k}]] מקומות, ולכן [[n=${sgn(k)}]]` : `מזיזים את הנקודה שמאלה עד אחרי הספרה [[${d1}]]: [[${k}]] מקומות, ולכן [[n=${k}]]`] });
  } },
  { id: 'rootsimp', station: 15, title: 'שורשים: הערכה ופישוט', needs: ['root'], u: (r) => {
    if (r() < 0.4) {
      const lo = ri(r, 2, 11), N = lo * lo + ri(r, 1, 2 * lo), h = Math.round(N / 2), hs = Math.floor(Math.sqrt(h));
      const opt = (a: number) => `בין [[${a}]] ל־[[${a + 1}]]`;
      return conceptQ(`בין אילו שני מספרים שלמים נמצא [[√${N}]]?`, opt(lo), [opt(lo + 1), opt(lo - 1), ...(hs !== lo && hs !== lo + 1 && hs !== lo - 1 ? [opt(hs)] : [])], [`[[${lo}×${lo}=${lo * lo}]] ו־[[${lo + 1}×${lo + 1}=${(lo + 1) * (lo + 1)}]]`, `[[${N}]] נמצא בין [[${lo * lo}]] ל־[[${(lo + 1) * (lo + 1)}]], ולכן [[√${N}]] בין [[${lo}]] ל־[[${lo + 1}]]`]);
    }
    const [a, b] = pick(r, [[2, 2], [2, 3], [2, 5], [2, 6], [2, 7], [3, 2], [3, 3], [3, 5], [3, 6], [4, 2], [4, 3], [5, 2], [5, 3], [6, 2], [6, 3], [7, 2], [4, 5], [2, 10], [3, 7]]), N = a * a * b;
    const others: [string, TrapId][] = [[`[[${a * a}√${b}]]`, 'rootsimp'], [`[[${b}√${a * a}]]`, 'rootsimp'], ...(a % 2 === 0 && a > 2 ? [[`[[${a / 2}√${4 * b}]]`, 'rootsimp'] as [string, TrapId]] : [[`[[${a}√${a * b}]]`, 'rootsimp'] as [string, TrapId]])];
    return conceptQ(`מה שווה ל־[[√${N}]] אחרי פישוט?`, `[[${a}√${b}]]`, others, [`מפרקים לריבוע שלם הגדול ביותר כפול מספר: [[${N}=${a * a}×${b}]]`, `[[√${a * a}=${a}]], ולכן [[√${N}=${a}√${b}]]`]);
  }, e: (r) => {
    if (r() < 0.5) {
      const [a, b] = pick(r, [[2, 2], [2, 3], [2, 5], [2, 6], [3, 2], [3, 3], [3, 5], [4, 2], [4, 3], [5, 2], [5, 3], [6, 2], [7, 2], [3, 7]]), N = a * a * b;
      return calc({ prompt: `[[√${N}]] שווה ל־[[k√${b}]]. מה [[k]]?`, ans: n(a), eq: `${a}`, wrong: [[n(a * a), 'rootsimp'], [n(N / b / 2), 'rootsimp']].filter(([v]) => v !== n(a)) as [string, TrapId][], steps: [`[[${N}=${a * a}×${b}]]`, `[[√${a * a}=${a}]], ולכן [[√${N}=${a}√${b}]] ו־[[k=${a}]]`] });
    }
    const [p, q] = pick(r, [[2, 8], [2, 18], [3, 12], [3, 27], [2, 32], [5, 20], [2, 50], [3, 48], [6, 24], [7, 28]]), s = Math.round(Math.sqrt(p * q));
    return calc({ prompt: `כמה זה [[√${p}×√${q}]]?`, ans: n(s), eq: `${s}`, wrong: [[n(p * q), 'rootsimp'], [n(p + q)]].filter(([v]) => v !== n(s)) as [string, TrapId?][], steps: [`כופלים מתחת לשורש: [[√${p}×√${q}=√${p * q}]]`, `[[${s}×${s}=${p * q}]], ולכן [[√${p * q}=${s}]]`] });
  } },
  // ---------- Station 16 ----------
  { id: 'sqsum', station: 16, title: 'נוסחאות כפל מקוצר: (a+b)², (a−b)², (a+b)(a−b)', needs: ['simplify'], u: (r) => {
    const a = ri(r, 2, 9), kind = ri(r, 0, 2), a2 = a * a, b2 = 2 * a;
    if (kind === 0) return conceptQ(`מה שווה ל־[[(x+${a})²]]?`, `[[x²+${b2}x+${a2}]]`, [[`[[x²+${a2}]]`, 'sqsum'], [`[[x²+${a}x+${a2}]]`, 'sqsum'], [`[[x²+${b2}x+${b2}]]`, 'sqsum']], [`[[(x+${a})²=(x+${a})(x+${a})]]`, `לפי הנוסחה: [[x²]], ועוד פעמיים [[x×${a}]], ועוד [[${a}²]]: [[x²+${b2}x+${a2}]]`]);
    if (kind === 1) return conceptQ(`מה שווה ל־[[(x−${a})²]]?`, `[[x²−${b2}x+${a2}]]`, [[`[[x²−${a2}]]`, 'sqsum'], [`[[x²−${b2}x−${a2}]]`, 'sign'], [`[[x²+${b2}x+${a2}]]`, 'sign']], [`[[(x−${a})²=(x−${a})(x−${a})]]`, `האיבר האמצעי שלילי: [[−2×${a}x=−${b2}x]], והאחרון חיובי: [[(−${a})×(−${a})=${a2}]]`]);
    return conceptQ(`מה שווה ל־[[(x+${a})(x−${a})]]?`, `[[x²−${a2}]]`, [[`[[x²+${a2}]]`, 'sign'], [`[[x²−${b2}x+${a2}]]`, 'sqsum'], [`[[x²−${b2}]]`, 'sqsum']], [`פותחים סוגריים: [[x²−${a}x+${a}x−${a2}]]`, `האיברים האמצעיים מבטלים זה את זה, ונשאר [[x²−${a2}]]`]);
  }, e: (r) => {
    if (r() < 0.5) {
      const a = ri(r, 2, 9), minus = r() < 0.5, s = minus ? '−' : '+', askB = r() < 0.5;
      const ans = askB ? (minus ? -2 * a : 2 * a) : a * a;
      const wrong: [string, TrapId?][] = askB ? [[n(minus ? -a : a), 'sqsum'], [n(minus ? 2 * a : -2 * a), 'sign'], [n(a * a), 'sqsum']] : [[n(2 * a), 'sqsum'], [n(-a * a), 'sign']];
      return calc({ prompt: `כשפותחים את [[(x${s}${a})²]] מקבלים [[x²+bx+c]]. מה ${askB ? '[[b]]' : '[[c]]'}?`, ans: n(ans), eq: askB ? `${minus ? -2 : 2}*${a}` : `${a}*${a}`, wrong: wrong.filter(([v]) => v !== n(ans)), steps: [`[[(x${s}${a})²=x²${s}2×${a}x+${a}²]]`, `[[x²${s}${2 * a}x+${a * a}]], ולכן ${askB ? `[[b=${sgn(ans)}]]` : `[[c=${ans}]]`}`] });
    }
    const t = pick(r, [20, 30, 40, 50, 60, 70, 80, 90]), d = ri(r, 1, 3), ans = t * t - d * d;
    return calc({ prompt: `בעזרת [[(a+b)(a−b)=a²−b²]], כמה זה [[${t + d}×${t - d}]]?`, ans: n(ans), eq: `${t + d}*${t - d}`, pencil: true, wrong: [[n(t * t), 'sqsum'], [n(t * t + d * d), 'sign'], [n(t * t - 2 * d), 'sqsum']], steps: [`[[${t + d}×${t - d}=(${t}+${d})(${t}−${d})]]`, `[[${t}²−${d}²=${t * t}−${d * d}=${ans}]]`] });
  } },
  { id: 'trinom', station: 16, title: 'פירוק טרינום x²+bx+c', needs: ['sqsum', 'factor1'], u: (r) => {
    const opts = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7];
    let p = pick(r, opts), q = pick(r, opts);
    while (p === q || p + q === 0) q = pick(r, opts);
    const B = p + q, C = p * q, tri = `x²${B > 0 ? '+' : ''}${kx(B)}${term(C)}`;
    const fac = (u: number, v: number) => `[[(x${term(Math.max(u, v))})(x${term(Math.min(u, v))})]]`;
    const same = (u: number, v: number) => (u === p && v === q) || (u === q && v === p);
    const cand: [number, number][] = [[-p, -q], [1, C], [-1, -C], [p + 1, q - 1], [p - 1, q + 1], [p, -q]];
    const others = cand.filter(([u, v]) => u !== 0 && v !== 0 && !same(u, v)).slice(0, 3).map(([u, v]) => [fac(u, v), 'trinom'] as [string, TrapId]);
    return conceptQ(`איך מפרקים את [[${tri}]] לגורמים?`, fac(p, q), others, [`מחפשים שני מספרים שמכפלתם [[${sgn(C)}]] וסכומם [[${sgn(B)}]]`, `[[${par(p)}×${par(q)}=${sgn(C)}]] ו־[[${sgn(p)}+${par(q)}=${sgn(B)}]], ולכן ${fac(p, q)}`]);
  }, e: (r) => {
    const opts = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7];
    let p = pick(r, opts), q = pick(r, opts);
    while (p === q || p + q === 0) q = pick(r, opts);
    const B = p + q, C = p * q, hi = Math.max(p, q), lo = Math.min(p, q), tri = `x²${B > 0 ? '+' : ''}${kx(B)}${term(C)}`;
    const wrong = ([[n(-hi), 'trinom'], [n(-lo), 'trinom'], [n(B), 'trinom']] as [string, TrapId][]).filter(([v]) => v !== n(hi));
    return calc({ prompt: `[[${tri}=(x+p)(x+q)]]. מה הגדול מבין [[p]] ו־[[q]]?`, ans: n(hi), eq: `${hi}`, wrong, steps: [`מחפשים שני מספרים שמכפלתם [[${sgn(C)}]] וסכומם [[${sgn(B)}]]`, `אלה [[${sgn(hi)}]] ו־[[${sgn(lo)}]]: [[${par(hi)}×${par(lo)}=${sgn(C)}]] ו־[[${sgn(hi)}+${par(lo)}=${sgn(B)}]]`, `הגדול מביניהם הוא [[${sgn(hi)}]]`] });
  } },
  { id: 'quadeq', station: 16, title: 'משוואה ריבועית בפירוק', needs: ['trinom'], u: (r) => {
    const opts = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7];
    let s = pick(r, opts), t = pick(r, opts);
    while (s === t || s + t === 0) t = pick(r, opts);
    const hi = Math.max(s, t), lo = Math.min(s, t), B = -(s + t), C = s * t, tri = `x²${B > 0 ? '+' : ''}${kx(B)}${term(C)}=0`;
    const sol = (u: number, v: number) => `[[x=${sgn(Math.max(u, v))}]] או [[x=${sgn(Math.min(u, v))}]]`;
    return conceptQ(`מה הפתרונות של [[${tri}]]?`, sol(hi, lo), [[sol(-hi, -lo), 'quadeq'], [`רק [[x=${sgn(hi)}]]`, 'quadeq'], [sol(-hi, lo), 'quadeq']], [`מפרקים: [[(x${term(-hi)})(x${term(-lo)})=0]]`, `מכפלה שווה [[0]] כשאחד הגורמים שווה [[0]]: [[x${term(-hi)}=0]] או [[x${term(-lo)}=0]]`, `ולכן ${sol(hi, lo)}`]);
  }, e: (r) => {
    const opts = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7];
    let s = pick(r, opts), t = pick(r, opts);
    while (s === t || s + t === 0) t = pick(r, opts);
    const hi = Math.max(s, t), lo = Math.min(s, t), B = -(s + t), C = s * t, tri = `x²${B > 0 ? '+' : ''}${kx(B)}${term(C)}=0`;
    return calc({ prompt: `למשוואה [[${tri}]] יש שני פתרונות. מה הגדול מביניהם?`, ans: n(hi), eq: `${hi}`, pencil: true, wrong: ([[n(-lo), 'quadeq'], [n(-hi), 'quadeq'], [n(lo)]] as [string, TrapId?][]).filter(([v]) => v !== n(hi)), steps: [`מפרקים: [[(x${term(-hi)})(x${term(-lo)})=0]]`, `[[x${term(-hi)}=0]] או [[x${term(-lo)}=0]], כלומר [[x=${sgn(hi)}]] או [[x=${sgn(lo)}]]`, `הגדול הוא [[${sgn(hi)}]]`] });
  } },
  { id: 'quadform', station: 16, title: 'נוסחת השורשים', needs: ['quadeq', 'rootsimp'], u: (r) => {
    const kind = ri(r, 0, 2), a = kind === 1 ? 1 : ri(r, 1, 3), b = pick(r, [-6, -4, -2, 2, 4, 6]);
    const c = kind === 0 ? -ri(r, 1, 5) : kind === 1 ? (b * b) / (4 * a) : Math.floor((b * b) / (4 * a)) + ri(r, 1, 4);
    const D = b * b - 4 * a * c, eq = `${a === 1 ? '' : a}x²${b > 0 ? '+' : ''}${kx(b)}${term(c)}=0`;
    const ans = kind === 0 ? 'שני פתרונות' : kind === 1 ? 'פתרון אחד' : 'אין פתרון';
    const others = ['שני פתרונות', 'פתרון אחד', 'אין פתרון'].filter((x) => x !== ans).map((x) => [x, 'quadform'] as [string, TrapId]);
    return conceptQ(`כמה פתרונות יש ל־[[${eq}]]?`, ans, others, [`מחשבים את הדיסקרימיננטה: [[b²−4ac=${par(b)}²−4×${a}×${par(c)}=${sgn(D)}]]`, D > 0 ? 'היא חיובית, ולכן יש שני פתרונות' : D === 0 ? 'היא [[0]], ולכן יש פתרון אחד' : 'היא שלילית, ואין שורש למספר שלילי, ולכן אין פתרון']);
  }, e: (r) => {
    const a = ri(r, 1, 3), s = ri(r, -5, 5), t0 = ri(r, -5, 5), t = t0 === s ? s + 1 : t0, b = -a * (s + t), c = a * s * t, D = b * b - 4 * a * c;
    const eqs = `${a === 1 ? '' : a}x²${b > 0 ? '+' : ''}${b ? kx(b) : ''}${term(c)}=0`;
    if (r() < 0.5) {
      const wrong = ([[n(b * b + 4 * a * c), 'quadform'], [n(-(b * b) - 4 * a * c), 'quadform'], [n(b * b - a * c), 'quadform']] as [string, TrapId][]).filter(([v]) => v !== n(D));
      return calc({ prompt: `במשוואה [[${eqs}]], כמה שווה [[b²−4ac]]?`, ans: n(D), eq: `(${b})*(${b})-4*${a}*(${c})`, pencil: true, wrong, steps: [`[[a=${a}]], [[b=${sgn(b)}]], [[c=${sgn(c)}]]`, `[[${par(b)}²−4×${a}×${par(c)}=${b * b}${c > 0 ? '−' : '+'}${Math.abs(4 * a * c)}=${sgn(D)}]]`] });
    }
    const hi = Math.max(s, t), lo = Math.min(s, t), sq = Math.round(Math.sqrt(D));
    return calc({ prompt: `פותרים את [[${eqs}]] בנוסחת השורשים. מה הפתרון הגדול?`, ans: n(hi), eq: `(-(${b})+${sq})/(2*${a})`, pencil: true, wrong: ([[n(-lo), 'quadeq'], [n(lo)], [n(-hi), 'quadeq']] as [string, TrapId?][]).filter(([v]) => v !== n(hi)), steps: [`[[b²−4ac=${b * b}${c > 0 ? '−' : '+'}${Math.abs(4 * a * c)}=${D}]], ושורשה [[${sq}]]`, `[[x=(${sgn(-b)}±${sq})÷${2 * a}]]`, `הגדול: [[(${sgn(-b)}+${sq})÷${2 * a}=${sgn(hi)}]]`] });
  } },
  { id: 'parab', station: 16, title: 'פרבולה: קודקוד ונקודות חיתוך', needs: ['quadeq', 'linefn'], u: (r) => {
    const opts = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
    if (r() < 0.5) {
      const h = pick(r, opts), k = pick(r, opts.filter((v) => v !== h)), f = `y=(x${term(-h)})²${term(k)}`;
      return conceptQ(`מה הקודקוד של הפרבולה [[${f}]]?`, `[[${pt(h, k)}]]`, [[`[[${pt(-h, k)}]]`, 'parab'], [`[[${pt(h, -k)}]]`, 'parab'], [`[[${pt(k, h)}]]`, 'parab']], [`ב־[[y=(x−h)²+k]] הקודקוד הוא [[(h,k)]]`, `[[x${term(-h)}=0]] כש־[[x=${sgn(h)}]], ואז [[y=${sgn(k)}]]: הקודקוד [[${pt(h, k)}]]`]);
    }
    let s = pick(r, opts), t = pick(r, opts);
    while (s === t || s + t === 0) t = pick(r, opts);
    const hi = Math.max(s, t), lo = Math.min(s, t), B = -(s + t), C = s * t, f = `y=x²${B > 0 ? '+' : ''}${kx(B)}${term(C)}`;
    const two = (a: string, b: string) => `[[${a}]] ו־[[${b}]]`;
    return conceptQ(`באילו נקודות הפרבולה [[${f}]] חותכת את ציר ה־[[x]]?`, two(pt(lo, 0), pt(hi, 0)), [[two(pt(-hi, 0), pt(-lo, 0)), 'quadeq'], [two(pt(0, lo), pt(0, hi)), 'parab'], [`רק [[${pt(0, C)}]]`, 'parab']], [
      `על ציר ה־[[x]] מתקיים [[y=0]]: [[x²${B > 0 ? '+' : ''}${kx(B)}${term(C)}=0]]`,
      `מפרקים: [[(x${term(-hi)})(x${term(-lo)})=0]], ולכן [[x=${sgn(hi)}]] או [[x=${sgn(lo)}]]`,
      `הנקודות ${two(pt(lo, 0), pt(hi, 0))}`]);
  }, e: (r) => {
    const h = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4]), k = pick(r, [-9, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), B = -2 * h, C = h * h + k, f = `y=x²${B > 0 ? '+' : ''}${kx(B)}${term(C)}`;
    const xs = `שיעור ה־[[x]] של הקודקוד: [[x=−b÷2=${sgn(-B)}÷2=${sgn(h)}]]`;
    if (r() < 0.5) return calc({ prompt: `מה שיעור ה־[[x]] של קודקוד הפרבולה [[${f}]]?`, ans: n(h), eq: `-(${B})/2`, pencil: true, wrong: ([[n(-h), 'parab'], [n(B), 'parab']] as [string, TrapId][]).filter(([v]) => v !== n(h)), steps: [xs, 'בקודקוד הפרבולה מחליפה כיוון, והיא סימטרית סביבו'] });
    return calc({ prompt: `מה שיעור ה־[[y]] של קודקוד הפרבולה [[${f}]]?`, ans: n(k), eq: `(${h})*(${h})+(${B})*(${h})+(${C})`, pencil: true, wrong: ([[n(C), 'parab'], [n(4 * h * h + k), 'sign']] as [string, TrapId][]).filter(([v]) => v !== n(k)), steps: [xs, `מציבים [[x=${sgn(h)}]]: [[y=${par(h)}²${term(B)}×${par(h)}${term(C)}=${h * h}${term(B * h)}${term(C)}=${sgn(k)}]]`] });
  } },
  // ---------- Station 17 ----------
  { id: 'prop', station: 17, title: 'פרופורציה ומכפלה בהצלבה', needs: ['ratio'], u: (r) => {
    const t = pick(r, ['מחברות', 'מדבקות', 'גלויות', 'קופסאות']), a = ri(r, 2, 5), u = ri(r, 2, 9), p = a * u, b = pick(r, [6, 7, 8, 9, 10, 11, 12].filter((v) => v !== a));
    return conceptQ(`[[${a}]] ${t} עולות [[${p}]] שקלים. איזו פרופורציה מתאימה לחישוב המחיר [[x]] של [[${b}]] ${t}?`, `[[${a}/${p}=${b}/x]]`, [[`[[${a}/${p}=x/${b}]]`, 'prop'], [`[[${a}/x=${b}/${p}]]`, 'prop'], [`[[${a}/${b}=x/${p}]]`, 'prop']], [
      `בשני השברים שמים את מספר ה${t} למעלה ואת המחיר למטה`,
      `[[${a}/${p}=${b}/x]], ובמכפלה בהצלבה: [[${a}x=${p}×${b}]]`,
      `[[x=${p * b}÷${a}=${u * b}]]`]);
  }, e: (r) => {
    const a = ri(r, 1, 9), b = pick(r, [2, 3, 4, 5, 6, 7, 8, 9].filter((v) => v !== a)), k = ri(r, 2, 6), d = b * k, x = a * k, top = r() < 0.5;
    const wrong: [string, TrapId?][] = [[n(a + d - b), 'prop'], [n(a * d), 'op']];
    if (top) return calc({ prompt: `מה הערך של [[x]] אם [[${a}/${b}=x/${d}]]?`, ans: n(x), eq: `${a}*${d}/${b}`, pencil: true, wrong: wrong.filter(([v]) => v !== n(x) && Number(v) > 0), steps: [`מכפלה בהצלבה: [[${b}×x=${a}×${d}]]`, `[[${b}x=${a * d}]], ומחלקים ב־[[${b}]]: [[x=${x}]]`] });
    const w2: [string, TrapId?][] = [[n(b + x - a), 'prop'], [n(b * x), 'op']];
    return calc({ prompt: `מה הערך של [[x]] אם [[${a}/${b}=${x}/x]]?`, ans: n(d), eq: `${b}*${x}/${a}`, pencil: true, wrong: w2.filter(([v]) => v !== n(d) && Number(v) > 0), steps: [`מכפלה בהצלבה: [[${a}×x=${b}×${x}]]`, `[[${a}x=${b * x}]], ומחלקים ב־[[${a}]]: [[x=${d}]]`] });
  } },
  { id: 'pctchg', station: 17, title: 'שינוי באחוזים (עלייה וירידה)', needs: ['pctof'], u: (r) => {
    if (r() < 0.4) {
      const p = pick(r, [10, 20, 50]), upFirst = r() < 0.5, mid = upFirst ? 100 + p : 100 - p, end = 100 - (p * p) / 100;
      const first = upFirst ? 'עלה' : 'ירד', second = upFirst ? 'ירד' : 'עלה';
      return conceptQ(`מחיר ${first} ב־[[${p}%]], ואחר כך ${second} ב־[[${p}%]]. מה המחיר עכשיו?`, 'נמוך מהמחיר ההתחלתי', [['שווה למחיר ההתחלתי', 'pctchg'], ['גבוה מהמחיר ההתחלתי', 'pctchg']], [
        `נניח שהמחיר היה [[100]]. אחרי השינוי הראשון: [[${mid}]]`,
        `השינוי השני מחושב מ־[[${mid}]], ולא מ־[[100]]: [[${p}%]] מ־[[${mid}]] הם [[${(mid * p) / 100}]]`,
        `${upFirst ? `[[${mid}−${(mid * p) / 100}=${end}]]` : `[[${mid}+${(mid * p) / 100}=${end}]]`}, פחות מ־[[100]]`]);
    }
    const p = pick(r, [5, 10, 15, 20, 25, 30, 40, 50, 60]), up = r() < 0.5, ans = dec(up ? 100 + p : 100 - p, 2);
    return conceptQ(`כדי ${up ? 'להעלות' : 'להוריד'} מחיר ב־[[${p}%]], בכמה כופלים אותו?`, `[[${ans}]]`, [[`[[${dec(p, 2)}]]`, 'pctchg'], [`[[${dec(up ? 100 - p : 100 + p, 2)}]]`, 'sign'], [`[[${p}]]`, 'percent']], [
      `המחיר כולו הוא [[100%]]. ${up ? `אחרי העלייה הוא [[100%+${p}%=${100 + p}%]]` : `אחרי הירידה נשארים [[100%−${p}%=${100 - p}%]]`}`,
      `[[${up ? 100 + p : 100 - p}%]] הם [[${ans}]], ולכן כופלים ב־[[${ans}]]`]);
  }, e: (r) => {
    const p = pick(r, [5, 10, 15, 20, 25, 30, 40, 50]), up = r() < 0.5, O = 20 * pick(r, [2, 3, 4, 6, 7, 8, 9, 10, 12, 15]), d = (O * p) / 100, N = up ? O + d : O - d, s = up ? '+' : '−';
    if (r() < 0.5) {
      const wrong: [string, TrapId?][] = [[n(up ? O - d : O + d), 'sign'], [n(d), 'pctchg'], [n(up ? O + p : O - p), 'percent']];
      return calc({ prompt: `מחיר של מוצר היה [[${O}]] שקלים, והוא ${up ? 'עלה' : 'ירד'} ב־[[${p}%]]. מה המחיר החדש?`, ans: n(N), eq: `${O}*(100${up ? '+' : '-'}${p})/100`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(N) && Number(v) > 0), steps: [`השינוי: [[${p}%]] מ־[[${O}]] הם [[${O}×${p}:100=${d}]]`, `[[${O}${s}${d}=${N}]]`, `או בבת אחת: [[${O}×${dec(up ? 100 + p : 100 - p, 2)}=${N}]]`] });
    }
    const wrong: [string, TrapId?][] = [[n(d), 'pctchg'], ...(((d * 100) % N === 0) ? [[n((d * 100) / N), 'pctchg'] as [string, TrapId]] : [])];
    return calc({ prompt: `מחיר ${up ? 'עלה' : 'ירד'} מ־[[${O}]] ל־[[${N}]] שקלים. בכמה אחוזים הוא ${up ? 'עלה' : 'ירד'}?`, ans: n(p), eq: `${d}/${O}*100`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(p)), steps: [`השינוי: [[${up ? `${N}−${O}` : `${O}−${N}`}=${d}]] שקלים`, `מחלקים במחיר שלפני השינוי: [[${d}÷${O}=${reduced(d, O)}]]`, `[[${reduced(d, O)}×100=${p}]], כלומר [[${p}%]]`] });
  } },
  { id: 'pctrev', station: 17, title: 'מציאת המחיר המקורי אחרי שינוי', needs: ['pctchg'], u: (r) => {
    const p = pick(r, [10, 20, 25, 50]), up = r() < 0.5, O = 20 * pick(r, [2, 3, 4, 6, 7, 8, 9, 10, 12, 15]), N = (O * (up ? 100 + p : 100 - p)) / 100, f = dec(up ? 100 + p : 100 - p, 2);
    return conceptQ(`אחרי ${up ? 'התייקרות' : 'הנחה'} של [[${p}%]] המחיר הוא [[${N}]] שקלים. איך מוצאים את המחיר שהיה לפני כן?`, `מחלקים את [[${N}]] ב־[[${f}]]`, [[up ? `מורידים [[${p}%]] מ־[[${N}]]` : `מוסיפים ל־[[${N}]] עוד [[${p}%]] ממנו`, 'pctrev'], [`כופלים את [[${N}]] ב־[[${f}]]`, 'pctrev'], [up ? `מחסרים [[${p}]] מ־[[${N}]]` : `מוסיפים [[${p}]] ל־[[${N}]]`, 'percent']], [
      `המחיר המקורי כפול [[${f}]] שווה [[${N}]], כי ${up ? 'נוספו' : 'נשארו'} [[${up ? 100 + p : 100 - p}%]]`,
      `כדי לחזור אחורה עושים את הפעולה ההפוכה: [[${N}÷${f}=${O}]]`]);
  }, e: (r) => {
    const p = pick(r, [10, 20, 25, 50]), up = r() < 0.5, O = 20 * pick(r, [2, 3, 4, 6, 7, 8, 9, 10, 12, 15]), q = up ? 100 + p : 100 - p, N = (O * q) / 100, f = dec(q, 2);
    const wrong: [string, TrapId?][] = [...((N * p) % 100 === 0 ? [[n(up ? N - (N * p) / 100 : N + (N * p) / 100), 'pctrev'] as [string, TrapId]] : []), [n(up ? N - p : N + p), 'percent']];
    return calc({ prompt: `אחרי ${up ? 'התייקרות' : 'הנחה'} של [[${p}%]] מוצר עולה [[${N}]] שקלים. כמה הוא עלה לפני ה${up ? 'התייקרות' : 'הנחה'}?`, ans: n(O), eq: `${N}*100/${q}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(O) && Number(v) > 0), steps: [`${up ? 'אחרי התייקרות' : 'אחרי הנחה'} של [[${p}%]] המחיר הוא [[${q}%]] מהמקורי: המחיר המקורי כפול [[${f}]] שווה [[${N}]]`, `מחלקים: [[${N}÷${f}=${O}]]`, `בודקים: [[${p}%]] מ־[[${O}]] הם [[${(O * p) / 100}]], ו־[[${O}${up ? '+' : '−'}${(O * p) / 100}=${N}]]`] });
  } },
  { id: 'interest', station: 17, title: 'ריבית פשוטה וריבית דריבית בשנתיים', needs: ['pctchg'], u: (r) => {
    const P = 1000 * ri(r, 1, 5), p = pick(r, [10, 20]), i1 = (P * p) / 100, A1 = P + i1, i2 = (A1 * p) / 100, f = dec(100 + p, 2);
    if (r() < 0.4) return conceptQ(`מפקידים [[${fmt(P)}]] שקלים לשנתיים, בריבית של [[${p}%]] לשנה. באיזו ריבית יהיה בסוף יותר כסף?`, 'בריבית דריבית', [['בריבית פשוטה', 'interest'], ['בשתיהן אותו סכום', 'interest']], [
      `בריבית פשוטה מקבלים כל שנה [[${p}%]] מ־[[${fmt(P)}]]: [[${fmt(i1)}]] בשנה, ובסך הכול [[${fmt(P + 2 * i1)}]]`,
      `בריבית דריבית השנה השנייה מחושבת מ־[[${fmt(A1)}]]: [[${fmt(A1)}+${fmt(i2)}=${fmt(A1 + i2)}]]`]);
    return conceptQ(`מפקידים [[${fmt(P)}]] שקלים בריבית דריבית של [[${p}%]] לשנה. כמה ריבית מקבלים בשנה השנייה?`, `[[${fmt(i2)}]]`, [[`[[${fmt(i1)}]]`, 'interest'], [`[[${fmt(i1 + i2)}]]`, 'op'], [`[[${fmt(A1 + i2)}]]`, 'op']], [
      `אחרי השנה הראשונה: [[${fmt(P)}×${f}=${fmt(A1)}]]`,
      `בשנה השנייה הריבית מחושבת מ־[[${fmt(A1)}]]: [[${p}%]] מ־[[${fmt(A1)}]] הם [[${fmt(i2)}]]`]);
  }, e: (r) => {
    const P = 100 * pick(r, [10, 20, 30, 40, 50, 60, 80]), p = pick(r, [10, 20]), i1 = (P * p) / 100, S = P + 2 * i1, A1 = P + i1, Cc = A1 + (A1 * p) / 100, f = dec(100 + p, 2);
    if (r() < 0.5) {
      const wrong: [string, TrapId?][] = [[n(Cc), 'interest'], [n(2 * i1), 'op'], [n(A1), 'op']];
      return calc({ prompt: `מפקידים [[${fmt(P)}]] שקלים בריבית פשוטה של [[${p}%]] לשנה. כמה כסף יהיה בחשבון אחרי שנתיים?`, ans: n(S), eq: `${P}+2*${P}*${p}/100`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(S)), steps: [`הריבית בכל שנה: [[${p}%]] מ־[[${fmt(P)}]] הם [[${fmt(i1)}]]`, `בריבית פשוטה היא שווה בשתי השנים: [[${fmt(P)}+2×${fmt(i1)}=${fmt(S)}]]`] });
    }
    const wrong: [string, TrapId?][] = [[n(S), 'interest'], [n(Cc - P), 'op'], [n(A1), 'op']];
    return calc({ prompt: `מפקידים [[${fmt(P)}]] שקלים בריבית דריבית של [[${p}%]] לשנה. כמה כסף יהיה בחשבון אחרי שנתיים?`, ans: n(Cc), eq: `${P}*(100+${p})/100*(100+${p})/100`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(Cc)), steps: [`אחרי שנה: [[${fmt(P)}×${f}=${fmt(A1)}]]`, `בשנה השנייה הריבית מחושבת מ־[[${fmt(A1)}]]: [[${fmt(A1)}×${f}=${fmt(Cc)}]]`] });
  } },
  { id: 'directinv', station: 17, title: 'יחס ישר ויחס הפוך', needs: ['prop'], u: (r) => {
    const items: [string, boolean][] = [
      ['המחיר שמשלמים ומספר הקילוגרמים שקונים, כשהמחיר לקילוגרם קבוע', true],
      ['מספר הפועלים ומספר הימים שלוקח להם לבנות את אותו קיר', false],
      ['המהירות והזמן שלוקח לנסוע את אותה דרך', false],
      ['מספר העוגות וכמות הקמח שצריך להן', true],
      ['מספר הילדים שמתחלקים בפיצה אחת וגודל החלק של כל אחד', false],
      ['מספר שעות העבודה והשכר, כששכר השעה קבוע', true],
      ['מספר הברזים שממלאים בריכה והזמן עד שהיא מתמלאת', false],
    ];
    const [desc, direct] = pick(r, items), ans = direct ? 'יחס ישר' : 'יחס הפוך';
    return conceptQ(`איזה יחס יש בין שתי הכמויות: ${desc}?`, ans, [[direct ? 'יחס הפוך' : 'יחס ישר', 'directinv'], ['אין ביניהן יחס ישר או הפוך', 'directinv']], direct
      ? ['כשכמות אחת גדלה פי [[2]], גם השנייה גדלה פי [[2]]', 'לכן זה יחס ישר: המנה שלהן קבועה']
      : ['כשכמות אחת גדלה פי [[2]], השנייה קטנה פי [[2]]', 'לכן זה יחס הפוך: המכפלה שלהן קבועה']);
  }, e: (r) => {
    if (r() < 0.5) {
      const a = ri(r, 2, 6), dd = pick(r, [2, 3, 4, 5, 6, 8, 9, 10, 12].filter((v) => v !== a)), total = a * dd, bs = [2, 3, 4, 5, 6, 8, 9, 10, 12].filter((v) => v !== a && total % v === 0), b = pick(r, bs), ans = total / b;
      const wrong: [string, TrapId?][] = [...((dd * b) % a === 0 ? [[n((dd * b) / a), 'directinv'] as [string, TrapId]] : []), [n(dd - (b - a)), 'op'], [n(total), 'op']];
      return calc({ prompt: `[[${a}]] פועלים בונים קיר ב־[[${dd}]] ימים. כמה ימים ייקח ל־[[${b}]] פועלים לבנות את אותו קיר, אם כולם עובדים באותו קצב?`, ans: n(ans), eq: `${a}*${dd}/${b}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(ans) && Number(v) > 0), steps: ['זה יחס הפוך: יותר פועלים מסיימים בפחות ימים', `כל העבודה: [[${a}×${dd}=${total}]] ימי עבודה`, `[[${total}÷${b}=${ans}]] ימים`] });
    }
    const t = ri(r, 2, 6), u = ri(r, 2, 10), s = pick(r, [2, 3, 4, 5, 6, 8, 9, 10, 12].filter((v) => v !== t)), a = u * t, ans = u * s;
    const wrong: [string, TrapId?][] = [...((a * t) % s === 0 ? [[n((a * t) / s), 'directinv'] as [string, TrapId]] : []), [n(a + s - t), 'prop'], [n(a * s), 'op']];
    return calc({ prompt: `מכונה מדפיסה [[${a}]] דפים ב־[[${t}]] דקות. כמה דפים היא תדפיס ב־[[${s}]] דקות, באותו קצב?`, ans: n(ans), eq: `${a}/${t}*${s}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(ans) && Number(v) > 0), steps: ['זה יחס ישר: יותר דקות, יותר דפים', `בדקה אחת: [[${a}÷${t}=${u}]] דפים`, `ב־[[${s}]] דקות: [[${u}×${s}=${ans}]] דפים`] });
  } },
  // ---------- Station 18 ----------
  { id: 'extang', station: 18, title: 'זווית חיצונית במשולש', needs: ['trisum'], e: (r) => {
    if (r() < 0.5) {
      const a = ri(r, 3, 8) * 10, b = ri(r, 2, 7) * 10, x = a + b;
      const wrong: [string, TrapId?][] = [[n(180 - x), 'extang'], [n(360 - x), 'op'], [n(180 - a), 'extang']];
      return calc({ prompt: `במשולש יש שתי זוויות של [[${a}]] ושל [[${b}]] מעלות. כמה מעלות יש בזווית החיצונית ליד הקודקוד השלישי?`, ans: n(x), eq: `${a}+${b}`, read: true, wrong: wrong.filter(([v]) => v !== n(x)), steps: ['זווית חיצונית שווה לסכום שתי הזוויות הפנימיות שאינן צמודות לה', `[[${a}+${b}=${x}]]`, `בודקים: הזווית הפנימית השלישית היא [[180−${x}=${180 - x}]], והחיצונית משלימה אותה ל־[[180]]`] });
    }
    const x = ri(r, 10, 16) * 10, a = ri(r, 3, x / 10 - 3) * 10, ans = x - a;
    const wrong: [string, TrapId?][] = [[n(180 - x), 'extang'], [n(x + a), 'op'], [n(180 - a), 'extang']];
    return calc({ prompt: `זווית חיצונית של משולש היא [[${x}]] מעלות. אחת הזוויות הפנימיות שאינן צמודות לה היא [[${a}]] מעלות. כמה מעלות יש בזווית הפנימית השנייה שאינה צמודה לה?`, ans: n(ans), eq: `${x}-${a}`, read: true, wrong: wrong.filter(([v]) => v !== n(ans) && Number(v) > 0), steps: ['הזווית החיצונית שווה לסכום שתי הזוויות הפנימיות שאינן צמודות לה', `[[${a}]] ועוד הזווית שמחפשים שווים [[${x}]], ולכן [[${x}−${a}=${ans}]]`] });
  } },
  { id: 'isos', station: 18, title: 'משולש שווה שוקיים', needs: ['trisum'], e: (r) => {
    if (r() < 0.5) {
      const t = ri(r, 1, 8) * 20, b = (180 - t) / 2;
      const wrong: [string, TrapId?][] = [[n(180 - t), 'isos'], [n(t), 'isos'], [n(180 - 2 * t), 'op']];
      return calc({ prompt: `במשולש שווה שוקיים זווית הראש היא [[${t}]] מעלות. כמה מעלות יש בכל אחת מזוויות הבסיס?`, ans: n(b), eq: `(180-${t})/2`, read: true, wrong: wrong.filter(([v]) => v !== n(b) && Number(v) > 0), steps: [`לשתי זוויות הבסיס יחד נשארו [[180−${t}=${180 - t}]] מעלות`, `זוויות הבסיס שוות, ולכן [[${180 - t}÷2=${b}]]`] });
    }
    const b = ri(r, 3, 8) * 10, t = 180 - 2 * b;
    const wrong: [string, TrapId?][] = [[n(180 - b), 'isos'], [n(b), 'isos'], [n(90 - b), 'op']];
    return calc({ prompt: `במשולש שווה שוקיים זווית בסיס היא [[${b}]] מעלות. כמה מעלות יש בזווית הראש?`, ans: n(t), eq: `180-2*${b}`, read: true, wrong: wrong.filter(([v]) => v !== n(t) && Number(v) > 0), steps: [`גם זווית הבסיס השנייה היא [[${b}]] מעלות`, `[[180−${b}−${b}=${t}]]`] });
  } },
  { id: 'polyang', station: 18, title: 'סכום זוויות במצולע', needs: ['trisum'], e: (r) => {
    if (r() < 0.5) {
      const k = ri(r, 4, 10), s = (k - 2) * 180;
      const wrong: [string, TrapId?][] = [[n(k * 180), 'polyang'], [n(360), 'polyang'], [n((k - 1) * 180), 'op']];
      return calc({ prompt: `מה סכום הזוויות הפנימיות ב${POLY_NAME[k]}, מצולע עם [[${k}]] צלעות?`, ans: n(s), eq: `(${k}-2)*180`, wrong: wrong.filter(([v]) => v !== n(s)), steps: [`מקודקוד אחד אפשר לחלק את המצולע ל־[[${k}−2=${k - 2}]] משולשים`, `בכל משולש [[180]] מעלות: [[${k - 2}×180=${s}]]`] });
    }
    const k = pick(r, [4, 5, 6, 8, 9, 10]), s = (k - 2) * 180, a = s / k;
    const wrong: [string, TrapId?][] = [[n(360 / k), 'polyang'], [n(180 / k), 'polyang'], [n(s), 'op']];
    return calc({ prompt: `ב${POLY_NAME[k]} משוכלל (מצולע עם [[${k}]] צלעות שוות וזוויות שוות), כמה מעלות יש בכל זווית פנימית?`, ans: n(a), eq: `(${k}-2)*180/${k}`, pencil: true, wrong: wrong.filter(([v]) => v !== n(a) && Number.isInteger(Number(v))), steps: [`סכום הזוויות: [[(${k}−2)×180=${s}]]`, `הזוויות שוות, ולכן מחלקים ב־[[${k}]]: [[${s}÷${k}=${a}]]`] });
  } },
  { id: 'congr', station: 18, title: 'משפטי חפיפה (איזה משפט מתאים)', needs: ['isos'], u: (r) => {
    const k = ri(r, 0, 2), P = ['A', 'B', 'C'], Q = ['D', 'E', 'F'], p = (i: number) => P[(i + k) % 3], q = (i: number) => Q[(i + k) % 3];
    const side = (i: number, j: number) => `[[${p(i)}${p(j)}=${q(i)}${q(j)}]]`, ang = (i: number) => `הזווית [[${p(i)}]] שווה לזווית [[${q(i)}]]`;
    const items: [string, string, string[]][] = [
      [`${side(0, 1)}, ${side(1, 2)}, ו${ang(1)}`, 'צ.ז.צ', ['הזווית השווה נמצאת בין שתי הצלעות השוות', 'צלע, זווית שביניהן, צלע: צ.ז.צ']],
      [`${ang(0)}, ${side(0, 1)}, ו${ang(1)}`, 'ז.צ.ז', ['הצלע השווה נמצאת בין שתי הזוויות השוות', 'זווית, צלע שביניהן, זווית: ז.צ.ז']],
      [`${side(0, 1)}, ${side(1, 2)}, ו־${side(0, 2)}`, 'צ.צ.צ', ['כל שלוש הצלעות שוות בהתאמה', 'שלוש צלעות: צ.צ.צ']],
      [`${ang(0)}, ${ang(1)}, ו${ang(2)}`, 'אי אפשר לקבוע שהם חופפים', ['נתונות רק זוויות, ואף צלע', 'משולש גדול ומשולש קטן יכולים להיות עם אותן זוויות, ולכן אין משפט חפיפה מתאים']],
    ];
    const [given, ans, steps] = pick(r, items);
    const all = ['צ.ז.צ', 'ז.צ.ז', 'צ.צ.צ', 'אי אפשר לקבוע שהם חופפים'];
    return conceptQ(`במשולשים [[ABC]] ו־[[DEF]] נתון: ${given}. לפי איזה משפט המשולשים חופפים?`, ans, all.filter((x) => x !== ans).map((x) => [x, 'congr'] as [string, TrapId]), steps);
  } },
  // ---------- Station 19 ----------
  { id: 'pyth', station: 19, title: 'משפט פיתגורס: מציאת היתר', needs: ['rootsimp', 'trisum'], e: (r) => {
    const [a, b, c] = pick(r, PYTH), sw = r() < 0.5, x = sw ? b : a, y = sw ? a : b;
    const wrong: [string, TrapId?][] = [[n(x + y), 'pyth'], [n(c * c), 'pyth'], [n(y), 'op']];
    return calc({ prompt: `במשולש ישר זווית אורכי הניצבים הם [[${x}]] ס״מ ו־[[${y}]] ס״מ. מה אורך היתר בס״מ?`, ans: n(c), eq: `(${x}*${x}+${y}*${y})/${c}`, pencil: true, wrong: wrong.filter(([v]) => v !== n(c)), steps: [`מעלים כל ניצב בריבוע ומחברים: [[${x}²+${y}²=${x * x}+${y * y}=${c * c}]]`, `היתר הוא השורש: [[√${c * c}=${c}]]`] });
  } },
  { id: 'pyth2', station: 19, title: 'משפט פיתגורס: מציאת ניצב ובעיות', needs: ['pyth'], e: (r) => {
    const [p, q, c] = pick(r, PYTH), sw = r() < 0.5, a = sw ? q : p, b = sw ? p : q, kind = ri(r, 0, 2);
    if (kind === 2) {
      const wrong: [string, TrapId?][] = [[n(a + b), 'pyth'], [n(c * c), 'pyth'], [n(2 * (a + b)), 'op']];
      return calc({ prompt: `אורכו של מלבן [[${a}]] מ׳ ורוחבו [[${b}]] מ׳. מה אורך האלכסון שלו במטרים?`, ans: n(c), eq: `(${a}*${a}+${b}*${b})/${c}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(c)), steps: ['האלכסון יוצר עם שתי הצלעות משולש ישר זווית, והוא היתר', `[[${a}²+${b}²=${a * a}+${b * b}=${c * c}]], ולכן האלכסון [[√${c * c}=${c}]]`] });
    }
    const wrong: [string, TrapId?][] = [[n(c - a), 'pyth'], [n(c * c - a * a), 'pyth'], [n(c + a), 'op']];
    const prompt = kind === 0
      ? `במשולש ישר זווית אורך היתר [[${c}]] ס״מ ואורך ניצב אחד [[${a}]] ס״מ. מה אורך הניצב השני בס״מ?`
      : `סולם באורך [[${c}]] מ׳ נשען על קיר. רגל הסולם נמצאת [[${a}]] מ׳ מהקיר. לאיזה גובה על הקיר מגיע הסולם, במטרים?`;
    return calc({ prompt, ans: n(b), eq: `(${c}*${c}-${a}*${a})/${b}`, pencil: true, read: kind === 1, wrong: wrong.filter(([v]) => v !== n(b) && Number(v) > 0), steps: [...(kind === 1 ? ['הקיר, הרצפה והסולם יוצרים משולש ישר זווית, והסולם הוא היתר'] : []), `מחסרים את ריבוע הניצב מריבוע היתר: [[${c}²−${a}²=${c * c}−${a * a}=${b * b}]]`, `[[√${b * b}=${b}]]`] });
  } },
  { id: 'circle', station: 19, title: 'היקף מעגל ושטח עיגול', needs: ['area'], e: (r) => {
    const k = ri(r, 1, 4), rad = 7 * k, byD = r() < 0.5, given = byD ? `שקוטרו [[${2 * rad}]] ס״מ` : `שרדיוסו [[${rad}]] ס״מ`, pi = 'השתמשו ב־[[π≈22/7]].';
    const half = byD ? [`הרדיוס הוא חצי מהקוטר: [[${2 * rad}÷2=${rad}]]`] : [];
    if (r() < 0.5) {
      const ans = 44 * k;
      const wrong: [string, TrapId?][] = [[n(154 * k * k), 'circle'], [n(22 * k), 'circle'], [n(88 * k), 'circle']];
      return calc({ prompt: `מה היקף המעגל ${given}, בס״מ? ${pi}`, ans: n(ans), eq: `2*22/7*${rad}`, pencil: true, wrong, steps: [...half, 'היקף מעגל: [[2πr]], כלומר [[π]] כפול הקוטר', `[[22/7×${2 * rad}=22×${2 * k}=${ans}]]`] });
    }
    const ans = 154 * k * k;
    const wrong: [string, TrapId?][] = [[n(44 * k), 'circle'], [n(616 * k * k), 'circle'], [n(308 * k * k), 'circle']];
    return calc({ prompt: `מה שטח העיגול ${given}, בסמ״ר? ${pi}`, ans: n(ans), eq: `22/7*${rad}*${rad}`, pencil: true, wrong, steps: [...half, 'שטח עיגול: [[πr²]], ומעלים בריבוע את הרדיוס, לא את הקוטר', `[[22/7×${rad}×${rad}=22×${k}×${rad}=${ans}]]`] });
  } },
  { id: 'sector', station: 19, title: 'קשת וגזרה', needs: ['circle'], e: (r) => {
    const [a, p, q] = pick(r, [[90, 1, 4], [180, 1, 2], [60, 1, 6], [120, 1, 3], [45, 1, 8], [270, 3, 4]] as const), arc = r() < 0.5;
    const L = (k: number) => 44 * k, A = (k: number) => 154 * k * k, whole = (v: number) => (v * p) % q === 0;
    const k = pick(r, [1, 2, 3, 4].filter((x) => whole(arc ? L(x) : A(x)))), rad = 7 * k, frac = `${p}/${q}`, pi = 'השתמשו ב־[[π≈22/7]].';
    const full = arc ? L(k) : A(k), other = arc ? A(k) : L(k), ans = (full * p) / q;
    const wrong: [string, TrapId?][] = [[n(full), 'sector'], [n((2 * full * p) / q), 'sector'], ...(whole(other) ? [[n((other * p) / q), 'sector'] as [string, TrapId]] : [])];
    const prompt = arc
      ? `במעגל שרדיוסו [[${rad}]] ס״מ יש זווית מרכזית של [[${a}]] מעלות. מה אורך הקשת שמולה, בס״מ? ${pi}`
      : `במעגל שרדיוסו [[${rad}]] ס״מ יש גזרה עם זווית מרכזית של [[${a}]] מעלות. מה שטח הגזרה, בסמ״ר? ${pi}`;
    return calc({ prompt, ans: n(ans), eq: arc ? `2*22/7*${rad}*${a}/360` : `22/7*${rad}*${rad}*${a}/360`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(ans)), steps: [`${arc ? 'הקשת' : 'הגזרה'} היא [[${a}/360=${frac}]] מה${arc ? 'מעגל' : 'עיגול'}`, arc ? `היקף המעגל: [[2×22/7×${rad}=${full}]]` : `שטח העיגול: [[22/7×${rad}×${rad}=${full}]]`, `[[${full}×${frac}=${ans}]]`] });
  } },
  // ---------- Station 20 ----------
  { id: 'prismvol', station: 20, title: 'נפח ושטח פנים של מנסרה וגליל', needs: ['circle'], e: (r) => {
    const kind = ri(r, 0, 3), h = ri(r, 2, 10);
    if (kind < 2) {
      const [x, y, c] = pick(r, PYTH.slice(0, 4)), base = (x * y) / 2, per = x + y + c;
      const intro = `בסיס המנסרה הוא משולש ישר זווית שאורכי הניצבים שלו [[${x}]] ו־[[${y}]] ס״מ${kind ? ` (והיתר [[${c}]] ס״מ)` : ''}. גובה המנסרה [[${h}]] ס״מ.`;
      if (kind === 0) {
        const ans = base * h;
        const wrong: [string, TrapId?][] = [[n(x * y * h), 'triHalf'], [n(per * h), 'prism'], [n(base + h), 'op']];
        return calc({ prompt: `${intro} מה נפח המנסרה, בסמ״ק?`, ans: n(ans), eq: `${x}*${y}/2*${h}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(ans)), steps: [`שטח הבסיס: [[${x}×${y}÷2=${base}]]`, `נפח המנסרה הוא שטח הבסיס כפול הגובה: [[${base}×${h}=${ans}]]`] });
      }
      const ans = 2 * base + per * h;
      const wrong: [string, TrapId?][] = [[n(per * h), 'prism'], [n(base + per * h), 'prism'], [n(base * h), 'volume']];
      return calc({ prompt: `${intro} מה שטח הפנים של המנסרה, בסמ״ר?`, ans: n(ans), eq: `2*${x}*${y}/2+(${x}+${y}+${c})*${h}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(ans)), steps: [`שני הבסיסים: [[2×${base}=${2 * base}]]`, `המעטפת היא היקף הבסיס כפול הגובה: [[(${x}+${y}+${c})×${h}=${per * h}]]`, `[[${2 * base}+${per * h}=${ans}]]`] });
    }
    const k = ri(r, 1, 2), rad = 7 * k, B = 154 * k * k, side = 44 * k * h, pi = 'השתמשו ב־[[π≈22/7]].';
    const intro = `לגליל רדיוס [[${rad}]] ס״מ וגובה [[${h}]] ס״מ.`;
    if (kind === 2) {
      const ans = B * h;
      const wrong: [string, TrapId?][] = [[n(side), 'prism'], [n(4 * B * h), 'circle'], [n(B + h), 'op']];
      return calc({ prompt: `${intro} מה נפח הגליל, בסמ״ק? ${pi}`, ans: n(ans), eq: `22/7*${rad}*${rad}*${h}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(ans)), steps: [`שטח הבסיס, עיגול: [[22/7×${rad}×${rad}=${B}]]`, `נפח הגליל הוא שטח הבסיס כפול הגובה: [[${B}×${h}=${ans}]]`] });
    }
    const ans = 2 * B + side;
    const wrong: [string, TrapId?][] = [[n(side), 'prism'], [n(B + side), 'prism'], [n(B * h), 'volume']];
    return calc({ prompt: `${intro} מה שטח הפנים של הגליל, בסמ״ר? ${pi}`, ans: n(ans), eq: `2*22/7*${rad}*${rad}+2*22/7*${rad}*${h}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(ans)), steps: [`שני הבסיסים: [[2×22/7×${rad}×${rad}=${2 * B}]]`, `המעטפת היא היקף הבסיס כפול הגובה: [[2×22/7×${rad}×${h}=${side}]]`, `[[${2 * B}+${side}=${ans}]]`] });
  } },
  { id: 'similar', station: 20, title: 'משולשים דומים ויחס דמיון', needs: ['prop'], e: (r) => {
    const [m, d] = pick(r, [[2, 1], [3, 1], [4, 1], [3, 2], [5, 2], [4, 3], [5, 3]] as const), u = ri(r, 1, 6), v = pick(r, [1, 2, 3, 4, 5, 6].filter((x) => x !== u));
    const big = r() < 0.5, [p, q] = big ? [d, m] : [m, d], AB = p * u, BC = p * v, DE = q * u, ans = q * v;
    const wrong: [string, TrapId?][] = [[n(BC + DE - AB), 'similar'], [n((BC * AB) / DE), 'similar'], [n(BC), 'similar']];
    return calc({ prompt: `המשולשים [[ABC]] ו־[[DEF]] דומים, והקודקודים מתאימים לפי הסדר: [[A]] ל־[[D]], [[B]] ל־[[E]] ו־[[C]] ל־[[F]]. נתון [[AB=${AB}]], [[BC=${BC}]] ו־[[DE=${DE}]] ס״מ. מה אורך [[EF]] בס״מ?`, ans: n(ans), eq: `${BC}*${DE}/${AB}`, pencil: true, read: true, wrong: wrong.filter(([w]) => w !== n(ans) && Number.isInteger(Number(w)) && Number(w) > 0), steps: [`יחס הדמיון: [[DE/AB=${DE}/${AB}=${q}/${p}]]`, `[[EF]] מתאימה ל־[[BC]], ולכן [[EF=${BC}×${q}/${p}=${ans}]]`] });
  } },
  { id: 'scalearea', station: 20, title: 'יחס שטחים ויחס נפחים', needs: ['similar'], e: (r) => {
    const vol = r() < 0.4, k = vol ? ri(r, 2, 3) : ri(r, 2, 5), pw = vol ? 3 : 2, f = k ** pw, s = vol ? ri(r, 2, 9) : ri(r, 2, 12), b = s * f, up = r() < 0.5;
    const what = vol ? 'נפח' : 'שטח', unit = vol ? 'סמ״ק' : 'סמ״ר', small = vol ? 'התיבה הקטנה' : 'המשולש הקטן', large = vol ? 'התיבה הגדולה' : 'המשולש הגדול';
    const lead = `${vol ? 'שתי תיבות דומות, ויחס הדמיון ביניהן' : 'שני משולשים דומים, ויחס הדמיון ביניהם'} (יחס האורכים) הוא [[1:${k}]].`;
    const law = vol ? `יחס הנפחים הוא יחס הדמיון בחזקת שלוש: [[${k}³=${f}]]` : `יחס השטחים הוא יחס הדמיון בריבוע: [[${k}²=${f}]]`;
    if (up) {
      const wrong: [string, TrapId?][] = [[n(s * k), 'scalearea'], [n(s * (vol ? k * k : k ** 3)), 'scalearea'], [n(s + k), 'op']];
      return calc({ prompt: `${lead} ${what} ${small} [[${s}]] ${unit}. מה ${what} ${large}, ב${unit}?`, ans: n(b), eq: `${s}*${Array(pw).fill(k).join('*')}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(b)), steps: [law, `[[${s}×${f}=${b}]]`] });
    }
    const wrong: [string, TrapId?][] = [[n(b / k), 'scalearea'], ...(vol ? [] : (b % (k ** 3) === 0 ? [[n(b / k ** 3), 'scalearea'] as [string, TrapId]] : [])), ...(vol ? [[n(b / (k * k)), 'scalearea'] as [string, TrapId]] : []), [n(b - k), 'op']];
    return calc({ prompt: `${lead} ${what} ${large} [[${b}]] ${unit}. מה ${what} ${small}, ב${unit}?`, ans: n(s), eq: `${b}/${f}`, pencil: true, read: true, wrong: wrong.filter(([v]) => v !== n(s) && Number(v) > 0), steps: [law, `מחלקים: [[${b}÷${f}=${s}]]`] });
  } },
  // ---------- Station 21 ----------
  { id: 'median', station: 21, title: 'חציון ושכיח', needs: ['mean'], e: (r) => {
    const mix = (a: number[]) => { const o = [...a]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
    const kind = ri(r, 0, 2);
    if (kind === 0) {
      const len = pick(r, [5, 7]), mid = (len - 1) / 2, s = Array.from({ length: len }, () => ri(r, 1, 20)).sort((x, y) => x - y), v = mix(s), ans = s[mid];
      const sum = s.reduce((x, y) => x + y, 0);
      const wrong: [string, TrapId?][] = [[n(v[mid]), 'median'], ...(sum % len === 0 ? [[n(sum / len), 'median'] as [string, TrapId]] : []), [n(s[mid + 1]), 'median']];
      return calc({ prompt: `מה החציון של המספרים [[${v.join(', ')}]]?`, ans: n(ans), eq: `${ans}`, pencil: true, wrong: wrong.filter(([w]) => w !== n(ans)), steps: [`מסדרים מהקטן לגדול: [[${s.join(', ')}]]`, `יש [[${len}]] מספרים, והאמצעי הוא המקום ה־[[${mid + 1}]]: [[${ans}]]`] });
    }
    if (kind === 1) {
      const m1 = ri(r, 4, 12), m2 = m1 + 2 * ri(r, 1, 4), s = [ri(r, 1, m1), ri(r, 1, m1), m1, m2, ri(r, m2, m2 + 8), ri(r, m2, m2 + 8)].sort((x, y) => x - y), v = mix(s), ans = (m1 + m2) / 2;
      const wrong: [string, TrapId?][] = [[n(m1), 'median'], [n(m2), 'median'], ...((v[2] + v[3]) % 2 === 0 ? [[n((v[2] + v[3]) / 2), 'median'] as [string, TrapId]] : [])];
      return calc({ prompt: `מה החציון של המספרים [[${v.join(', ')}]]?`, ans: n(ans), eq: `(${m1}+${m2})/2`, pencil: true, wrong: wrong.filter(([w]) => w !== n(ans)), steps: [`מסדרים מהקטן לגדול: [[${s.join(', ')}]]`, `יש [[6]] מספרים, מספר זוגי, ולכן יש שני אמצעיים: [[${m1}]] ו־[[${m2}]]`, `החציון הוא הממוצע שלהם: [[(${m1}+${m2})÷2=${ans}]]`] });
    }
    const pool = mix(Array.from({ length: 15 }, (_, i) => i + 1)), mode = pool[0], others = pool.slice(1, 4), times = 3;
    const v = mix([mode, mode, mode, others[0], others[0], others[1], others[2]]);
    const wrong: [string, TrapId?][] = [[n(times), 'median'], [n(others[0]), 'median'], [n(Math.max(...v)), 'median']];
    return calc({ prompt: `מה השכיח של המספרים [[${v.join(', ')}]]?`, ans: n(mode), eq: `${mode}`, wrong: wrong.filter(([w]) => w !== n(mode)), steps: ['השכיח הוא הערך שמופיע הכי הרבה פעמים', `[[${mode}]] מופיע [[${times}]] פעמים, ו־[[${others[0]}]] רק פעמיים`] });
  } },
];
export const SKILL: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
