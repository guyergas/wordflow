// Families, their people and roles. A family has its own people, study times, goals and achievements;
// the courses are the same for every family. The data is open by the families' choice: a family's id is in its invite link.
// This module does not import the course, so the family and its people are ready before the course is read.
import { dbUrl, famUrl, FAMILY_KEY, familyId, FIRST_FAMILY, validFamily } from './db';

export type Role = 'parent' | 'kid' | 'tot';
export const ROLES: { id: Role; name: string; note: string }[] = [
  { id: 'parent', name: 'הורה', note: 'קובע לו״ז ומנהל את המשפחה' },
  { id: 'kid', name: 'ילד', note: 'גיל 9-15' },
  { id: 'tot', name: 'קטנטן', note: 'גיל 4-8, רק קורסי הקטנטנים' },
];
export interface Person { id: string; name: string; she: boolean; role: Role; order?: number }
export interface FamilyMeta { name: string; users?: Record<string, Omit<Person, 'id'>>; migrated?: number; created?: number }

const META_KEY = 'wordflow.fam.meta';
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* this visit only */ } };
const drop = (k: string) => { try { localStorage.removeItem(k); } catch { /* nothing to drop */ } };

/** The first family as it was before families existed. */
export const FIRST_META: FamilyMeta = {
  name: 'ארגס',
  users: {
    guy: { name: 'גיא', she: false, role: 'parent', order: 0 },
    dikla: { name: 'דיקלה', she: true, role: 'parent', order: 1 },
    ayala: { name: 'איילה', she: true, role: 'kid', order: 2 },
    ofir: { name: 'אופיר', she: true, role: 'kid', order: 3 },
    omer: { name: 'עומר', she: false, role: 'tot', order: 4 },
    ido: { name: 'עידו', she: false, role: 'tot', order: 5 },
  },
};

export const peopleOf = (meta: FamilyMeta | null | undefined): Person[] =>
  Object.entries(meta?.users ?? {}).filter(([, u]) => u && u.name).map(([id, u]) => ({ id, name: u.name, she: !!u.she, role: (['parent', 'kid', 'tot'] as Role[]).includes(u.role) ? u.role : 'kid', order: u.order ?? 99 })).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));

/** The family as this device last saw it. */
export function cachedMeta(): FamilyMeta | null {
  const fid = familyId();
  if (!fid) return null;
  try { const m = JSON.parse(get(META_KEY) ?? 'null') as (FamilyMeta & { id?: string }) | null; if (m && m.id === fid) return m; } catch { /* read again from the network */ }
  return fid === FIRST_FAMILY ? FIRST_META : null;
}
export const saveMeta = (meta: FamilyMeta) => put(META_KEY, JSON.stringify({ ...meta, id: familyId() }));

const rand = (n: number, abc = 'abcdefghijkmnpqrstuvwxyz') => Array.from({ length: n }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
/** User ids are letters only, so they never clash with the first family's names or with key rules. */
export const newUserId = () => rand(9);
export const newFamilyId = () => `f${rand(11, 'abcdefghijkmnpqrstuvwxyz23456789')}`;

export const inviteLink = (fid = familyId()) => { const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('join', fid ?? ''); return u.toString(); };

const json = async <T>(url: string, init?: RequestInit): Promise<T> => { const r = await fetch(url, init); if (!r.ok) throw new Error(String(r.status)); return (await r.json()) as T; };
const send = (url: string, method: string, body?: unknown) => json<unknown>(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });

/** An invite link moves the device into that family. Whoever was signed in is signed out, since the people are different. */
function takeInvite() {
  let asked: string | null = null;
  try { asked = new URLSearchParams(location.search).get('join'); } catch { return; }
  if (asked === null) return;
  try { const u = new URL(location.href); u.searchParams.delete('join'); history.replaceState(null, '', u.toString()); } catch { /* the link stays in the address */ }
  if (!validFamily(asked) || asked === get(FAMILY_KEY)) return;
  put(FAMILY_KEY, asked);
  drop('wordflow.user');
  drop(META_KEY);
}

