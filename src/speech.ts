// What the Hebrew voice is given to read. The display keeps its niqqud; the recording does not.
//
// Guy heard the recordings stretch vowels: דָּג as "daag", גַּג as "gaag", כַּדּוּר as "kaadur", דְּבוֹרָה as "daavora",
// אֲרֻכָּה as "aaruka", and כָּל read with a long a instead of "kol". The voice reads plain Hebrew well,
// so it gets the text without niqqud. A few words read as a different word without niqqud keep it,
// and the geresh becomes an apostrophe, so צ׳וּפְּצִ׳יק is read with "ch".
import { LETTERS } from './alef/letters';
import { audioName } from './thai';

const MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g;
const MARKS_ALL = /[\u0591-\u05C7]/g;

/**
 * Letter names keep their niqqud: without it רֵישׁ is read "rish" and דָּלֶת "delet", the door.
 * A word counts as a letter name only when it is pointed exactly as one, so דֶּלֶת (door) and בַּיִת (house) are left alone.
 * דָּלֶת is read with a long "aa" even with niqqud, so it is spelled the way it sounds.
 */
const SPOKEN: Record<string, string> = { 'דָּלֶת': 'דאלת' };
const KEEP: Record<string, string> = Object.fromEntries(LETTERS.map((l) => [l.say.replace(MARKS_ALL, ''), l.say]));


/**
 * Full spelling (כתיב מלא) from pointed text, so that the text without niqqud reads right:
 * holam becomes ו (אָרֹךְ → ארוך, but not before א: לֹא, רֹאשׁ), qubutz becomes ו (מְצֻיָּן → מצוין),
 * hiriq becomes י unless the next letter closes the syllable with a shva (זִכָּרוֹן → זיכרון, מִסְתַּכְּלִים → מסתכלים),
 * and a ו that is a consonant inside a word is doubled (תִּקְוָה → תקווה).
 */
/** Words the rules spell wrong, written out. */
const SPELLED: Record<string, string> = { 'מִתַּחַת': 'מתחת', 'הִנֵּה': 'הנה' };

export function toPlene(text: string): string {
  for (const [k, v] of Object.entries(SPELLED)) text = text.split(k).join(v);
  const units: { ch: string; marks: string }[] = [];
  for (const c of text) {
    if (/[\u0591-\u05C7]/.test(c) && units.length) units[units.length - 1].marks += c;
    else units.push({ ch: c, marks: '' });
  }
  const isLetter = (u?: { ch: string }) => !!u && /[\u05D0-\u05EA]/.test(u.ch);
  let out = '';
  units.forEach((u, i) => {
    const next = units[i + 1], prev = units[i - 1];
    out += u.ch;
    if (!isLetter(u)) return;
    const atStart = !isLetter(prev);
    if (u.ch === 'ו' && !atStart && isLetter(next) && /[\u05B0-\u05B8\u05BB]/.test(u.marks) && !u.marks.includes('\u05B9') && !(u.marks.includes('\u05BC') && !/[\u05B0-\u05B8]/.test(u.marks))) out += 'ו';
    const last = (k: number) => isLetter(units[k]) && !isLetter(units[k + 1]);
    // Holam: not before א (לֹא), and not before a final ה (אֵיפֹה, פֹּה).
    if (u.marks.includes('\u05B9') && u.ch !== 'ו' && next?.ch !== 'ו' && next?.ch !== 'א' && !(next?.ch === 'ה' && last(i + 1))) out += 'ו';
    if (u.marks.includes('\u05BB') && next?.ch !== 'ו') out += 'ו';
    // Hiriq: no י before a shva, or in a short closed word (עִם, אִם).
    const closedEnd = last(i + 1) && !/[\u05B1-\u05BB]/.test(next!.marks);
    if (u.marks.includes('\u05B4') && u.ch !== 'י' && next?.ch !== 'י' && isLetter(next) && !next!.marks.includes('\u05B0') && !closedEnd) out += 'י';
    // A consonant י after hiriq is written twice: סִיַּמְנוּ → סיימנו. Not when the י has no vowel (תִּיק), takes hiriq (אֲלַכְסוֹנִיִּים), or comes before ו (אוֹתִיּוֹת).
    if (u.marks.includes('\u05B4') && u.ch !== 'י' && next?.ch === 'י' && /[\u05B0-\u05B3\u05B5-\u05B8]/.test(next.marks) && isLetter(units[i + 2]) && units[i + 2].ch !== 'ו') out += 'י';
    // Qamatz before a final ו in a longer word takes a י: עַכְשָׁו → עכשיו, סְתָו → סתיו (but וָו, תָּו stay).
    if (u.marks.includes('\u05B8') && next?.ch === 'ו' && last(i + 1) && !next.marks && i >= 1 && isLetter(units[i - 1])) out += 'י';
    // A dual ending ַיִם doubles the י in words longer than מַיִם: שְׁתַּיִם → שתיים, רַגְלַיִם → רגליים.
    if (u.ch === 'י' && u.marks.includes('\u05B4') && prev?.marks.includes('\u05B7') && next?.ch === 'ם' && last(i + 1) && i >= 2 && isLetter(units[i - 2])) out += 'י';
  });
  return out;
}

export function forSpeech(text: string): string {
  const plain = toPlene(text).replace(/\u05BE/g, '-').replace(MARKS, '').replace(/[\u05F3׳]/g, "'");
  // A letter name pointed exactly as the name (בֵּית, not בַּיִת) keeps its niqqud, so it is not read as another word.
  const pointed = text.split(/\s+/), bare = plain.split(/\s+/);
  if (pointed.length !== bare.length) return plain;
  return bare.map((w, i) => {
    const p = pointed[i].replace(/[.,!?:]/g, ''), b = w.replace(/[.,!?:]/g, '');
    return KEEP[b] === p ? w.replace(b, SPOKEN[p] ?? p) : w;
  }).join(' ');
}

/** The file name of a recording. Hebrew is named by what is actually read, so a change in reading makes a new recording. */
export const recordingName = (text: string, dir: string) => audioName(dir === 'he' ? forSpeech(text) : text);

/**
 * Spellings to compare by ear, for sounds the voice gets wrong. Each is recorded as written,
 * and the settings page plays them side by side so a parent can pick the one that sounds right.
 */
export const TRIALS: { label: string; options: string[] }[] = [
  { label: 'האות ד (דָּלֶת)', options: ['דָּלֶת', 'דָלֶת', 'דַּלֶת', 'דאלת', 'דאלֶת', 'דָּאלֶת', 'הָאוֹת דָּלֶת', 'האות דאלת'] },
  { label: 'האות ר (רֵישׁ)', options: ['רֵישׁ', 'רֵיש', 'רֵשׁ', 'רייש', 'הָאוֹת רֵישׁ', 'האות רייש'] },
  { label: 'סיימנו', options: ['סיימנו', 'סִיַּמְנוּ', 'סיימנו!', 'סיימנו להיום'] },
];
export const trialName = (text: string) => audioName(`trial|${text}`);
