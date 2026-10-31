import { describe, it, expect, vi } from 'vitest';
import { ThemeClient, parsePublishedTheme, type ThemeStorage } from './runtime.js';
import { DEFAULT_THEME_CONFIG, BUILT_IN_REVISION_ID } from './config.js';

const published = (revision: number, primary = '#1677FF') => ({
  revision,
  revisionId: `r${revision}-abc`,
  checksum: 'abc',
  publishedAt: '2026-01-01T00:00:00.000Z',
  config: { ...DEFAULT_THEME_CONFIG, brand: { primary } },
});

const memoryStorage = (): ThemeStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

const res = (status: number, body?: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body }) as Response;

describe('ThemeClient', () => {
  it('starts on the built-in default (safe first render, offline)', async () => {
    const c = new ThemeClient({ baseUrl: 'http://x/api', fetchImpl: vi.fn().mockRejectedValue(new Error('offline')) as never });
    expect(c.getTheme().revisionId).toBe(BUILT_IN_REVISION_ID);
    const r = await c.refresh({ force: true });
    expect(r.outcome).toBe('offline');
    expect(c.getTheme().revisionId).toBe(BUILT_IN_REVISION_ID);
  });

  it('applies and caches a newer revision, then restores it offline after restart', async () => {
    const storage = memoryStorage();
    const fetchImpl = vi.fn().mockResolvedValue(res(200, published(3, '#0A5BD6')));
    const a = new ThemeClient({ baseUrl: 'http://x/api/', storage, fetchImpl: fetchImpl as never });
    const result = await a.refresh({ force: true });
    expect(result).toMatchObject({ outcome: 'updated', changed: true });
    expect(fetchImpl.mock.calls[0][0]).toBe('http://x/api/theme');
    expect(a.getTheme().config.brand.primary).toBe('#0A5BD6');

    // "app restart" while offline
    const b = new ThemeClient({ baseUrl: 'http://x/api', storage, fetchImpl: vi.fn().mockRejectedValue(new Error('offline')) as never });
    await b.loadCached();
    expect(b.getTheme().revisionId).toBe('r3-abc');
    expect((await b.refresh({ force: true })).outcome).toBe('offline');
    expect(b.getTheme().revisionId).toBe('r3-abc');
  });

  it('uses a conditional request and keeps the theme on 304', async () => {
    const storage = memoryStorage();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(res(200, published(2)))
      .mockResolvedValueOnce(res(304));
    const c = new ThemeClient({ baseUrl: 'http://x/api', storage, fetchImpl: fetchImpl as never });
    await c.refresh({ force: true });
    const r = await c.refresh({ force: true });
    expect(r).toMatchObject({ outcome: 'not-modified', changed: false });
    expect((fetchImpl.mock.calls[1][1] as RequestInit).headers).toMatchObject({ 'If-None-Match': '"r2-abc"' });
  });

  it('throttles refreshes (no polling) unless forced, and detects stale revisions from headers', async () => {
    let t = 1_000_000;
    const fetchImpl = vi.fn().mockResolvedValue(res(200, published(1)));
    const c = new ThemeClient({ baseUrl: 'http://x/api', fetchImpl: fetchImpl as never, now: () => t, minRefreshIntervalMs: 60_000 });
    await c.refresh();
    expect((await c.refresh()).outcome).toBe('throttled');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    t += 61_000;
    await c.refresh();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(c.isStale('r9-zzz')).toBe(true);
    expect(c.isStale('r1-abc')).toBe(false);
  });

  it('discards invalid or malicious payloads', async () => {
    const evil = { ...published(5), config: { ...DEFAULT_THEME_CONFIG, brand: { primary: 'url(javascript:alert(1))' } } };
    const c = new ThemeClient({ baseUrl: 'http://x/api', fetchImpl: vi.fn().mockResolvedValue(res(200, evil)) as never });
    expect((await c.refresh({ force: true })).outcome).toBe('invalid');
    expect(c.getTheme().revisionId).toBe(BUILT_IN_REVISION_ID);
    expect(parsePublishedTheme({ revision: -1 })).toBeNull();
    expect(parsePublishedTheme(null)).toBeNull();
  });

  it('survives a corrupt cache', async () => {
    const storage = memoryStorage();
    storage.data.set('padhai.theme.v1', '{not json');
    const c = new ThemeClient({ baseUrl: 'http://x/api', storage });
    await expect(c.loadCached()).resolves.toMatchObject({ revisionId: BUILT_IN_REVISION_ID });
  });
});
