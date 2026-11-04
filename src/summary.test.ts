import { describe, expect, it } from 'vitest';
import { buildSummary, minutes, weekStart } from './summary';

const SUN = 20000 - ((20000 + 4) % 7);
const courses = [
  { id: 'en' as const, days: { [SUN]: { sec: 600 }, [SUN + 1]: { sec: 300 } } },
  { id: 'th' as const, days: {} },
  { id: 'math' as const, days: { [SUN + 1]: { sec: 900 } } },
];

describe('time summary', () => {
  it('a day counts that day only, against the day goal', () => {
    const s = buildSummary(courses, { en: { day: 5, week: 20 }, math: { day: 20, week: 60 } }, SUN + 1, 'day', 'איילה');
    expect(s.rows.map((r) => [r.id, r.sec, r.met])).toEqual([['en', 300, true], ['math', 900, false]]);
    expect(s.allMet).toBe(false);
    expect(s.totalSec).toBe(1200);
  });
  it('a week runs Sunday to Saturday and keeps each day', () => {
    const s = buildSummary(courses, { en: { day: 5, week: 15 }, math: { day: 5, week: 15 } }, SUN + 3, 'week', 'x');
    expect([s.from, s.to]).toEqual([SUN, SUN + 6]);
    expect(s.rows[0].perDay.slice(0, 2)).toEqual([600, 300]);
    expect(s.allMet).toBe(true);
    expect(weekStart(SUN + 6)).toBe(SUN);
  });
  it('a course with no goal and no practice stays out, and one with practice shows', () => {
    expect(buildSummary(courses, {}, SUN, 'day', '').rows.some((r) => r.id === 'th')).toBe(false);
    const withThai = [{ id: 'th' as const, days: { [SUN]: { sec: 120 } } }];
    const r = buildSummary(withThai, {}, SUN, 'day', '').rows[0];
    expect([r.id, r.met]).toEqual(['th', false]);
  });
  it('rounds down, so a goal never looks reached too early', () => { expect(minutes(899)).toBe(14); });
});
