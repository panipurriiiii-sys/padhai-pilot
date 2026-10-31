// `npm run local:api` - builds (if needed) and runs the API on :3001 against the local DB.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, apiEnv, assertLocalDb, run } from './lib.mjs';

assertLocalDb();
const env = apiEnv();
const api = join(ROOT, 'apps/api');
const main = join(api, 'dist/main.js');
// LOCAL_API_REBUILD=1 forces a rebuild; otherwise dist/ is reused when present.
if (process.env.LOCAL_API_REBUILD || !existsSync(main)) {
  try {
    await run('npm', ['run', 'build', '--workspace=@padhai-pilot/api'], { env });
  } catch (e) {
    // tsc still emits JS when there are type errors (noEmitOnError is off). Keep going locally, but shout.
    if (!existsSync(main)) throw e;
    console.warn('[local:api] WARNING: tsc reported type errors; running the emitted dist anyway (local only).');
  }
}
await run('node', ['dist/main.js'], { cwd: api, env });
