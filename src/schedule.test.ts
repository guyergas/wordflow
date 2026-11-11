import { describe, expect, it } from 'vitest';
import { buildSummary, cleanSchedule, planOf, weekday } from './summary';

describe('the weekly schedule', () => {
  it('is set per weekday, so the same goals apply every week', () => {
    const plan = cleanSchedule({ math: [0, 20, 20, 20, 20, 10, 0] });
    const monday = 20004 - weekday(20004) + 1;
    for (const week of [0, 1, 7, 52]) expect(planOf(plan, 'math')[weekday(monday + week * 7)]).toBe(20);
  });
  it('a week the sync service returns as an object, or with missing days, comes back as seven numbers', () => {
    expect(cleanSchedule({ math: { 1: 15, 3: 15 } }).math).toEqual([0, 15, 0, 15, 0, 0, 0]);
    expect(cleanSchedule({ en: [5, 5] }).en).toEqual([5, 5, 0, 0, 0, 0, 0]);
    expect(cleanSchedule(null)).toEqual({});
  });
  it('the goal counts in a summary long after it was set', () => {
    const plan = cleanSchedule({ math: [10, 10, 10, 10, 10, 10, 10] });
    const s = buildSummary([{ id: 'math', days: {} }], plan, 20004 + 70, 'day', 'x');
    expect(JSON.stringify(s)).toContain('10');
  });
});
