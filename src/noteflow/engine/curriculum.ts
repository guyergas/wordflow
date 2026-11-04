// Learning path: parallel tracks instead of a single linear list.
// Nothing is locked — prerequisites only drive the recommendation.

import { applyKey, Clef, diatonic, KeySig, midi, naturalRange, parsePitch, Pitch } from '../music/pitch';

/**
 * name = read the note's name; key = find it on the keyboard; ear = hear it and find it on the staff;
 * finger = which finger plays it (C position); interval = the distance between two notes.
 */
export type Skill = 'name' | 'key' | 'ear' | 'finger' | 'interval';

export interface StageItem {
  clef: Clef;
  pitch: Pitch;
  /** The note is read under this key signature (the pitch already carries the key's ♯/♭). */
  keySig?: KeySig;
}

export interface StageRange {
  clef: Clef;
  from: string;
  to: string;
  /** Also include ♯ and ♭ spellings of the black keys inside the range (never C♭, F♭, E♯, B♯). */
  accidentals?: boolean;
  /** Read in this key signature: naturals on the staff become the key's ♯/♭ notes. */
  key?: KeySig;
  /** Only these notes from the range (landmarks). */
  only?: string[];
}

export type StageExercise = 'notes' | 'sequence' | 'rhythm' | 'grand' | 'finger' | 'interval';

export interface Stage {
  id: string;
  track: TrackId;
  /** Default 'notes'. */
  exercise?: StageExercise;
  /** Rhythm stages. */
  rhythmLevel?: number;
  bpm?: number;
  title: string;
  subtitle: string;
  ranges: StageRange[];
  /** Stage ids that should be at least "passed" before this is recommended. */
  after: string[];
  /** Notes stages: the nearest landmark note is always shown, and answers are explained by counting from it. */
  anchors?: boolean;
  /** Interval stages: largest interval (2 = second … 5 = fifth). */
  maxInterval?: number;
  /** Grand-staff stages: pairs of notes, or a melody over a bass line. */
  grandMode?: 'pairs' | 'melody';
}

export type TrackId = 'treble' | 'bass' | 'mixed' | 'accidentals' | 'melody' | 'rhythm' | 'hands' | 'reading' | 'keys';

export const TRACKS: { id: TrackId; title: string }[] = [
  { id: 'treble', title: 'מפתח סול' },
  { id: 'bass', title: 'מפתח פה' },
  { id: 'mixed', title: 'שני המפתחות' },
  { id: 'accidentals', title: 'דיאז ובמול' },
  { id: 'melody', title: 'קריאת מנגינה' },
  { id: 'rhythm', title: 'מקצב' },
  { id: 'hands', title: 'ידיים ואצבעות' },
  { id: 'reading', title: 'קריאה חכמה' },
  { id: 'keys', title: 'סימני סולם' },
];

