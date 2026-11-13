import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyRemote, collect, decodeKey, encodeKey, isShared, pullProgress, pushProgress, shouldPull } from './progressSync';

class Mem {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

let ls: Mem;
beforeEach(() => { ls = new Mem(); ls.setItem('wordflow.fam.moved', '1'); vi.stubGlobal('localStorage', ls); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('which keys are copied', () => {
  it('keeps progress and leaves device settings, lesson spots and piano out', () => {
    for (const k of ['data.en', 'data.hist', 'enGrammar', 'enReading', 'courses', 'schedule', 'gotTots']) expect(isShared(k)).toBe(true);
    for (const k of ['textSize', 'winsSeen', 'syncedAt', 'course', 'lessonSpot.hist', 'nf-mood', 'data.notes']) expect(isShared(k)).toBe(false);
  });
  it('collects only the signed-in user', () => {
    ls.setItem('wordflow.u.guy.data.en', '{"a":1}');
    ls.setItem('wordflow.u.guy.textSize', '20');
    ls.setItem('wordflow.u.guy.lessonSpot.geo', '{}');
    ls.setItem('wordflow.u.dikla.data.en', '{"b":2}');
    ls.setItem('wordflow.user', 'guy');
    expect(collect('guy', ls)).toEqual({ 'data.en': '{"a":1}' });
  });
  it('encodes key names the database does not allow', () => {
    for (const k of ['data.en', 'lessonSpot.a/b', 'x%y$#[]']) { expect(encodeKey(k)).not.toMatch(/[.$#[\]/]/); expect(decodeKey(encodeKey(k))).toBe(k); }
  });
});

describe('newer wins', () => {
  const r = (at: number, device = 'other') => ({ at, device, data: {} });
  it('takes a newer copy from another device only', () => {
    expect(shouldPull(r(200), 100, 'me')).toBe(true);
    expect(shouldPull(r(100), 100, 'me')).toBe(false);
    expect(shouldPull(r(50), 100, 'me')).toBe(false);
    expect(shouldPull(r(200, 'me'), 100, 'me')).toBe(false);
    expect(shouldPull(null, 0, 'me')).toBe(false);
  });
  it('replaces copied keys and keeps device settings', () => {
    ls.setItem('wordflow.u.guy.data.en', 'old');
    ls.setItem('wordflow.u.guy.data.math', 'gone');
    ls.setItem('wordflow.u.guy.textSize', '22');
    applyRemote('guy', { at: 300, device: 'x', data: { [encodeKey('data.en')]: 'new', [encodeKey('enGrammar')]: 'g' } }, ls);
    expect(ls.getItem('wordflow.u.guy.data.en')).toBe('new');
    expect(ls.getItem('wordflow.u.guy.enGrammar')).toBe('g');
    expect(ls.getItem('wordflow.u.guy.data.math')).toBeNull();
    expect(ls.getItem('wordflow.u.guy.textSize')).toBe('22');
    expect(ls.getItem('wordflow.u.guy.syncedAt')).toBe('300');
  });
});

describe('with the network', () => {
  const reply = (body: unknown) => ({ ok: true, json: async () => body });
  it('pulls a newer copy from another device', async () => {
    ls.setItem('wordflow.user', 'guy'); ls.setItem('wordflow.device', 'me'); ls.setItem('wordflow.u.guy.data.en', 'old');
    const f = vi.fn(async () => reply({ at: 500, device: 'phone', data: { 'data%2Een': 'fresh' } }));
    vi.stubGlobal('fetch', f);
    await pullProgress();
    expect(ls.getItem('wordflow.u.guy.data.en')).toBe('fresh');
    expect(String((f.mock.calls[0] as unknown[])[0])).toMatch(/\/progress\/guy\.json$/);
  });
  it('sends the local copy when there is none yet', async () => {
    ls.setItem('wordflow.user', 'guy'); ls.setItem('wordflow.device', 'me'); ls.setItem('wordflow.u.guy.data.en', 'mine');
    const f = vi.fn(async (_u: string, o?: RequestInit) => reply(o?.method === 'PUT' ? 'ok' : null));
    vi.stubGlobal('fetch', f);
    await pullProgress();
    await vi.waitFor(() => expect(f).toHaveBeenCalledTimes(2));
    const put = f.mock.calls[1][1]!;
    expect(put.method).toBe('PUT');
    expect(JSON.parse(String(put.body))).toMatchObject({ device: 'me', data: { 'data%2Een': 'mine' } });
  });
  it('opens without waiting when the network hangs', async () => {
    ls.setItem('wordflow.user', 'guy');
    vi.stubGlobal('fetch', (_u: string, o: RequestInit) => new Promise((_, no) => o.signal?.addEventListener('abort', () => no(new Error('abort')))));
    const t = Date.now();
    await pullProgress(100);
    expect(Date.now() - t).toBeLessThan(1000);
  });
  it('pushes a moment after a finish, with the time it sent', async () => {
    vi.useFakeTimers();
    ls.setItem('wordflow.user', 'guy'); ls.setItem('wordflow.device', 'me'); ls.setItem('wordflow.u.guy.data.en', 'x');
    const f = vi.fn(async () => reply('ok'));
    vi.stubGlobal('fetch', f);
    pushProgress();
    expect(f).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1500);
    expect(f).toHaveBeenCalledTimes(1);
    expect(Number(ls.getItem('wordflow.u.guy.syncedAt'))).toBeGreaterThan(0);
  });
});
