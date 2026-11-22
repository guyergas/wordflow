import { describe, expect, it } from 'vitest';
import { applyReward, HEARTS, MAX_HEARTS, SAME_LESSON_MS } from './hearts';
import gamePage from '../public/game/paperio.html?raw';

const T = 1_000_000_000, DAY = 20_000;

describe('hearts', () => {
  it('a finished lesson gives 2, a lesson with new material 4', () => {
    expect(applyReward({ n: 0 }, 'lesson', T, DAY, false).gained).toBe(HEARTS.lesson);
    expect(applyReward({ n: 0 }, 'fresh', T, DAY, false).gained).toBe(HEARTS.fresh);
  });

  it('a lesson that ends right after its new material was paid gives nothing more', () => {
    const a = applyReward({ n: 0 }, 'fresh', T, DAY, false);
    const b = applyReward(a.s, 'lesson', T + 60_000, DAY, false);
    expect(b.gained).toBe(0);
    expect(b.s.n).toBe(4);
    // The next lesson pays again.
    expect(applyReward(b.s, 'lesson', T + 120_000, DAY, false).gained).toBe(2);
    // And so does a lesson long after.
    expect(applyReward(a.s, 'lesson', T + SAME_LESSON_MS + 1, DAY, false).gained).toBe(2);
  });

  it('meeting the day goals gives 5, once a day', () => {
    const a = applyReward({ n: 0 }, 'lesson', T, DAY, true);
    expect(a.gained).toBe(HEARTS.lesson + HEARTS.goals);
    const b = applyReward({ ...a.s, n: 0 }, 'lesson', T + 1e6, DAY, true);
    expect(b.gained).toBe(HEARTS.lesson);
    expect(applyReward({ ...a.s, n: 0 }, 'lesson', T + 1e6, DAY + 1, true).gained).toBe(HEARTS.lesson + HEARTS.goals);
  });

  it('never holds more than 10', () => {
    expect(MAX_HEARTS).toBe(10);
    const r = applyReward({ n: 8 }, 'fresh', T, DAY, false);
    expect(r.s.n).toBe(MAX_HEARTS);
    expect(r.gained).toBe(2);
  });

  it('the game reads and writes the same hearts key, and parents play free', () => {
    expect(gamePage).toContain('`wordflow.u.${WF_USER}.hearts`');
    expect(gamePage).toContain("PARAMS.get('free') === '1'");
    expect(gamePage).toContain(`const MAX_HEARTS = ${MAX_HEARTS};`);
  });
});
