// Song Library — public-domain melodies (verified, in C) and procedurally generated originals.
// Every melody carries source and license. No copyrighted material and no invented "pop" transcriptions.

import { Clef, diatonic, fromDiatonic, midi, naturalRange, parsePitch, Pitch, pitchId } from './pitch';

export interface MelodyNote {
  /** null = rest */
  pitch: Pitch | null;
  /** Length in quarter-note beats (4/4). */
  beats: number;
}

export interface Melody {
  id: string;
  title: string;
  composer: string;
  source: string;
  license: string;
  category: 'known' | 'original';
  clef: Clef;
  bpm: number;
  /** Musical version with the melody's rhythm. */
  rhythmic: MelodyNote[];
  /** Identification version: every pitch as a quarter, last bar padded with rests. */
  quarters: MelodyNote[];
}

interface SongDef {
  id: string;
  title: string;
  composer: string;
  source: string;
  license: string;
  bpm: number;
  /** "E4:1 D4:0.5 R:1" — pitch:beats, R = rest. */
  notes: string;
}

const PD = 'נחלת הכלל (Public Domain) · עיבוד לימודי של NoteFlow';

/** Melodies in C major, C4–A4. Rhythms are simple educational settings in 4/4. */
export const SONG_DEFS: SongDef[] = [
  {
    id: 'ode', title: 'Ode to Joy', composer: 'L. van Beethoven', bpm: 92, license: PD,
    source: 'Beethoven, Symphony No. 9, Op. 125 (1824), "An die Freude" — melody transposed to C',
    notes: 'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:0.5 D4:2 '
      + 'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:0.5 C4:2',
  },
  {
    id: 'twinkle', title: 'Twinkle, Twinkle, Little Star', composer: 'לחן צרפתי מסורתי', bpm: 96, license: PD,
    source: '"Ah! vous dirai-je, maman" (France, 1761)',
    notes: 'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 '
      + 'G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 '
      + 'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
  },
  {
    id: 'mary', title: 'Mary Had a Little Lamb', composer: 'מסורתי (ארה"ב)', bpm: 100, license: PD,
    source: 'Traditional American melody, 19th century',
    notes: 'E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:2 D4:1 D4:1 D4:2 E4:1 G4:1 G4:2 '
      + 'E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:1 E4:1 D4:1 D4:1 E4:1 D4:1 C4:4',
  },
  {
    id: 'hotcross', title: 'Hot Cross Buns', composer: 'מסורתי (אנגליה)', bpm: 96, license: PD,
    source: 'Traditional English street cry',
    notes: 'E4:1 D4:1 C4:2 E4:1 D4:1 C4:2 C4:0.5 C4:0.5 C4:0.5 C4:0.5 D4:0.5 D4:0.5 D4:0.5 D4:0.5 E4:1 D4:1 C4:2',
  },
  {
    id: 'clairdelune', title: 'Au clair de la lune', composer: 'מסורתי (צרפת)', bpm: 92, license: PD,
    source: 'Traditional French song, 18th century — opening phrase',
    notes: 'C4:1 C4:1 C4:1 D4:1 E4:2 D4:2 C4:1 E4:1 D4:1 D4:1 C4:4 '
      + 'C4:1 C4:1 C4:1 D4:1 E4:2 D4:2 C4:1 E4:1 D4:1 D4:1 C4:4',
  },
  {
    id: 'jingle', title: 'Jingle Bells', composer: 'J. Pierpont (1857)', bpm: 108, license: PD,
    source: 'James Lord Pierpont, "One Horse Open Sleigh" (1857) — chorus',
    notes: 'E4:1 E4:1 E4:2 E4:1 E4:1 E4:2 E4:1 G4:1 C4:1.5 D4:0.5 E4:4 '
      + 'F4:1 F4:1 F4:1.5 F4:0.5 F4:1 E4:1 E4:1 E4:0.5 E4:0.5 E4:1 D4:1 D4:1 E4:1 D4:2 G4:2',
  },
  {
    id: 'london', title: 'London Bridge', composer: 'מסורתי (אנגליה)', bpm: 100, license: PD,
    source: 'Traditional English nursery rhyme',
    notes: 'G4:1.5 A4:0.5 G4:1 F4:1 E4:1 F4:1 G4:2 D4:1 E4:1 F4:2 E4:1 F4:1 G4:2 '
      + 'G4:1.5 A4:0.5 G4:1 F4:1 E4:1 F4:1 G4:2 D4:2 G4:2 E4:1 C4:3',
  },
];

