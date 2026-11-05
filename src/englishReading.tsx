// A short English text with three questions, offered once in a few days. Most of the practice stays with words.
import { useRef, useState } from 'react';
import { userKey } from './course';
import './users.css';

type Q = [question: string, right: string, wrong: string[]];
export interface Passage { id: string; title: string; text: string; qs: Q[] }
export const GAP_DAYS = 3;
/** Reading comes at an advanced stage: the first text needs 300 solid words, and each later one 60 more. */
export const wordsNeeded = (index: number) => 300 + 60 * index;

export const PASSAGES: Passage[] = [
  { id: 'pet', title: 'My Dog', text: 'I have a small dog. His name is Max. He is brown and white. Max likes to run in the park. He eats twice a day. Every morning I give him food and water. At night he sleeps next to my bed. Max is my best friend.', qs: [['מה צבע הכלב?', 'חום ולבן', ['שחור', 'אפור']], ['מה מקס אוהב לעשות?', 'לרוץ בפארק', ['לשחות', 'לישון ביום']], ['איפה הוא ישן?', 'ליד המיטה', ['בפארק', 'במטבח']]] },
  { id: 'day', title: 'A School Day', text: 'Dana gets up at seven o\'clock. She eats bread and cheese for breakfast. She walks to school with her sister. Her favorite lesson is art, because she loves to draw. After school she does her homework and then plays with her friends. She goes to bed at nine.', qs: [['מה דנה אוכלת בבוקר?', 'לחם וגבינה', ['ביצה', 'דגנים']], ['למה היא אוהבת אמנות?', 'כי היא אוהבת לצייר', ['כי זה קצר', 'כי אחותה שם']], ['מה היא עושה קודם אחרי בית הספר?', 'שיעורי בית', ['הולכת לישון', 'משחקת']]] },
  { id: 'postcard', title: 'A Postcard', text: 'Hi Noa! We are in Eilat. The sea is warm and blue. Yesterday we saw many colorful fish. Today we are going on a boat. The food here is great, but it is very hot! I want to come back next year. See you on Sunday. Love, Tamar', qs: [['איפה תמר נמצאת?', 'באילת', ['בירושלים', 'בלונדון']], ['מה ראתה אתמול?', 'דגים צבעוניים', ['סירה ישנה', 'הר גבוה']], ['מתי הן ייפגשו?', 'ביום ראשון', ['בשנה הבאה', 'היום']]] },
  { id: 'ad', title: 'Summer Camp', text: 'Come to Sun Camp! For children aged 8 to 12. Swimming, music and games every day. The camp opens on July 1st and closes on July 20th. It is open from nine to three. Bring a hat and a water bottle. Lunch is free. Call Ron to sign up.', qs: [['למי מיועד המחנה?', 'לילדים בני 8 עד 12', ['לתינוקות', 'למבוגרים']], ['מה צריך להביא?', 'כובע ובקבוק מים', ['ארוחת צהריים', 'אופניים']], ['מה לא עולה כסף?', 'ארוחת הצהריים', ['השחייה', 'הכובע']]] },
  { id: 'cat', title: 'The Lost Cat', text: 'Last Friday, Sam could not find his cat, Luna. He looked under the bed and behind the sofa, but she was not there. He was very sad. Sam made a sign and put it on a tree. The next day, an old woman knocked on the door. She had Luna in her arms!', qs: [['מה אבד לסאם?', 'החתולה', ['הכלב', 'התיק']], ['מה הוא עשה כדי למצוא אותה?', 'תלה שלט על עץ', ['התקשר למשטרה', 'קנה חתולה']], ['איך זה נגמר?', 'אישה מבוגרת החזירה אותה', ['היא לא נמצאה', 'היא חזרה לבד']]] },
  { id: 'bees', title: 'Busy Bees', text: 'Bees are small, but they are very important. They fly from flower to flower to collect food. While they do this, they carry pollen, and this helps plants make fruit. Without bees, we would have fewer apples and almonds. Today, there are fewer bees in many places. People can help by growing flowers.', qs: [['למה דבורים חשובות?', 'הן עוזרות לצמחים ליצור פרי', ['הן מנקות את האוויר', 'הן אוכלות תפוחים']], ['מה קורה היום במקומות רבים?', 'יש פחות דבורים', ['יש יותר דבורים', 'אין פרחים בכלל']], ['איך אנשים יכולים לעזור?', 'לגדל פרחים', ['לאכול פחות שקדים', 'לתפוס דבורים']]] },
  { id: 'phone', title: 'Too Much Screen Time?', text: 'Many teenagers spend hours on their phones every day. Some parents worry about this, because too much screen time at night can make it hard to sleep. However, phones are also useful: students use them to talk with friends and to learn new things. Perhaps the answer is not to stop using phones, but to choose when to put them away.', qs: [['ממה הורים מודאגים?', 'מסך בלילה מקשה להירדם', ['טלפונים יקרים', 'חברים רעים']], ['מה הכותב מציע?', 'לבחור מתי להניח את הטלפון', ['להפסיק לגמרי', 'להשתמש יותר']], ['מה תפקיד המילה However?', 'להציג צד אחר', ['להוסיף דוגמה זהה', 'לסיים את הטקסט']]] },
  { id: 'malala', title: 'A Girl Who Spoke Up', text: 'Malala Yousafzai was born in Pakistan in 1997. In her area, some men did not want girls to go to school. Malala spoke out against this, even though it was dangerous. In 2012 she was badly hurt in an attack, but she recovered and continued her work. In 2014, at seventeen, she became the youngest person to win the Nobel Peace Prize.', qs: [['על מה נאבקה מלאלה?', 'על זכות בנות ללמוד', ['על מים נקיים', 'על ספורט']], ['מה קרה אחרי שנפצעה?', 'החלימה והמשיכה בעבודתה', ['הפסיקה לדבר', 'עברה למקצוע אחר']], ['במה היא מיוחדת?', 'הצעירה ביותר שזכתה בנובל לשלום', ['הראשונה בפקיסטן שלמדה', 'נולדה בלונדון']]] },
  { id: 'recycle', title: 'A New Life for Old Things', text: 'A plastic bottle can stay in nature for hundreds of years. Recycling gives it a new life: it can become a bag, a jacket or even a playground. However, recycling also uses energy, so it is not the whole answer. The best choice is to use less in the first place. Carrying your own bottle is a simple way to start.', qs: [['למה מיחזור לא מספיק?', 'גם הוא צורך אנרגיה', ['הוא אסור', 'בקבוק לא ממוחזר']], ['מה הבחירה הטובה ביותר?', 'להשתמש פחות מלכתחילה', ['לקנות יותר בקבוקים', 'לזרוק לים']], ['מה יכול להיווצר מבקבוק?', 'מעיל', ['תפוח', 'ספר נייר']]] },
];

