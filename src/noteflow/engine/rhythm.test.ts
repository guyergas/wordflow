import { describe, expect, it } from 'vitest';
import { combineRounds, evaluateTaps, makePattern, onsetsOf, parseBar, rhythmPassed, rhythmScore, toleranceSec } from './rhythm';

function seeded(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

const beat = 60 / 70;

describe('rhythm patterns', () => {
  it('every generated pattern is exactly two 4/4 bars and never starts with a rest', () => {
    for (const level of [1, 2, 3]) {
      for (let s = 1; s < 80; s++) {
        const p = makePattern(level, seeded(s));
        expect(p.reduce((a, e) => a + e.beats, 0)).toBe(8);
        expect(p[0].rest).toBe(false);
        let pos = 0;
        for (const e of p) { expect((pos % 4) + e.beats).toBeLessThanOrEqual(4 + 1e-9); pos += e.beats; }
        if (level === 1) expect(p.every((e) => [1, 2, 4].includes(e.beats) && !e.rest)).toBe(true);
      }
    }
  });
});

describe('tap evaluation', () => {
  const ev = [...parseBar('q q h'), ...parseBar('q qr q q')];
  const { onsets } = onsetsOf(ev, beat);

  it('perfect taps are all on time', () => {
    const r = evaluateTaps(ev, onsets.map((o) => o.time), beat);
    expect(r.summary.onTime).toBe(onsets.length);
    expect(r.summary.extras).toBe(0);
    expect(r.summary.timingAccuracy).toBe(1);
  });

  it('classifies early, late, missed and extra taps; taps in a rest are flagged', () => {
    const tol = toleranceSec(beat);
    const taps = onsets.map((o) => o.time);
    taps[0] -= tol + 0.05;          // early
    taps[1] += tol + 0.05;          // late
    taps.splice(2, 1);              // miss the half note
    taps.push(5.5 * beat);          // inside the quarter rest of bar 2
    const r = evaluateTaps(ev, taps, beat);
    expect(r.perOnset[0].status).toBe('early');
    expect(r.perOnset[1].status).toBe('late');
    expect(r.perOnset[2].status).toBe('miss');
    expect(r.summary.extras).toBe(1);
    expect(r.restTaps).toBe(1);
  });

  it('a tap is never credited to a far-away note, and double taps count as extra', () => {
    const r = evaluateTaps(parseBar('w'), [0.01, 0.05, 2.0], beat);
    expect(r.summary.onTime).toBe(1);
    expect(r.summary.extras).toBe(2);
  });

  it('eighth notes keep separate windows', () => {
    const e8 = parseBar('8 8 q q q');
    const t = onsetsOf(e8, beat).onsets.map((o) => o.time);
    const r = evaluateTaps(e8, [t[0], t[2], t[3], t[4]], beat); // skipped the second eighth
    expect(r.perOnset[1].status).toBe('miss');
    expect(r.summary.onTime).toBe(4);
  });

  it('combines rounds and decides pass/fail', () => {
    const good = evaluateTaps(ev, onsets.map((o) => o.time + 0.01), beat).summary;
    const all = combineRounds([good, good, good], 70, 2);
    expect(all.timingAccuracy).toBe(1);
    expect(rhythmPassed(all)).toBe(true);
    expect(rhythmScore(all)).toBe(100);
    const sloppy = evaluateTaps(ev, onsets.map((o, i) => o.time + (i % 2 ? 0.2 : 0)), beat).summary;
    expect(rhythmPassed(combineRounds([sloppy], 70, 2))).toBe(false);
  });
});
