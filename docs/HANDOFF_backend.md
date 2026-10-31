# Backend (T-03) hand-off - branch `backend-core`

**Status: PARTIALLY COMPLETE. Do NOT merge to `main` until the owner has run the migrations on a rehearsal database
(see `docs/database-and-migrations.md`).** Nothing here has been run against PostgreSQL or Redis. Unit tests use
Prisma stubs (`vi.fn`), which prove query scoping and business rules in code, not database behaviour.

## What is real now

| Area | State |
|---|---|
| Schema + migrations | **Done (offline).** `apps/api/prisma/schema.prisma`, migrations `20261031000000_baseline`, `..._t03_backend_core`, `..._enrollment_roll_unique`, `migration_lock.toml`. SQL replayed on PGlite (WASM Postgres) with seeded rows: existing rows preserved, duplicate fee reminder rejected. 45 public tables after the chain. |
| Connection handling | **Done.** `prisma.service.ts` resolves `DATABASE_URL_POOLED` > `DATABASE_URL` > `POSTGRES_URL` (skips `prisma+postgres://`), appends `connection_limit=1&pool_timeout=20` (override `DB_CONNECTION_LIMIT`), never logs the URL. Generator `binaryTargets = ["native","rhel-openssl-3.0.x"]`. |
| Per-request session / membership revocation | **Done in code.** `common/access/access.service.ts` `verifySession` (one indexed membership+user+institute lookup per request, 10 s per-instance positive cache `SESSION_CHECK_TTL_MS`, 0 = off) wired into `AuthGuard`; JWT carries `tv` = `User.tokenVersion`; password change/reset bumps `tokenVersion`; change-password returns a fresh token. `assertActiveMembership` (uncached) is available for sensitive writes but **not yet called by any service**. Cost: +1 PK-range query per authenticated request (cached); no Redis. |
| Access helpers | **Done.** `AccessService.db()` (503 when DB down), `staffBatchIds`, `assertBatchAccess` (404 cross-tenant / 403 unassigned), `studentBatchIds`. Helpers in `common/db/db.ts` (`assertDb`, `clampLimit`, validators). Provided globally via `PrismaModule`. |
| `StudentService` + `/student/*` | **Done in code, no fabricated data.** Every endpoint is Prisma-backed, tenant/ownership scoped from the JWT, bounded lists, server-side test scoring from `TestQuestion` (answer key never selected for students), one attempt per test (unique index, repeat submit returns the original result), idempotent assignment submit / correction request / join-batch (join-batch now also returns a fresh `token` + `user`), private study tasks, 503 when DB down. Spec: `student.service.spec.ts` (18 tests). |
| Auth | Hardening kept. Demo accounts remain in-memory, non-production only. |

## What is still fake / in-memory (remaining `isConnected` / memory paths)

Counts of `isConnected` references: `tuition/tuition.service.ts` 27, `assessment/assessment.service.ts` 13,
`admin/admin.service.ts` 5. `teacher/teacher.service.ts` has **no DB code at all** (pure `memoryStore` seeded with
"Prof. Rajesh Sharma" data, even when connected). Concretely:

1. `teacher.service.ts` - 100% in-memory. **Highest priority**: rewrite on Prisma (batches, roster, attendance sessions/records, assignments + grading, tests/questions, lesson plans, announcements, reports, invitation codes) using `AccessService.staffBatchIds/assertBatchAccess`. Also add `GET /teacher/queries` + `POST /teacher/queries/:id/reply` (tables exist: `AcademicQuery`, `AcademicQueryReply`).
2. `assessment.service.ts` - DB branch exists but falls back to `memoryStore` (seeded) when not connected; DB branch loses multi-subject marks (`subjects`, `subjectMarks`, `isMultiSubject` now exist in the schema), checks `teacherId === user.id` (should use `assertBatchAccess`), and returns unbounded lists. Student results/notifications/materials queries are DB-backed but unbounded and `getStudentStudyMaterials` falls back to all-institute when the student has no enrolment (must return `[]`).
3. `tuition.service.ts` - DB branches exist; remove the ~600 lines of `mem*` fallbacks + constructor seed, the auto-creation of `inst_apex_academy`, and fix tenant gaps: `createTeachingDiary`/`createStudyMaterial`/`createFeeRecord`/`generateSalaryRecord`/`applyLeave` do not verify that `batchId`/`studentId`/`facultyId`/`substituteFacultyId` belong to the caller's institute; `generateSalaryRecord` upsert can overwrite a PAID record; `createFaculty` creates users with a placeholder password hash (must be replaced by the invitation flow); `dispatchFeeReminder` writes status `SENT` although nothing is sent (use `RECORDED`/`DELIVERED` + `dedupeKey = channel:YYYY-MM-DD`, create an in-app `Notification` for IN_APP); `GET /tuition/diaries` exposes all faculty entries to any staff role; lists are unbounded.
4. `admin.service.ts` - `Map` institutes/audit logs/announcements. Use new columns (`Institute.status/subdomain/customDomain/isWhiteLabel/isDedicatedDb/maxStudents/maxTeachers`), `AuditLog` (+`actorEmail/details/status`) and `PlatformAnnouncement`.
5. `AssessmentService` is injected into `StudentService` (results/materials), so item 2 affects the student portal.
6. Old specs for teacher/tuition/assessment/admin still assert the memory behaviour and still pass; rewrite them when the services are converted.

