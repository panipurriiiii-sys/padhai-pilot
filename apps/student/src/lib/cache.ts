/**
 * Lightweight in-memory + sessionStorage cache for static-ish API responses.
 * Prevents redundant API calls on tab switches and within the same browser session.
 */

interface CacheEntry<T> {
  v: T;
  t: number;
}

const _mem: Record<string, CacheEntry<unknown>> = {};

/**
 * Requests already in flight, keyed the same way as the cache.
 *
 * Without this, two callers asking for the same key before the first response lands both issue a
 * request: the cache is only written on completion. That happens routinely now that each tab
 * fetches its own resources (the boot sequence and the tab effect can ask at the same moment),
 * and it is exactly the duplicate traffic the cache exists to prevent.
 */
const _inflight = new Map<string, Promise<unknown>>();

/**
 * Wraps an async data-fetching function with a TTL cache.
 * Checks in-memory first (survives tab switches), then sessionStorage (survives page refresh),
 * then an in-flight request for the same key, and only then calls `fn`.
 *
 * @param key     Unique cache key
 * @param ttlMs   Time-to-live in milliseconds (e.g. 5 * 60 * 1000 for 5 min)
 * @param fn      The async fetch function to call on cache miss
 */
export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();

  // 1. In-memory hit
  const mem = _mem[key] as CacheEntry<T> | undefined;
  if (mem && now - mem.t < ttlMs) {
    return Promise.resolve(mem.v);
  }

  // 2. sessionStorage hit (survives F5)
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(`pp_cache_${key}`) : null;
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (now - entry.t < ttlMs) {
        _mem[key] = entry as CacheEntry<unknown>;
        return Promise.resolve(entry.v);
      }
    }
  } catch {
    // sessionStorage unavailable (private mode / blocked) — continue to fetch
  }

  // 3. The same request is already on the wire — join it instead of starting a second one.
  const pending = _inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  // 4. Cache miss — fetch, store in both layers
  const request = fn()
    .then((v) => {
      const entry: CacheEntry<T> = { v, t: Date.now() };
      _mem[key] = entry as CacheEntry<unknown>;
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`pp_cache_${key}`, JSON.stringify(entry));
        }
      } catch {
        // sessionStorage write failed (quota exceeded / blocked) — in-memory only
      }
      return v;
    })
    .finally(() => {
      _inflight.delete(key);
    });

  _inflight.set(key, request);
  return request;
}

/** Manually invalidate a cache entry (e.g. after a mutation). */
export function invalidate(key: string): void {
  delete _mem[key];
  _inflight.delete(key);
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`pp_cache_${key}`);
    }
  } catch {
    // ignore
  }
}
