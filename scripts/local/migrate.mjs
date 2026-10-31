// `npm run local:migrate` - applies apps/api/prisma/migrations to the LOCAL db only, then checks for drift.
import { join } from 'node:path';
import { ROOT, DATABASE_URL, assertLocalDb, run } from './lib.mjs';

assertLocalDb();
process.env.DATABASE_URL = DATABASE_URL;
const schema = join(ROOT, 'apps/api/prisma/schema.prisma');
await run('npx', ['prisma', 'validate', '--schema', `"${schema}"`]);
await run('npx', ['prisma', 'migrate', 'deploy', '--schema', `"${schema}"`]);
// Drift check: the DB produced by the migrations must equal schema.prisma (empty diff => exit 0).
await run('npx', ['prisma', 'migrate', 'diff', '--from-url', `"${DATABASE_URL}"`, '--to-schema-datamodel', `"${schema}"`, '--exit-code']);
console.log('[local:migrate] migrations applied, schema matches schema.prisma');
