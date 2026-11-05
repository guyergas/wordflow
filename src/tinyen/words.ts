// First English words for children of five and six who cannot read yet. They learn by ear, with a picture for each word.
// Spoken Hebrew carries vowel marks, so that the recordings pronounce it correctly.
export interface Word { en: string; he: string; pic: string; ask: string }
export interface Batch { id: string; topic: string; title: string; words: Word[] }

type Row = [string, string, string];
/** `the` makes “Where is the cat?”. Words that are not things are asked about by themselves. */
const TOPICS: { id: string; name: string; form: 'the' | 'bare' | 'none'; rows: Row[] }[] = [
  { id: 'colors', name: 'צבעים', form: 'bare', rows: [['red', 'אדום', '🔴'], ['blue', 'כחול', '🔵'], ['green', 'ירוק', '🟢'], ['yellow', 'צהוב', '🟡'], ['orange', 'כתום', '🟠'], ['purple', 'סגול', '🟣'], ['black', 'שחור', '⚫'], ['white', 'לבן', '⚪'], ['brown', 'חום', '🟤']] },
  { id: 'animals', name: 'חיות', form: 'the', rows: [['cat', 'חתול', '🐱'], ['dog', 'כלב', '🐶'], ['fish', 'דג', '🐟'], ['bird', 'ציפור', '🐦'], ['cow', 'פרה', '🐄'], ['horse', 'סוס', '🐴'], ['lion', 'אריה', '🦁'], ['elephant', 'פיל', '🐘'], ['monkey', 'קוף', '🐒'], ['duck', 'ברווז', '🦆'], ['bear', 'דוב', '🐻'], ['rabbit', 'ארנב', '🐰']] },
  { id: 'greet', name: 'מילים של כל יום', form: 'none', rows: [['hello', 'שלום', '🙋'], ['goodbye', 'להתראות', '👋'], ['thank you', 'תודה', '🙏'], ['yes', 'כן', '👍'], ['no', 'לא', '👎'], ['I love you', 'אני אוהב אותך', '❤️']] },
  { id: 'numbers', name: 'מספרים', form: 'bare', rows: [['one', 'אחת', '1️⃣'], ['two', 'שתיים', '2️⃣'], ['three', 'שלוש', '3️⃣'], ['four', 'ארבע', '4️⃣'], ['five', 'חמש', '5️⃣'], ['six', 'שש', '6️⃣'], ['seven', 'שבע', '7️⃣'], ['eight', 'שמונה', '8️⃣'], ['nine', 'תשע', '9️⃣'], ['ten', 'עשר', '🔟']] },
  { id: 'food', name: 'אוכל', form: 'the', rows: [['apple', 'תפוח', '🍎'], ['banana', 'בננה', '🍌'], ['milk', 'חלב', '🥛'], ['water', 'מים', '💧'], ['bread', 'לחם', '🍞'], ['egg', 'ביצה', '🥚'], ['cake', 'עוגה', '🎂'], ['pizza', 'פיצה', '🍕'], ['ice cream', 'גלידה', '🍦']] },
  { id: 'family', name: 'משפחה', form: 'none', rows: [['mom', 'אמא', '👩'], ['dad', 'אבא', '👨'], ['baby', 'תינוק', '👶'], ['boy', 'ילד', '👦'], ['girl', 'ילדה', '👧'], ['grandma', 'סבתא', '👵'], ['grandpa', 'סבא', '👴']] },
  { id: 'body', name: 'הגוף', form: 'the', rows: [['eye', 'עין', '👁️'], ['nose', 'אף', '👃'], ['ear', 'אוזן', '👂'], ['mouth', 'פה', '👄'], ['hand', 'יד', '✋'], ['foot', 'כף רגל', '🦶'], ['tooth', 'שן', '🦷'], ['leg', 'רגל', '🦵']] },
  { id: 'things', name: 'דברים סביבי', form: 'the', rows: [['ball', 'כדור', '⚽'], ['car', 'מכונית', '🚗'], ['book', 'ספר', '📖'], ['bed', 'מיטה', '🛏️'], ['door', 'דלת', '🚪'], ['chair', 'כיסא', '🪑'], ['house', 'בית', '🏠'], ['shoe', 'נעל', '👟'], ['hat', 'כובע', '🧢'], ['bus', 'אוטובוס', '🚌']] },
  { id: 'nature', name: 'בחוץ', form: 'the', rows: [['sun', 'שמש', '☀️'], ['moon', 'ירח', '🌙'], ['star', 'כוכב', '⭐'], ['tree', 'עץ', '🌳'], ['flower', 'פרח', '🌸'], ['rain', 'גשם', '🌧️']] },
  { id: 'actions', name: 'עושים', form: 'none', rows: [['eat', 'לאכול', '🍽️'], ['drink', 'לשתות', '🥤'], ['sleep', 'לישון', '😴'], ['run', 'לרוץ', '🏃'], ['jump', 'לקפוץ', '🤸'], ['sing', 'לשיר', '🎤']] },
];
const askOf = (en: string, form: 'the' | 'bare' | 'none') => (form === 'the' ? `Where is the ${en}?` : form === 'bare' ? `Where is ${en}?` : `Where is ${en}?`);

/** Three new words at a time, which is about what a child of five holds in one sitting. */
export const BATCHES: Batch[] = TOPICS.flatMap((t) => {
  const out: Batch[] = [];
  for (let i = 0; i < t.rows.length; i += 3) {
    const part = t.rows.length > 3 ? ` ${i / 3 + 1}` : '';
    out.push({ id: `${t.id}${i / 3 + 1}`, topic: t.id, title: `${t.name}${part}`, words: t.rows.slice(i, i + 3).map(([en, he, pic]) => ({ en, he, pic, ask: askOf(en, t.form === 'none' ? 'bare' : t.form) })) });
  }
  return out;
});
export const BATCH = Object.fromEntries(BATCHES.map((b) => [b.id, b])) as Record<string, Batch>;
export const ALL_WORDS: Word[] = BATCHES.flatMap((b) => b.words);
export const WORD = Object.fromEntries(ALL_WORDS.map((w) => [w.en, w])) as Record<string, Word>;

export const HE = {
  intro: 'שׁוֹמְעִים אֶת הַמִּלָּה בְּאַנְגְּלִית, וְאוֹמְרִים אוֹתָהּ בְּקוֹל.',
  where: 'אֵיפֹה',
  isIt: 'זֶה',
  hunt: 'מוֹצְאִים אֶת כָּל הַתְּמוּנוֹת שֶׁל',
  pairs: 'מוֹצְאִים זוּגוֹת שֶׁל תְּמוּנוֹת זֵהוֹת.',
  finish: 'סִיַּמְנוּ לְהַיּוֹם. כָּל הַכָּבוֹד!',
  notThis: 'לֹא, זֶה',
};
export const EN = { yes: (en: string) => `Yes! ${en}.`, again: 'Good job!' };

export const TINY_HE_AUDIO: string[] = Object.values(HE);
export const TINY_EN_AUDIO: string[] = [...new Set([EN.again, ...ALL_WORDS.flatMap((w) => [w.en, w.ask, EN.yes(w.en)])])];
