// Hearts: what learning pays into the game. Up to 5 are kept per person. A game costs one heart, and so does
// coming back into a game after being knocked out. Earned: a finished lesson 1, new material 2 (instead of the 1),
// meeting all of today's time goals 5 (once a day), taking the whole map in the game 1.
// Stored under the person's keys, so it syncs with their progress and the game page reads the same place.
import { userKey } from './course';
import { dayNumber } from './engine';
import { buildSummary, loadSchedule, readCourses } from './summary';

export const MAX_HEARTS = 5;
export const HEARTS = { lesson: 1, fresh: 2, goals: 5 } as const;
/** A lesson finished this soon after new material in it was already paid as new material. */
export const SAME_LESSON_MS = 10 * 60_000;

export interface HeartState { n: number; goalDay?: number; freshAt?: number; lessonAt?: number }
export type Reward = 'lesson' | 'fresh';

/** Pays a finished lesson or new material, and the day's goals once. Pure, for the tests. */
export function applyReward(s: HeartState, kind: Reward, now: number, today: number, goalsMet: boolean): { s: HeartState; gained: number } {
  const next = { ...s };
  let gained = 0;
  if (kind === 'fresh') { gained += HEARTS.fresh; next.freshAt = now; }
  else {
    const paidAsFresh = !!s.freshAt && now - s.freshAt < SAME_LESSON_MS && (!s.lessonAt || s.freshAt > s.lessonAt);
    if (!paidAsFresh) gained += HEARTS.lesson;
    next.lessonAt = now;
  }
  if (goalsMet && s.goalDay !== today) { gained += HEARTS.goals; next.goalDay = today; }
  const before = s.n || 0;
  next.n = Math.min(MAX_HEARTS, before + gained);
  return { s: next, gained: next.n - before };
}

const KEY = () => userKey('hearts');
export function readHearts(): HeartState {
  try { const v = JSON.parse(localStorage.getItem(KEY()) ?? '{}') as HeartState; return { ...v, n: Math.max(0, Math.min(MAX_HEARTS, Number(v.n) || 0)) }; } catch { return { n: 0 }; }
}
function writeHearts(s: HeartState) { try { localStorage.setItem(KEY(), JSON.stringify(s)); } catch { /* this visit only */ } }

function goalsMetToday(): boolean {
  try { const sum = buildSummary(readCourses(), loadSchedule(), dayNumber(), 'day', ''); return sum.hasGoals && sum.allMet; } catch { return false; }
}

type Listener = (gained: number, n: number) => void;
let listener: Listener | null = null;
/** The offer to play listens here. */
export function onHearts(l: Listener) { listener = l; }

/** Hearts a parent gave: added (up to 5) and shown with the offer to play. */
export function addHearts(n: number) {
  const s = readHearts();
  const next = Math.min(MAX_HEARTS, s.n + n);
  writeHearts({ ...s, n: next });
  if (listener) listener(next - s.n, next);
  else void import('./heartsOffer').then((m) => m.showOffer(next - s.n, next));
}

/** Called where a lesson ends or new material is done. Offers a game when hearts came in. */
export function reward(kind: Reward) {
  const { s, gained } = applyReward(readHearts(), kind, Date.now(), dayNumber(), goalsMetToday());
  writeHearts(s);
  if (gained > 0 || (kind === 'lesson' && s.n > 0)) {
    if (listener) listener(gained, s.n);
    else void import('./heartsOffer').then((m) => m.showOffer(gained, s.n));
  }
}
