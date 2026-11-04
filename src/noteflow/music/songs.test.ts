import { describe, expect, it } from 'vitest';
import { midi, parsePitch, pitchId } from './pitch';
import { generateMelody, knownSongsFor, parseNotes, pickMelodies, SONG_DEFS, toQuarters, validateBars } from './songs';

function seeded(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

describe('song library', () => {
  it('every known song has complete 4/4 bars, a source and a public-domain license', () => {
    for (const d of SONG_DEFS) {
      expect(() => validateBars(parseNotes(d.notes)), d.id).not.toThrow();
      expect(d.source.length).toBeGreaterThan(5);
      expect(d.license).toMatch(/Public Domain/);
    }
  });

  it('opening of Ode to Joy and Twinkle are correct', () => {
    const ode = parseNotes(SONG_DEFS.find((d) => d.id === 'ode')!.notes).map((n) => pitchId(n.pitch!));
    expect(ode.slice(0, 8)).toEqual(['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4']);
    const tw = parseNotes(SONG_DEFS.find((d) => d.id === 'twinkle')!.notes).map((n) => pitchId(n.pitch!));
    expect(tw.slice(0, 7)).toEqual(['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4']);
  });

  it('identification versions are quarters with full bars and the same pitches', () => {
    for (const d of SONG_DEFS) {
      const notes = parseNotes(d.notes);
      const q = toQuarters(notes);
      expect(q.every((n) => n.beats === 1)).toBe(true);
      expect(q.length % 4).toBe(0);
      expect(q.filter((n) => n.pitch).map((n) => pitchId(n.pitch!))).toEqual(notes.filter((n) => n.pitch).map((n) => pitchId(n.pitch!)));
    }
  });

  it('songs fit the requested range, an octave lower for the bass clef', () => {
    const treble = knownSongsFor('treble', 'C4', 'C5');
    expect(treble.length).toBe(SONG_DEFS.length);
    const bass = knownSongsFor('bass', 'C3', 'C4');
    expect(bass.length).toBe(SONG_DEFS.length);
    for (const m of bass) {
      for (const n of m.quarters) if (n.pitch) expect(midi(n.pitch)).toBeLessThanOrEqual(midi(parsePitch('C4')));
    }
  });

  it('generated melodies stay in range, start and end on C, and have complete bars', () => {
    for (let s = 1; s < 60; s++) {
      for (const [clef, from, to] of [['treble', 'C4', 'C5'], ['bass', 'C3', 'C4'], ['treble', 'A3', 'C6']] as const) {
        const m = generateMelody(clef, from, to, seeded(s));
        validateBars(m.rhythmic);
        const ps = m.rhythmic.map((n) => midi(n.pitch!));
        expect(Math.min(...ps)).toBeGreaterThanOrEqual(midi(parsePitch(from)));
        expect(Math.max(...ps)).toBeLessThanOrEqual(midi(parsePitch(to)));
        expect(m.rhythmic[0].pitch!.letter).toBe('C');
        expect(m.rhythmic[m.rhythmic.length - 1].pitch!.letter).toBe('C');
        expect(m.license).toBe('CC0');
      }
    }
  });

  it('tests can use originals only; recent songs are not repeated first', () => {
    const p = pickMelodies({ clef: 'treble', from: 'C4', to: 'C5', content: 'original', notes: 32, recent: [], rng: seeded(3) });
    expect(p.melodies.every((m) => m.category === 'original')).toBe(true);
    expect(p.total).toBeGreaterThanOrEqual(32);
    const k = pickMelodies({ clef: 'treble', from: 'C4', to: 'C5', content: 'known', notes: 20, recent: ['ode', 'twinkle'], rng: seeded(5) });
    expect(k.melodies[0].id).not.toBe('ode');
    expect(k.melodies[0].id).not.toBe('twinkle');
  });
});
