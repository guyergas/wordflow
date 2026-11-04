// Musical symbols: what each one means, and how it sounds. Glyphs are SMuFL code points (Bravura font).

import type { NoteEvent } from './accomp';

/**
 * Glyph art in a 160×100 box; staff lines (when drawn) at y = 30, 40 … 70, so a staff space is 10 units
 * and the default font size (40) matches SMuFL's 4-space em. Each part: [text, x, baseline y].
 */
export type SymbolArt =
  | { kind: 'glyph'; parts: [string, number, number][]; staff?: boolean; size?: number }
  | { kind: 'svg'; shape: 'tie' | 'slur' | 'cresc' | 'decresc' };

export interface MusicSymbol {
  id: string;
  art: SymbolArt;
  name: string;
  /** Italian / English term. */
  term: string;
  /** One line for the quiz. */
  short: string;
  /** Longer explanation. */
  text: string;
  /** A sound example: events in beats, at `bpm`. */
  demo?: { events: NoteEvent[]; bpm: number; caption: string };
  group: 'basics' | 'length' | 'touch' | 'volume' | 'form';
}

const n = (midi: number, at: number, beats: number, velocity = 0.7): NoteEvent => ({ midi, at, beats, velocity });
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, Fs4 = 66, G4 = 67;

const scale = (vel: (i: number) => number, len = 1, gap = 1): NoteEvent[] =>
  [C4, D4, E4, F4, G4].map((m, i) => n(m, i * gap, len, vel(i)));

