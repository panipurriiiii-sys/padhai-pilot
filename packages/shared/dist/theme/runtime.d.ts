/**
 * Platform-neutral runtime theme loader (web + React Native).
 *
 * Strategy ("stale-while-revalidate, version-keyed, no polling"):
 *  1. First render ALWAYS uses a synchronous theme: the cached published theme if present, else the built-in default.
 *  2. `refresh()` issues one conditional GET /theme (If-None-Match: <revisionId>). 304 = nothing to do.
 *  3. Responses are re-validated with the same validator the API uses; anything invalid is discarded.
 *  4. The validated theme + ETag are cached. Offline / errors keep whatever is cached (or the default).
 *  5. Refresh triggers are deliberate (startup, foreground, a newer `X-Theme-Revision` header) and throttled.
 */
import { type PublishedTheme } from './config.js';
export interface ThemeStorage {
    getItem(key: string): string | null | Promise<string | null>;
    setItem(key: string, value: string): void | Promise<void>;
}
export interface ThemeClientOptions {
    /** API base such as `https://host/api` (no trailing slash needed) */
    baseUrl: string;
    storage?: ThemeStorage;
    fetchImpl?: typeof fetch;
    storageKey?: string;
    timeoutMs?: number;
    /** Minimum gap between network refreshes unless forced (default 5 minutes) */
    minRefreshIntervalMs?: number;
    now?: () => number;
}
export type RefreshOutcome = 'updated' | 'not-modified' | 'throttled' | 'offline' | 'invalid';
export interface RefreshResult {
    outcome: RefreshOutcome;
    theme: PublishedTheme;
    changed: boolean;
}
/** Validate an untrusted `GET /theme` payload. Returns null if it is not a well-formed, valid published theme. */
export declare function parsePublishedTheme(raw: unknown): PublishedTheme | null;
export declare class ThemeClient {
    private readonly baseUrl;
    private readonly storage?;
    private readonly fetchImpl;
    private readonly storageKey;
    private readonly timeoutMs;
    private readonly minInterval;
    private readonly now;
    private current;
    private fetchedAt;
    private inflight;
    constructor(options: ThemeClientOptions);
    /** Synchronous current theme (cached or built-in default). Safe to call during first render. */
    getTheme(): PublishedTheme;
    /** Load the persisted theme (if any) into memory. Never throws. */
    loadCached(): Promise<PublishedTheme>;
    /** Cheap check used when the API reports a newer revision in `X-Theme-Revision`. */
    isStale(revisionId: string | null | undefined): boolean;
    refresh(opts?: {
        force?: boolean;
    }): Promise<RefreshResult>;
    private persist;
    private doRefresh;
}
