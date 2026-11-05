// App state: loads raw data from IndexedDB once, keeps derived indexes in memory, writes through.

import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { STORAGE_KEY, USER_NAME } from '../../course';
import { db, loadSettings, saveSettings, getKV, setKV, resetAll, BackupFile } from '../storage/db';
import type { Attempt, Favorite, MyMelody, PendingSession, SessionRecord, Settings } from '../storage/types';
import { DEFAULT_SETTINGS } from '../storage/types';
import { addToIndex, buildIndex, StatsIndex } from '../engine/stats';
import { audio } from '../audio/engine';

export interface AppData {
  loaded: boolean;
  settings: Settings;
  attempts: Attempt[];
  sessions: SessionRecord[];
  favorites: Favorite[];
  idx: StatsIndex;
  achievements: Record<string, number>;
  /** IndexedDB unavailable or a write failed — progress will not survive a reload. */
  storageError: boolean;
  pending: PendingSession | null;
  lessonsSeen: Record<string, number>;
  myMelodies: MyMelody[];
  version: number;
}

type Listener = () => void;

class Store {
  data: AppData = {
    loaded: false, settings: DEFAULT_SETTINGS, attempts: [], sessions: [], favorites: [],
    idx: new Map(), achievements: {}, storageError: false, pending: null, lessonsSeen: {}, myMelodies: [], version: 0,
  };
  private listeners = new Set<Listener>();

  subscribe = (l: Listener) => { this.listeners.add(l); return () => this.listeners.delete(l); };
  getSnapshot = () => this.data;

  private emit(patch: Partial<AppData>) {
    this.data = { ...this.data, ...patch, version: this.data.version + 1 };
    this.listeners.forEach((l) => l());
  }

  private pending = new Set<Promise<unknown>>();

  /** Persist in the background; the in-memory state is already updated. */
  private persist(p: Promise<unknown>) {
    const tracked = p.catch(() => {
      if (!this.data.storageError) this.emit({ storageError: true });
    }).finally(() => this.pending.delete(tracked));
    this.pending.add(tracked);
  }

  /** Resolves when every queued write has finished. */
  async flush() {
    await Promise.all([...this.pending]);
  }

  async load() {
    try {
      const [saved, attempts, sessions, favorites, achievements, pending, lessonsSeen, myMelodies] = await Promise.all([
        loadSettings(), db.attempts.orderBy('ts').toArray(), db.sessions.orderBy('startedAt').toArray(),
        db.favorites.orderBy('createdAt').toArray(), getKV<Record<string, number>>('achievements', {}),
        getKV<PendingSession | null>('pending', null), getKV<Record<string, number>>('lessons-seen', {}),
        getKV<MyMelody[]>('my-melodies', []),
      ]);
      shareTime(sessions);
      const settings = { ...saved, name: USER_NAME || saved.name };
      audio.setVolume(settings.volume);
      audio.feedback = settings.feedbackSounds;
      this.emit({ loaded: true, storageError: false, settings, attempts, sessions, favorites, idx: buildIndex(attempts, settings), achievements, pending, lessonsSeen, myMelodies });
    } catch {
      // Storage blocked (private mode, sandboxed view): run fully in memory instead of hanging on "loading".
      this.emit({ loaded: true, storageError: true });
    }
  }

  addAttempt(a: Attempt) {
    addToIndex(this.data.idx, a, this.data.settings);
    this.emit({ attempts: [...this.data.attempts, a] });
    this.persist(db.attempts.add(a));
  }

  addSession(s: SessionRecord) {
    this.emit({ sessions: [...this.data.sessions, s] });
    this.persist(db.sessions.put(s));
    shareTime(this.data.sessions);
  }

  unlockAchievements(ids: string[]): string[] {
    const fresh = ids.filter((id) => !this.data.achievements[id]);
    if (!fresh.length) return [];
    const next = { ...this.data.achievements };
    fresh.forEach((id) => (next[id] = Date.now()));
    this.emit({ achievements: next });
    this.persist(setKV('achievements', next));
    return fresh;
  }

  updateSettings(patch: Partial<Settings>) {
    const settings = { ...this.data.settings, ...patch };
    audio.setVolume(settings.volume);
    audio.feedback = settings.feedbackSounds;
    const needsRebuild = patch.fluencyTargetMs !== undefined && patch.fluencyTargetMs !== this.data.settings.fluencyTargetMs;
    this.emit({ settings, idx: needsRebuild ? buildIndex(this.data.attempts, settings) : this.data.idx });
    this.persist(saveSettings(settings));
  }

