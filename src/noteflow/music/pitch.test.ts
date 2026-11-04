import { describe, expect, it } from 'vitest';
import {
  describePosition, diatonic, fromDiatonic, ledgerLines, midi, naturalRange, parsePitch,
  pitchAtPosition, staffPosition, vexKey, LETTERS,
} from './pitch';

describe('music model', () => {
  it('Middle C is C4 = MIDI 60', () => {
    expect(midi(parsePitch('C4'))).toBe(60);
    expect(midi(parsePitch('A4'))).toBe(69);
    expect(midi(parsePitch('C#4'))).toBe(61);
    expect(midi(parsePitch('Db4'))).toBe(61); // enharmonic sound, different spelling
    expect(parsePitch('Db4').letter).toBe('D');
    expect(midi(parsePitch('Cb4'))).toBe(59);
    expect(midi(parsePitch('B#3'))).toBe(60);
  });

  it('note order is C D E F G A B', () => {
    expect(LETTERS.join('')).toBe('CDEFGAB');
  });

  it('treble clef lines are E4 G4 B4 D5 F5; second line from bottom is G4', () => {
    const lines = [0, 2, 4, 6, 8].map((p) => pitchAtPosition(p, 'treble'));
    expect(lines.map((p) => `${p.letter}${p.octave}`)).toEqual(['E4', 'G4', 'B4', 'D5', 'F5']);
  });

  it('bass clef lines are G2 B2 D3 F3 A3; second line from top is F3', () => {
    const lines = [0, 2, 4, 6, 8].map((p) => pitchAtPosition(p, 'bass'));
    expect(lines.map((p) => `${p.letter}${p.octave}`)).toEqual(['G2', 'B2', 'D3', 'F3', 'A3']);
  });

  it('middle C sits on one ledger line below treble and above bass', () => {
    const c4 = parsePitch('C4');
    expect(staffPosition(c4, 'treble')).toBe(-2);
    expect(ledgerLines(c4, 'treble')).toEqual([-2]);
    expect(staffPosition(c4, 'bass')).toBe(10);
    expect(ledgerLines(c4, 'bass')).toEqual([10]);
  });

  it('ledger lines for D4 (none) and A5 (one) and C6 (two)', () => {
    expect(ledgerLines(parsePitch('D4'), 'treble')).toEqual([]);
    expect(ledgerLines(parsePitch('A5'), 'treble')).toEqual([10]);
    expect(ledgerLines(parsePitch('B5'), 'treble')).toEqual([10]);
    expect(ledgerLines(parsePitch('C6'), 'treble')).toEqual([10, 12]);
    expect(ledgerLines(parsePitch('E2'), 'bass')).toEqual([-2]);
  });

  it('round-trips every pitch C2–C6 through position, diatonic and MIDI', () => {
    for (const clef of ['treble', 'bass'] as const) {
      for (const p of naturalRange('C2', 'C6')) {
        const back = pitchAtPosition(staffPosition(p, clef), clef);
        expect(back).toEqual(p);
        expect(fromDiatonic(diatonic(p))).toEqual(p);
      }
    }
    const midis = naturalRange('C4', 'C5').map(midi);
    expect(midis).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
  });

  it('vex keys', () => {
    expect(vexKey(parsePitch('F#3'))).toBe('f#/3');
    expect(vexKey(parsePitch('C4'))).toBe('c/4');
  });

  it('describes positions without naming the note', () => {
    expect(describePosition(parsePitch('G4'), 'treble')).toBe('הקו השני מלמטה');
    expect(describePosition(parsePitch('F4'), 'treble')).toBe('הרווח הראשון מלמטה');
    expect(describePosition(parsePitch('C4'), 'treble')).toContain('קו עזר אחד');
    expect(describePosition(parsePitch('D4'), 'treble')).toBe('מתחת לקו התחתון');
  });
});
