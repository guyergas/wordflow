// Short, everyday words for the little ones' courses, unlocked by the letters the children already learned.
// Each line: written word | how it is said | picture. Hebrew is shown without niqqud and said with it, so the recording is right.
import { LETTERS } from '../alef/letters';
import { ABC } from '../tinyen/letters';

export interface LittleWord { id: string; text: string; say: string; pic: string; long: boolean }
export interface WordLesson { id: string; words: LittleWord[]; long: boolean; letters: string[] }
export type Lang = 'he' | 'en';

const HE_SHORT = `אבא|אַבָּא|👨
אמא|אִמָּא|👩
סבא|סָבָא|👴
ילד|יֶלֶד|🧒
בן|בֵּן|👦
בת|בַּת|👧
דוד|דּוֹד|🧔
חבר|חָבֵר|🤝
יד|יָד|✋
רגל|רֶגֶל|🦵
ראש|רֹאשׁ|🙆
פה|פֶּה|👄
אף|אַף|👃
עין|עַיִן|👁️
שן|שֵׁן|🦷
לב|לֵב|❤️
בית|בַּיִת|🏠
דלת|דֶּלֶת|🚪
גן|גַּן|🌷
ספר|סֵפֶר|📖
עט|עֵט|🖊️
תיק|תִּיק|🎒
כוס|כּוֹס|🥤
כף|כַּף|🥄
סל|סַל|🧺
נר|נֵר|🕯️
נעל|נַעַל|👟
גרב|גֶּרֶב|🧦
מפה|מַפָּה|🗺️
רכב|רֶכֶב|🚗
שיר|שִׁיר|🎵
חג|חַג|🎉
יום|יוֹם|🌞
אור|אוֹר|💡
אש|אֵשׁ|🔥
מים|מַיִם|💧
ים|יָם|🌊
הר|הַר|⛰️
חול|חוֹל|🏖️
אבן|אֶבֶן|🪨
עץ|עֵץ|🌳
פרח|פֶּרַח|🌸
עלה|עָלֶה|🍃
דשא|דֶּשֶׁא|🌱
שמש|שֶׁמֶשׁ|☀️
ירח|יָרֵחַ|🌙
ענן|עָנָן|☁️
גשם|גֶּשֶׁם|🌧️
שלג|שֶׁלֶג|❄️
דג|דָּג|🐟
סוס|סוּס|🐎
כלב|כֶּלֶב|🐕
דוב|דֹּב|🐻
פיל|פִּיל|🐘
צב|צָב|🐢
פרה|פָּרָה|🐄
עז|עֵז|🐐
קוף|קוֹף|🐒
נמר|נָמֵר|🐆
זאב|זְאֵב|🐺
גמל|גָּמָל|🐪
נחש|נָחָשׁ|🐍
תות|תּוּת|🍓
ענב|עֵנָב|🍇
אגס|אַגָּס|🍐
זית|זַיִת|🫒
גזר|גֶּזֶר|🥕
בצל|בָּצָל|🧅
לחם|לֶחֶם|🍞
חלב|חָלָב|🥛
דבש|דְּבַשׁ|🍯
מיץ|מִיץ|🧃
תה|תֵּה|🍵
מלח|מֶלַח|🧂
חם|חַם|🥵
קר|קַר|🥶
כן|כֵּן|👍
לא|לֹא|👎`;

const HE_LONG = `חתול|חָתוּל|🐈
ארנב|אַרְנָב|🐰
אריה|אַרְיֵה|🦁
עכבר|עַכְבָּר|🐭
חמור|חֲמוֹר|🫏
ילדה|יַלְדָּה|👧
סבתא|סָבְתָא|👵
כדור|כַּדּוּר|⚽
בובה|בֻּבָּה|🪆
כוכב|כּוֹכָב|⭐
לילה|לַיְלָה|🌃
חלון|חַלּוֹן|🪟
מיטה|מִטָּה|🛏️
שעון|שָׁעוֹן|⏰
כובע|כּוֹבַע|🧢
אוזן|אֹזֶן|👂
אצבע|אֶצְבַּע|☝️
תפוח|תַּפּוּחַ|🍎
בננה|בָּנָנָה|🍌
ביצה|בֵּיצָה|🥚
עוגה|עוּגָה|🎂
פיצה|פִּיצָה|🍕
צלחת|צַלַּחַת|🍽️
מזלג|מַזְלֵג|🍴
אוטו|אוֹטוֹ|🚙`;