export const SYMBOLS: MusicSymbol[] = [
  {
    id: 'treble', group: 'basics', art: { kind: 'glyph', staff: true, parts: [['', 24, 60]] }, name: 'מפתח סול', term: 'Treble clef / G clef',
    short: 'הקו השני מלמטה הוא G4', text: 'מתלפף סביב הקו השני מלמטה — שם נמצא G4. בפסנתר: בדרך כלל היד הימנית.',
    demo: { events: [n(G4, 0, 2)], bpm: 80, caption: 'G4 — הצליל שהמפתח מסמן' },
  },
  {
    id: 'bass', group: 'basics', art: { kind: 'glyph', staff: true, parts: [['', 24, 40]] }, name: 'מפתח פה', term: 'Bass clef / F clef',
    short: 'הקו השני מלמעלה הוא F3', text: 'שתי הנקודות עוטפות את הקו השני מלמעלה — שם נמצא F3. בפסנתר: בדרך כלל היד השמאלית.',
    demo: { events: [n(53, 0, 2)], bpm: 80, caption: 'F3 — הצליל שהמפתח מסמן' },
  },
  {
    id: 'time', group: 'basics', art: { kind: 'glyph', staff: true, parts: [['', 14, 60], ['', 64, 40], ['', 64, 60]] }, name: 'משקל 4/4', term: 'Time signature',
    short: 'ארבע פעמות בכל תיבה', text: 'המספר העליון: כמה פעמות בתיבה. התחתון: איזה תו הוא פעמה (4 = רבע). 3/4 הוא משקל של ואלס.',
    demo: { events: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => n(i % 4 === 0 ? 72 : 67, i, 0.4, i % 4 === 0 ? 0.8 : 0.4)), bpm: 96, caption: 'אחת־שתיים־שלוש־ארבע, ושוב' },
  },
  {
    id: 'sharp', group: 'basics', art: { kind: 'glyph', staff: true, parts: [['', 62, 50], ['', 76, 50]] }, name: 'דיאז ♯', term: 'Sharp',
    short: 'מעלה את התו בחצי טון', text: 'הקליד הבא מימין — בדרך כלל השחור. נשאר בתוקף עד סוף התיבה.',
    demo: { events: [n(F4, 0, 1), n(Fs4, 1, 1)], bpm: 72, caption: 'F ואז F♯' },
  },
  {
    id: 'flat', group: 'basics', art: { kind: 'glyph', staff: true, parts: [['', 62, 50], ['', 76, 50]] }, name: 'במול ♭', term: 'Flat',
    short: 'מוריד את התו בחצי טון', text: 'הקליד הבא משמאל. גם הוא בתוקף עד סוף התיבה.',
    demo: { events: [n(71, 0, 1), n(70, 1, 1)], bpm: 72, caption: 'B ואז B♭' },
  },
  {
    id: 'natural', group: 'basics', art: { kind: 'glyph', staff: true, parts: [['', 62, 50], ['', 76, 50]] }, name: 'בקר ♮', term: 'Natural',
    short: 'מבטל דיאז או במול', text: 'מחזיר את התו לקליד הלבן — גם אם בתחילת התיבה, או בסימן הסולם, היה לו ♯ או ♭.',
    demo: { events: [n(Fs4, 0, 1), n(F4, 1, 1)], bpm: 72, caption: 'F♯ ואז F עם בקר' },
  },
  {
    id: 'values', group: 'length', art: { kind: 'glyph', parts: [['', 16, 74], ['', 54, 74], ['', 90, 74], ['', 122, 74]] }, name: 'ערכי תווים', term: 'Whole · Half · Quarter · Eighth',
    short: 'שלם 4, חצי 2, רבע 1, שמינית ½', text: 'שלם = ארבע פעמות, חצי = שתיים, רבע = אחת, שמינית = חצי פעמה. הצורה אומרת כמה זמן, המקום על החמשה אומר איזה צליל.',
    demo: { events: [n(C4, 0, 4), n(E4, 4, 2), n(G4, 6, 1), n(G4, 7, 0.5), n(G4, 7.5, 0.5)], bpm: 96, caption: 'שלם, חצי, רבע ושתי שמיניות' },
  },
  {
    id: 'rests', group: 'length', art: { kind: 'glyph', staff: true, parts: [['', 18, 40], ['', 54, 50], ['', 92, 50], ['', 124, 50]] }, name: 'הפסקות', term: 'Rests',
    short: 'שקט — סופרים ולא מנגנים', text: 'לכל ערך של תו יש הפסקה באותו אורך. בזמן ההפסקה ממשיכים לספור.',
    demo: { events: [n(C4, 0, 1), n(E4, 2, 1), n(G4, 4, 1)], bpm: 88, caption: 'צליל, הפסקה, צליל, הפסקה' },
  },
  {
    id: 'dot', group: 'length', art: { kind: 'glyph', size: 48, parts: [['', 54, 76], ['', 86, 72]] }, name: 'נקודה ליד תו', term: 'Dotted note',
    short: 'מוסיפה חצי מהאורך', text: 'חצי מנוקד = 3 פעמות, רבע מנוקד = פעמה וחצי.',
    demo: { events: [n(E4, 0, 2), n(G4, 2, 2), n(E4, 4, 3), n(G4, 7, 1)], bpm: 96, caption: 'חצי וחצי, ואז חצי מנוקד ורבע' },
  },
  {
    id: 'tie', group: 'length', art: { kind: 'svg', shape: 'tie' }, name: 'קשת חיבור', term: 'Tie',
    short: 'שני תווים זהים — צליל אחד ארוך', text: 'קשת בין שני תווים באותו גובה מחברת אותם: מנגנים פעם אחת ומחזיקים את שני האורכים.',
    demo: { events: [n(G4, 0, 1), n(G4, 1, 1), n(G4, 3, 2)], bpm: 84, caption: 'בלי קשת: שתי הקשות. עם קשת: אחת ארוכה' },
  },
  {
    id: 'slur', group: 'touch', art: { kind: 'svg', shape: 'slur' }, name: 'קשת לגאטו', term: 'Slur / Legato',
    short: 'לנגן מחובר, בלי רווחים', text: 'קשת מעל כמה תווים שונים: מנגנים אותם ברצף רך, בלי להרים את היד בין תו לתו.',
    demo: { events: scale(() => 0.6, 1.15), bpm: 100, caption: 'מחובר ורך' },
  },
  {
    id: 'staccato', group: 'touch', art: { kind: 'glyph', size: 48, parts: [['', 64, 70], ['', 71, 86]] }, name: 'סטקטו', term: 'Staccato',
    short: 'קצר ומנותק', text: 'נקודה מעל או מתחת לראש התו: מנגנים קצר וקופצני, וחצי מהזמן — שקט.',
    demo: { events: scale(() => 0.7, 0.25), bpm: 100, caption: 'קצר־קצר־קצר' },
  },
  {
    id: 'accent', group: 'touch', art: { kind: 'glyph', size: 48, parts: [['', 66, 40], ['', 64, 82]] }, name: 'אקצנט', term: 'Accent',
    short: 'להדגיש את התו', text: 'החץ השוכב מעל התו: לנגן אותו חזק יותר מהתווים שסביבו.',
    demo: { events: scale((i) => (i === 2 ? 1 : 0.4)), bpm: 100, caption: 'התו האמצעי מודגש' },
  },
  {
    id: 'fermata', group: 'touch', art: { kind: 'glyph', size: 48, parts: [['', 56, 40], ['', 66, 84]] }, name: 'פרמטה', term: 'Fermata',
    short: 'להחזיק יותר זמן', text: 'העין מעל התו: עוצרים את הספירה ומחזיקים את הצליל כמה שמרגיש נכון.',
    demo: { events: [n(C4, 0, 1), n(E4, 1, 1), n(G4, 2, 4)], bpm: 90, caption: 'האחרון נמשך' },
  },
  {
    id: 'piano', group: 'volume', art: { kind: 'glyph', size: 64, parts: [['', 66, 70]] }, name: 'פיאנו', term: 'piano · p',
    short: 'בשקט', text: 'p = חלש ושקט. pp = שקט מאוד. כן — זה מקור השם "פסנתר": כלי שיכול לנגן גם חלש וגם חזק.',
    demo: { events: scale(() => 0.25), bpm: 100, caption: 'בשקט' },
  },
  {
    id: 'forte', group: 'volume', art: { kind: 'glyph', size: 64, parts: [['', 66, 70]] }, name: 'פורטה', term: 'forte · f',
    short: 'בחוזקה', text: 'f = חזק. ff = חזק מאוד.',
    demo: { events: scale(() => 1), bpm: 100, caption: 'בחוזקה' },
  },
  {
    id: 'mezzo', group: 'volume', art: { kind: 'glyph', size: 64, parts: [['', 50, 70]] }, name: 'מצו־פורטה', term: 'mezzo-forte · mf',
    short: 'חזק במידה', text: 'mezzo = "חצי". mf חזק במידה, mp חלש במידה — באמצע הדרך.',
    demo: { events: scale(() => 0.6), bpm: 100, caption: 'באמצע' },
  },
  {
    id: 'cresc', group: 'volume', art: { kind: 'svg', shape: 'cresc' }, name: 'קרשנדו', term: 'crescendo · cresc.',
    short: 'להתחזק בהדרגה', text: 'המזלג שנפתח: כל תו קצת חזק מהקודם.',
    demo: { events: scale((i) => 0.2 + i * 0.2), bpm: 100, caption: 'מתחזק' },
  },
  {
    id: 'decresc', group: 'volume', art: { kind: 'svg', shape: 'decresc' }, name: 'דימינואנדו', term: 'diminuendo · dim.',
    short: 'להיחלש בהדרגה', text: 'המזלג שנסגר: כל תו קצת חלש מהקודם.',
    demo: { events: scale((i) => 1 - i * 0.2), bpm: 100, caption: 'נחלש' },
  },
  {
    id: 'repeat', group: 'form', art: { kind: 'glyph', staff: true, parts: [['', 22, 70], ['', 70, 50], ['', 118, 70]] }, name: 'סימני חזרה', term: 'Repeat signs',
    short: 'לנגן את הקטע פעמיים', text: 'שני קווים ונקודות: מנגנים עד סימן הסוף, וחוזרים לסימן הפתיחה (או להתחלה) — פעם אחת.',
    demo: { events: [...scale(() => 0.65), ...scale(() => 0.65).map((e) => ({ ...e, at: e.at + 5 }))], bpm: 120, caption: 'אותו קטע — פעמיים' },
  },
];

export const SYMBOL_GROUPS: { id: MusicSymbol['group']; title: string }[] = [
  { id: 'basics', title: 'בסיס' },
  { id: 'length', title: 'אורך' },
  { id: 'touch', title: 'מגע' },
  { id: 'volume', title: 'עוצמה' },
  { id: 'form', title: 'מבנה' },
];

export interface SymbolQuestion { symbol: MusicSymbol; options: MusicSymbol[] }

/** Quiz: each symbol once (up to `count`), four meanings to choose from. */
export function symbolQuiz(rng: () => number, count = 10): SymbolQuestion[] {
  const pool = shuffle(SYMBOLS, rng).slice(0, count);
  return pool.map((s) => {
    const others = shuffle(SYMBOLS.filter((x) => x.id !== s.id), rng).slice(0, 3);
    return { symbol: s, options: shuffle([s, ...others], rng) };
  });
}

function shuffle<T>(xs: T[], rng: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
