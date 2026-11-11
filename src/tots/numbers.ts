// Numbers for children of five and six who cannot read. Everything is spoken, with vowel marks so that recordings are right.
// Counting is in the form children learn first: אחת, שתיים, שלוש.
import { Pt, Shape, Stroke } from '../alef/letters';

const line = (...c: number[]): Stroke => ({ k: 'big', p: c.reduce<Pt[]>((a, v, i) => (i % 2 ? a : [...a, [v, c[i + 1]] as Pt]), []) });
/** Angles are in degrees, 0 at the top, growing clockwise. */
const arc = (cx: number, cy: number, rx: number, ry: number, from: number, to: number): Stroke => {
  const n = Math.max(8, Math.ceil(Math.abs(to - from) / 15));
  return { k: 'round', p: Array.from({ length: n + 1 }, (_, i): Pt => { const a = ((from + ((to - from) * i) / n) * Math.PI) / 180; return [Math.round((cx + rx * Math.sin(a)) * 10) / 10, Math.round((cy - ry * Math.cos(a)) * 10) / 10]; }) };
};

export const DIGITS: Record<number, Shape & { recipe: string }> = {
  0: { strokes: [arc(50, 50, 34, 50, 0, 360)], recipe: 'עִיגּוּל סָגוּר, מַתְחִילִים לְמַעְלָה וְחוֹזְרִים לְמַעְלָה.' },
  1: { strokes: [line(26, 28, 55, 0), line(55, 0, 55, 100)], recipe: 'קַו קָטָן עוֹלֶה, וְקַו אָרֹךְ יוֹרֵד.' },
  2: { strokes: [arc(50, 30, 32, 30, -70, 115), line(79.3, 42.7, 15, 100), line(15, 100, 85, 100)], recipe: 'קֶשֶׁת לְמַעְלָה, קַו אֲלַכְסוֹנִי לְמַטָּה, וְרִצְפָּה.' },
  3: { strokes: [arc(48, 25, 30, 25, -60, 180), arc(48, 75, 34, 25, 0, 240)], recipe: 'בֶּטֶן קְטַנָּה, וְעוֹד בֶּטֶן גְּדוֹלָה.' },
  4: { strokes: [line(60, 0, 12, 65), line(12, 65, 88, 65), line(60, 0, 60, 100)], recipe: 'קַו אֲלַכְסוֹנִי לְמַטָּה, קַו יָשָׁר לַצַּד, וְקַו אָרֹךְ יוֹרֵד.' },
  5: { strokes: [line(80, 0, 28, 0), line(28, 0, 24, 46), arc(48, 68, 34, 32, -47, 220)], recipe: 'גַּג, קַו קָטָן יוֹרֵד, וּבֶטֶן גְּדוֹלָה.' },
  6: { strokes: [line(75, 5, 55, 12, 38, 28, 26, 48, 20, 70), arc(50, 70, 30, 30, -90, 270)], recipe: 'קַו מְעֻקָּל יוֹרֵד, וְעִיגּוּל לְמַטָּה.' },
  7: { strokes: [line(15, 0, 85, 0), line(85, 0, 38, 100)], recipe: 'גַּג, וְקַו אֲלַכְסוֹנִי יוֹרֵד.' },
  8: { strokes: [arc(50, 25, 24, 25, 180, 540), arc(50, 75, 30, 25, 0, 360)], recipe: 'עִיגּוּל קָטָן לְמַעְלָה, וְעִיגּוּל גָּדוֹל לְמַטָּה.' },
  9: { strokes: [arc(50, 30, 28, 30, 90, -270), line(78, 30, 78, 100)], recipe: 'עִיגּוּל לְמַעְלָה, וְקַו אָרֹךְ יוֹרֵד.' },
  10: { strokes: [line(-12, 26, 12, 0), line(12, 0, 12, 100), arc(80, 50, 32, 50, 0, 360)], recipe: 'קַו אָרֹךְ לְמַטָּה, וּלְיָדוֹ עִיגּוּל.' },
};
export const ALL_DIGITS = Object.values(DIGITS);

