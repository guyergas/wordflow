import { describe, expect, it } from 'vitest';
import { buildSummary, minutes, newOn, planOf, weekStart } from './summary';

const SUN = 20000 - ((20000 + 4) % 7);
const courses = [
  { id: 'en' as const, days: { [SUN]: { sec: 600, fresh: 4 }, [SUN + 1]: { sec: 300, fresh: 2 } } },
  { id: 'th' as const, days: {} },
  { id: 'math' as const, days: { [SUN + 1]: { sec: 900 } }, skills: { a: { met: SUN + 1 }, b: { met: SUN + 1, assumed: true } } },
  { id: 'geo' as const, days: { [SUN + 1]: { sec: 240, fresh: 1 } } },
];
const plan = (m: number) => [m, m, m, m, m, 0, 0];

describe('summary across courses', () => {
  it('a day counts that day, against that weekday in the schedule', () => {
    const s = buildSummary(courses, { en: plan(5), math: plan(20) }, SUN + 1, 'day', 'איילה');
    expect(s.rows.map((r) => [r.id, r.sec, r.met, r.fresh])).toEqual([['en', 300, true, 2], ['math', 900, false, 1], ['geo', 240, false, 1]]);
    expect(s.totalSec).toBe(1440);
    expect(s.totalFresh).toBe(4);
  });
  it('a week runs Sunday to Saturday and adds up the planned minutes', () => {
    const s = buildSummary(courses, { en: [10, 5, 0, 0, 0, 0, 0], math: [0, 15, 0, 0, 0, 0, 0] }, SUN + 3, 'week', 'x');
    expect([s.from, s.to]).toEqual([SUN, SUN + 6]);
    expect(s.rows[0].perDay.slice(0, 2)).toEqual([600, 300]);
    expect(s.rows[0].goalMin).toBe(15);
    expect(s.rows[0].fresh).toBe(6);
    expect(s.allMet).toBe(true);
    expect(weekStart(SUN + 6)).toBe(SUN);
  });
  it('a course off the schedule with nothing done stays out', () => {
    expect(buildSummary(courses, {}, SUN, 'day', '').rows.some((r) => r.id === 'th')).toBe(false);
  });
  it('what the math opening test assumed is not counted as new', () => { expect(newOn(courses[2], SUN + 1)).toBe(1); });
  it('a free day in the default schedule has no goal', () => { expect(planOf({}, 'en')[6]).toBe(0); expect(planOf({}, 'en')[0]).toBeGreaterThan(0); });
  it('rounds down, so a goal never looks reached too early', () => { expect(minutes(899)).toBe(14); });
});
