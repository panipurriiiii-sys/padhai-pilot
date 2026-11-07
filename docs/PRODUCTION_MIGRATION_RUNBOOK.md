# Production migration runbook (owner-run)

Scope: bring the production PostgreSQL database (created before the migration history existed) up to the current
`apps/api/prisma/schema.prisma` and deploy the matching API. Six migrations, in order:

| Folder | Effect | Can fail on real data? |
|---|---|---|
| `20261031000000_baseline` | Recreates the OLD tables. **Never executed on production**: marked applied with `migrate resolve`. | n/a |
| `20261031000100_t03_backend_core` | Additive tables/columns/indexes. | No |
| `20261031000200_enrollment_roll_unique` | `UNIQUE (batchId, rollNumber)` on `Enrollment`. | **Yes**, if duplicate roll numbers exist (rolls back cleanly) |
| `20261031000300_theme_revision_and_audit_reason` | `CREATE TABLE IF NOT EXISTS "PlatformThemeRevision"` + `AssessmentAudit.reason` (`ADD COLUMN IF NOT EXISTS`). Safe if the theme table was applied by hand earlier from `prisma/sql/`. | No |
| `20261031000400_finance_leaves` | Fee structures, payments, counters, student leave; new nullable/defaulted columns on `StudentFeeRecord`. | No |
| `20261101000000_academic_core` | Batch archive/schedule, enrolment history, `InvitationCode.expiresAt` becomes nullable (+ label/revokedAt/updatedAt), timetable notes, `BatchPromotion`. | No |

Rules: never paste connection strings into chat, commits or logs; set them only in your own shell. Run from the repo
root on the commit you are about to deploy. Commands are bash; in PowerShell use `$env:DATABASE_URL="..."`.

## 0. Prerequisites
* PostgreSQL client tools 14+ (`pg_dump`, `pg_restore`, `psql`) and Node 20+ with `npm ci` done.
* Two URLs from your database provider: `PROD_DIRECT_URL` (non-pooled, port 5432, used for dump and migrations) and the
  pooled URL (used by Vercel at runtime). Prisma Migrate must use the **direct** URL: pooled/pgbouncer endpoints break
  advisory locks and DDL.
* The database encoding must be UTF8 (`SHOW server_encoding;`). The fee reminders contain the rupee sign; a WIN1252
  database returns 500. Managed providers are UTF8 by default.
* `schema.prisma` has no `directUrl`; Prisma reads `DATABASE_URL` for migrate. Export it per command as below.

## 1. Pre-flight read-only SQL checks (on production, via `psql "$PROD_DIRECT_URL"`)
```sql
-- 1a. Must return ZERO rows, otherwise migration 20261031000200 fails. Fix the rows first (renumber one of each pair).
SELECT "batchId", "rollNumber", count(*) AS n, array_agg(id) AS enrollment_ids
FROM "Enrollment" GROUP BY 1, 2 HAVING count(*) > 1;

-- 1b. Must return ZERO rows: baseline assumption (history table absent or empty). If it lists rows, STOP and review.
SELECT to_regclass('public._prisma_migrations');           -- expect NULL before step 4

-- 1c. Encoding and version
SHOW server_encoding;   -- UTF8
SELECT version();

-- 1d. Which of the "new" objects already exist (hand-applied earlier)? All are safe, but know the answer.
SELECT to_regclass('public."PlatformThemeRevision"') AS theme_table;
SELECT column_name FROM information_schema.columns WHERE table_name='AssessmentAudit' AND column_name='reason';

-- 1e. Row counts to compare after the migration (save the output).
SELECT 'Institute', count(*) FROM "Institute" UNION ALL SELECT 'User', count(*) FROM "User"
UNION ALL SELECT 'InstituteMembership', count(*) FROM "InstituteMembership" UNION ALL SELECT 'Batch', count(*) FROM "Batch"
UNION ALL SELECT 'Enrollment', count(*) FROM "Enrollment" UNION ALL SELECT 'InvitationCode', count(*) FROM "InvitationCode"
UNION ALL SELECT 'StudentFeeRecord', count(*) FROM "StudentFeeRecord" UNION ALL SELECT 'AssessmentMark', count(*) FROM "AssessmentMark"
UNION ALL SELECT 'AttendanceRecord', count(*) FROM "AttendanceRecord";
```
Fixing duplicates (example, keep the oldest, renumber the rest; review before running):
```sql
UPDATE "Enrollment" e SET "rollNumber" = e."rollNumber" || '-' || substr(e.id, 1, 4)
FROM (SELECT id, row_number() OVER (PARTITION BY "batchId","rollNumber" ORDER BY "joinedAt", id) rn FROM "Enrollment") d
WHERE e.id = d.id AND d.rn > 1;
```