const EN_SHORT = `cat|🐈
dog|🐕
pig|🐖
cow|🐄
hen|🐔
fox|🦊
bee|🐝
ant|🐜
owl|🦉
bat|🦇
mom|👩
dad|👨
boy|👦
eye|👁️
ear|👂
leg|🦵
arm|💪
lip|👄
toe|🦶
sun|☀️
hat|🧢
bed|🛏️
cup|🥤
egg|🥚
bus|🚌
car|🚗
van|🚐
jet|✈️
box|📦
bag|👜
toy|🧸
key|🔑
pen|🖊️
map|🗺️
fan|🪭
web|🕸️
ice|🧊
tea|🍵
pie|🥧
jam|🍓
nut|🥜
zoo|🦓
red|🔴
hot|🌶️
yes|👍
no|👎
up|⬆️
hi|👋
me|🙋
run|🏃
sit|🪑
eat|🍽️`;

const EN_LONG = `fish|🐟
bird|🐦
frog|🐸
duck|🦆
bear|🐻
lion|🦁
book|📖
ball|⚽
cake|🎂
milk|🥛
tree|🌳
star|⭐
moon|🌙
rain|🌧️
shoe|👟
sock|🧦
door|🚪
hand|✋
nose|👃
baby|👶
home|🏠
bike|🚲
boat|⛵
kite|🪁`;

const parse = (block: string, lang: Lang, long: boolean): LittleWord[] => [...new Map(block.split('\n').map((l) => {
  const p = l.split('|');
  return lang === 'he' ? { id: p[0], text: p[0], say: p[1], pic: p[2], long } : { id: p[0], text: p[0], say: p[0], pic: p[1], long };
}).map((w) => [w.id, w])).values()];

/** The order the course teaches letters in. */
export const ORDER: Record<Lang, string[]> = { he: LETTERS.map((l) => l.id), en: ABC.map((l) => l.id) };
export const letterIds = (lang: Lang, text: string) => (lang === 'he' ? [...text] : [...text]);

/** In English a word can be read in capitals before the small letters are learned. */
export const formsOf = (lang: Lang, w: LittleWord) => (lang === 'he' ? [w.text] : [w.text, w.text.toUpperCase()]);
const rank = (lang: Lang, form: string) => Math.max(...[...form].map((c) => { const i = ORDER[lang].indexOf(c); return i < 0 ? 1e6 : i; }));
const unlock = (lang: Lang, w: LittleWord) => Math.min(...formsOf(lang, w).map((f) => rank(lang, f)));

export const WORDS: Record<Lang, LittleWord[]> = { he: [...parse(HE_SHORT, 'he', false), ...parse(HE_LONG, 'he', true)], en: [...parse(EN_SHORT, 'en', false), ...parse(EN_LONG, 'en', true)] };

const LESSON_SIZE = 5;
function lessonsOf(lang: Lang): WordLesson[] {
  const out: WordLesson[] = [];
  for (const long of [false, true]) {
    const list = WORDS[lang].filter((w) => w.long === long).sort((a, b) => unlock(lang, a) - unlock(lang, b) || a.text.length - b.text.length);
    for (let i = 0; i < list.length; i += LESSON_SIZE) {
      let words = list.slice(i, i + LESSON_SIZE);
      // A last lesson with one or two words joins the one before it.
      if (words.length < 3 && out.length && out[out.length - 1].long === long) { out[out.length - 1].words.push(...words); continue; }
      out.push({ id: `${lang}${long ? 'L' : 'S'}${out.length + 1}`, words, long, letters: [] });
      words = [];
    }
  }
  for (const l of out) l.letters = [...new Set(l.words.flatMap((w) => [...(formsOf(lang, w).sort((a, b) => rank(lang, a) - rank(lang, b))[0])]))];
  return out;
}
export const LESSONS: Record<Lang, WordLesson[]> = { he: lessonsOf('he'), en: lessonsOf('en') };

/** How the word is shown right now: in English, small letters once they are all learned, capitals before that. Null while it cannot be read yet. */
export function shownForm(lang: Lang, w: LittleWord, met: Set<string>): string | null {
  return formsOf(lang, w).find((f) => [...f].every((c) => met.has(c))) ?? null;
}
export const lessonOpen = (lang: Lang, l: WordLesson, met: Set<string>, doneShort: boolean) => (!l.long || doneShort) && l.words.every((w) => shownForm(lang, w, met));

// ---------- What is said ----------
export const HE_SAY = { choose: 'אֵיפֹה כָּתוּב', build: 'בּוֹנִים אֶת הַמִּלָּה', write: 'כּוֹתְבִים אֶת הַמִּלָּה', meet: 'מִלָּה חֲדָשָׁה', letter: 'כּוֹתְבִים אֶת הָאוֹת', done: 'סִיַּמְנוּ! כָּל הַכָּבוֹד!' };
export const WORDS_HE_AUDIO: string[] = [...new Set([...Object.values(HE_SAY), ...WORDS.he.map((w) => w.say), ...LETTERS.map((l) => l.say)])];
export const WORDS_EN_AUDIO: string[] = [...new Set(WORDS.en.map((w) => w.say))];
