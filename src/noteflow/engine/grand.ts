// Two-hand reading on the grand staff: pieces made of notes in both staves, answered in reading order
// (by time; at the same moment, left hand first — bottom to top, like reading a chord).

import { Clef, diatonic, naturalRange, Pitch, pitchId } from '../music/pitch';
import { generateMelody, MelodyNote, parseNotes, SONG_DEFS } from '../music/songs';
import { bassLine, chordsForSong, harmonize } from './accomp';
import type { ScoreNote } from '../notation/Score';
import type { GrandBar } from '../notation/GrandScore';
import { pitchFromMidi } from './exercise';

export interface GNote {
  clef: Clef;
  /** null = rest */
  pitch: Pitch | null;
  beats: number;
  /** Start, in beats from the beginning of the piece. */
  at: number;
}

export interface GrandPiece {
  id: string;
  title: string;
  notes: GNote[];
  bars: number;
}

export interface GrandRange { clef: Clef; from: string; to: string }

/** Indexes of the notes to answer, in reading order. */
export function readingOrder(p: GrandPiece): number[] {
  return p.notes
    .map((n, i) => ({ n, i }))
    .filter((x) => x.n.pitch)
    .sort((a, b) => a.n.at - b.n.at || (a.n.clef === b.n.clef ? diatonic(a.n.pitch!) - diatonic(b.n.pitch!) : a.n.clef === 'bass' ? -1 : 1))
    .map((x) => x.i);
}

function rangeOf(ranges: GrandRange[], clef: Clef): Pitch[] {
  const r = ranges.find((x) => x.clef === clef) ?? (clef === 'treble' ? { clef, from: 'C4', to: 'G4' } : { clef, from: 'C3', to: 'G3' });
  return naturalRange(r.from, r.to);
}

/** Pairs: a half note in each hand, two per bar. */
export function grandPairs(ranges: GrandRange[], rng: () => number, events = 8, n = 0): GrandPiece {
  const tr = rangeOf(ranges, 'treble');
  const bs = rangeOf(ranges, 'bass');
  const notes: GNote[] = [];
  let last = '';
  for (let e = 0; e < events; e++) {
    let t: Pitch;
    let b: Pitch;
    let k: string;
    let guard = 0;
    do {
      t = tr[Math.floor(rng() * tr.length)];
      b = bs[Math.floor(rng() * bs.length)];
      k = pitchId(t) + pitchId(b);
    } while ((k === last || pitchId(t) === pitchId(b)) && guard++ < 20);
    last = k;
    notes.push({ clef: 'bass', pitch: b, beats: 2, at: e * 2 });
    notes.push({ clef: 'treble', pitch: t, beats: 2, at: e * 2 });
  }
  return { id: `pairs-${n}-${last}`, title: 'זוגות', notes, bars: Math.ceil(events / 2) };
}

function fromMelody(id: string, title: string, rh: MelodyNote[], bass: { midi: number; at: number; beats: number }[]): GrandPiece {
  const notes: GNote[] = [];
  let at = 0;
  for (const m of rh) { notes.push({ clef: 'treble', pitch: m.pitch, beats: m.beats, at }); at += m.beats; }
  for (const b of bass) notes.push({ clef: 'bass', pitch: pitchFromMidi(b.midi), beats: b.beats, at: b.at });
  return { id, title, notes, bars: Math.ceil(at / 4) };
}

/** A melody in the right hand over long bass notes in the left. */
export function grandMelody(ranges: GrandRange[], rng: () => number, n = 0): GrandPiece {
  const t = ranges.find((x) => x.clef === 'treble') ?? { clef: 'treble' as Clef, from: 'C4', to: 'C5' };
  const m = generateMelody('treble', t.from, t.to, rng, 4, n);
  return fromMelody(m.id, m.title, m.rhythmic, bassLine(harmonize(m.rhythmic)));
}

/** Ode to Joy with both hands: the melody, and C3 / G3 in the left hand (no hand movement needed). */
export function odeHands(): GrandPiece {
  const def = SONG_DEFS.find((d) => d.id === 'ode')!;
  const rh = parseNotes(def.notes);
  // Roots land on C3 and G3: the little finger and the thumb of the left hand in C position.
  return fromMelody('ode-hands', def.title, rh, bassLine(chordsForSong('ode', rh)));
}

/** Bars [from, to) of a piece as grand-staff bars, each voice filled with rests where empty. */
export function piecesBars(p: GrandPiece, from: number, to: number, roleOf: (noteIndex: number) => ScoreNote['role'], fingers?: (i: number) => number | undefined): GrandBar[] {
  const out: GrandBar[] = [];
  for (let b = from; b < to; b++) {
    const bar: GrandBar = { treble: [], bass: [] };
    for (const clef of ['treble', 'bass'] as Clef[]) {
      const voice = p.notes.map((n, i) => ({ n, i })).filter((x) => x.n.clef === clef && x.n.at >= b * 4 - 1e-9 && x.n.at < (b + 1) * 4 - 1e-9);
      let pos = b * 4;
      const list: ScoreNote[] = [];
      for (const { n, i } of voice) {
        if (n.at > pos + 1e-9) { list.push(...restsFor(n.at - pos)); }
        list.push({ pitch: n.pitch, beats: n.beats, role: roleOf(i), finger: fingers?.(i) });
        pos = n.at + n.beats;
      }
      if (pos < (b + 1) * 4 - 1e-9) list.push(...restsFor((b + 1) * 4 - pos));
      bar[clef] = list;
    }
    out.push(bar);
  }
  return out;
}

function restsFor(beats: number): ScoreNote[] {
  const out: ScoreNote[] = [];
  let left = beats;
  for (const v of [4, 2, 1, 0.5, 0.25]) while (left >= v - 1e-9) { out.push({ pitch: null, beats: v }); left -= v; }
  return out;
}

/** Number of notes to answer in a piece. */
export const pieceLength = (p: GrandPiece) => p.notes.filter((n) => n.pitch).length;
