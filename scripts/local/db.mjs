// `npm run local:db` - starts a throwaway embedded PostgreSQL (real Postgres binaries, no Docker).
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { LOCAL_DIR, PGDATA, DB_PORT, DB_USER, DB_PASS, DB_NAME } from './lib.mjs';

const require = createRequire(import.meta.url);
const pg = new EmbeddedPostgres({
  databaseDir: PGDATA,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  persistent: true,
  // Windows defaults to WIN1252, which cannot store e.g. the rupee sign: always UTF8.
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {},
  onError: (m) => { if (process.env.LOCAL_DB_VERBOSE) console.error(m); },
});

const fresh = !existsSync(join(PGDATA, 'PG_VERSION'));
if (fresh) {
  // A previous failed init leaves a non-empty dir without PG_VERSION, which makes initdb refuse to run.
  if (existsSync(PGDATA)) rmSync(PGDATA, { recursive: true, force: true });
  mkdirSync(dirname(PGDATA), { recursive: true });
  try {
    await pg.initialise();
  } catch (e) {
    // embedded-postgres sometimes throws an empty error on Windows: run initdb directly to get the real message.
    const msg = e instanceof Error && e.message ? e.message : String(e || '');
    console.error(`[local:db] initialise() failed${msg ? `: ${msg}` : ' with an empty error'}; retrying with initdb directly.`);
    if (existsSync(PGDATA)) rmSync(PGDATA, { recursive: true, force: true });
    const pkgDir = dirname(require.resolve(`@embedded-postgres/${process.platform}-${process.arch === 'x64' ? 'x64' : process.arch}/package.json`));
    const exe = join(pkgDir, 'native', 'bin', process.platform === 'win32' ? 'initdb.exe' : 'initdb');
    const pwFile = join(LOCAL_DIR, 'pgpass.tmp');
    writeFileSync(pwFile, DB_PASS);
    const r = spawnSync(exe, [`--pgdata=${PGDATA}`, `--username=${DB_USER}`, `--pwfile=${pwFile}`, '--auth=password', '--encoding=UTF8', '--locale=C'], { encoding: 'utf8' });
    rmSync(pwFile, { force: true });
    if (r.status !== 0) {
      console.error(r.stdout, r.stderr);
      if (/administrator|elevated|root/i.test(`${r.stdout}${r.stderr}`)) console.error('[local:db] PostgreSQL refuses to run as Administrator: use a normal (non-elevated) terminal.');
      process.exit(1);
    }
  }
}
await pg.start();
try { await pg.createDatabase(DB_NAME); } catch { /* already exists */ }
console.log(`[local:db] PostgreSQL ready on 127.0.0.1:${DB_PORT} db=${DB_NAME} user=${DB_USER} (data: .local/pgdata). Ctrl+C to stop.`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  try { await pg.stop(); } catch { /* ignore */ }
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
