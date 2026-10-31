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
import { BUILT_IN_PUBLISHED_THEME, validateThemeConfig, } from './config.js';
/** Validate an untrusted `GET /theme` payload. Returns null if it is not a well-formed, valid published theme. */
export function parsePublishedTheme(raw) {
    if (typeof raw !== 'object' || raw === null)
        return null;
    const r = raw;
    if (typeof r.revision !== 'number' || !Number.isInteger(r.revision) || r.revision < 0)
        return null;
    if (typeof r.revisionId !== 'string' || r.revisionId.length === 0 || r.revisionId.length > 64)
        return null;
    const validation = validateThemeConfig(r.config);
    if (!validation.ok || !validation.config)
        return null;
    return {
        revision: r.revision,
        revisionId: r.revisionId,
        checksum: typeof r.checksum === 'string' ? r.checksum.slice(0, 128) : '',
        publishedAt: typeof r.publishedAt === 'string' ? r.publishedAt : null,
        config: validation.config,
    };
}
export class ThemeClient {
    baseUrl;
    storage;
    fetchImpl;
    storageKey;
    timeoutMs;
    minInterval;
    now;
    current = BUILT_IN_PUBLISHED_THEME;
    fetchedAt = 0;
    inflight = null;
    constructor(options) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.storage = options.storage;
        this.fetchImpl = options.fetchImpl ?? ((...args) => fetch(...args));
        this.storageKey = options.storageKey ?? 'padhai.theme.v1';
        this.timeoutMs = options.timeoutMs ?? 8000;
        this.minInterval = options.minRefreshIntervalMs ?? 5 * 60 * 1000;
        this.now = options.now ?? (() => Date.now());
    }
    /** Synchronous current theme (cached or built-in default). Safe to call during first render. */
    getTheme() {
        return this.current;
    }
    /** Load the persisted theme (if any) into memory. Never throws. */
    async loadCached() {
        try {
            const raw = this.storage ? await this.storage.getItem(this.storageKey) : null;
            if (raw) {
                const record = JSON.parse(raw);
                const parsed = parsePublishedTheme(record.theme);
                if (parsed) {
                    this.current = parsed;
                    this.fetchedAt = typeof record.fetchedAt === 'number' ? record.fetchedAt : 0;
                }
            }
        }
        catch {
            // corrupt cache: keep the default
        }
        return this.current;
    }
    /** Cheap check used when the API reports a newer revision in `X-Theme-Revision`. */
    isStale(revisionId) {
        return !!revisionId && revisionId !== this.current.revisionId;
    }
    refresh(opts = {}) {
        if (this.inflight)
            return this.inflight;
        if (!opts.force && this.now() - this.fetchedAt < this.minInterval) {
            return Promise.resolve({ outcome: 'throttled', theme: this.current, changed: false });
        }
        this.inflight = this.doRefresh().finally(() => {
            this.inflight = null;
        });
        return this.inflight;
    }
    async persist() {
        if (!this.storage)
            return;
        try {
            const record = { theme: this.current, fetchedAt: this.fetchedAt };
            await this.storage.setItem(this.storageKey, JSON.stringify(record));
        }
        catch {
            // storage unavailable: memory cache only
        }
    }
    async doRefresh() {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;
        try {
            const headers = { Accept: 'application/json' };
            if (this.current.revision > 0)
                headers['If-None-Match'] = `"${this.current.revisionId}"`;
            const res = await this.fetchImpl(`${this.baseUrl}/theme`, {
                method: 'GET',
                headers,
                signal: controller?.signal,
            });
            if (res.status === 304) {
                this.fetchedAt = this.now();
                await this.persist();
                return { outcome: 'not-modified', theme: this.current, changed: false };
            }
            if (!res.ok)
                return { outcome: 'offline', theme: this.current, changed: false };
            const body = (await res.json());
            const parsed = parsePublishedTheme(body);
            if (!parsed)
                return { outcome: 'invalid', theme: this.current, changed: false };
            const changed = parsed.revisionId !== this.current.revisionId;
            this.current = parsed;
            this.fetchedAt = this.now();
            await this.persist();
            return { outcome: 'updated', theme: parsed, changed };
        }
        catch {
            return { outcome: 'offline', theme: this.current, changed: false };
        }
        finally {
            if (timer)
                clearTimeout(timer);
        }
    }
}
