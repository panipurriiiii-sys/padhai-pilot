// `npm run test:e2e` - makes sure DB + (fresh-seeded) API are up on port 3199, runs the vitest e2e suite, cleans up.
// Env: E2E_KEEP=1 keeps the API/DB running afterwards. E2E_REBUILD=1 rebuilds the API first.
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, DB_PORT, apiEnv, assertLocalDb, run, stopDb } from './lib.mjs';

assertLocalDb();
const E2E_PORT = Number(process.env.E2E_API_PORT || 3199);
const up = (port) => new Promise((r) => {
  const s = net.connect(port, '127.0.0.1');
  s.on('connect', () => { s.destroy(); r(true); });
  s.on('error', () => r(false));
});
const wait = async (port, secs) => { for (let i = 0; i < secs && !(await up(port)); i++) await new Promise((r) => setTimeout(r, 1000)); return up(port); };
const kill = (p) => { if (p?.pid) spawnSync('taskkill', ['/PID', String(p.pid), '/T', '/F'], { stdio: 'ignore' }); };

const started = [];
let startedDb = false;
try {
  if (!(await up(DB_PORT))) {
    const db = spawn('node', ['scripts/local/db.mjs'], { cwd: ROOT, stdio: 'inherit' });
    started.push(db);
    startedDb = true;
    if (!(await wait(DB_PORT, 90))) throw new Error('local DB did not start');
  }
  await run('node', ['scripts/local/migrate.mjs']);
  await run('npm', ['run', 'local:seed']);

  if (await up(E2E_PORT)) throw new Error(`port ${E2E_PORT} already in use; set E2E_API_PORT or stop the process`);
  const api = spawn('node', ['scripts/local/api.mjs'], {
    cwd: ROOT, stdio: 'inherit',
    // SESSION_CHECK_TTL_MS=0: no per-instance session cache, so revocation tests are deterministic.
    env: { ...apiEnv({ PORT: String(E2E_PORT), SESSION_CHECK_TTL_MS: '0' }), LOCAL_API_PORT: String(E2E_PORT), LOCAL_API_REBUILD: process.env.E2E_REBUILD || '' },
  });
  started.push(api);
  if (!(await wait(E2E_PORT, 120))) throw new Error('API did not start');

  await run('npx', ['vitest', 'run', '--config', 'vitest.config.e2e.ts', ...process.argv.slice(2)], {
    cwd: join(ROOT, 'apps/api'),
    env: { ...process.env, E2E_API_URL: `http://localhost:${E2E_PORT}/api` },
  });
} finally {
  if (!process.env.E2E_KEEP) {
    started.forEach(kill);
    if (startedDb) stopDb();
  }
}