export function parseNotes(s: string): MelodyNote[] {
  return s.trim().split(/\s+/).map((tok) => {
    const [p, b] = tok.split(':');
    return { pitch: p === 'R' ? null : parsePitch(p), beats: Number(b) };
  });
}

/** Throws if bars are not exactly 4 beats or a note crosses a barline. */
export function validateBars(notes: MelodyNote[]): void {
  let pos = 0;
  for (const n of notes) {
    if (![0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].includes(n.beats)) throw new Error(`Unsupported duration ${n.beats}`);
    const inBar = pos % 4;
    if (inBar + n.beats > 4 + 1e-9) throw new Error(`Note crosses a barline at beat ${pos}`);
    pos += n.beats;
  }
  if (Math.abs(pos % 4) > 1e-9) throw new Error(`Last bar is incomplete (${pos} beats)`);
}

export function toQuarters(notes: MelodyNote[]): MelodyNote[] {
  const out: MelodyNote[] = notes.filter((n) => n.pitch).map((n) => ({ pitch: n.pitch, beats: 1 }));
  while (out.length % 4) out.push({ pitch: null, beats: 1 });
  return out;
}

function shift(notes: MelodyNote[], octaves: number): MelodyNote[] {
  return notes.map((n) => ({ ...n, pitch: n.pitch ? { ...n.pitch, octave: n.pitch.octave + octaves } : null }));
}

function rangeOf(notes: MelodyNote[]): [number, number] {
  const ms = notes.filter((n) => n.pitch).map((n) => midi(n.pitch!));
  return [Math.min(...ms), Math.max(...ms)];
}

/** Known songs that fit the range (shifted by whole octaves when needed). */
export function knownSongsFor(clef: Clef, from: string, to: string): Melody[] {
  const lo = midi(parsePitch(from));
  const hi = midi(parsePitch(to));
  const out: Melody[] = [];
  for (const d of SONG_DEFS) {
    const base = parseNotes(d.notes);
    for (const oct of [0, -1, 1, -2]) {
      const notes = shift(base, oct);
      const [a, b] = rangeOf(notes);
      if (a >= lo && b <= hi) {
        out.push({
          id: oct ? `${d.id}@${oct}` : d.id, title: d.title, composer: d.composer, source: d.source, license: d.license,
          category: 'known', clef, bpm: d.bpm, rhythmic: notes, quarters: toQuarters(notes),
        });
        break;
      }
    }
  }
  return out;
}

const ORIGINAL_TITLES = [
  'בוקר בהיר', 'שביל בחורשה', 'גל קטן', 'חלון פתוח', 'צעדים בחול', 'ענן עובר', 'אור של ערב', 'סיבוב בפארק',
  'קפה של שבת', 'רוח קלה', 'מדרגות', 'הדרך הביתה', 'שקיעה בים', 'טיפות', 'כוכב ראשון', 'מנגינה לדיקלה',
];

/**
 * Original melody, generated: mostly steps, some skips, occasional leaps; phrases of 2 bars ending on a half note;
 * starts and ends on C (or the nearest stable note in range).
 */