/** The first family's data was at the top of the database. It is copied once into the family; the old copy stays as a backup. */
async function moveFirstFamily(signal: AbortSignal) {
  if (familyId() !== FIRST_FAMILY || get('wordflow.fam.moved')) return;
  const base = `${dbUrl()}/families/${FIRST_FAMILY}`;
  const done = await json<number | null>(`${base}/meta/migrated.json`, { signal });
  if (!done) {
    const parts = ['time', 'plans', 'courses', 'progress', 'wins'] as const;
    const old = await Promise.all(parts.map((p) => json<unknown>(`${dbUrl()}/${p}.json`, { signal })));
    const all: Record<string, unknown> = { 'meta/migrated': Date.now() };
    parts.forEach((p, i) => { if (old[i] != null) all[p] = old[i]; });
    // Another device may have moved it meanwhile. Then nothing is written over its newer data.
    if (!(await json<number | null>(`${base}/meta/migrated.json`, { signal }))) await send(`${base}.json`, 'PATCH', all);
  }
  put('wordflow.fam.moved', '1');
}

/** Before anything else: an invite, the first family's move, and the family's people. Never waits longer than the limit. */
export async function setupFamily(limitMs = 3000) {
  takeInvite();
  const fid = familyId();
  if (!fid || !dbUrl()) return;
  // The move happens once and may take longer. Until it succeeds this device does not sync at all.
  const stop = new AbortController();
  const late = setTimeout(() => stop.abort(), get('wordflow.fam.moved') || fid !== FIRST_FAMILY ? limitMs : 15000);
  try {
    await moveFirstFamily(stop.signal);
    const meta = await json<FamilyMeta | null>(`${famUrl()}/meta.json`, { signal: stop.signal });
    if (meta?.users) saveMeta(meta);
    else if (fid === FIRST_FAMILY) { const m = { ...FIRST_META, ...meta, users: FIRST_META.users }; await send(`${famUrl()}/meta.json`, 'PATCH', { name: m.name, users: m.users }); saveMeta(m); }
  } catch { /* no network or too slow: the app opens with what is here */ } finally { clearTimeout(late); }
}

// Changes by a parent. Each one writes the person and keeps this device's copy in step.
export async function savePerson(p: Person) {
  const { id, ...rest } = p;
  await send(`${famUrl()}/meta/users/${id}.json`, 'PUT', rest);
  const m = cachedMeta() ?? { name: '' };
  saveMeta({ ...m, users: { ...m.users, [id]: rest } });
}

/** Removes a person with everything they learned and their study times, on every device of the family. */
export async function deletePerson(id: string) {
  const base = famUrl();
  await send(`${base}.json`, 'PATCH', { [`meta/users/${id}`]: null, [`progress/${id}`]: null, [`time/${id}`]: null, [`plans/${id}`]: null, [`courses/${id}`]: null });
  const m = cachedMeta() ?? { name: '' };
  const users = { ...m.users }; delete users[id];
  saveMeta({ ...m, users });
  try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k?.startsWith(`wordflow.u.${id}.`)) localStorage.removeItem(k); } } catch { /* other devices clear theirs on the next pull */ }
}

export const renameFamily = async (name: string) => { await send(`${famUrl()}/meta/name.json`, 'PUT', name); const m = cachedMeta() ?? { name }; saveMeta({ ...m, name }); };

/** Only Guy opens families. A new family starts with one parent, who then adds the rest from the invite link. */
export async function createFamily(name: string, parent: { name: string; she: boolean }): Promise<string> {
  const fid = newFamilyId();
  const meta: FamilyMeta = { name, created: Date.now(), users: { [newUserId()]: { name: parent.name, she: parent.she, role: 'parent', order: 0 } } };
  await send(`${dbUrl()}/families/${fid}/meta.json`, 'PUT', meta);
  return fid;
}

export async function listFamilies(): Promise<{ id: string; name: string; people: number }[]> {
  const ids = Object.keys((await json<Record<string, true> | null>(`${dbUrl()}/families.json?shallow=true`)) ?? {});
  const metas = await Promise.all(ids.map((id) => json<FamilyMeta | null>(`${dbUrl()}/families/${id}/meta.json`).catch(() => null)));
  return ids.map((id, i) => ({ id, name: metas[i]?.name ?? id, people: Object.keys(metas[i]?.users ?? {}).length }));
}
