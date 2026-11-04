// Accompaniment: simple piano harmony (C, F, G) under a melody — bass on beats 1 and 3, chord on 2 and 4.
// Known songs carry hand-checked chords; other melodies are harmonised automatically.

import { midi, Pitch } from '../music/pitch';
import type { MelodyNote } from '../music/songs';

export type ChordName = 'C' | 'F' | 'G' | 'Am' | 'Dm' | 'Em';

const CHORDS: Record<ChordName, { root: number; pcs: number[] }> = {
  C: { root: 0, pcs: [0, 4, 7] },
  F: { root: 5, pcs: [5, 9, 0] },
  G: { root: 7, pcs: [7, 11, 2] },
  Am: { root: 9, pcs: [9, 0, 4] },
  Dm: { root: 2, pcs: [2, 5, 9] },
  Em: { root: 4, pcs: [4, 7, 11] },
};

/** Chords per bar ("F C" = two chords, one per half bar). Melodies in C. */
export const SONG_CHORDS: Record<string, string> = {
  ode: 'C | G | C | G | C | G | C | G C',
  twinkle: 'C | F C | F C | G C | C F | C G | C F | C G | C | F C | F C | G C',
  mary: 'C | C | G | C | C | C | G | C',
  hotcross: 'C | C | C G | C',
  clairdelune: 'C | C G | C G | C | C | C G | C G | C',
  jingle: 'C | C | C | C | F | C | G | G',
  london: 'C | C | G | C | C | C | G | C',
};

export function parseChords(s: string): ChordName[][] {
  return s.split('|').map((b) => b.trim().split(/\s+/) as ChordName[]);
}

const pcOf = (p: Pitch) => ((midi(p) % 12) + 12) % 12;

/** Per bar, the melody notes sounding at beats 0 and 2 (null = rest). */
function halves(notes: MelodyNote[]): (Pitch | null)[][] {
  const total = notes.reduce((a, n) => a + n.beats, 0);
  const at = (beat: number) => {
    let p = 0;
    for (const n of notes) {
      if (beat >= p - 1e-9 && beat < p + n.beats - 1e-9) return n.pitch;
      p += n.beats;
    }
    return null;
  };
  const out: (Pitch | null)[][] = [];
  for (let b = 0; b < Math.ceil(total / 4); b++) out.push([at(b * 4), at(b * 4 + 2)]);
  return out;
}

/** Simple harmoniser: per half bar, the first of C / G / F that contains the melody note; the last bar is C. */
export function harmonize(notes: MelodyNote[]): ChordName[][] {
  const hs = halves(notes);
  let prev: ChordName = 'C';
  return hs.map((pair, b) => {
    if (b === hs.length - 1) {
      const first = pick(pair[0], prev);
      return first === 'C' ? ['C'] : [first, 'C'];
    }
    const a = pick(pair[0], prev);
    const c = pick(pair[1], a);
    prev = c;
    return a === c ? [a] : [a, c];
  });
}

function pick(p: Pitch | null, prev: ChordName): ChordName {
  if (!p) return prev;
  const pc = pcOf(p);
  if (CHORDS[prev].pcs.includes(pc)) return prev;
  for (const c of ['C', 'G', 'F'] as ChordName[]) if (CHORDS[c].pcs.includes(pc)) return c;
  return prev;
}

export function chordsForSong(id: string | undefined, notes: MelodyNote[]): ChordName[][] {
  const base = id?.split('@')[0];
  if (base && SONG_CHORDS[base]) return parseChords(SONG_CHORDS[base]);
  return harmonize(notes);
}

export interface NoteEvent {
  midi: number;
  /** Start, in beats from the beginning. */
  at: number;
  beats: number;
  velocity: number;
}

/**
 * Left-hand pattern: bass root (octave 2) on beats 1 and 3, a close chord (C3–B3) on beats 2 and 4.
 * `octave` shifts everything (−1 for a melody in the bass clef).
 */
export function accompaniment(chords: ChordName[][], octave = 0): NoteEvent[] {
  const out: NoteEvent[] = [];
  chords.forEach((bar, b) => {
    for (let beat = 0; beat < 4; beat++) {
      const ch = CHORDS[bar.length === 2 && beat >= 2 ? bar[1] : bar[0]];
      const at = b * 4 + beat;
      const o = octave * 12;
      if (beat % 2 === 0) {
        out.push({ midi: 36 + ch.root + o, at, beats: 1, velocity: 0.42 });
      } else {
        for (const pc of ch.pcs) out.push({ midi: 48 + pc + o, at, beats: 0.8, velocity: 0.22 });
      }
    }
  });
  return out;
}

export function melodyEvents(notes: MelodyNote[], velocity = 0.8): NoteEvent[] {
  const out: NoteEvent[] = [];
  let at = 0;
  for (const n of notes) {
    if (n.pitch) out.push({ midi: midi(n.pitch), at, beats: n.beats, velocity });
    at += n.beats;
  }
  return out;
}

/** Bass notes for the left hand of a grand-staff piece: one per chord (root, in C3–G3 where possible). */
export function bassLine(chords: ChordName[][]): { midi: number; at: number; beats: number }[] {
  const out: { midi: number; at: number; beats: number }[] = [];
  chords.forEach((bar, b) => {
    if (bar.length === 1) out.push({ midi: 48 + CHORDS[bar[0]].root, at: b * 4, beats: 4 });
    else bar.forEach((c, i) => out.push({ midi: 48 + CHORDS[c].root, at: b * 4 + i * 2, beats: 2 }));
  });
  return out;
}
