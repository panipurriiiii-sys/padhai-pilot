// `npm run local:db` - starts a throwaway embedded PostgreSQL (real Postgres binaries, no Docker).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { PGDATA, DB_PORT, DB_USER, DB_PASS, DB_NAME } from './lib.mjs';

const pg = new EmbeddedPostgres({
  databaseDir: PGDATA,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  persistent: true,
  onLog: () => {},
  onError: (m) => { if (process.env.LOCAL_DB_VERBOSE) console.error(m); },
});

const fresh = !existsSync(join(PGDATA, 'PG_VERSION'));
if (fresh) await pg.initialise();
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
