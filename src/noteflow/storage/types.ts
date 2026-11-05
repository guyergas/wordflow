import type { Clef, KeySig, Letter } from '../music/pitch';
import type { Skill } from '../engine/curriculum';

export type Mode = 'practice' | 'test';

export type ErrorType =
  | 'adjacent'   // neighbouring note (one step off)
  | 'clef'       // read in the other clef
  | 'octave'     // right letter, wrong octave (keyboard)
  | 'accidental' // right letter, wrong ♯/♭/natural
  | 'direction'  // interval: right size, wrong direction
  | 'timeout'    // no answer in time
  | 'other';

/** Raw attempt — never mutated; all metrics are derived from these. */
export interface Attempt {
  id?: number;
  sessionId: string;
  ts: number;
  skill: Skill;
  clef: Clef;
  pitch: string;            // pitchId e.g. "C4"
  answer: string | null;    // letter (name skill) or pitchId (key skill); null = timeout
  correct: boolean;
  rtMs: number | null;
  timeLimitMs: number | null;
  mode: Mode;
  hints: number;
  /** The note was heard (auto-play or replay) before answering — counts for accuracy, not as proof of fluent reading. */
  heard?: boolean;
  error?: ErrorType;
  /** Extra context: the interval read ("C4>E4"), the key signature, the input device. */
  meta?: string;
}

export type Exercise = 'notes' | 'sequence' | 'rhythm' | 'listen' | 'interval' | 'grand' | 'playalong' | 'symbols';
export type MelodyContent = 'known' | 'original' | 'mixed';

export interface SessionConfig {
  kind: 'recommended' | 'stage-practice' | 'stage-test' | 'free' | 'daily' | 'mistakes';
  /** Default 'notes' (single notes). */
  exercise?: Exercise;
  mode: Mode;
  skill: Skill;
  stageId?: string;
  /** For free practice. */
  clefs?: Clef[];
  ranges?: { clef: Clef; from: string; to: string; accidentals?: boolean; key?: KeySig; only?: string[] }[];
  /** Notes: always show the nearest landmark note and explain answers by counting from it. */
  anchors?: boolean;
  /** Intervals: largest interval asked (2–5). */
  maxInterval?: number;
  /** Grand staff: pairs of notes, a melody over a bass line, or a song (songIds). */
  grandMode?: 'pairs' | 'melody' | 'song';
  count: number;
  timeLimitMs: number | null;  // null = unlimited
  adaptiveTime?: boolean;
  autoAdvance: boolean;
  /** Sequence: notes visible ahead including the current one (0 = whole line, -1 = to the end of the bar). */
  look?: number;
  content?: MelodyContent;
  /** Rhythm. */
  rhythmLevel?: number;
  bpm?: number;
  metronome?: boolean;
  /** Finish at the next question boundary once this much time has passed (daily plan blocks). */
  timeBudgetMs?: number;
  /** Part of the 10-minute daily plan. */
  daily?: { index: number; total: number };
  /** Sequence: read these melodies (songbook "read now"). */
  songIds?: string[];
  /** Couple challenge: same notes for everyone today. */
  couple?: boolean;
  /** Weekly reading check: same conditions every week. */
  weeklyCheck?: boolean;
  /** Rhythm: fixed bars instead of generated ones (e.g. the rhythm of a song). */
  rhythmBars?: string[];
}

export interface RhythmSummary {
  onsets: number;
  hits: number;
  onTime: number;
  misses: number;
  extras: number;
  restTaps: number;
  /** Mean signed offset of hits (negative = early), ms. */
  meanOffsetMs: number | null;
  meanAbsOffsetMs: number | null;
  timingAccuracy: number;
  bpm: number;
  level: number;
}

export interface SessionSummary {
  total: number;
  correct: number;
  misses: number;
  accuracy: number;
  meanRt: number | null;
  medianRt: number | null;
  /** Difficulty-relative score 0–100 (accuracy weighted by speed vs. the time target). */
  score: number;
  passed?: boolean;
  wrongNotes: { key: string; count: number }[];
  slowNotes: { key: string; medianRt: number }[];
  rhythm?: RhythmSummary;
  /** Sequence sessions: melodies read. */
  melodies?: { id: string; title: string; correct?: number; total?: number }[];
  /** Per-answer correctness, in order (for the shareable result line). */
  marks?: boolean[];
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  config: SessionConfig;
  summary: SessionSummary;
}

export interface Settings {
  name: string;
  theme: 'system' | 'light' | 'dark' | 'evening';
  volume: number;          // 0..1
  feedbackSounds: boolean;
  playNoteOnAnswer: boolean;
  playNoteOnShow: boolean;
  showKeyNames: boolean;
  hintsEnabled: boolean;
  autoAdvance: boolean;
  fluencyTargetMs: number; // mastery speed threshold
  masteryAccuracy: number; // e.g. 0.9
  weeklyGoalDays: number;
  sessionLength: number;   // questions per recommended session
  /** Tap latency compensation measured by calibration (ms, subtracted from tap times). */
  tapOffsetMs: number;
  /** First-run welcome finished. */
  onboarded: boolean;
  /** Display comfort. */
  noteSize: 'normal' | 'large';
  highContrast: boolean;
  reduceMotion: boolean;
  /** Where keyboard answers come from: the on-screen piano, or a real piano (microphone / MIDI) as well. */
  input: 'screen' | 'external';
  /** Switch to the evening look and sound from 20:00 to 06:00. */
  autoEvening: boolean;
  /** Finger numbers above melodies that fit the five-finger position. */
  showFingers: boolean;
  /** Daily reminder (added to the calendar by the learner). */
  reminderTime: string;
  reminderDays: number[];
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'system',
  volume: 0.8,
  feedbackSounds: true,
  playNoteOnAnswer: true,
  playNoteOnShow: true,
  showKeyNames: false,
  hintsEnabled: true,
  autoAdvance: true,
  fluencyTargetMs: 2000,
  masteryAccuracy: 0.9,
  weeklyGoalDays: 4,
  sessionLength: 20,
  tapOffsetMs: 0,
  onboarded: false,
  noteSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  input: 'screen',
  autoEvening: false,
  showFingers: true,
  reminderTime: '20:30',
  reminderDays: [0, 1, 2, 3, 4, 5, 6],
};

export interface Favorite {
  id: string;
  name: string;
  /** FreeOptions (engine/sessions) */
  options: unknown;
  createdAt: number;
}

export type AnswerLetter = Letter;

/** An unfinished session saved after every answer, so a reload or an app switch never loses it. */
export interface PendingSession {
  /** SessionPlan (engine/sessions) */
  plan: unknown;
  sessionId: string;
  startedAt: number;
  savedAt: number;
  done: number;
  total: number;
  /** Exercise-specific progress (answers so far, melodies, rhythm rounds). */
  state: unknown;
}

/** A melody Dikla wrote herself (served back later as reading practice). */
export interface MyMelody {
  id: string;
  title: string;
  clef: 'treble' | 'bass';
  /** pitch ids, quarter notes */
  notes: string[];
  createdAt: number;
}