## Not started

* **Faculty invitation flow** (tables `FacultyInvitation`, `NotificationOutbox`, `BatchFaculty` exist; no service/controller). Design agreed: owner `POST /faculty-invitations` (single-use sha256-hashed token, expiry, role fixed to FACULTY, never owner/super-admin; returns the accept link once; `deliveryStatus` stays `NOT_SENT` because no email provider exists), list/revoke/resend (resend rotates the token), public `preview` + `accept` (atomic `updateMany` claim in a transaction, creates/links user, FACULTY membership, `FacultyProfile`, `BatchFaculty` rows, audit log; existing accounts must supply their password). Re-enable `AuthService.registerTeacher` only through `invitationToken`.
* **Analytics endpoints and `packages/shared/src/types/analytics.ts`** - **not started; no types published**, so the UI agent has no contract yet. Requirements from the coordinator are in the task log: student/faculty/owner/super-admin scopes, bounded date ranges, SQL aggregation (`groupBy`/`$queryRaw date_trunc`), private short `Cache-Control`.
* `docs/api-contracts.md`, `docs/security-and-tenant-isolation.md`, `docs/performance-and-cost.md` section, status-table updates in `docs/PROJECT_AUDIT.md` - not written (only this file and `docs/database-and-migrations.md`).
* Dev-only demo seed script (`seed:demo`) that loads demo data into a **local** PostgreSQL and refuses non-localhost URLs: not written. Without it, local dev has no data for the converted student endpoints (they 503/empty by design).
* Performance items from the late coordinator note: only connection-limit/binary-target work done. Not done: cold-start measurement, lazy imports, removing Redis calls on cheap reads, `Cache-Control` headers, ETag on a theme endpoint, object-storage plan for the base64 `/tuition/media-upload`.
* Theme-configuration model from the `design-system-sync` agent must be merged **through the backend owner** into `schema.prisma` + a new migration.

## Contract changes (all additive)

* `POST /student/join-batch` response adds `alreadyEnrolled`, `token`, `user` (type `StudentJoinBatchResult` in `packages/shared/src/types/student.ts`; clients should replace the stored token with `token`).
* `StudentFeeSummary.status` union gains `'PENDING'`; `StudentTestQuestion` gains optional `type`.
* `POST /auth/change-password` now returns `{ success, user, token }` (fresh session) instead of `{ success }`.
* `GET /student/diary` accepts `?limit=` (default 50, max 100).
* Behavioural: student data endpoints return empty lists for a student with no enrolment; `GET /student/tests/:id` returns 403 before start / after close and 409 after an attempt; JWTs are now rejected (401) when the membership is revoked/suspended, the institute is deactivated, the user is deactivated, or `tokenVersion` changed. Existing tokens without `tv` are treated as version 0 (valid until the user's version is bumped).
* Consumers not yet audited for the changes above: `apps/student`, `apps/teacher`, `apps/mobile` (grep `join-batch`, `change-password`).

## Verification run (exact commands)

| Command | Result |
|---|---|
| `npm install --ignore-scripts --no-audit --no-fund` (root) | OK |
| `npm run build:shared` | OK |
| `npx prisma generate --schema=apps/api/prisma/schema.prisma` | OK (Prisma 6.19.3, native + rhel-openssl-3.0.x) |
| `cd apps/api && npx tsc -p tsconfig.build.json --noEmit` | exit 0 |
| `cd apps/api && npx vitest run` | **12 files, 114/114 passed** (baseline was 112; the 16 old student-fabrication tests were replaced by 18 new student/session tests) |
| PGlite replay of the 3 migrations over seeded pre-change rows (`rehearse.mjs`, kept outside the repo) | applied, row counts unchanged, duplicate reminder rejected |
| `prisma migrate deploy/status/resolve`, any real DB, any Vercel deploy | **NOT RUN** (forbidden by task rules) |

## Owner-run commands

See `docs/database-and-migrations.md` ("Owner-run command sequence"): backup -> rehearse on a throw-away DB
(`migrate resolve --applied 20261031000000_baseline` then `migrate deploy`) -> repeat on production with the direct
URL -> deploy the API afterwards. Do not run `migrate dev` or `db push`.

## Prioritised next steps

1. Owner: rehearse the migrations (above) on a restored copy of production. Merge to `main` only afterwards.
2. Convert `TeacherService` to Prisma (item 1) and add the teacher query-reply routes; the web/mobile faculty apps currently show fabricated data from it.
3. Clean `AssessmentService` (item 2) - it feeds student results/materials.
4. Faculty invitation flow + `registerTeacher` via invitation; call `assertActiveMembership` from grading/publishing/payroll/invitation writes.
5. Convert `TuitionService` and `AdminService` (items 3-4); delete all remaining memory seed data.
6. Publish `analytics.ts` shared types first, then implement the analytics endpoints with a Prisma double + tests.
7. Write `docs/api-contracts.md`, `docs/security-and-tenant-isolation.md`, performance section, update `docs/PROJECT_AUDIT.md`.
8. Add a typed in-memory Prisma double for broader tenant-isolation tests, and a PostgreSQL-backed test run once a test DB exists.
