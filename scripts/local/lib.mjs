// Shared config for the local dev harness (DEV ONLY - never point this at a real database).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LOCAL_DIR = join(ROOT, '.local');
export const PGDATA = join(LOCAL_DIR, 'pgdata');
export const DB_PORT = Number(process.env.LOCAL_DB_PORT || 54329);
export const DB_USER = 'padhai';
export const DB_PASS = 'padhai_local';
export const DB_NAME = 'padhai_local';
export const API_PORT = Number(process.env.LOCAL_API_PORT || 3001);
export const WEB_PORTS = { teacher: 3000, student: 3002, admin: 3003, web: 3004 };
export const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:${DB_PORT}/${DB_NAME}?schema=public`;
export const API_URL = `http://localhost:${API_PORT}/api`;

mkdirSync(LOCAL_DIR, { recursive: true });

/** Random JWT secret generated once and kept (gitignored) so sessions survive restarts. */
export function jwtSecret() {
  const f = join(LOCAL_DIR, 'jwt-secret');
  if (!existsSync(f)) writeFileSync(f, randomBytes(48).toString('hex'));
  return readFileSync(f, 'utf8').trim();
}

/** Refuse anything that is not the throwaway local database. */
export function assertLocalDb(url = DATABASE_URL) {
  const u = new URL(url);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname) || Number(u.port) !== DB_PORT) {
    throw new Error(`Refusing to run: DATABASE_URL must point at the local harness DB (127.0.0.1:${DB_PORT}).`);
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to run with NODE_ENV=production.');
}

const corsOrigins = Object.values(WEB_PORTS).flatMap((p) => [`http://localhost:${p}`, `http://127.0.0.1:${p}`]);

/** Environment for the API: scrubbed process.env (no Redis/Upstash, no prod URLs) + local values. */
export function apiEnv(extra = {}) {
  const env = { ...process.env };
  for (const k of Object.keys(env)) {
    if (/^(UPSTASH_|KV_|REDIS_|POSTGRES_|DATABASE_URL|PRISMA_DATABASE_URL|VERCEL)/i.test(k)) delete env[k];
  }
  return {
    ...env,
    NODE_ENV: 'development',
    PORT: String(API_PORT),
    DATABASE_URL,
    JWT_SECRET: jwtSecret(),
    CORS_ORIGINS: corsOrigins.join(','),
    ...extra,
  };
}

export function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', cwd: ROOT, ...opts });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`${cmd} ${args.join(' ')} exited ${c}`))));
    p.on('error', rej);
  });
}

/** Stop the harness PostgreSQL cleanly (killing node alone orphans postgres.exe on Windows). */
export function stopDb() {
  const dir = join(ROOT, 'node_modules', '@embedded-postgres', `${process.platform}-${process.arch}`, 'native', 'bin');
  const exe = join(dir, process.platform === 'win32' ? 'pg_ctl.exe' : 'pg_ctl');
  if (!existsSync(exe) || !existsSync(join(PGDATA, 'postmaster.pid'))) return;
  spawnSync(exe, ['stop', '-D', PGDATA, '-m', 'fast', '-w'], { stdio: 'ignore' });
}
