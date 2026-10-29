import crypto from 'crypto';

export interface RedisEnvironmentConfig {
  url: string | null;
  token: string | null;
  cacheEnabled: boolean;
  rateLimitEnabled: boolean;
  failClosedOnAuth: boolean;
  timeoutMs: number;
}

/**
 * Standard centralized Redis configuration loader.
 * Supports Upstash Redis REST, Vercel KV Marketplace, and local fallback.
 */
export function loadRedisConfig(): RedisEnvironmentConfig {
  const isRedisExplicitlyDisabled = process.env.REDIS_ENABLED === 'false';

  const url = isRedisExplicitlyDisabled
    ? null
    : process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_REST_API_URL ||
      process.env.REDIS_URL ||
      null;

  const token = isRedisExplicitlyDisabled
    ? null
    : process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.KV_REST_API_TOKEN ||
      null;

  const cacheEnabled =
    !isRedisExplicitlyDisabled &&
    process.env.REDIS_CACHE_ENABLED !== 'false' &&
    Boolean(url && token);

  const rateLimitEnabled =
    !isRedisExplicitlyDisabled && process.env.REDIS_RATE_LIMIT_ENABLED !== 'false';

  // Strict rate limit failure mode: if true, auth endpoints fail closed on Redis outage.
  // Defaults to false for development resilience, configurable for production hardened security.
  const failClosedOnAuth = process.env.REDIS_FAIL_CLOSED_AUTH === 'true';

  // 3-second bounded timeout to prevent serverless function hangs
  const timeoutMs = Number(process.env.REDIS_TIMEOUT_MS) || 3000;

  return {
    url,
    token,
    cacheEnabled,
    rateLimitEnabled,
    failClosedOnAuth,
    timeoutMs,
  };
}

/**
 * Prefix constant guaranteeing zero cross-environment collision.
 */
export const REDIS_KEY_VERSION = 'padhai:v1';

/**
 * Hash raw identifiers (e.g. emails, student roll numbers, sensitive IDs)
 * with SHA-256 before using them in Redis keys.
 * This guarantees no PII is ever leaked into Redis logs, keys, or external metrics.
 */
export function hashIdentifier(rawIdentifier: string): string {
  if (!rawIdentifier) return 'anon';
  return crypto
    .createHash('sha256')
    .update(rawIdentifier.trim().toLowerCase())
    .digest('hex')
    .substring(0, 32); // 32-char hex is secure and reduces key size to save bytes
}

/**
 * Key Generators with strict tenant and version isolation
 */
export const RedisKeys = {
  version: REDIS_KEY_VERSION,

  tenantBranding(instituteId: string): string {
    return `${REDIS_KEY_VERSION}:tenant:${instituteId}:branding`;
  },

  tenantFeatures(instituteId: string): string {
    return `${REDIS_KEY_VERSION}:tenant:${instituteId}:features`;
  },

  teacherDashboard(instituteId: string, teacherId: string): string {
    return `${REDIS_KEY_VERSION}:tenant:${instituteId}:teacher:${teacherId}:dashboard`;
  },

  rateLimit(action: string, identifier: string): string {
    const hashed = hashIdentifier(identifier);
    return `${REDIS_KEY_VERSION}:rate:${action}:${hashed}`;
  },

  tenantPrefix(instituteId: string): string {
    return `${REDIS_KEY_VERSION}:tenant:${instituteId}:`;
  },
};

/**
 * Authoritative TTL constants (in seconds)
 */
export const RedisTTLs = {
  BRANDING_SECONDS: 900, // 15 minutes
  FEATURES_SECONDS: 900, // 15 minutes
  DASHBOARD_SECONDS: 300, // 5 minutes
  DEFAULT_CACHE_SECONDS: 300, // 5 minutes
};

/**
 * Standard Rate Limit Profiles
 */
export interface RateLimitProfile {
  maxRequests: number;
  windowSeconds: number;
  action: string;
}

export const RateLimitProfiles: Record<string, RateLimitProfile> = {
  login: {
    action: 'login',
    maxRequests: 5,
    windowSeconds: 60,
  },
  register: {
    action: 'register',
    maxRequests: 3,
    windowSeconds: 60,
  },
  forgotPassword: {
    action: 'forgot_password',
    maxRequests: 3,
    windowSeconds: 300, // 3 attempts per 5 minutes
  },
  invitationValidate: {
    action: 'invitation_validate',
    maxRequests: 10,
    windowSeconds: 60, // 10 lookups per minute
  },
  default: {
    action: 'api',
    maxRequests: 30,
    windowSeconds: 60,
  },
};

