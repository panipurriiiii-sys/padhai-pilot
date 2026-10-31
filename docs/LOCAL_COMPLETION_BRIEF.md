# Local completion brief (shared by all agents)

Goal: finish and verify EVERY app locally (web, admin, teacher, student, api, mobile) so it is deployment-ready. The owner's Vercel quota is exhausted.

## Hard rules
1. **Never `git push` anything, never run `vercel`, never trigger a deployment.** Commit locally only, on your own branch (you work in an isolated git worktree; name your branch `local/<your-area>`). The director merges branches locally.
2. The root `.env` of the main checkout holds REAL production credentials: never copy it into a worktree, never print it, never run Prisma migrate/db push/seed against it. Local work uses a throwaway local PostgreSQL (see "Local database") and `DATABASE_URL` set only in your shell.
3. Do not weaken auth hardening (scrypt, strong JWT_SECRET, exact-origin CORS, role guards, tenant ids from the JWT only). No fabricated data in production code paths; fixtures only in tests and a clearly dev-only seed.
4. Teacher Portal (`apps/teacher/src/app/globals.css` + `packages/shared/src/theme`) is the master design; only Playfair Display, Raleway, Inter. Shared types live in `packages/shared` (run `npm run build:shared`; `dist` is tracked).
5. Harness quirks (Windows): multi-line shell heredocs often fail — use the Write/Edit tools for files. Another process may lock `node_modules/.prisma` on Windows; if `prisma generate` fails with EPERM, retry in your own worktree's node_modules.
6. Report honestly: Implemented vs Verified; unit tests with mocks are not end-to-end verification. Keep reports short.

## State at handoff (verified)
Antigravity merged all branches into `main`. The API had TypeScript errors (fixed partially by the director: analytics types, admin fields); remaining at handoff: `apps/api/src/teacher/teacher.service.ts` (uses `User.rollNumber` / `Enrollment.student` that the schema does not have). One failing test: `analytics.service.spec.ts` (mock lacks `assessmentMark.groupBy`). Teacher routes returned 403 "Batch unauthorized" in production because the old in-memory TeacherService lost batches between serverless instances: everything must live in PostgreSQL via Prisma.
Migrations: `apps/api/prisma/migrations/` (baseline, t03_backend_core, enrollment_roll_unique); theme SQL in `apps/api/prisma/sql/`. Only the **api-core** agent edits `schema.prisma` and adds migrations; others hand api-core a patch or add a clearly separate new migration folder with a later timestamp and a short note (director resolves conflicts).

## Owner feature requests (all must work on web teacher/student + mobile + backend)
- Batches & Student Rosters: teacher can **edit** an existing batch; shareable **enrollment code** (easy to copy/share, with a share link/text), **no day limit**; teacher can change, revoke or set/clear expiry of a code; works on web and mobile.
- **Batch fees**: teacher sets fee for a batch; initially every student's fee is PENDING; teacher manually marks payments received (full/partial, with date/mode/reference), audit trail; **fee alerts/receipts go to the student side** (in-app notifications + fee list + receipt); duplicate reminders prevented.
- **Promote batch to next class** (move students to a next batch/class with history; no data loss).
- **Weekly Teaching Timetable**: full CRUD (create/edit/delete) per batch by the teacher; students see it.
- **Academic Broadcast / announcements** working end to end (teacher → batch/all students).
- **Tuition Branding & Letterhead**: institute logo upload (use `https://media.dhyey.cc/docs` style media storage already used by the app for materials; keep the existing upload flow/20 MB preflight) and use the logo/name/address/signatory on documents.
- **Student leave applications** (student applies, teacher/owner approves/rejects, student sees status) + improved **Student Fees & Balance Alerts** section.
- **Assignments & Academic Evaluations**: teacher can attach a PDF/document (stored via the media.dhyey.cc upload flow) to an assignment; students can open it.
- **PDFs everywhere** (report cards, fee receipts, salary slips, attendance reports, result sheets): one consistent, industry-grade layout; header shows the **teacher's institute** (logo, name, address, contact, signatory) — **never the PadhaiPilot platform name**; correct data only.
- Fix the 403s seen in production (`/teacher/batches/:id/students`, `/teacher/attendance/...`, `/teacher/invitations` → "Batch unauthorized").

## Local database
The **local-env-qa** agent builds the harness (`npm run local:db` etc.) and documents it in `docs/LOCAL_DEV.md`. Until it lands, use unit tests with Prisma doubles. Docker is not available; use an in-process/embedded PostgreSQL (e.g. PGlite with its socket server, or `embedded-postgres`).

## Route/contract coordination
All agents share one git repo: read another agent's committed work with `git show local/<area>:path` or `git log local/<area>`. **api-core and api-finance-docs must commit `docs/LOCAL_API_ROUTES.md` (method, path, roles, request/response types in `packages/shared`) early** so UI agents can build against it. UI agents must not invent routes.

## Done criteria per area
Build + typecheck + tests green with the exact commands run; real workflows exercised against the local stack where possible; screenshots/visual inspection for UI; list what is NOT verified.