  setPending(p: PendingSession) {
    this.data = { ...this.data, pending: p }; // no re-render: saved quietly after each answer
    this.persist(setKV('pending', p));
  }

  clearPending() {
    if (!this.data.pending) return;
    this.emit({ pending: null });
    this.persist(setKV('pending', null));
  }

  markLessonSeen(id: string) {
    if (this.data.lessonsSeen[id]) return;
    const next = { ...this.data.lessonsSeen, [id]: Date.now() };
    this.emit({ lessonsSeen: next });
    this.persist(setKV('lessons-seen', next));
  }

  addMyMelody(m: MyMelody) {
    const next = [...this.data.myMelodies, m];
    this.emit({ myMelodies: next });
    this.persist(setKV('my-melodies', next));
  }

  removeMyMelody(id: string) {
    const next = this.data.myMelodies.filter((m) => m.id !== id);
    this.emit({ myMelodies: next });
    this.persist(setKV('my-melodies', next));
  }

  addFavorite(f: Favorite) {
    this.emit({ favorites: [...this.data.favorites, f] });
    this.persist(db.favorites.put(f));
  }

  removeFavorite(id: string) {
    this.emit({ favorites: this.data.favorites.filter((f) => f.id !== id) });
    this.persist(db.favorites.delete(id));
  }

  /** Backup built from memory, so it includes the latest answers even if a write is still queued or storage is blocked. */
  snapshotBackup(): BackupFile {
    const d = this.data;
    return {
      app: 'noteflow', version: 1, exportedAt: new Date().toISOString(),
      attempts: d.attempts, sessions: d.sessions, favorites: d.favorites,
      kv: [{ key: 'settings', value: d.settings }, { key: 'achievements', value: d.achievements }, { key: 'lessons-seen', value: d.lessonsSeen }, { key: 'my-melodies', value: d.myMelodies }],
    };
  }

  /** Clears progress (keeps settings), in memory and on disk. */
  async reset() {
    await this.flush();
    this.emit({ attempts: [], sessions: [], favorites: [], achievements: {}, idx: new Map(), pending: null, lessonsSeen: {} });
    this.persist(resetAll());
    await this.flush();
    // A fresh start includes the welcome screens (name, sound check, what we'll learn).
    await this.updateSettings({ onboarded: false });
    await this.flush();
  }

  async reload() {
    await this.flush();
    await this.load();
  }
}

/** The cross-course summary reads practice time per day from here. */
function shareTime(sessions: SessionRecord[]) {
  const days: Record<string, { sec: number; fresh: number }> = {};
  for (const x of sessions) {
    const d = new Date(x.startedAt), day = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5);
    days[day] ??= { sec: 0, fresh: 0 };
    days[day].sec += Math.max(0, Math.round((x.endedAt - x.startedAt) / 1000));
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ days })); } catch { /* the summary only */ }
}

export const store = new Store();

const Ctx = createContext<Store>(store);

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => { void store.load(); }, []);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useApp(): AppData {
  const s = useContext(Ctx);
  return useSyncExternalStore(s.subscribe, s.getSnapshot);
}

export function useStore(): Store {
  return useContext(Ctx);
}

/** Applies theme and display-comfort settings to <html>. */
/** The theme in effect now: "evening" when chosen, or automatically late in the day. */
export function effectiveTheme(theme: Settings['theme'], autoEvening: boolean, now = Date.now()): Settings['theme'] {
  if (theme === 'evening') return 'evening';
  const h = new Date(now).getHours();
  if (autoEvening && (h >= 20 || h < 6)) return 'evening';
  return theme;
}

export function useThemeEffect(theme: Settings['theme'], comfort?: Pick<Settings, 'highContrast' | 'reduceMotion' | 'noteSize' | 'autoEvening'>) {
  const now = useNow(60_000);
  const eff = effectiveTheme(theme, !!comfort?.autoEvening, now);
  useEffect(() => {
    const el = document.documentElement;
    if (eff === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', eff);
    audio.setEvening(eff === 'evening');
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta && eff === 'evening') meta.setAttribute('content', '#24102a');
  }, [eff]);
  useEffect(() => {
    const el = document.documentElement;
    const set = (k: string, on: boolean, v = 'on') => (on ? el.setAttribute(k, v) : el.removeAttribute(k));
    set('data-contrast', !!comfort?.highContrast, 'high');
    set('data-motion', !!comfort?.reduceMotion, 'reduce');
    set('data-notesize', comfort?.noteSize === 'large', 'large');
  }, [comfort?.highContrast, comfort?.reduceMotion, comfort?.noteSize]);
}

export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useMemoOnce<T>(f: () => T): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(f, []);
}