## 2. Backup and verify
```bash
export PROD_DIRECT_URL='postgresql://...'            # direct, non-pooled
pg_dump --format=custom --no-owner --file=padhai-pre-migrate-$(date +%Y%m%d-%H%M).dump "$PROD_DIRECT_URL"
pg_restore --list padhai-pre-migrate-*.dump | head -40      # must list tables such as "Institute", "User", "Enrollment"
ls -l padhai-pre-migrate-*.dump                              # not zero bytes
```
Also take the provider snapshot / note the PITR timestamp. Store the dump outside the provider.

## 3. Rehearse on a throw-away database restored from that dump
```bash
createdb -U postgres padhai_rehearsal            # or a new provider branch; UTF8
pg_restore --no-owner -d postgresql://.../padhai_rehearsal padhai-pre-migrate-*.dump
export DATABASE_URL='postgresql://.../padhai_rehearsal'     # the REHEARSAL database only
npx prisma migrate resolve --applied 20261031000000_baseline --schema=apps/api/prisma/schema.prisma
npx prisma migrate deploy  --schema=apps/api/prisma/schema.prisma
npx prisma migrate status  --schema=apps/api/prisma/schema.prisma   # "Database schema is up to date!"
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel apps/api/prisma/schema.prisma --exit-code   # "No difference detected", exit 0
```
Re-run the row-count query from 1e on the rehearsal DB (counts must be equal to production; the only added rows are in
`_prisma_migrations`). Then boot the new API against it (`NODE_ENV=development PORT=3377 DATABASE_URL=... JWT_SECRET=<32+ chars> CORS_ORIGINS=http://localhost:3000 node apps/api/dist/main.js`, after `npm run build:shared && npm run build -w apps/api`)
and run the smoke checks in section 7 against `http://localhost:3377`. Do not continue until this is clean.

## 4. Production migration (maintenance window; migrate BEFORE deploying the new API)
```bash
export DATABASE_URL="$PROD_DIRECT_URL"
npx prisma migrate resolve --applied 20261031000000_baseline --schema=apps/api/prisma/schema.prisma   # writes one row, executes no SQL
npx prisma migrate deploy  --schema=apps/api/prisma/schema.prisma
npx prisma migrate status  --schema=apps/api/prisma/schema.prisma
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel apps/api/prisma/schema.prisma --exit-code
unset DATABASE_URL
```
Re-run 1e and compare. The migrations are additive, so the previous API build keeps working on the migrated database.
Each migration file runs in one transaction: a failure leaves that migration unapplied and the schema as before.

If a step fails with `P3009`/"migration failed" (e.g. duplicate roll numbers): fix the data (section 1a), then
```bash
npx prisma migrate resolve --rolled-back 20261031000200_enrollment_roll_unique --schema=apps/api/prisma/schema.prisma
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```
(Rehearsed locally: failed on a duplicate pair, recovered with the commands above.) Replace the folder name with the one reported.

