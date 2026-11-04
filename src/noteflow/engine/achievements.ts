// Achievements reward real skill gains — never time spent or tap counts.

import type { Attempt, SessionRecord, Settings } from '../storage/types';
import { stageById } from './curriculum';
import { computeRecords, median, practiceDaysThisWeek, stageProgress, StatsIndex, atLeast } from './stats';

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'all7', title: 'כל שבעת התווים', desc: 'זיהית נכון כל אחד מ־C D E F G A B' },
  { id: 'first-pass', title: 'מבחן ראשון', desc: 'עברת מבחן שליטה ראשון' },
  { id: 'treble-octave', title: 'אוקטבה בסול', desc: 'עברת את מבחן C4–C5 במפתח סול' },
  { id: 'bass-octave', title: 'אוקטבה בפה', desc: 'עברת את מבחן C3–C4 במפתח פה' },
  { id: 'bass-master', title: 'שליטה במפתח פה', desc: 'עברת פעמיים, בימים שונים, את מבחן C3–C4 במפתח פה' },
  { id: 'both-clefs', title: 'שני המפתחות', desc: 'עברת מבחן מעורב של שני המפתחות' },
  { id: 'keys-pass', title: 'יד על המקלדת', desc: 'עברת מבחן שליטה במקלדת' },
  { id: 'streak20', title: '20 ברצף', desc: '20 תשובות נכונות ברצף' },
  { id: 'streak50', title: '50 ברצף', desc: '50 תשובות נכונות ברצף' },
  { id: 'perfect', title: 'מבחן מושלם', desc: '100% במבחן של לפחות 20 שאלות' },
  { id: 'speedup', title: 'קוראת מהר יותר', desc: 'זמן הזיהוי החציוני שלך ירד ב־30% לעומת ההתחלה' },
  { id: 'week', title: 'יעד שבועי', desc: 'עמדת ביעד התרגול השבועי' },
  { id: 'melody-clean', title: 'מנגינה שלמה', desc: 'קראת לפחות 16 תווים של מנגינות בלי אף טעות' },
  { id: 'steady-beat', title: 'דופק יציב', desc: '90% מהצלילים בזמן באימון מקצב של 4 סבבים לפחות' },
  { id: 'fingers', title: 'חמש אצבעות', desc: 'עברת מבחן אצבעות במיקום C' },
  { id: 'grand', title: 'שתי ידיים', desc: 'עברת מבחן קריאה על שתי חמשות' },
  { id: 'intervals', title: 'קוראת מרווחים', desc: 'עברת מבחן מרווחים' },
  { id: 'key-sig', title: 'סימן סולם', desc: 'עברת מבחן בסולם עם דיאז או במול בתחילת השורה' },
  { id: 'play-along', title: 'מנגנת עם ליווי', desc: 'ניגנת מנגינה שלמה עם ליווי, כל התווים נכונים' },
  { id: 'symbols', title: 'מכירה את הסימנים', desc: '10 מתוך 10 בחידון הסימנים' },
];

export function earnedAchievements(
  attempts: Attempt[], sessions: SessionRecord[], idx: StatsIndex, s: Settings,
): string[] {
  const out: string[] = [];
  const name = attempts.filter((a) => a.skill === 'name');
  const letters = new Set(name.filter((a) => a.correct).map((a) => a.pitch[0]));
  if (letters.size === 7) out.push('all7');
  const passed = (id: string, skill: 'name' | 'key' = 'name') => stageProgress(stageById(id), skill, idx, sessions, s).status;
  if (sessions.some((x) => x.config.kind === 'stage-test' && x.summary.passed)) out.push('first-pass');
  if (atLeast(passed('t2'), 'passed')) out.push('treble-octave');
  if (atLeast(passed('b2'), 'passed')) out.push('bass-octave');
  if (passed('b2') === 'mastered') out.push('bass-master');
  if (['m1', 'm2', 'm3'].some((id) => atLeast(passed(id), 'passed'))) out.push('both-clefs');
  if (sessions.some((x) => x.config.kind === 'stage-test' && x.config.skill === 'key' && x.summary.passed)) out.push('keys-pass');
  const rec = computeRecords(attempts, sessions);
  if (rec.bestStreak >= 20) out.push('streak20');
  if (rec.bestStreak >= 50) out.push('streak50');
  if (sessions.some((x) => x.config.mode === 'test' && x.summary.total >= 20 && x.summary.correct === x.summary.total)) out.push('perfect');
  const rts = name.filter((a) => a.correct && a.rtMs != null).map((a) => a.rtMs!);
  if (rts.length >= 200) {
    const first = median(rts.slice(0, 100))!;
    const last = median(rts.slice(-100))!;
    if (last <= first * 0.7) out.push('speedup');
  }
  if (practiceDaysThisWeek(sessions).length >= s.weeklyGoalDays) out.push('week');
  if (sessions.some((x) => x.config.exercise === 'sequence' && x.summary.total >= 16 && x.summary.correct === x.summary.total)) out.push('melody-clean');
  if (sessions.some((x) => x.summary.rhythm && x.config.count >= 4 && x.summary.rhythm.timingAccuracy >= 0.9)) out.push('steady-beat');
  const stagePassed = (ids: string[]) => sessions.some((x) => x.config.kind === 'stage-test' && x.summary.passed && ids.includes(x.config.stageId ?? ''));
  if (stagePassed(['h1', 'h2'])) out.push('fingers');
  if (stagePassed(['g1', 'g2'])) out.push('grand');
  if (stagePassed(['i1', 'i2'])) out.push('intervals');
  if (stagePassed(['k1', 'k2', 'k3'])) out.push('key-sig');
  if (sessions.some((x) => x.config.exercise === 'playalong' && x.summary.total >= 8 && x.summary.correct === x.summary.total)) out.push('play-along');
  if (sessions.some((x) => x.config.exercise === 'symbols' && x.summary.total >= 10 && x.summary.correct === x.summary.total)) out.push('symbols');
  return out;
}