/** Something each digit looks like, which a child already knows. It helps to remember the shape, and is said before how to write it. */
export const LIKE: Record<number, { pic: string; say: string }> = {
  0: { pic: '🥚', say: 'אֶפֶס נִרְאֶה כְּמוֹ בֵּיצָה.' },
  1: { pic: '✏️', say: 'אַחַת נִרְאֵית כְּמוֹ עִפָּרוֹן.' },
  2: { pic: '🦢', say: 'שְׁתַּיִם נִרְאֵית כְּמוֹ בַּרְבּוּר.' },
  3: { pic: '👂', say: 'שָׁלוֹשׁ נִרְאֵית כְּמוֹ אֹזֶן.' },
  4: { pic: '⛵', say: 'אַרְבַּע נִרְאֵית כְּמוֹ סִירָה עִם מִפְרָשׂ.' },
  5: { pic: '🪝', say: 'חָמֵשׁ נִרְאֵית כְּמוֹ וָו עִם כּוֹבַע.' },
  6: { pic: '🐌', say: 'שֵׁשׁ נִרְאֵית כְּמוֹ חִלָּזוֹן.' },
  7: { pic: '🪃', say: 'שֶׁבַע נִרְאֵית כְּמוֹ בּוּמֶרַנְג.' },
  8: { pic: '⛄', say: 'שְׁמוֹנֶה נִרְאֵית כְּמוֹ אִישׁ שֶׁלֶג.' },
  9: { pic: '🎈', say: 'תֵּשַׁע נִרְאֵית כְּמוֹ בָּלוֹן עַל חוּט.' },
  10: { pic: '✏️🥚', say: 'עֶשֶׂר זֶה עִפָּרוֹן וּבֵיצָה: אַחַת וְאֶפֶס.' },
};

export const WORD: Record<number, string> = {
  0: 'אֶפֶס', 1: 'אַחַת', 2: 'שְׁתַּיִם', 3: 'שָׁלוֹשׁ', 4: 'אַרְבַּע', 5: 'חָמֵשׁ', 6: 'שֵׁשׁ', 7: 'שֶׁבַע', 8: 'שְׁמוֹנֶה', 9: 'תֵּשַׁע', 10: 'עֶשֶׂר',
  11: 'אַחַת עֶשְׂרֵה', 12: 'שְׁתֵּים עֶשְׂרֵה', 13: 'שְׁלוֹשׁ עֶשְׂרֵה', 14: 'אַרְבַּע עֶשְׂרֵה', 15: 'חֲמֵשׁ עֶשְׂרֵה', 16: 'שֵׁשׁ עֶשְׂרֵה', 17: 'שְׁבַע עֶשְׂרֵה', 18: 'שְׁמוֹנֶה עֶשְׂרֵה', 19: 'תְּשַׁע עֶשְׂרֵה', 20: 'עֶשְׂרִים',
};

export type SkillKind = 'num' | 'seq' | 'more' | 'add' | 'sub' | 'bond';
export interface Skill { id: string; kind: SkillKind; n: number; title: string; label: string; stage: number; teach?: string }
export const STAGES = ['מספרים 1 עד 5', 'חיבור וחיסור עד 5', 'מספרים 6 עד 10', 'חיבור וחיסור עד 10', 'השלמה וספירה עד 20'];