## 5. Vercel environment variables (API project; Production scope)
| Variable | Value / notes |
|---|---|
| `DATABASE_URL` | **Pooled** connection string (pgbouncer/Accelerate-free pooled host). The code appends `connection_limit=1&pool_timeout=20` unless present (`DB_CONNECTION_LIMIT` overrides). Migrations are run from your machine with the **direct** URL, not from Vercel. `DATABASE_URL_POOLED` or `POSTGRES_URL` are read first if set (first `postgres(ql)://` wins); `prisma+postgres://` values (`PRISMA_DATABASE_URL`) are ignored. |
| `JWT_SECRET` | Random, at least 32 chars (`openssl rand -hex 48`). The API refuses to start in production without it; the old committed secret is rejected. Rotating it signs every user out. |
| `NODE_ENV` | `production` (Vercel sets it). Demo accounts and demo routes are disabled. |
| `CORS_ORIGINS` | Comma separated exact origins, no wildcard, e.g. `https://teacher.example.com,https://student.example.com,https://admin.example.com,https://www.example.com`. Anything else gets no CORS headers. |
| `STUDENT_PORTAL_URL` | Base URL of the student portal, used to build enrollment-code share links (`https://student.example.com`). Without it share links are relative (`/?code=...`) and the share text omits the link. |
| `JWT_EXPIRES_IN` | Optional, default `12h`. |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL` + `KV_REST_API_TOKEN`) | Optional. Without them the rate limiter and cache use an in-process fallback (per instance, so limits are weaker on serverless). `REDIS_ENABLED`, `REDIS_FAIL_CLOSED_AUTH`, `REDIS_RATE_LIMIT_ENABLED`, `REDIS_CACHE_ENABLED`, `REDIS_TIMEOUT_MS` tune it. |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME` | **Not** Vercel variables. Only for the one-off `bootstrap-super-admin` script run from your machine (it also honours `DIRECT_URL`). |
Web apps need `NEXT_PUBLIC_API_URL` pointing at `https://<api-host>/api`.

## 6. Deploy
Deploy the API (and portals) only after step 4 succeeded: pushing `main` deploys production. Do the smoke checks next.

## 7. Post-deploy smoke checks
```bash
API=https://<api-host>/api
curl -s -o /dev/null -w "health %{http_code}\n"            $API/health                      # 200 (body: database "connected")
curl -s -o /dev/null -w "unauth %{http_code}\n"            $API/teacher/batches             # 401
curl -s -o /dev/null -w "bad login %{http_code}\n" -X POST $API/auth/login -H 'content-type: application/json' -d '{"email":"nobody@example.com","password":"wrong-password-1"}'   # 401, never 500
curl -s -i -X OPTIONS $API/auth/login -H 'Origin: https://teacher.example.com' -H 'Access-Control-Request-Method: POST' | grep -i access-control-allow-origin   # echoes exactly that origin
curl -s -i -X OPTIONS $API/auth/login -H 'Origin: https://evil.example' -H 'Access-Control-Request-Method: POST' | grep -ci access-control-allow-origin          # 0
curl -s -o /dev/null -w "demo %{http_code}\n" $API/auth/demo-owner                         # must NOT be 200 (demo routes are disabled in production)
```
Then sign in through the portals as: an owner (batches list, roster, take attendance, fees list and record a payment,
enrollment code create with and without expiry), and a student (dashboard, fees + receipts, results, timetable). Check
Vercel function logs for Prisma errors (`P2021` table missing, `P2022` column missing mean migrations were not applied).

## 8. Rollback
* Migrations are additive: if only the code is bad, redeploy the previous Vercel build; the old code ignores new
  tables/columns. The one behavioural change is `InvitationCode.expiresAt` being nullable: codes created without expiry
  have `NULL`, which the OLD code cannot handle. If you roll the API back after owners created no-expiry codes, run
  `UPDATE "InvitationCode" SET "expiresAt" = now() + interval '365 days' WHERE "expiresAt" IS NULL;` first.
* If the database must go back: stop writes (maintenance), restore the step-2 dump into a **new** database
  (`pg_restore --no-owner -d <new>`), point `DATABASE_URL` at it, redeploy the previous API build. Data written after the
  dump is lost; prefer provider PITR to a timestamp just before step 4 when available. Do not hand-drop tables.
* After any restore, recreate the baseline marker only if you intend to migrate again (`migrate resolve --applied ...baseline`).

## 9. Rehearsal evidence (local, embedded PostgreSQL 18, UTF8)
Baseline SQL only, seeded with an institute, 4 users/memberships, a batch, 3 enrollments, an invitation code, 2 fee
records (title contains the rupee sign), an assessment with 2 marks and an assessment audit row; then
`migrate resolve --applied` baseline and `migrate deploy`: 5 migrations applied, `migrate status` up to date,
`migrate diff` "No difference detected", all row counts unchanged, fee titles intact, the old invitation code kept its
expiry, `AssessmentAudit.reason` and `PlatformThemeRevision` each created once. A second database with a duplicate
`(batchId, rollNumber)` pair failed migration 3 as documented and recovered after fixing the data. This is a local
rehearsal; it does not replace section 3 on a restore of the real dump.
