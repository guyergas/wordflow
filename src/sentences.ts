// Useful everyday sentences, with a check of which words in each one she already knows.
import { isKnown, Metric, State, ws, freshMetric, grade, spellKind } from './engine';
import { WORDS, Word } from './words';

export interface Sentence { id: string; en: string; he: string; topic: string; order: number }
export const TOPICS: Record<string, string> = { friends: 'חברים', school: 'בית ספר', help: 'לבקש עזרה', food: 'אוכל וקניות', travel: 'בדרך', feel: 'איך אני מרגישה', plans: 'תוכניות' };

const RAW: Record<string, string> = {
  friends: `What is your name?|איך קוראים לך?
Nice to meet you.|נעים להכיר.
How are you today?|מה שלומך היום?
This is my best friend.|זו החברה הכי טובה שלי.
Do you want to play a game?|את רוצה לשחק משחק?
Can I sit here?|אפשר לשבת כאן?
I like your shoes.|אני אוהבת את הנעליים שלך.
Where do you live?|איפה את גרה?
Come to my party!|בואי למסיבה שלי!
That was really funny.|זה היה ממש מצחיק.
I am sorry I am late.|סליחה שאיחרתי.
Can you keep a secret?|את יכולה לשמור סוד?
You are very kind.|את ממש אדיבה.
I agree with you.|אני מסכימה איתך.
Thank you for your help.|תודה על העזרה שלך.
See you tomorrow!|נתראה מחר!`,
  school: `I have a question.|יש לי שאלה.
I don't understand this word.|אני לא מבינה את המילה הזו.
Can you explain it again?|את יכולה להסביר שוב?
I forgot my homework at home.|שכחתי את שיעורי הבית בבית.
Can I borrow a pencil?|אפשר לשאול עיפרון?
What is the answer?|מה התשובה?
The test was very difficult.|המבחן היה ממש קשה.
I think this is a mistake.|אני חושבת שזו טעות.
When does the lesson begin?|מתי השיעור מתחיל?
My favorite color is blue.|הצבע האהוב עליי הוא כחול.
I want to learn a new language.|אני רוצה ללמוד שפה חדשה.
How do you write your name?|איך כותבים את השם שלך?
Please listen to the teacher.|בבקשה להקשיב למורה.
I finished my homework early.|סיימתי את שיעורי הבית מוקדם.`,
  help: `Can you help me, please?|את יכולה לעזור לי, בבקשה?
I need your help.|אני צריכה את העזרה שלך.
Please wait for me.|בבקשה תחכי לי.
What does this word mean?|מה פירוש המילה הזו?
Can you speak slowly?|את יכולה לדבר לאט?
I don't know what to do.|אני לא יודעת מה לעשות.
Can you say that again?|את יכולה לומר את זה שוב?
I lost my phone.|איבדתי את הטלפון שלי.
Where is the door?|איפה הדלת?
Is it far from here?|זה רחוק מכאן?
Please open the window.|בבקשה לפתוח את החלון.
Can I take this chair?|אפשר לקחת את הכיסא הזה?
I can't find my keys.|אני לא מוצאת את המפתחות שלי.`,
  food: `I am very hungry.|אני ממש רעבה.
Can I have some water, please?|אפשר קצת מים, בבקשה?
I don't eat meat.|אני לא אוכלת בשר.
How much money is this?|כמה כסף זה עולה?
That is too expensive.|זה יקר מדי.
I want to buy this.|אני רוצה לקנות את זה.
Pizza is my favorite food.|פיצה היא האוכל האהוב עליי.
Let's eat at a restaurant.|בואו נאכל במסעדה.
This food smells great.|האוכל הזה מריח נהדר.
Do you want some bread?|את רוצה קצת לחם?
The store closes at nine.|החנות נסגרת בתשע.
I would like an apple, please.|הייתי רוצה תפוח, בבקשה.`,
  travel: `Where is the station?|איפה התחנה?
How do I get to the airport?|איך מגיעים לשדה התעופה?
Our flight leaves at noon.|הטיסה שלנו יוצאת בצהריים.
Do you have a map?|יש לך מפה?
I need a ticket, please.|אני צריכה כרטיס, בבקשה.
We arrive tomorrow morning.|אנחנו מגיעות מחר בבוקר.
What is the weather like today?|איך מזג האוויר היום?
It is very cold outside.|קר מאוד בחוץ.
Let's walk to the beach.|בואו נלך ברגל לחוף.
Is this street dangerous at night?|הרחוב הזה מסוכן בלילה?
We love to travel in summer.|אנחנו אוהבות לטייל בקיץ.
Don't forget your passport.|אל תשכחי את הדרכון שלך.`,
  feel: `I am so happy today.|אני כל כך שמחה היום.
I feel tired.|אני מרגישה עייפה.
I don't feel well.|אני לא מרגישה טוב.
My stomach hurts.|הבטן שלי כואבת.
I have a headache.|יש לי כאב ראש.
I am a little nervous.|אני קצת לחוצה.
Don't worry about it.|אל תדאגי בקשר לזה.
I am proud of you.|אני גאה בך.
I am afraid of the dark.|אני מפחדת מהחושך.
I was really surprised.|ממש הופתעתי.
Why are you so sad?|למה את כל כך עצובה?
I am bored.|משעמם לי.
I believe you.|אני מאמינה לך.`,
  plans: `What are you doing this weekend?|מה את עושה בסוף השבוע?
Let's meet after school.|בואי ניפגש אחרי בית הספר.
Are you ready to go?|את מוכנה ללכת?
I will call you tonight.|אתקשר אלייך הערב.
We will visit my family on Friday.|נבקר את המשפחה שלי ביום שישי.
I am busy today, maybe tomorrow.|אני עסוקה היום, אולי מחר.
What time do we leave?|באיזו שעה יוצאים?
I always read before I sleep.|אני תמיד קוראת לפני שאני ישנה.
I hope you win the game.|אני מקווה שתנצחי במשחק.
It is my birthday next month.|יום ההולדת שלי בחודש הבא.
I promise to help you.|אני מבטיחה לעזור לך.
We can choose a movie together.|אנחנו יכולות לבחור סרט ביחד.`,
};

