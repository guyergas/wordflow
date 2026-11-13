// Study time and goals, shared by the whole family across devices. Only minutes and goals leave the device.
// The data is open by the family's choice. Each device writes its own numbers, so devices add up without overwriting each other.
import { enrolledCourses, USER_ID, userKey } from './course';
import { cleanSchedule, loadSchedule, readCourses, saveSchedule, Schedule } from './summary';
import { famUrl, deviceId } from './db';
/** The family's database address. Empty until the device is in a family. */
export const dbUrl = famUrl;
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

const send = (path: string, method: string, body: unknown) => fetch(`${dbUrl()}/${path}.json`, { method, body: JSON.stringify(body) }).then((r) => { if (!r.ok) throw new Error(String(r.status)); });

export function pushTime() {
  if (!dbUrl() || !USER_ID) return Promise.resolve();
  const dev = deviceId(), all: Record<string, unknown> = { [`courses/${USER_ID}`]: enrolledCourses() };
  for (const c of readCourses()) for (const [day, d] of Object.entries(c.days)) {
    if (d.sec) all[`time/${USER_ID}/${c.id}/${day}/${dev}`] = Math.round(d.sec);
  }
  return send('', 'PATCH', all).catch(() => undefined);
}
export const pushPlan = (user: string, plan: Schedule) => (dbUrl() ? send(`plans/${user}`, 'PUT', plan).catch(() => undefined) : Promise.resolve());

/** A goal set from another device replaces the one here. A device's existing goal goes up if there is none yet. */
async function pullPlan() {
  if (!USER_ID) return;
  try {
    const raw = await (await fetch(`${dbUrl()}/plans/${USER_ID}.json`)).json();
    if (raw) saveSchedule(cleanSchedule(raw));
    else if (get(userKey('schedule'))) await pushPlan(USER_ID, loadSchedule());
  } catch { /* the next launch tries again */ }
}

export interface FamilyData { time?: Record<string, Record<string, Record<string, Record<string, number>>>>; plans?: Record<string, Schedule>; courses?: Record<string, string[]> }
/** Only the times, goals and courses, not everyone's whole progress. */
export async function readFamily(): Promise<FamilyData> {
  const [time, plans, courses] = await Promise.all(['time', 'plans', 'courses'].map(async (p) => { const r = await fetch(`${dbUrl()}/${p}.json`); if (!r.ok) throw new Error(String(r.status)); return r.json(); }));
  return { time: time ?? undefined, plans: plans ?? undefined, courses: courses ?? undefined };
}

export function startSync() {
  if (!dbUrl() || !USER_ID) return;
  void pullPlan();
  void pushTime();
  setInterval(() => { if (document.visibilityState === 'visible') void pushTime(); }, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void pushTime(); });
}