const nowDay = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
const KEY = () => userKey('enReading');
const load = (): { done: string[]; last: number } => { try { return { done: [], last: 0, ...JSON.parse(localStorage.getItem(KEY()) ?? '{}') }; } catch { return { done: [], last: 0 }; } };
const store = (s: { done: string[]; last: number }) => { try { localStorage.setItem(KEY(), JSON.stringify(s)); } catch { /* this visit only */ } };

function Reader({ p, onClose }: { p: Passage; onClose: (finished: boolean) => void }) {
  const [at, setAt] = useState(-1);
  const [chosen, setChosen] = useState<string | null>(null);
  const opts = useRef(p.qs.map((q) => [q[1], ...q[2]].sort(() => Math.random() - 0.5)));
  const q = p.qs[at];
  return (
    <div className="fam-page"><div className="fam-inner">
      <div className="cs-row"><h2 dir="ltr">{p.title}</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={() => onClose(false)}>✕</button></div>
      {(at === -1 || chosen) && <div className="fam-card en-text" dir="ltr">{p.text}</div>}
      {at === -1 && <button type="button" className="fam-open" onClick={() => setAt(0)}>קראתי</button>}
      {q && <>
        <h3>{q[0]}</h3>
        {opts.current[at].map((o) => <button key={o} type="button" className={`en-opt${chosen ? (o === q[1] ? ' ok' : o === chosen ? ' no' : '') : ''}`} disabled={!!chosen} onClick={() => setChosen(o)}>{o}</button>)}
        {chosen && <button type="button" className="fam-open" onClick={() => { setChosen(null); if (at + 1 < p.qs.length) setAt(at + 1); else onClose(true); }}>{at + 1 < p.qs.length ? 'הבאה' : 'סיום'}</button>}
      </>}
    </div></div>
  );
}

/** Practice time here counts like any other practice in the course. */
export function EnglishReading({ known, onTime }: { known: number; onTime: (sec: number) => void }) {
  const [state, setState] = useState(load);
  const [open, setOpen] = useState(false);
  const started = useRef(0);
  const next = PASSAGES.find((p) => !state.done.includes(p.id));
  if (!next || known < wordsNeeded(PASSAGES.indexOf(next)) || nowDay() - state.last < GAP_DAYS) return null;
  const close = (finished: boolean) => {
    onTime(Math.min(600, Math.round((Date.now() - started.current) / 1000)));
    setOpen(false);
    if (finished) { const s = { done: [...state.done, next.id], last: nowDay() }; store(s); setState(s); }
  };
  return (
    <>
      <button type="button" className="en-card" onClick={() => { started.current = Date.now(); setOpen(true); }}><b>קטע קצר באנגלית</b><small dir="ltr">{next.title}</small></button>
      {open && <Reader p={next} onClose={close} />}
    </>
  );
}