export const STAGES: Stage[] = [
  {
    id: 'o3', track: 'mixed', title: 'אוקטבה 3 בשני המפתחות', subtitle: 'A3 ו־B3 על קווי עזר מתחת למפתח סול, ואותם תווים בתוך מפתח פה — אותו צליל, שני מקומות',
    ranges: [{ clef: 'bass', from: 'C3', to: 'B3' }, { clef: 'treble', from: 'A3', to: 'C4' }], after: ['b2', 't2'],
  },
  {
    id: 't1', track: 'treble', title: 'C4–G4', subtitle: 'חמשת התווים הראשונים, מ־Middle C ועד G — הקו שהמפתח מסמן',
    ranges: [{ clef: 'treble', from: 'C4', to: 'G4' }], after: [],
  },
  {
    id: 'b1', track: 'bass', title: 'F3–C4', subtitle: 'מ־Middle C כלפי מטה ועד F — הקו שמפתח פה מסמן',
    ranges: [{ clef: 'bass', from: 'F3', to: 'C4' }], after: ['t1'],
  },
  {
    id: 'm1', track: 'mixed', title: 'סול ופה יחד', subtitle: 'מעבר בין המפתחות בטווחים שנלמדו',
    ranges: [{ clef: 'treble', from: 'C4', to: 'G4' }, { clef: 'bass', from: 'F3', to: 'C4' }], after: ['t1', 'b1'],
  },
  {
    id: 't2', track: 'treble', title: 'C4–C5', subtitle: 'השלמת האוקטבה במפתח סול',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5' }], after: ['t1'],
  },
  {
    id: 'b2', track: 'bass', title: 'C3–C4', subtitle: 'אוקטבה 3 שלמה במפתח פה: C3 עד B3, ועד Middle C — עם C3 כעוגן',
    ranges: [{ clef: 'bass', from: 'C3', to: 'C4' }], after: ['b1'],
  },
  {
    id: 'm2', track: 'mixed', title: 'אוקטבה מלאה בשני המפתחות', subtitle: 'C3–C5 במעבר חופשי בין המפתחות',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5' }, { clef: 'bass', from: 'C3', to: 'C4' }], after: ['t2', 'b2', 'm1'],
  },
  {
    id: 'r1', track: 'rhythm', exercise: 'rhythm', rhythmLevel: 1, bpm: 70, title: 'מוצאים את הדופק', subtitle: 'רבעים, חצאים ושלמים ב־4/4 — מקישים בתחילת כל צליל',
    ranges: [], after: ['t1'],
  },
  {
    id: 's1', track: 'melody', exercise: 'sequence', title: 'מנגינות בסול', subtitle: 'קוראים משפטים מוזיקליים ב־C4–C5, תו אחרי תו, עם הצצה קדימה',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5' }], after: ['t2'],
  },
  {
    id: 'r2', track: 'rhythm', exercise: 'rhythm', rhythmLevel: 2, bpm: 70, title: 'שמיניות ושתיקות', subtitle: 'שתי שמיניות בפעימה, ורגעים של שקט',
    ranges: [], after: ['r1'],
  },
  {
    id: 's2', track: 'melody', exercise: 'sequence', title: 'מנגינות בפה', subtitle: 'אותן מנגינות, אוקטבה נמוכה יותר, במפתח פה',
    ranges: [{ clef: 'bass', from: 'C3', to: 'C4' }], after: ['b2', 's1'],
  },
  {
    id: 'a1', track: 'accidentals', title: 'דיאז ובמול בסול', subtitle: 'C4–C5 עם ♯ ו־♭: אותו מקום על החמשה, חצי טון למעלה או למטה — הקלידים השחורים',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5', accidentals: true }], after: ['m2'],
  },
  {
    id: 'a2', track: 'accidentals', title: 'דיאז ובמול בפה', subtitle: 'C3–C4 עם ♯ ו־♭, ואחר כך מעורב עם מפתח סול',
    ranges: [{ clef: 'bass', from: 'C3', to: 'C4', accidentals: true }, { clef: 'treble', from: 'C4', to: 'C5', accidentals: true }], after: ['a1'],
  },
  {
    id: 't3', track: 'treble', title: 'A3–C6', subtitle: 'שתי אוקטבות וחצי, כולל קווי עזר מעל ומתחת',
    ranges: [{ clef: 'treble', from: 'A3', to: 'C6' }], after: ['t2'],
  },
  {
    id: 'b3', track: 'bass', title: 'C2–E4', subtitle: 'שתי אוקטבות וחצי, כולל קווי עזר מעל ומתחת',
    ranges: [{ clef: 'bass', from: 'C2', to: 'E4' }], after: ['b2'],
  },
  {
    id: 'm3', track: 'mixed', title: 'טווח מורחב בשני המפתחות', subtitle: 'קריאה מעורבת בכל הטווח, כמו בתווי פסנתר',
    ranges: [{ clef: 'treble', from: 'A3', to: 'C6' }, { clef: 'bass', from: 'C2', to: 'E4' }], after: ['t3', 'b3', 'm2'],
  },
  {
    id: 'r3', track: 'rhythm', exercise: 'rhythm', rhythmLevel: 3, bpm: 66, title: 'נקודות ושש־עשריות', subtitle: 'רבע מנוקד, חצי מנוקד וארבע שש־עשריות בפעימה',
    ranges: [], after: ['r2'],
  },
  // ---- Hands and fingers ----
  {
    id: 'h1', track: 'hands', exercise: 'finger', title: 'יד ימין במיקום C', subtitle: 'חמש אצבעות על C4–G4: אגודל על C, זרת על G. מי מנגנת כל תו?',
    ranges: [{ clef: 'treble', from: 'C4', to: 'G4' }], after: ['t1'],
  },
  {
    id: 'h2', track: 'hands', exercise: 'finger', title: 'יד שמאל במיקום C', subtitle: 'C3–G3 ביד שמאל: הזרת על C, האגודל על G — המספרים מתהפכים',
    ranges: [{ clef: 'bass', from: 'C3', to: 'G3' }], after: ['h1', 'b2'],
  },
  {
    id: 'g1', track: 'hands', exercise: 'grand', grandMode: 'pairs', title: 'שתי ידיים: זוגות', subtitle: 'שתי חמשות מחוברות. בכל פעם שני תווים יחד — קודם יד שמאל, אחר כך יד ימין',
    ranges: [{ clef: 'treble', from: 'C4', to: 'G4' }, { clef: 'bass', from: 'C3', to: 'G3' }], after: ['h2', 'm1'],
  },
  {
    id: 'g2', track: 'hands', exercise: 'grand', grandMode: 'melody', title: 'שתי ידיים: מנגינה ובס', subtitle: 'מנגינה ביד ימין, וצלילי בס ארוכים ביד שמאל',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5' }, { clef: 'bass', from: 'C3', to: 'C4' }], after: ['g1', 's1'],
  },
  // ---- Smarter reading ----
  {
    id: 'l1', track: 'reading', title: 'תווי עוגן', subtitle: 'שישה תווים שמזהים במבט: C3, F3, C4 בפה; C4, G4, C5 בסול',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5', only: ['C4', 'G4', 'C5'] }, { clef: 'bass', from: 'C3', to: 'C4', only: ['C3', 'F3', 'C4'] }], after: ['m1'],
  },
  {
    id: 'i1', track: 'reading', exercise: 'interval', maxInterval: 3, title: 'צעדים ודילוגים', subtitle: 'קוראים את המרחק בין שני תווים: אותו תו, צעד (קו לרווח) או דילוג (קו לקו)',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5' }], after: ['l1', 't2'],
  },
  {
    id: 'l2', track: 'reading', anchors: true, title: 'סופרים מהעוגן', subtitle: 'כל הטווח, כולל קווי עזר — העוגן הקרוב תמיד מופיע לידך',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C6' }, { clef: 'bass', from: 'C2', to: 'C4' }], after: ['l1', 'm2'],
  },
  {
    id: 'i2', track: 'reading', exercise: 'interval', maxInterval: 5, title: 'מרווחים עד קווינטה', subtitle: 'רביעית וחמישית, בשני המפתחות — כך קוראים מנגינה בלי לפענח כל תו',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5' }, { clef: 'bass', from: 'C3', to: 'C4' }], after: ['i1'],
  },
  // ---- Key signatures ----
  {
    id: 'k1', track: 'keys', title: 'סולם G מז׳ור', subtitle: 'דיאז אחד בתחילת השורה: כל F הוא F♯, בכל אוקטבה',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5', key: 'G' }], after: ['a1'],
  },
  {
    id: 'k2', track: 'keys', title: 'סולם F מז׳ור', subtitle: 'במול אחד בתחילת השורה: כל B הוא B♭',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5', key: 'F' }], after: ['k1'],
  },
  {
    id: 'k3', track: 'keys', title: 'D ו־B♭ מז׳ור', subtitle: 'שני סימנים: F♯ ו־C♯ בסול, B♭ ו־E♭ בפה',
    ranges: [{ clef: 'treble', from: 'C4', to: 'C5', key: 'D' }, { clef: 'bass', from: 'C3', to: 'C4', key: 'Bb' }], after: ['k2', 'a2'],
  },
];

