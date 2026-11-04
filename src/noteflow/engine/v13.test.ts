import { describe, expect, it } from 'vitest';
import { detectPitch, freqToMidi, OnsetTracker } from '../audio/pitch-detect';
import { accidentalSign, applyKey, Accidental, midi, parsePitch, pitchId } from '../music/pitch';
import { parseNotes, SONG_DEFS } from '../music/songs';
import { accompaniment, bassLine, chordsForSong, harmonize, parseChords, SONG_CHORDS } from './accomp';
import { monthCard } from './card';
import { itemBased, itemsForRanges, RECOMMENDED_ORDER, stageById, stageExercise, stageSkills, STAGES } from './curriculum';
import { evaluateName, explain, Generator } from './exercise';
import { evaluateFinger, fingerFor, melodyFingers } from './fingers';
import { grandMelody, grandPairs, odeHands, piecesBars, readingOrder } from './grand';
import { evaluateInterval, intervalQuestion } from './intervals';
import { googleCalendarUrl, reminderIcs, rrule } from './reminder';
import { stagePractice, stageTest } from './sessions';
import { recommend, buildIndex, stageProgress } from './stats';
import { symbolQuiz, SYMBOLS } from './symbols';
import { effectiveTheme } from '../state/store';
import { DEFAULT_SETTINGS, type Attempt, type SessionRecord } from '../storage/types';

const S = DEFAULT_SETTINGS;
const p = parsePitch;

describe('key signatures and accidental signs', () => {
  it('applies the key to naturals', () => {
    expect(pitchId(applyKey(p('F4'), 'G'))).toBe('F#4');
    expect(pitchId(applyKey(p('B3'), 'F'))).toBe('Bb3');
    expect(pitchId(applyKey(p('E4'), 'Bb'))).toBe('Eb4');
    expect(pitchId(applyKey(p('C5'), 'D'))).toBe('C#5');
    expect(pitchId(applyKey(p('A4'), 'G'))).toBe('A4');
  });
  it('prints a sign only when the note differs from the key or from earlier in the bar', () => {
    expect(accidentalSign(p('F#4'), 'G')).toBeNull();
    expect(accidentalSign(p('F4'), 'G')).toBe('n');
    expect(accidentalSign(p('F#4'), undefined)).toBe('#');
    const bar = new Map<string, Accidental>();
    expect(accidentalSign(p('F#4'), undefined, bar)).toBe('#');
    expect(accidentalSign(p('F#4'), undefined, bar)).toBeNull(); // holds to the barline
    expect(accidentalSign(p('F4'), undefined, bar)).toBe('n');
    expect(accidentalSign(p('F#5'), undefined, bar)).toBe('#'); // other octave
  });
  it('key stages carry the key on every item, and answers need the ♯/♭', () => {
    const items = itemsForRanges(stageById('k1').ranges);
    expect(items.every((i) => i.keySig === 'G')).toBe(true);
    expect(items.map((i) => pitchId(i.pitch))).toContain('F#4');
    expect(items.map((i) => pitchId(i.pitch))).not.toContain('F4');
    const q = { n: 0, skill: 'name' as const, clef: 'treble' as const, pitch: p('F#4'), timeLimitMs: null, keySig: 'G' as const };
    expect(evaluateName(q, 'F#').correct).toBe(true);
    const ev = evaluateName(q, 'F');
    expect(ev).toEqual({ correct: false, error: 'accidental' });
    expect(explain(q, ev.error)).toContain('סימן הסולם');
  });
  it('the generator passes the key signature to the question', () => {
    const pool = itemsForRanges(stageById('k2').ranges).map((i) => ({ ...i, skill: 'name' as const }));
    const g = new Generator({ mode: 'practice', count: 5, pool, timeLimitMs: null, adaptiveTime: false, idx: new Map(), settings: S, rng: () => 0.3 });
    expect(g.next([]).keySig).toBe('F');
  });
  it('landmark stage holds only the landmarks', () => {
    const ids = itemsForRanges(stageById('l1').ranges).map((i) => `${i.clef}:${pitchId(i.pitch)}`);
    expect(ids.sort()).toEqual(['bass:C3', 'bass:C4', 'bass:F3', 'treble:C4', 'treble:C5', 'treble:G4'].sort());
  });
});

