# Local development harness (no Docker, no production access)

Real PostgreSQL via the `embedded-postgres` npm package (data in `.local/pgdata`, gitignored). Everything below refuses to run with `NODE_ENV=production` or a non-local `DATABASE_URL`. Never push, never `vercel`.

## Commands (repo root, in order)
| Command | What |
|---|---|
| `npm install` | once (also generates the Prisma client) |
| `npm run local:db` | start PostgreSQL on `127.0.0.1:54329` (db `padhai_local`, user `padhai`); keep this terminal open |
| `npm run local:migrate` | `prisma validate` + `migrate deploy` + drift check (migrations vs `schema.prisma`, must print "No difference") |
| `npm run local:seed` | DEV-ONLY seed, idempotent (wipes + recreates the two dev institutes) |
| `npm run local:api` | builds `apps/api` if `dist/` missing (`LOCAL_API_REBUILD=1` forces) and runs it |
| `npm run local:web` | teacher :3000, student :3002, admin :3003, web :3004 with `NEXT_PUBLIC_API_URL=http://localhost:<API>/api` |
| `npm run local:all` | db -> migrate -> seed -> api -> web |
| `npm run test:e2e` | API e2e suite (`apps/api/test/e2e`) against a running local stack (starts DB+API itself if needed, on port 3199) |

Overrides: `LOCAL_API_PORT` (default 3001), `LOCAL_DB_PORT` (default 54329). If 3001 is taken by a stale process use `LOCAL_API_PORT=3101` for **both** `local:api` and `local:web`.

## API env set by the harness (never read from the root `.env`)
`NODE_ENV=development`, `DATABASE_URL` (local), `JWT_SECRET` (random 96 hex chars generated into `.local/jwt-secret`), `CORS_ORIGINS` (the four web origins, localhost + 127.0.0.1), `PORT`. All `UPSTASH_*`, `KV_*`, `REDIS_*`, `POSTGRES_*`, `VERCEL*` variables are removed, so the rate limiter uses its in-process sliding window (login 5/min per ip+email, register 3/min).

## Seeded dev accounts (password for ALL: `DevPass#2026`)
- Super admin: `admin@dev.local`
- Institute **Dev Academy**: owner `owner@dev.local`; faculty `faculty1@dev.local` (TEACHER, Mathematics Batch 1, Class 9), `faculty2@dev.local` (FACULTY, Science Batch 2, Class 10); students `student1..10@dev.local` (alternate between the two batches). Includes attendance (3 days), assignments + a graded submission, a published unit test with marks, fees (PAID / PARTIAL / OVERDUE / PENDING), announcements, a timetable slot, invitation code `DEVACADEMY-DEV-JOIN`.
- Institute **Rival Institute** (second tenant for isolation tests): owner `owner2@dev.local`, faculty `rfaculty1@dev.local`, students `rstudent1..3@dev.local`, code `RIVALINSTITUTE-DEV-JOIN`.

## Troubleshooting
- **EPERM on `query_engine-windows.dll.node` during `prisma generate`/`npm install`**: another process (a running API/Next dev server) locks `node_modules/.prisma`. Stop it and retry, or run in your own worktree's `node_modules`.
- **Port 3001 busy**: `netstat -ano | findstr :3001`, or use `LOCAL_API_PORT`.
- **tsc type errors in `local:api`**: tsc still emits `dist/`; the launcher warns and runs the emitted code. Fix the errors before shipping; `npm run build` must be green for deployment.
- **Postgres will not start / stale lock**: stop `local:db`, delete `.local/pgdata`, start again, then `local:migrate && local:seed`.
- **Postgres refuses to run as Administrator**: use a normal (non-elevated) terminal.
- Migration `20261031000300_theme_revision_and_audit_reason` was added by local-env-qa: the earlier migrations did not create `PlatformThemeRevision` nor `AssessmentAudit.reason` (found by the drift check). It is idempotent (`IF NOT EXISTS`).

## E2E tests (`apps/api/test/e2e`)
`npm run test:e2e` starts the DB if needed, migrates, re-seeds, starts the API on :3199 (with `SESSION_CHECK_TTL_MS=0`), runs vitest (`apps/api/vitest.config.e2e.ts`), and stops what it started (`E2E_KEEP=1` keeps it running). Files: auth, roles (route x role matrix), tenancy (institute A vs B), scope (own data / assigned batches), invitations (lifecycle, maxUses, concurrency), idempotency.
- `it.fails(...)` = a KNOWN BUG, written as the correct behaviour; the suite goes red when it is fixed so the marker gets removed. `it.todo(...)` = feature not built yet. Do not delete either.
- The DB is created with `--encoding=UTF8` (Windows default WIN1252 cannot store the rupee sign and made fee reminders 500).
- Unit tests: `npm test` (vitest, 30 s timeout since scrypt-heavy specs timed out on a loaded machine).