/** Recommended order through the parallel tracks. */
export const RECOMMENDED_ORDER = [
  't1', 'h1', 'b1', 'b2', 'm1', 'l1', 'r1', 't2', 'o3', 'h2', 'm2', 'i1', 's1', 'g1', 'r2', 's2', 'l2', 'i2', 'g2',
  'a1', 'k1', 'a2', 'k2', 'k3', 't3', 'b3', 'm3', 'r3',
];

export function stageExercise(s: Stage): StageExercise {
  return s.exercise ?? 'notes';
}

/** Skills measured in a stage (rhythm uses the 'name' slot for bookkeeping). */
export function stageSkills(s: Stage): Skill[] {
  const ex = stageExercise(s);
  if (ex === 'rhythm') return ['name'];
  if (ex === 'finger') return ['finger'];
  if (ex === 'interval') return ['interval'];
  return ['name', 'key'];
}

/** Stage titles that are note ranges ("C4–G4") are set left-to-right. */
export function ltrTitle(s: Stage): boolean {
  return /^[A-G]\d/.test(s.title);
}

/** Stages whose progress is measured note by note (the others by whole sessions). */
export function itemBased(s: Stage): boolean {
  const ex = stageExercise(s);
  return ex === 'notes' || ex === 'grand' || ex === 'finger';
}

export function stageById(id: string): Stage {
  const s = STAGES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown stage ${id}`);
  return s;
}

const SHARPABLE = new Set(['C', 'D', 'F', 'G', 'A']);
const FLATTABLE = new Set(['D', 'E', 'G', 'A', 'B']);

export function itemsForRanges(ranges: StageRange[]): StageItem[] {
  return ranges.flatMap((r) => {
    let naturals = naturalRange(r.from, r.to);
    if (r.only) naturals = naturals.filter((p) => r.only!.includes(`${p.letter}${p.octave}`));
    if (r.key) return naturals.map((n) => ({ clef: r.clef, pitch: applyKey(n, r.key), keySig: r.key }));
    if (!r.accidentals) return naturals.map((pitch) => ({ clef: r.clef, pitch }));
    const lo = midi(parsePitch(r.from));
    const hi = midi(parsePitch(r.to));
    const out: StageItem[] = [];
    for (const n of naturals) {
      out.push({ clef: r.clef, pitch: n });
      const sharp: Pitch = { ...n, accidental: 1 };
      const flat: Pitch = { ...n, accidental: -1 };
      if (SHARPABLE.has(n.letter) && midi(sharp) <= hi) out.push({ clef: r.clef, pitch: sharp });
      if (FLATTABLE.has(n.letter) && midi(flat) >= lo) out.push({ clef: r.clef, pitch: flat });
    }
    return out.sort((a, b) => diatonic(a.pitch) - diatonic(b.pitch) || a.pitch.accidental - b.pitch.accidental);
  });
}

export function stageItems(stage: Stage): StageItem[] {
  return itemsForRanges(stage.ranges);
}