describe('curriculum v1.3', () => {
  it('every stage is in the order once, prerequisites exist and come earlier', () => {
    expect(new Set(RECOMMENDED_ORDER).size).toBe(RECOMMENDED_ORDER.length);
    expect([...RECOMMENDED_ORDER].sort()).toEqual(STAGES.map((s) => s.id).sort());
    for (const s of STAGES) for (const a of s.after) expect(RECOMMENDED_ORDER.indexOf(a)).toBeLessThan(RECOMMENDED_ORDER.indexOf(s.id));
  });
  it('builds practice and test plans for every stage and skill', () => {
    for (const s of STAGES) {
      for (const sk of stageSkills(s)) {
        const pr = stagePractice(s.id, sk, S);
        const te = stageTest(s.id, sk, S);
        expect(pr.config.skill).toBe(sk);
        expect(te.config.mode).toBe('test');
        if (stageExercise(s) === 'notes' || stageExercise(s) === 'finger') expect(pr.pool.length).toBeGreaterThan(0);
      }
    }
    expect(stagePractice('l2', 'name', S).config.anchors).toBe(true);
    expect(stagePractice('i2', 'interval', S).config.maxInterval).toBe(5);
    expect(stageTest('g1', 'key', S).config.exercise).toBe('grand');
  });
  it('finger and interval stages measure their own skill', () => {
    expect(stageSkills(stageById('h1'))).toEqual(['finger']);
    expect(stageSkills(stageById('i1'))).toEqual(['interval']);
    expect(itemBased(stageById('g1'))).toBe(true);
    expect(itemBased(stageById('i1'))).toBe(false);
  });
  it('a new learner is still sent to t1 first', () => {
    expect(recommend(new Map(), [], S).stageId).toBe('t1');
  });
  it('finger stage progress comes from finger attempts', () => {
    const attempts: Attempt[] = [];
    let ts = 1;
    for (const n of ['C4', 'D4', 'E4', 'F4', 'G4']) for (let i = 0; i < 6; i++) attempts.push({ sessionId: 'x', ts: ts++, skill: 'finger', clef: 'treble', pitch: n, answer: '1', correct: true, rtMs: 900, timeLimitMs: null, mode: 'practice', hints: 0 });
    const idx = buildIndex(attempts, S);
    expect(stageProgress(stageById('h1'), 'finger', idx, [], S).status).toBe('ready');
  });
});

describe('fingers', () => {
  it('C position in each hand', () => {
    expect(['C4', 'D4', 'E4', 'F4', 'G4'].map((n) => fingerFor(p(n), 'treble'))).toEqual([1, 2, 3, 4, 5]);
    expect(['C3', 'D3', 'E3', 'F3', 'G3'].map((n) => fingerFor(p(n), 'bass'))).toEqual([5, 4, 3, 2, 1]);
    expect(fingerFor(p('A4'), 'treble')).toBeNull();
    expect(fingerFor(p('F#4'), 'treble')).toBeNull();
  });
  it('melodies inside the position get fingers; others none', () => {
    const ode = parseNotes(SONG_DEFS.find((d) => d.id === 'ode')!.notes);
    expect(melodyFingers(ode.map((n) => n.pitch), 'treble')?.slice(0, 4)).toEqual([3, 3, 4, 5]);
    const twinkle = parseNotes(SONG_DEFS.find((d) => d.id === 'twinkle')!.notes);
    expect(melodyFingers(twinkle.map((n) => n.pitch), 'treble')).toBeNull();
  });
  it('evaluates', () => {
    expect(evaluateFinger(p('E4'), 'treble', 3).correct).toBe(true);
    expect(evaluateFinger(p('E4'), 'treble', 4).error).toBe('adjacent');
    expect(evaluateFinger(p('E4'), 'treble', null).error).toBe('timeout');
  });
});