const num = (n: number, stage: number): Skill => ({ id: `n${n}`, kind: 'num', n, title: `המספר ${n}`, label: String(n), stage });
/** The order of teaching. Each skill uses only numbers that were already met. */
export const SKILLS: Skill[] = [
  num(1, 0), num(2, 0), num(3, 0), num(4, 0), num(5, 0),
  { id: 'seq5', kind: 'seq', n: 5, title: 'הסדר עד 5', label: '…5', stage: 0, teach: 'מַתְחִילִים מֵאַחַת וְסוֹפְרִים לְפִי הַסֵּדֶר: אַחַת, שְׁתַּיִם, שָׁלוֹשׁ, אַרְבַּע, חָמֵשׁ.' },
  { id: 'more5', kind: 'more', n: 5, title: 'יותר ופחות עד 5', label: '<5', stage: 0, teach: 'סוֹפְרִים כָּל קְבוּצָה, וְרוֹאִים אֵיפֹה יֵשׁ יוֹתֵר וְאֵיפֹה יֵשׁ פָּחוֹת.' },
  { id: 'add3', kind: 'add', n: 3, title: 'חיבור עד 3', label: '+3', stage: 1, teach: 'חִבּוּר זֶה לְהוֹסִיף. יֵשׁ לָנוּ שְׁתַּיִם, מוֹסִיפִים עוֹד אַחַת, וְסוֹפְרִים הַכֹּל: שָׁלוֹשׁ.' },
  { id: 'add5', kind: 'add', n: 5, title: 'חיבור עד 5', label: '+5', stage: 1, teach: 'מְחַבְּרִים שְׁתֵּי קְבוּצוֹת, וְסוֹפְרִים כַּמָּה יֵשׁ בְּיַחַד.' },
  { ...num(0, 1), teach: 'אֶפֶס זֶה כְּלוּם. כְּשֶׁאֵין שׁוּם דָּבָר, יֵשׁ אֶפֶס.' },
  { id: 'sub3', kind: 'sub', n: 3, title: 'חיסור עד 3', label: '−3', stage: 1, teach: 'חִסּוּר זֶה לְהוֹרִיד. יֵשׁ לָנוּ שָׁלוֹשׁ, מוֹרִידִים אַחַת, וְנִשְׁאֲרוּ שְׁתַּיִם.' },
  { id: 'sub5', kind: 'sub', n: 5, title: 'חיסור עד 5', label: '−5', stage: 1, teach: 'מוֹרִידִים אֶת מָה שֶׁמְּסֻמָּן, וְסוֹפְרִים כַּמָּה נִשְׁאַר.' },
  num(6, 2), num(7, 2), num(8, 2), num(9, 2), num(10, 2),
  { id: 'seq10', kind: 'seq', n: 10, title: 'הסדר עד 10', label: '…10', stage: 2, teach: 'סוֹפְרִים עַד עֶשֶׂר לְפִי הַסֵּדֶר, וְכָל מִסְפָּר בָּא אַחֲרֵי זֶה שֶׁלְּפָנָיו.' },
  { id: 'more10', kind: 'more', n: 10, title: 'יותר ופחות עד 10', label: '<10', stage: 2, teach: 'סוֹפְרִים כָּל קְבוּצָה, וְרוֹאִים אֵיפֹה יֵשׁ יוֹתֵר וְאֵיפֹה יֵשׁ פָּחוֹת.' },
  { id: 'add10', kind: 'add', n: 10, title: 'חיבור עד 10', label: '+10', stage: 3, teach: 'מְחַבְּרִים שְׁתֵּי קְבוּצוֹת, וְסוֹפְרִים כַּמָּה יֵשׁ בְּיַחַד.' },
  { id: 'sub10', kind: 'sub', n: 10, title: 'חיסור עד 10', label: '−10', stage: 3, teach: 'מוֹרִידִים אֶת מָה שֶׁמְּסֻמָּן, וְסוֹפְרִים כַּמָּה נִשְׁאַר.' },
  { id: 'bond5', kind: 'bond', n: 5, title: 'השלמה ל־5', label: '→5', stage: 4, teach: 'רוֹאִים כַּמָּה מְלֵאִים, וּמְגַלִּים כַּמָּה חָסֵר עַד חָמֵשׁ.' },
  { id: 'bond10', kind: 'bond', n: 10, title: 'השלמה ל־10', label: '→10', stage: 4, teach: 'רוֹאִים כַּמָּה מְלֵאִים, וּמְגַלִּים כַּמָּה חָסֵר עַד עֶשֶׂר.' },
  { id: 'seq20', kind: 'seq', n: 20, title: 'ספירה עד 20', label: '…20', stage: 4, teach: 'אַחֲרֵי עֶשֶׂר מַמְשִׁיכִים: אַחַת עֶשְׂרֵה, שְׁתֵּים עֶשְׂרֵה, וְכָכָה עַד עֶשְׂרִים.' },
];
export const SKILL = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<string, Skill>;
export const hasWriting = (s: Skill) => s.kind === 'num';

