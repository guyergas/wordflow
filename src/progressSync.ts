// Each person's learning progress, copied between their devices. The whole progress goes up as one piece at
// points where something was finished (a practice, a lesson, a topic), never in the middle. On launch, a newer copy
// written by another device replaces the one here. The last copy written wins; nothing is merged.
// The data is open by the family's choice, like the study times. The piano course keeps its own storage and is not copied.
// This module does not import the course, so the app can pull before the course is loaded.
import { famUrl, deviceId } from './db';

export interface Remote { at: number; device: string; data: Record<string, string> }
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

const prefix = (user: string) => `wordflow.u.${user}.`;
/** Settings that belong to one device, and the piano course. They are never copied. */
const LOCAL = new Set(['syncedAt', 'textSize', 'winsSeen', 'course', 'nf-mood', 'data.notes']);
/** Where someone stopped inside a lesson on this device. */
const LOCAL_START = ['lessonSpot.'];
export const isShared = (name: string) => !!name && !LOCAL.has(name) && !LOCAL_START.some((p) => name.startsWith(p));

const store = (): Storage | null => { try { return localStorage; } catch { return null; } };
export const currentUser = (s: Storage | null = store()) => { try { const u = s?.getItem('wordflow.user'); return u && /^[a-z]+$/.test(u) ? u : null; } catch { return null; } };

/** The user's progress as it is copied: key names without the user prefix. */
export function collect(user: string, s: Storage): Record<string, string> {
  const out: Record<string, string> = {}, p = prefix(user);
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (!k?.startsWith(p) || !isShared(k.slice(p.length))) continue;
    const v = s.getItem(k);
    if (v !== null) out[k.slice(p.length)] = v;
  }
  return out;
}

// The database does not allow . $ # [ ] / in a key name, so they are written as %XX.
export const encodeKey = (k: string) => k.replace(/[%.$#[\]/]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`);
export const decodeKey = (k: string) => { try { return decodeURIComponent(k); } catch { return k; } };
const encodeData = (d: Record<string, string>) => Object.fromEntries(Object.entries(d).map(([k, v]) => [encodeKey(k), v]));
const decodeData = (d: Record<string, unknown> | undefined) => Object.fromEntries(Object.entries(d ?? {}).filter(([, v]) => typeof v === 'string').map(([k, v]) => [decodeKey(k), v as string]));

export const syncedAtOf = (user: string, s: Storage) => Number(s.getItem(`${prefix(user)}syncedAt`)) || 0;
/** A copy replaces the one here only if it is newer than the last copy this device sent or took, and came from another device. */
export const shouldPull = (remote: Remote | null, syncedAt: number, device: string) => !!remote && typeof remote.at === 'number' && remote.at > syncedAt && remote.device !== device;

/** Replaces this device's copied progress with the remote one. Device settings stay. */
export function applyRemote(user: string, remote: Remote, s: Storage) {
  const p = prefix(user), data = decodeData(remote.data), stale: string[] = [];
  for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k?.startsWith(p) && isShared(k.slice(p.length)) && !(k.slice(p.length) in data)) stale.push(k); }
  stale.forEach((k) => s.removeItem(k));
  for (const [k, v] of Object.entries(data)) if (isShared(k)) s.setItem(p + k, v);
  s.setItem(`${p}syncedAt`, String(remote.at));
}

let pending = false, timer: ReturnType<typeof setTimeout> | null = null;

async function send(keepalive = false) {
  const user = currentUser(), s = store();
  if (!user || !s || !famUrl()) return;
  if (timer) { clearTimeout(timer); timer = null; }
  const at = Date.now();
  const body = JSON.stringify({ at, device: deviceId(), data: encodeData(collect(user, s)) });
  try {
    // A page that is closing can only send a small body with keepalive.
    const r = await fetch(`${famUrl()}/progress/${user}.json`, { method: 'PUT', body, keepalive: keepalive && body.length < 60_000 });
    if (!r.ok) throw new Error(String(r.status));
    pending = false;
    try { s.setItem(`${prefix(user)}syncedAt`, String(at)); } catch { /* sent again next time */ }
  } catch { /* stays pending: sent when the app is hidden or at the next finish */ }
}

/** Something whole was finished. The progress goes up a moment later, once the screens have saved it. */
export function pushProgress() {
  if (!currentUser()) return;
  pending = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void send(); }, 1200);
}

/** Before the course loads: takes a newer copy from another device, or sends the first copy. Never waits longer than the limit. */
export async function pullProgress(limitMs = 2500) {
  const user = currentUser(), s = store();
  if (!user || !s || !famUrl()) return;
  const stop = new AbortController();
  const late = setTimeout(() => stop.abort(), limitMs);
  try {
    const r = await fetch(`${famUrl()}/progress/${user}.json`, { signal: stop.signal });
    if (!r.ok) return;
    const remote = (await r.json()) as Remote | null;
    if (!remote) { if (Object.keys(collect(user, s)).length) void send(); return; }
    if (shouldPull(remote, syncedAtOf(user, s), deviceId())) applyRemote(user, remote, s);
  } catch { /* no network or too slow: the app opens with what is here */ } finally { clearTimeout(late); }
}

/** When the app is hidden, a finish that has not gone up yet goes up now. */
export function startProgressSync() {
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && pending) void send(true); });
}