describe('intervals', () => {
  it('questions stay inside the range and respect the size limit', () => {
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 300; i++) {
      const q = intervalQuestion([{ clef: 'treble', from: 'C4', to: 'C5' }, { clef: 'bass', from: 'C3', to: 'C4' }], 5, rng);
      expect(Math.abs(q.dist)).toBeLessThanOrEqual(4);
      const lo = q.clef === 'treble' ? 60 : 48;
      for (const x of [q.a, q.b]) { expect(midi(x)).toBeGreaterThanOrEqual(lo); expect(midi(x)).toBeLessThanOrEqual(lo + 12); }
    }
  });
  it('evaluates direction and size', () => {
    const q = { clef: 'treble' as const, a: p('E4'), b: p('G4'), dist: 2 };
    expect(evaluateInterval(q, 2).correct).toBe(true);
    expect(evaluateInterval(q, -2).error).toBe('direction');
    expect(evaluateInterval(q, 1).error).toBe('adjacent');
    expect(evaluateInterval(q, null).error).toBe('timeout');
  });
});

describe('grand staff', () => {
  it('pairs: left hand first at each moment', () => {
    const piece = grandPairs([{ clef: 'treble', from: 'C4', to: 'G4' }, { clef: 'bass', from: 'C3', to: 'G3' }], Math.random, 8);
    const order = readingOrder(piece);
    expect(order.length).toBe(16);
    for (let i = 0; i < order.length; i += 2) {
      expect(piece.notes[order[i]].clef).toBe('bass');
      expect(piece.notes[order[i + 1]].clef).toBe('treble');
      expect(piece.notes[order[i]].at).toBe(piece.notes[order[i + 1]].at);
    }
  });
  it('bars are complete in both voices', () => {
    for (const piece of [odeHands(), grandMelody([{ clef: 'treble', from: 'C4', to: 'C5' }], Math.random)]) {
      const bars = piecesBars(piece, 0, piece.bars, () => 'normal');
      expect(bars.length).toBe(piece.bars);
      for (const b of bars) {
        expect(b.treble.reduce((a, n) => a + n.beats, 0)).toBeCloseTo(4);
        expect(b.bass.reduce((a, n) => a + n.beats, 0)).toBeCloseTo(4);
      }
    }
  });
  it('Ode with both hands stays in C position (left hand C3/G3)', () => {
    const bass = odeHands().notes.filter((n) => n.clef === 'bass').map((n) => pitchId(n.pitch!));
    expect(new Set(bass)).toEqual(new Set(['C3', 'G3']));
  });
});

describe('accompaniment', () => {
  it('song chords cover every bar', () => {
    for (const d of SONG_DEFS) {
      const notes = parseNotes(d.notes);
      const beats = notes.reduce((a, n) => a + n.beats, 0);
      expect(parseChords(SONG_CHORDS[d.id]).length).toBe(beats / 4);
    }
  });
  it('harmonises: chord contains the melody note on each half bar, ends on C', () => {
    const notes = parseNotes('E4:1 F4:1 G4:2 B4:1 D4:1 C4:2');
    const ch = harmonize(notes);
    expect(ch[0]).toEqual(['C']);
    expect(ch[ch.length - 1][ch[ch.length - 1].length - 1]).toBe('C');
  });
  it('accompaniment: bass on 1 and 3, chord on 2 and 4', () => {
    const ev = accompaniment([['C'], ['F', 'G']]);
    const bass = ev.filter((e) => e.midi < 48);
    expect(bass.map((e) => [e.at, e.midi])).toEqual([[0, 36], [2, 36], [4, 41], [6, 43]]);
    expect(ev.filter((e) => e.at === 5).map((e) => e.midi % 12).sort()).toEqual([0, 5, 9]);
    expect(bassLine(chordsForSong('ode', parseNotes(SONG_DEFS[0].notes))).length).toBeGreaterThan(7);
  });
});

