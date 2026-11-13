import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { famUrl, familyId } from './db';
import { FIRST_META, peopleOf, setupFamily } from './families';

class Mem {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
}
let ls: Mem;
const ok = (v: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(v) } as Response);
beforeEach(() => { ls = new Mem(); vi.stubGlobal('localStorage', ls); vi.stubGlobal('location', { href: 'https://x.io/wordflow/', search: '' }); vi.stubGlobal('history', { replaceState: vi.fn() }); });
afterEach(() => vi.unstubAllGlobals());

describe('which family', () => {
  it('a fresh device has none', () => { expect(familyId()).toBeNull(); expect(famUrl()).toBe(''); });
  it('a device already in use belongs to the first family, but syncs only after the move', () => {
    ls.setItem('wordflow.user', 'ayala');
    expect(familyId()).toBe('argas');
    expect(famUrl()).toBe('');
    ls.setItem('wordflow.fam.moved', '1');
    expect(famUrl()).toMatch(/\/families\/argas$/);
  });
  it('an invite moves the device to the family and signs out', async () => {
    ls.setItem('wordflow.family', 'argas'); ls.setItem('wordflow.user', 'guy');
    vi.stubGlobal('location', { href: 'https://x.io/wordflow/?join=fabc123', search: '?join=fabc123' });
    vi.stubGlobal('fetch', vi.fn(() => ok({ name: 'כהן', users: { abc: { name: 'רון', she: false, role: 'parent' } } })));
    await setupFamily();
    expect(ls.getItem('wordflow.family')).toBe('fabc123');
    expect(ls.getItem('wordflow.user')).toBeNull();
    expect(JSON.parse(ls.getItem('wordflow.fam.meta')!).name).toBe('כהן');
  });
});

describe('moving the first family', () => {
  it('copies the old data once, then the people', async () => {
    ls.setItem('wordflow.user', 'guy');
    const calls: [string, RequestInit | undefined][] = [];
    vi.stubGlobal('fetch', vi.fn((u: string, o?: RequestInit) => {
      calls.push([u, o]);
      if (u.endsWith('/families/argas/meta/migrated.json')) return ok(null);
      if (u.endsWith('/time.json')) return ok({ guy: { en: {} } });
      if (u.endsWith('/families/argas/meta.json') && !o?.method) return ok(null);
      return ok(null);
    }));
    await setupFamily();
    const patch = calls.find(([u, o]) => u.endsWith('/families/argas.json') && o?.method === 'PATCH')!;
    const body = JSON.parse(patch[1]!.body as string);
    expect(body.time).toEqual({ guy: { en: {} } });
    expect(body['meta/migrated']).toBeGreaterThan(0);
    expect(ls.getItem('wordflow.fam.moved')).toBe('1');
    expect(calls.some(([u, o]) => u.endsWith('/families/argas/meta.json') && o?.method === 'PATCH')).toBe(true);
  });
  it('does not copy again when another device already moved it', async () => {
    ls.setItem('wordflow.user', 'guy');
    const f = vi.fn((u: string, _o?: RequestInit) => ok(u.endsWith('migrated.json') ? 123 : { name: 'ארגס', users: FIRST_META.users }));
    vi.stubGlobal('fetch', f);
    await setupFamily();
    expect(f.mock.calls.some(([, o]) => (o as RequestInit | undefined)?.method)).toBe(false);
  });
});

describe('people', () => {
  it('keeps the first family as it was, in order and with roles', () => {
    const p = peopleOf(FIRST_META);
    expect(p.map((u) => u.id)).toEqual(['guy', 'dikla', 'ayala', 'ofir', 'omer', 'ido']);
    expect(p.filter((u) => u.role === 'tot').map((u) => u.id)).toEqual(['omer', 'ido']);
  });
});

describe('courses by role', () => {
  it('little ones get only their courses, and nobody else gets them', async () => {
    const { coursesFor } = await import('./course');
    expect(coursesFor('tot').map((c) => c.id).sort()).toEqual(['alef', 'tinyen', 'tots']);
    for (const r of ['kid', 'parent'] as const) { const ids = coursesFor(r).map((c) => c.id); expect(ids).toContain('en'); expect(ids).not.toContain('alef'); expect(ids).not.toContain('tots'); }
  });
});