const count = (n: number) => Array.from({ length: n }, (_, i) => WORD[i + 1]).join(', ');
export const SAY = {
  right: ['נָכוֹן!', 'יָפֶה מְאוֹד!', 'כָּל הַכָּבוֹד!', 'מְצֻיָּן!'],
  again: 'כִּמְעַט! מְנַסִּים עוֹד פַּעַם.',
  finish: 'סִיַּמְנוּ לְהַיּוֹם. כָּל הַכָּבוֹד!',
  howMany: 'כַּמָּה יֵשׁ?',
  more: 'אֵיפֹה יֵשׁ יוֹתֵר?',
  less: 'אֵיפֹה יֵשׁ פָּחוֹת?',
  meet: (n: number) => (n === 0 ? `אֶפֶס. זֶה כְּלוּם, אֵין שׁוּם דָּבָר. ${LIKE[0].say}` : `${count(n)}. זֶה הַמִּסְפָּר ${WORD[n]}. ${LIKE[n].say}`),
  find: (n: number) => `אֵיפֹה הַמִּסְפָּר ${WORD[n]}?`,
  match: (n: number) => `אֵיפֹה יֵשׁ ${WORD[n]}?`,
  make: (n: number) => `לוֹחֲצִים וְסוֹפְרִים עַד ${WORD[n]}.`,
  next: (n: number) => `מָה בָּא אַחֲרֵי ${WORD[n]}?`,
  before: (n: number) => `מָה בָּא לִפְנֵי ${WORD[n]}?`,
  add: (a: number, b: number) => `${WORD[a]} וְעוֹד ${WORD[b]}. כַּמָּה יַחַד?`,
  sub: (a: number, b: number) => `${WORD[a]} פָּחוֹת ${WORD[b]}. כַּמָּה נִשְׁאָר?`,
  addRight: (a: number, b: number) => `נָכוֹן! ${WORD[a]} וְעוֹד ${WORD[b]} זֶה ${WORD[a + b]}.`,
  subRight: (a: number, b: number) => `נָכוֹן! ${WORD[a]} פָּחוֹת ${WORD[b]} זֶה ${WORD[a - b]}.`,
  bond: (t: number) => `כַּמָּה חָסֵר עַד ${WORD[t]}?`,
  isRight: (n: number) => `נָכוֹן! ${WORD[n]}.`,
  notThis: (n: number) => `זֶה ${WORD[n]}. מְנַסִּים עוֹד.`,
  trace: (n: number) => `עוֹבְרִים עִם הָאֶצְבַּע עַל הַמִּסְפָּר ${WORD[n]}. ${LIKE[n].say} ${DIGITS[n].recipe}`,
  copy: (n: number) => `כּוֹתְבִים ${WORD[n]}, כְּמוֹ הַמִּסְפָּר שֶׁלְּמַעְלָה. ${LIKE[n].say} ${DIGITS[n].recipe}`,
  memory: (n: number) => `מִסְתַּכְּלִים טוֹב עַל הַמִּסְפָּר ${WORD[n]}, וְכוֹתְבִים אוֹתוֹ מֵהַזִּכָּרוֹן. ${LIKE[n].say} ${DIGITS[n].recipe}`,
  write: (n: number) => `עַכְשָׁו כּוֹתְבִים ${WORD[n]}, לְבַד. ${LIKE[n].say} ${DIGITS[n].recipe}`,
  thisIs: (n: number) => `זֶה הַמִּסְפָּר ${WORD[n]}.`,
};

const upTo = (n: number) => Array.from({ length: n + 1 }, (_, i) => i);
/** Every sentence the course can say. The deploy creates a recording for each one. */
export const TOTS_AUDIO: string[] = [...new Set([
  ...SAY.right, SAY.again, SAY.finish, SAY.howMany, SAY.more, SAY.less,
  ...SKILLS.flatMap((s) => (s.teach ? [s.teach] : [])),
  ...upTo(20).flatMap((n) => [WORD[n], SAY.find(n), SAY.match(n), SAY.make(n), SAY.next(n), SAY.before(n), SAY.isRight(n), SAY.notThis(n)]),
  ...upTo(10).flatMap((n) => [SAY.meet(n), SAY.trace(n), SAY.copy(n), SAY.memory(n), SAY.write(n), SAY.thisIs(n), SAY.bond(n)]),
  ...upTo(10).flatMap((a) => upTo(10 - a).filter((b) => b > 0 && a > 0).flatMap((b) => [SAY.add(a, b), SAY.addRight(a, b)])),
  ...upTo(10).flatMap((a) => upTo(a).filter((b) => b > 0 && a > 0).flatMap((b) => [SAY.sub(a, b), SAY.subRight(a, b)])),
])];