let n = 0;
export const SENTENCES: Sentence[] = Object.entries(RAW).flatMap(([topic, block]) => block.split('\n').map((line) => {
  const [en, he] = line.split('|');
  const order = n++;
  return { id: `s${order}`, en, he, topic, order };
}));

// Grammar words and very simple words that are not practiced as vocabulary, so they never hold a sentence back.
export const BASIC = new Set(`a an the i you he she it we they me my your our his her their this that these those is am are was were be been being
do does did don't can't can will would need have has had not no yes and or but so to of in on at for from with about up out here there what where when why who how which much many some too very really
please thank thanks sorry hi nice let's it's what's like go get know say see think come lose lost find keys phone mean make call time name home
one two nine friday noon tonight next again together little outside dark blue pizza movie summer win meat great busy best keep smells play sit live word test love well doing`.split(/\s+/));

const IRREGULAR: Record<string, string> = { ate: 'eat', bought: 'buy', forgot: 'forget', left: 'leave', took: 'take', leaves: 'leave', closes: 'close', hurts: 'hurt', hungry: 'hungry' };
const byEn = new Map(WORDS.map((w) => [w.en, w]));

export const tokens = (en: string) => en.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);

export function bankWord(token: string): Word | null {
  if (BASIC.has(token)) return null;
  const base = IRREGULAR[token] ?? token;
  const tries = [base, base.replace(/s$/, ''), base.replace(/es$/, ''), base.replace(/ed$/, ''), base.replace(/d$/, ''), base.replace(/ing$/, ''), `${base.replace(/ing$/, '')}e`, base.replace(/ies$/, 'y')];
  for (const t of tries) { const w = byEn.get(t); if (w) return w; }
  return null;
}
/** A token the app can classify: a basic word, or a word from the bank. Tests require this of every sentence. */
export const classified = (t: string) => BASIC.has(t) || bankWord(t) !== null;

export const unknownWords = (st: State, s: Sentence): Word[] => {
  const out = new Map<string, Word>();
  for (const t of tokens(s.en)) { const w = bankWord(t); if (w && !isKnown(ws(st, w.id))) out.set(w.id, w); }
  return [...out.values()];
};

export const metricOf = (st: State, id: string): Metric => st.sentences?.[id] ?? freshMetric();
export const sMeasured = (m: Metric) => m.ok + m.no > 0;
export const readyCount = (st: State) => SENTENCES.filter((s) => unknownWords(st, s).length === 0).length;
export const sentencesKnown = (st: State) => SENTENCES.filter((s) => { const m = metricOf(st, s.id); return m.box >= 3 && !m.flag; }).length;

/** Reviews first, then new sentences ordered by how few unfamiliar words they contain. */
export function sentencePlan(st: State, today: number, count = 6): Sentence[] {
  const due = SENTENCES.filter((s) => { const m = metricOf(st, s.id); return sMeasured(m) && (m.flag || m.due <= today); })
    .sort((a, b) => Number(metricOf(st, b.id).flag) - Number(metricOf(st, a.id).flag) || metricOf(st, a.id).due - metricOf(st, b.id).due)
    .slice(0, Math.ceil(count / 2));
  const fresh = SENTENCES.filter((s) => !sMeasured(metricOf(st, s.id)))
    .sort((a, b) => unknownWords(st, a).length - unknownWords(st, b).length || a.en.length - b.en.length || a.order - b.order)
    .slice(0, count - due.length);
  return [...due, ...fresh];
}
export function recordSentence(st: State, id: string, correct: boolean, today: number): State {
  return { ...st, sentences: { ...st.sentences, [id]: grade(metricOf(st, id), correct, today) } };
}
/** Understanding first, then building from Hebrew, then building by ear. */
export const sentenceKind = (m: Metric): 'meaning' | 'build' | 'ear' => (m.box <= 0 ? 'meaning' : spellKind(m.box) === 'type' ? 'ear' : 'build');
