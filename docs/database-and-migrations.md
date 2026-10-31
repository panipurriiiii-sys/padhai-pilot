# Database and migrations

Canonical schema: `apps/api/prisma/schema.prisma`. Migration history: `apps/api/prisma/migrations/`.
Nothing in this document has been run against a real PostgreSQL server. The SQL was generated offline with
`prisma migrate diff` and replayed on **PGlite** (an in-process WASM PostgreSQL) with sample rows to confirm
that the chain applies, preserves existing rows and rejects duplicates. That is a rehearsal of the SQL, not a
substitute for the rehearsal on your own throw-away database below.

## Migration files (apply in this order)

| # | Directory | Purpose | Safe on a populated DB? |
|---|---|---|---|
| 1 | `20261031000000_baseline` | Recreates the **pre-change** production tables exactly as the old schema defined them. **Do not run it on production** - mark it applied with `migrate resolve`. | n/a (not executed on prod) |
| 2 | `20261031000100_t03_backend_core` | Additive: new tables (faculty invitations, outbox, academic queries + replies, study tasks, support requests, student documents, attendance corrections, batch-faculty assignments, test questions/answers, platform announcements), new nullable/defaulted columns (`User.tokenVersion`, `User.notificationPreferences`, Institute status/subdomain/customDomain/limits, membership `updatedAt`/`revokedAt`, test `closesAt`/`totalMarks`, multi-subject marks, dedupe keys) and indexes. The only `ALTER COLUMN` is `TestQuiz.questions SET DEFAULT '[]'`. No drops, no data rewrites. | Yes |
| 3 | `20261031000200_enrollment_roll_unique` | One statement: unique index on `Enrollment(batchId, rollNumber)`. Kept separate because it is the only change that can fail on existing data (duplicate roll numbers in a batch). | Fails cleanly (no partial change) if duplicates exist - see pre-check |

Pre-check for migration 3 (read-only):

```sql
SELECT "batchId", "rollNumber", count(*) FROM "Enrollment" GROUP BY 1,2 HAVING count(*) > 1;
```

## Connection URLs

* The API reads, in order: `DATABASE_URL_POOLED`, `DATABASE_URL`, `POSTGRES_URL` (first value that starts with
  `postgres://` or `postgresql://`). `PRISMA_DATABASE_URL` (`prisma+postgres://`, Accelerate/HTTP) is **ignored** because
  the API uses the regular query engine over TCP.
* At runtime the code appends `connection_limit=1&pool_timeout=20` unless the URL already carries them
  (`DB_CONNECTION_LIMIT` overrides the 1). That is the serverless-safe default: instances x pool size is what exhausts a
  managed database. Trade-off: with Fluid-compute concurrency a single connection serialises queries inside one
  instance; raise `DB_CONNECTION_LIMIT` only if you measure queueing.
* `schema.prisma` has **no `directUrl`** on purpose: the Vercel project has no `DIRECT_URL` variable, and adding the
  attribute without it would break `migrate`. Run migrations from your machine with `DATABASE_URL` pointing at the
  **direct (non-pooled)** connection string for that shell session only (see below).
* The generator targets `native` and `rhel-openssl-3.0.x` (Vercel runtime) so the right engine binary ships.

## Owner-run command sequence

Run from the repository root on branch `backend-core`, in a terminal where `DATABASE_URL` is set per step. Never paste
connection strings into chat, commits or logs.

1. **Back up production first** (provider snapshot/PITR if available, plus a logical dump):
   `pg_dump --format=custom --no-owner --file=padhai-pre-t03.dump "$PROD_DIRECT_URL"`
   and verify it lists tables: `pg_restore --list padhai-pre-t03.dump | head`.
2. **Rehearse on a throw-away database** (new Neon/Prisma-Postgres branch or a local Docker Postgres), restored from
   that dump so it has realistic data:
   ```
   createdb padhai_rehearsal && pg_restore --no-owner -d padhai_rehearsal padhai-pre-t03.dump
   export DATABASE_URL="postgresql://.../padhai_rehearsal"       # direct URL of the rehearsal DB only
   npx prisma migrate resolve --applied 20261031000000_baseline --schema=apps/api/prisma/schema.prisma
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   npx prisma migrate status --schema=apps/api/prisma/schema.prisma      # expect "Database schema is up to date"
   ```
   If the rehearsal DB is **empty** instead (fresh environment): skip `resolve` and run only `migrate deploy` (it
   applies all three files).
3. **Production**, only after step 2 is clean and the new API build has been verified against the rehearsal DB:
   ```
   export DATABASE_URL="<production DIRECT (non-pooled) url>"
   npx prisma migrate resolve --applied 20261031000000_baseline --schema=apps/api/prisma/schema.prisma
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   npx prisma migrate status --schema=apps/api/prisma/schema.prisma
   ```
   `resolve --applied` only writes a row into `_prisma_migrations`; it executes no SQL.
4. Deploy the API. **Order matters:** migrate before deploying code that reads the new columns/tables.

## Rollback

* Migrations 2 and 3 are additive, so the previous API build keeps working against the migrated database (it ignores
  the new tables/columns). Rolling back = redeploy the previous Vercel build; no data is lost.
* To undo schema changes (only if required): restore the step-1 dump into a fresh database and point the app at it, or
  manually `DROP INDEX "Enrollment_batchId_rollNumber_key"` for migration 3 and drop the new tables (they are empty
  until the new API writes to them). Prefer restoring the dump over hand-editing.

## Backup / restore procedure

* Backups: enable the provider's automatic daily snapshots + point-in-time recovery; take a manual `pg_dump -Fc` before
  every migration. Keep at least 7 daily and 4 weekly copies; store dumps outside the database provider.
* Restore drill (do it before launch, then quarterly): restore the latest dump into a throw-away database with
  `pg_restore --no-owner -d <scratch>`, run `npx prisma migrate status` against it, and run the API's smoke checks
  (`/api/health`, login, one student and one teacher read) against it. A backup that has never been restored is not a
  backup.
* Export for provider portability: `pg_dump` output restores into any PostgreSQL 14+; the schema uses only standard
  types (`TEXT`, `DOUBLE PRECISION`, `JSONB`, `TEXT[]`, `TIMESTAMP`).

## Adding schema changes later

All schema edits go through the backend owner. Edit `schema.prisma`, then create the migration offline:
`npx prisma migrate diff --from-migrations apps/api/prisma/migrations --shadow-database-url <throwaway> --to-schema-datamodel apps/api/prisma/schema.prisma --script`
(or diff against the previous schema file when no shadow database is available) and commit the new directory.
The design-system agent's theme-configuration model must be merged into `schema.prisma` through this process.