export function generateMelody(clef: Clef, from: string, to: string, rng: () => number, bars = 4, n = 0): Melody {
  const scale = naturalRange(from, to);
  const lo = diatonic(scale[0]);
  const hi = diatonic(scale[scale.length - 1]);
  const cs = scale.filter((p) => p.letter === 'C').map(diatonic);
  const tonic = cs.length ? cs.reduce((b, c) => (Math.abs(c - (lo + hi) / 2) < Math.abs(b - (lo + hi) / 2) ? c : b)) : lo + Math.floor((hi - lo) / 2);
  const stable = new Set([0, 2, 4].map((k) => (((tonic + k) % 7) + 7) % 7));
  let cur = tonic;
  let lastDir = 0;
  let leapRun = 0;
  const notes: MelodyNote[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const phraseEnd = bar % 2 === 1;
    const lastBar = bar === bars - 1;
    const count = phraseEnd ? 3 : 4;
    for (let i = 0; i < count; i++) {
      if (!(bar === 0 && i === 0)) {
        const isFinal = lastBar && i === count - 1;
        if (isFinal) {
          cur = tonic;
        } else if (lastBar && i === count - 2) {
          // Approach the tonic by step.
          cur = Math.max(lo, Math.min(hi, tonic + (cur >= tonic ? 1 : -1)));
        } else {
          const r = rng();
          let step = r < 0.12 ? 0 : r < 0.67 ? 1 : r < 0.9 ? 2 : r < 0.97 ? 3 : 4;
          let dir = rng() < 0.5 ? -1 : 1;
          if (step >= 2 && leapRun >= 1) step = 1;
          if (step >= 3) dir = -lastDir || dir; // recover after a leap in the other direction
          if (cur + dir * step > hi || cur + dir * step < lo) dir = -dir;
          cur = Math.max(lo, Math.min(hi, cur + dir * step));
          leapRun = step >= 2 ? leapRun + 1 : 0;
          lastDir = step ? dir : lastDir;
          // Phrase ends land on a stable note.
          if (phraseEnd && i === count - 1 && !stable.has(((cur % 7) + 7) % 7)) {
            cur = Math.max(lo, Math.min(hi, cur + (stable.has(((cur + 1) % 7 + 7) % 7) ? 1 : -1)));
          }
        }
      }
      notes.push({ pitch: fromDiatonic(cur), beats: phraseEnd && i === count - 1 ? 2 : 1 });
    }
  }
  const title = ORIGINAL_TITLES[n % ORIGINAL_TITLES.length];
  return {
    id: `orig-${clef}-${notes.map((x) => pitchId(x.pitch!)).join('')}`, title, composer: 'NoteFlow', category: 'original',
    source: 'מנגינה מקורית שנוצרה עבור האפליקציה', license: 'CC0', clef, bpm: 90, rhythmic: notes, quarters: toQuarters(notes),
  };
}

export interface MelodyPick {
  melodies: Melody[];
  /** Notes to answer (rests excluded). */
  total: number;
}

/**
 * Picks melodies until about `notes` pitches are reached. Known songs first that weren't played recently,
 * then originals. Tests use originals only, so they measure reading and not memory.
 */
export function pickMelodies(opts: {
  clef: Clef; from: string; to: string; content: 'known' | 'original' | 'mixed'; notes: number;
  recent: string[]; rng: () => number;
}): MelodyPick {
  const known = opts.content === 'original' ? [] : knownSongsFor(opts.clef, opts.from, opts.to);
  const fresh = known.filter((m) => !opts.recent.includes(m.id.split('@')[0]));
  const stale = known.filter((m) => opts.recent.includes(m.id.split('@')[0]));
  const shuffled = [...shuffle(fresh, opts.rng), ...shuffle(stale, opts.rng)];
  const out: Melody[] = [];
  let total = 0;
  let k = 0;
  let o = Math.floor(opts.rng() * ORIGINAL_TITLES.length);
  while (total < opts.notes) {
    const wantKnown = opts.content === 'known' || (opts.content === 'mixed' && out.length % 2 === 0);
    let m: Melody | undefined = wantKnown ? shuffled[k++] : undefined;
    if (!m && opts.content === 'known' && known.length) m = shuffled[k++ % shuffled.length];
    if (!m) m = generateMelody(opts.clef, opts.from, opts.to, opts.rng, 4, o++);
    out.push(m);
    total += m.quarters.filter((x) => x.pitch).length;
    if (out.length > 12) break;
  }
  return { melodies: out, total };
}

function shuffle<T>(xs: T[], rng: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A known song (any octave fitting the range) or one of my own melodies, by id. */
export function melodyById(id: string, clef: Clef, from: string, to: string, mine: { id: string; title: string; clef: Clef; notes: string[]; createdAt: number }[] = []): Melody | null {
  const own = mine.find((m) => `my-${m.id}` === id || m.id === id);
  if (own) return myMelody(own);
  return knownSongsFor(clef, from, to).find((m) => m.id.split('@')[0] === id.split('@')[0]) ?? knownSongsFor(clef, 'C2', 'C6').find((m) => m.id.split('@')[0] === id.split('@')[0]) ?? null;
}

export function myMelody(m: { id: string; title: string; clef: Clef; notes: string[]; createdAt: number }): Melody {
  const notes: MelodyNote[] = m.notes.map((n) => ({ pitch: parsePitch(n), beats: 1 }));
  while (notes.length % 4) notes.push({ pitch: null, beats: 1 });
  return {
    id: `my-${m.id}`, title: m.title, composer: 'דיקלה', category: 'original', source: `כתבת ב־${new Date(m.createdAt).toLocaleDateString('he-IL')}`,
    license: 'שלך', clef: m.clef, bpm: 90, rhythmic: notes, quarters: notes,
  };
}
