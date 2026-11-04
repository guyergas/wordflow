// Local Persistence — IndexedDB via Dexie. Raw data only; metrics are computed in engine/stats.

import { USER_ID } from '../../course';
import Dexie, { type Table } from 'dexie';
import { Attempt, DEFAULT_SETTINGS, Favorite, SessionRecord, Settings } from './types';

class NoteFlowDB extends Dexie {
  attempts!: Table<Attempt, number>;
  sessions!: Table<SessionRecord, string>;
  kv!: Table<{ key: string; value: unknown }, string>;
  favorites!: Table<Favorite, string>;

  constructor() {
    // Dikla continues the original NoteFlow's data when it is in the same browser. Everyone else has their own.
    super(!USER_ID || USER_ID === 'dikla' ? 'noteflow' : `noteflow.${USER_ID}`);
    this.version(1).stores({
      attempts: '++id, sessionId, ts, skill, [skill+clef+pitch]',
      sessions: 'id, startedAt',
      kv: 'key',
      favorites: 'id, createdAt',
    });
  }
}

export const db = new NoteFlowDB();

export async function loadSettings(): Promise<Settings> {
  const row = await db.kv.get('settings');
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function saveSettings(s: Settings): Promise<void> {
  await db.kv.put({ key: 'settings', value: s });
}

export async function getKV<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key);
  return (row?.value as T) ?? fallback;
}

export async function setKV(key: string, value: unknown): Promise<void> {
  await db.kv.put({ key, value });
}

/** Ask the browser not to evict our data (important on iOS Safari). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch { /* ignore */ }
  return false;
}

export interface BackupFile {
  app: 'noteflow';
  version: 1;
  exportedAt: string;
  attempts: Attempt[];
  sessions: SessionRecord[];
  kv: { key: string; value: unknown }[];
  favorites: Favorite[];
}

export async function exportAll(): Promise<BackupFile> {
  return {
    app: 'noteflow',
    version: 1,
    exportedAt: new Date().toISOString(),
    attempts: await db.attempts.toArray(),
    sessions: await db.sessions.toArray(),
    kv: await db.kv.toArray(),
    favorites: await db.favorites.toArray(),
  };
}

export async function importAll(data: BackupFile): Promise<void> {
  if (data?.app !== 'noteflow' || !Array.isArray(data.attempts)) throw new Error('קובץ גיבוי לא תקין');
  await db.transaction('rw', [db.attempts, db.sessions, db.kv, db.favorites], async () => {
    await Promise.all([db.attempts.clear(), db.sessions.clear(), db.kv.clear(), db.favorites.clear()]);
    await db.attempts.bulkAdd(data.attempts.map(({ id: _id, ...a }) => a));
    await db.sessions.bulkPut(data.sessions ?? []);
    await db.kv.bulkPut(data.kv ?? []);
    await db.favorites.bulkPut(data.favorites ?? []);
  });
}

/** Clears progress and history; keeps settings. */
export async function resetAll(): Promise<void> {
  await db.transaction('rw', [db.attempts, db.sessions, db.kv, db.favorites], async () => {
    const settings = await db.kv.get('settings');
    await Promise.all([db.attempts.clear(), db.sessions.clear(), db.kv.clear(), db.favorites.clear()]);
    if (settings) await db.kv.put(settings);
  });
}
