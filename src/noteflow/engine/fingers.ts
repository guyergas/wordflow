// Hands and fingers: the C five-finger position for each hand.
// Right hand (treble): thumb on C4 … little finger on G4. Left hand (bass): little finger on C3 … thumb on G3.

import { Clef, diatonic, parsePitch, Pitch } from '../music/pitch';
import type { ErrorType } from '../storage/types';

export type Hand = 'right' | 'left';

export const FINGER_NAMES = ['', 'אגודל', 'אצבע', 'אמה', 'קמיצה', 'זרת'];

export const handFor = (clef: Clef): Hand => (clef === 'treble' ? 'right' : 'left');
export const HAND_NAME: Record<Hand, string> = { right: 'יד ימין', left: 'יד שמאל' };

const RIGHT_C = diatonic(parsePitch('C4'));
const LEFT_C = diatonic(parsePitch('C3'));

/** Finger number (1–5) for a note in the C position of the hand that reads this clef; null outside the position. */
export function fingerFor(p: Pitch, clef: Clef): number | null {
  if (p.accidental !== 0) return null;
  if (clef === 'treble') {
    const d = diatonic(p) - RIGHT_C;
    return d >= 0 && d <= 4 ? d + 1 : null;
  }
  const d = diatonic(p) - LEFT_C;
  return d >= 0 && d <= 4 ? 5 - d : null;
}

/** Fingers for a whole melody, or null if it leaves the five-finger position. */
export function melodyFingers(pitches: (Pitch | null)[], clef: Clef): (number | undefined)[] | null {
  const out: (number | undefined)[] = [];
  for (const p of pitches) {
    if (!p) { out.push(undefined); continue; }
    const f = fingerFor(p, clef);
    if (f == null) return null;
    out.push(f);
  }
  return out;
}

export function evaluateFinger(p: Pitch, clef: Clef, answer: number | null): { correct: boolean; error?: ErrorType } {
  if (answer == null) return { correct: false, error: 'timeout' };
  const f = fingerFor(p, clef);
  if (f === answer) return { correct: true };
  if (f != null && Math.abs(f - answer) === 1) return { correct: false, error: 'adjacent' };
  return { correct: false, error: 'other' };
}

export function explainFinger(p: Pitch, clef: Clef): string {
  const f = fingerFor(p, clef);
  const hand = handFor(clef);
  if (f == null) return '';
  const where = hand === 'right' ? 'האגודל על C4, וכל אצבע תו אחד למעלה' : 'הזרת על C3, וכל אצבע תו אחד למעלה עד האגודל על G3';
  return `${p.letter}${p.octave} מנוגן באצבע ${f} (${FINGER_NAMES[f]}) של ${HAND_NAME[hand]} — ${where}.`;
}
