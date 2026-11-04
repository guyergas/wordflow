// Music Model — pitch, clef and staff geometry.
// Single source of truth: notation, audio and answer evaluation all derive from here.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];
export type Accidental = -1 | 0 | 1; // ♭ natural #
export type Clef = 'treble' | 'bass';

export interface Pitch {
  letter: Letter;
  octave: number;
  accidental: Accidental;
}

const SEMITONE: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Diatonic step index: C0 = 0, D0 = 1 … C4 = 28. Independent of accidentals. */
export function diatonic(p: Pick<Pitch, 'letter' | 'octave'>): number {
  return p.octave * 7 + LETTERS.indexOf(p.letter);
}

export function fromDiatonic(d: number, accidental: Accidental = 0): Pitch {
  const octave = Math.floor(d / 7);
  return { letter: LETTERS[((d % 7) + 7) % 7], octave, accidental };
}

/** MIDI number. Middle C (C4) = 60. Cb/B# cross octaves correctly. */
export function midi(p: Pitch): number {
  return (p.octave + 1) * 12 + SEMITONE[p.letter] + p.accidental;
}

/** Parse "C4", "F#3", "Bb2". */
export function parsePitch(s: string): Pitch {
  const m = /^([A-G])(#|b|♯|♭)?(-?\d)$/.exec(s.trim());
  if (!m) throw new Error(`Bad pitch: ${s}`);
  const acc: Accidental = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  return { letter: m[1] as Letter, octave: Number(m[3]), accidental: acc };
}

export function pitchName(p: Pitch, withOctave = true): string {
  const acc = p.accidental === 1 ? '#' : p.accidental === -1 ? '♭' : '';
  return `${p.letter}${acc}${withOctave ? p.octave : ''}`;
}

export function pitchId(p: Pitch): string {
  const acc = p.accidental === 1 ? '#' : p.accidental === -1 ? 'b' : '';
  return `${p.letter}${acc}${p.octave}`;
}

/** Bottom staff line of each clef. Treble: E4. Bass: G2. */
export const BOTTOM_LINE: Record<Clef, Pitch> = {
  treble: { letter: 'E', octave: 4, accidental: 0 },
  bass: { letter: 'G', octave: 2, accidental: 0 },
};

/**
 * Staff position in diatonic steps from the bottom line.
 * Even = on a line, odd = in a space. 0..8 is inside the staff (5 lines).
 */
export function staffPosition(p: Pitch, clef: Clef): number {
  return diatonic(p) - diatonic(BOTTOM_LINE[clef]);
}

export function pitchAtPosition(pos: number, clef: Clef): Pitch {
  return fromDiatonic(diatonic(BOTTOM_LINE[clef]) + pos);
}

export function isOnLine(p: Pitch, clef: Clef): boolean {
  return staffPosition(p, clef) % 2 === 0;
}

/** Positions (even) of the ledger lines a note needs. */
export function ledgerLines(p: Pitch, clef: Clef): number[] {
  const pos = staffPosition(p, clef);
  const out: number[] = [];
  if (pos <= -2) for (let l = -2; l >= pos; l -= 2) out.push(l);
  if (pos >= 10) for (let l = 10; l <= pos; l += 2) out.push(l);
  return out;
}

/** Human-readable location in Hebrew, e.g. "הקו השני מלמטה", "הרווח השלישי", "קו עזר אחד מתחת". */
export function describePosition(p: Pitch, clef: Clef): string {
  const pos = staffPosition(p, clef);
  const ord = ['הראשון', 'השני', 'השלישי', 'הרביעי', 'החמישי'];
  if (pos >= 0 && pos <= 8) {
    return pos % 2 === 0 ? `הקו ${ord[pos / 2]} מלמטה` : `הרווח ${ord[(pos - 1) / 2]} מלמטה`;
  }
  if (pos === -1) return 'מתחת לקו התחתון';
  if (pos === 9) return 'מעל הקו העליון';
  const n = ledgerLines(p, clef).length;
  const where = pos < 0 ? 'מתחת לחמשה' : 'מעל החמשה';
  const lines = n === 1 ? 'קו עזר אחד' : `${n} קווי עזר`;
  return pos % 2 === 0 ? `על ${lines} ${where}` : `${lines} ${where}, ברווח`;
}

/** Inclusive diatonic range of natural pitches. */
export function naturalRange(from: string, to: string): Pitch[] {
  const a = diatonic(parsePitch(from));
  const b = diatonic(parsePitch(to));
  const out: Pitch[] = [];
  for (let d = Math.min(a, b); d <= Math.max(a, b); d++) out.push(fromDiatonic(d));
  return out;
}

/** VexFlow key string, e.g. "c/4", "f#/3". */
export function vexKey(p: Pitch): string {
  const acc = p.accidental === 1 ? '#' : p.accidental === -1 ? 'b' : '';
  return `${p.letter.toLowerCase()}${acc}/${p.octave}`;
}

// ---------- Key signatures ----------

export type KeySig = 'C' | 'G' | 'D' | 'F' | 'Bb';

export const KEY_SIGS: Record<KeySig, { name: string; sharps: Letter[]; flats: Letter[] }> = {
  C: { name: 'C מז׳ור', sharps: [], flats: [] },
  G: { name: 'G מז׳ור', sharps: ['F'], flats: [] },
  D: { name: 'D מז׳ור', sharps: ['F', 'C'], flats: [] },
  F: { name: 'F מז׳ור', sharps: [], flats: ['B'] },
  Bb: { name: 'B♭ מז׳ור', sharps: [], flats: ['B', 'E'] },
};

/** The accidental the key signature gives a letter (in every octave). */
export function keyAccidental(key: KeySig | undefined, letter: Letter): Accidental {
  if (!key) return 0;
  const k = KEY_SIGS[key];
  return k.sharps.includes(letter) ? 1 : k.flats.includes(letter) ? -1 : 0;
}

/** A natural staff position read in a key: F in G major is F♯. */
export function applyKey(p: Pitch, key: KeySig | undefined): Pitch {
  return { ...p, accidental: keyAccidental(key, p.letter) };
}

/** Human description of what the key signature does to a letter, e.g. "♯ על F". */
export function keySigText(key: KeySig): string {
  const k = KEY_SIGS[key];
  if (k.sharps.length) return k.sharps.map((l) => `♯ על ${l}`).join(' ו־');
  if (k.flats.length) return k.flats.map((l) => `♭ על ${l}`).join(' ו־');
  return 'בלי סימנים';
}

/**
 * Which accidental sign to print before a note: null = none. Within a bar an accidental holds until the
 * barline (pass the same `bar` map for every note of the bar); the key signature holds everywhere.
 */
export function accidentalSign(p: Pitch, key: KeySig | undefined, bar?: Map<string, Accidental>): '#' | 'b' | 'n' | null {
  const k = `${p.letter}${p.octave}`;
  const expected = bar?.get(k) ?? keyAccidental(key, p.letter);
  if (p.accidental === expected) return null;
  bar?.set(k, p.accidental);
  return p.accidental === 1 ? '#' : p.accidental === -1 ? 'b' : 'n';
}

/** Equal-tempered frequency, A4 = 440Hz. */
export function frequency(p: Pitch): number {
  return 440 * Math.pow(2, (midi(p) - 69) / 12);
}

/** The clef a note is usually written in: Middle C and up in treble, below it in bass. */
export function clefForMidi(m: number): Clef {
  return m >= 60 ? 'treble' : 'bass';
}
