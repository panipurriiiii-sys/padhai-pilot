import { randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Demo mode seeds in-memory demo accounts and demo-login endpoints. It is hard-disabled in
 * production so no deployed environment can ever expose built-in credentials.
 */
export function isDemoMode(): boolean {
  return !isProduction();
}

let cachedSecret: string | undefined;

// Secrets that were committed to source control at some point and must never be trusted in production.
const COMPROMISED_SECRETS = new Set(['padhaipilot-production-secret-key-2026']);

/** JWT signing secret. Production refuses to start without a strong one; dev gets a per-process random one. */
export function getJwtSecret(): string {
  if (cachedSecret) return cachedSecret;
  const configured = process.env.JWT_SECRET?.trim();
  if (isProduction() && configured && COMPROMISED_SECRETS.has(configured)) {
    throw new Error('JWT_SECRET is a publicly known value from the repository history. Rotate it before deploying.');
  }
  if (configured && configured.length >= 32) {
    cachedSecret = configured;
  } else if (isProduction()) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters in production.');
  } else {
    cachedSecret = randomBytes(48).toString('hex');
  }
  return cachedSecret;
}

export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '12h';
const COOKIE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

/**
 * CORS allow-list from CORS_ORIGINS (comma separated). Requests with no Origin header
 * (native mobile app, server-to-server) are allowed because CORS is a browser-only control.
 * Outside production an unset list falls back to localhost origins.
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const configured = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (configured.includes(origin.replace(/\/$/, ''))) return true;
  if (!isProduction() && configured.length === 0) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }
  return false;
}

export const CORS_METHODS = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'];
export const CORS_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'];

export const corsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) =>
    cb(null, isOriginAllowed(origin)),
  credentials: true,
  methods: CORS_METHODS,
  allowedHeaders: CORS_HEADERS,
};