describe('pitch detection', () => {
  const tone = (f: number, sr = 48000, n = 2048, harmonics = [1, 0.6, 0.35, 0.2]) => {
    const b = new Float32Array(n);
    for (let i = 0; i < n; i++) b[i] = harmonics.reduce((a, h, k) => a + 0.3 * h * Math.sin(2 * Math.PI * f * (k + 1) * i / sr), 0);
    return b;
  };
  it('finds piano-like tones across the range', () => {
    for (const m of [43, 48, 55, 60, 64, 67, 72, 79, 84]) {
      const f = 440 * Math.pow(2, (m - 69) / 12);
      const d = detectPitch(tone(f), 48000);
      expect(d.freq).not.toBeNull();
      expect(Math.round(freqToMidi(d.freq!))).toBe(m);
    }
  });
  it('ignores silence and noise', () => {
    expect(detectPitch(new Float32Array(2048), 48000).freq).toBeNull();
    let s = 7;
    const noise = new Float32Array(2048).map(() => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5) * 0.4);
    expect(detectPitch(noise, 48000).freq).toBeNull();
  });
  it('reports a note once when it is stable, again after a new strike', () => {
    const t = new OnsetTracker(3, 0.8);
    const det = (f: number | null, rms = 0.1) => ({ freq: f, clarity: f ? 0.95 : 0, rms });
    const out: (number | null)[] = [];
    for (let i = 0; i < 6; i++) out.push(t.push(det(261.63)));
    expect(out.filter((x) => x != null)).toEqual([60]);
    out.length = 0;
    out.push(t.push(det(null, 0.001)));
    for (let i = 0; i < 4; i++) out.push(t.push(det(261.63)));
    expect(out.filter((x) => x != null)).toEqual([60]);
    out.length = 0;
    for (let i = 0; i < 4; i++) out.push(t.push(det(293.66)));
    expect(out.filter((x) => x != null)).toEqual([62]);
  });
});

describe('reminder', () => {
  it('builds a repeating calendar event', () => {
    const now = new Date(2026, 9, 27, 10, 0);
    const ics = reminderIcs('20:30', [0, 1, 2, 3, 4, 5, 6], now);
    expect(ics).toContain('DTSTART:20261027T203000');
    expect(ics).toContain('RRULE:FREQ=DAILY');
    expect(ics).toContain('BEGIN:VALARM');
    expect(rrule([1, 3])).toBe('FREQ=WEEKLY;BYDAY=MO,WE');
    expect(reminderIcs('08:00', [0], now)).toContain('DTSTART:20261101T080000');
    expect(googleCalendarUrl('20:30', [0], now)).toContain('calendar.google.com');
  });
});

describe('month card, evening, symbols', () => {
  it('summarises the month', () => {
    const now = new Date(2026, 9, 27, 12).getTime();
    const day = 86_400_000;
    const sessions: SessionRecord[] = [0, 1, 1, 5].map((d, i) => ({
      id: `s${i}`, startedAt: now - d * day - 600_000, endedAt: now - d * day, config: { kind: 'free', mode: 'practice', skill: 'name', count: 10, timeLimitMs: null, autoAdvance: true },
      summary: { total: 10, correct: 9, misses: 0, accuracy: 0.9, meanRt: 1, medianRt: 1, score: 80, wrongNotes: [], slowNotes: [] },
    }));
    const attempts: Attempt[] = Array.from({ length: 30 }, (_, i) => ({ sessionId: 's0', ts: now - i * 1000, skill: 'name', clef: 'treble', pitch: 'C4', answer: 'C', correct: i % 10 !== 0, rtMs: 900, timeLimitMs: null, mode: 'practice', hints: 0 }));
    const c = monthCard(attempts, sessions, now);
    expect(c.days).toBe(3);
    expect(c.minutes).toBe(40);
    expect(c.notesRead).toBe(27);
    expect(c.monthLabel).toBe('אוקטובר 2026');
  });
  it('evening theme: chosen, or automatic late at night', () => {
    expect(effectiveTheme('light', true, new Date(2026, 1, 1, 21).getTime())).toBe('evening');
    expect(effectiveTheme('light', true, new Date(2026, 1, 1, 12).getTime())).toBe('light');
    expect(effectiveTheme('dark', false, new Date(2026, 1, 1, 23).getTime())).toBe('dark');
    expect(effectiveTheme('evening', false)).toBe('evening');
  });
  it('symbol quiz: distinct options including the answer', () => {
    const qs = symbolQuiz(Math.random, 10);
    expect(qs.length).toBe(10);
    for (const q of qs) {
      expect(new Set(q.options.map((o) => o.id)).size).toBe(4);
      expect(q.options.some((o) => o.id === q.symbol.id)).toBe(true);
    }
    expect(new Set(SYMBOLS.map((s) => s.short)).size).toBe(SYMBOLS.length);
  });
});
