# Handoff to Antigravity (or any engineer taking over)

Written 2026-10-31 at the end of the first Claude session. Read this first, then `docs/PROJECT_AUDIT.md` (verified audit) and `docs/ENGINEERING_TRACKER.md` (workstreams).
The owner writes Hinglish; answer them in clear English or Hinglish. Do not trust older claims in `PROJECT_SPEC.md` §20–22 (see §23 there).

## 1. What is live right now (verified)

| App | Vercel project | URL |
|---|---|---|
| API (NestJS) | `padhai-pilot` (root `apps/api`) | https://padhai-pilot.vercel.app |
| Platform Admin | `admin.padhai-pilot` | https://adminpadhai-pilot-pi.vercel.app |
| Student Portal | `student.padhai-pilot` | https://studentpadhai-pilot.vercel.app |
| Teacher Portal | `padhai-pilot-grwp` | https://padhai-pilot-grwp.vercel.app |
| Public site | `padhaipilot` | https://padhaipilot.vercel.app |

Vercel team `bhau-ki-team`. All five are linked to GitHub `panipurriiiii-sys/padhai-pilot`, branch `main`; **every push to `main` deploys production**. Branch pushes do not build (`ignoreCommand` in each `vercel.json`).
Database: Prisma Postgres (`db.prisma.io`). Redis: Upstash REST. The API's production env has `DATABASE_URL`, `JWT_SECRET` (rotated), `CORS_ORIGINS` (exact portal origins), Upstash/KV variables.

Security baseline on `main` (do not weaken): scrypt passwords; no universal/demo passwords; demo accounts and `/auth/demo-*` exist only when `NODE_ENV !== 'production'`; the API refuses to start in production without a strong `JWT_SECRET`; exact-origin CORS from `CORS_ORIGINS`; `@Roles` guards on every controller (`apps/api/src/common/security/roles.ts`, tests in `common/guards/controller-roles.spec.ts`); public sign-up can only create `TUITION_OWNER`; Super Admin is created only by `npm run bootstrap:admin`.

## 2. What is NOT done (the real work)

1. **The backend still serves fake or process-local data.** `StudentService`, `TeacherService`, `TuitionService`, `AssessmentService`, `AdminService` use hard-coded values or in-memory maps (writes vanish between serverless invocations). There are no Prisma migrations in `main`. Branch `backend-core` replaces this; it is not merged (needs migrations — §4).
2. No faculty-invitation flow (public faculty sign-up is blocked in production on purpose).
3. No email/push provider, no object storage, no server-side PDFs, no CSV/XLSX import.
4. Mobile: screens and services are rewritten on real routes (jest 77 tests, `tsc` 0 errors) but never run on a device/emulator; no secure token storage (needs `react-native-keychain` or similar), no push, no deep links, no release build/signing.
5. Design system / premium UI / charts: in progress on branches (§3). Charts need the analytics endpoints from `backend-core`.
6. The Super Admin does not exist in production yet (owner runs `bootstrap:admin`).
7. Independent QA/security/performance review has not been done.

## 3. Branches (all on GitHub; merge order matters)

| Branch | Owner of | State at handoff |
|---|---|---|
| `main` | production | auth hardening, role guards, real-route mobile app, Vercel cost config, docs |
| `backend-core` | Prisma schema, migrations, real services, invitations, analytics endpoints | in progress by an agent; check `docs/HANDOFF_backend.md` on the branch |
| `design-system-sync` | shared theme package from the Teacher Portal, portals consuming it, runtime theme-config API, mobile theme | partly pushed; see `docs/HANDOFF_design-system.md` on the branch |
| `premium-components` | SVG library (`packages/assets`), motion system, shared components, charts, 3D | in progress; see `docs/HANDOFF_premium-components.md` on the branch |
| `portals-live`, `audit/auth-hardening` | already merged into `main` | can be deleted |

Merge order: **1) `backend-core` → 2) `design-system-sync` → 3) `premium-components`.** The backend owns `apps/api/prisma/schema.prisma`; the design-system branch adds theme-config models that must be merged into the schema through the backend branch. Resolve conflicts by hand; never force-push `main`.
If a branch looks incomplete, read its handoff doc first, run its tests, and merge only what builds. Unfinished work stays on its branch.

### Branch status after the agents reported (2026-10-31)

- **`backend-core` (0270629), partial.** Real now: Prisma schema + 3 offline migrations (baseline, `t03_backend_core`, unique roll number), DB env handling (`DATABASE_URL_POOLED` → `DATABASE_URL` → `POSTGRES_URL`, `connection_limit=1`), per-request session revocation (`tokenVersion` + membership check, 10 s per-instance cache), `StudentService` and all `/student/*` endpoints on Prisma (114/114 API tests; migrations replayed on in-process PGlite only, never on a real PostgreSQL). Still fake/in-memory: `TeacherService` (highest priority), `AssessmentService`, `TuitionService` (missing tenant checks, can overwrite PAID salary), `AdminService`. Not started: faculty invitation service, analytics endpoints/types, dev seed script, api-contracts/security docs. Contract changes: `join-batch` returns `{alreadyEnrolled, token, user}`; `change-password` returns `{success,user,token}`; fee status adds `PENDING`. Details: `docs/HANDOFF_backend.md` and `docs/database-and-migrations.md` on that branch.
- **`premium-components` (8d85494), partial.** Done: 36 original SVGs in `packages/assets` (svgo + validator + tests, 39 pass), web and native adapters; `packages/ui` (`motion` ^14.9 with LazyMotion and reduced-motion, tabs, dialog, toast, skeleton, count-up, CSS-only `Tilt3D`), own SVG chart layer (bar/line/hbar/donut with keyboard + table fallback, 7 tests); charts wired into Teacher Dashboard, Reports, Attendance, Assignments, Tests, Lesson plans on data the page already fetches; Teacher build passes. Only the Teacher Dashboard was viewed rendered; everything else is compile-checked only. Not done: Student/Admin/Web screens, mobile native charts (add `watchFolders` to `apps/mobile/metro.config.js` before importing `@padhai-pilot/assets/native`), date-range filters, the three docs, portfolio study, real 3D (three.js/R3F/Rive intentionally not adopted). Licences: motion MIT, svgo MIT, react-native-svg MIT, lucide ISC; React Bits is MIT + Commons Clause (no source copied), Aceternity and 21st.dev not used (licence unclear). Details: `docs/HANDOFF_premium-components.md` on that branch.
- **`design-system-sync` (6b28d39), checkpoint** — the agent may still have been working; check the branch tip and its handoff doc.

Expected merge conflicts between `premium-components` and `design-system-sync`: `apps/teacher/src/app/page.tsx`, `apps/teacher/src/components/{Dashboard,Reports,Attendance,Assignments,Tests,LessonPlans}View.tsx`, `ui/CountUp.tsx`, the four portals' `package.json` + `next.config.ts`, `apps/mobile/package.json`, root `package.json`/`package-lock.json` (regenerate with `npm install --ignore-scripts`). Some Teacher view files have mixed CRLF/LF endings — edit by hand, not scripted replaces.

## 4. Safe release procedure (production has real credentials)

- The root `.env` (gitignored) contains **real production DB/Redis credentials**. Never run `prisma migrate dev`, `db push`, `db pull`, seeds or any script against it casually. Rehearse every migration on a throwaway PostgreSQL first (Neon/Supabase free branch or local Docker).
- Production has never had migration history. Follow `docs/database-and-migrations.md` from `backend-core`: back up, rehearse, `prisma migrate resolve --applied <baseline>`, then `prisma migrate deploy`. Only then merge `backend-core` into `main` (otherwise the API will query tables that do not exist and break production).
- After every push to `main`, verify: `curl https://padhai-pilot.vercel.app/api/health` → 200; unauthenticated `/api/teacher/dashboard` → 401; `/api/auth/demo-admin` → 404; CORS preflight from a portal origin → allowed, from `https://evil.example.net` → 403. Roll back by redeploying the previous deployment in Vercel (Deployments → ⋯ → Promote/Redeploy) if any check fails.
- Vercel env changes: the CLI is installed (`vercel`), logged in as `panipurriiiii-sys`; mutating the production project may be blocked by the agent's permission layer — ask the owner or do it in the dashboard.
- Cost rules: no new paid service, queue or always-on worker; Redis only for rate limiting/measured caches; one aggregate API call per screen; lazy-load charts/3D; see `docs/performance-and-cost.md`.

## 5. Task list for you, in order

1. Fetch all branches. Read the three `HANDOFF_*.md` docs. Run `npm ci`, `npm run build:shared`, `npm run build:api`, `cd apps/api && npx vitest run`, builds of the four Next apps, and `cd apps/mobile && npx tsc --noEmit --ignoreDeprecations 6.0 && npx jest --silent` on each branch before merging it.
2. Backend (T-03): finish `backend-core` (remaining services to Prisma, faculty invitations, analytics endpoints), rehearse migrations, then merge and deploy. Add integration tests against a real PostgreSQL if a throwaway DB is available.
3. Wire the Teacher, Student and Admin portal screens to the real endpoints (T-07/08/09). Remove any `catch → sample data` pattern (the student web client has several in `apps/student/src/lib/api.ts`). Admin must become a DB-backed multi-page app (institutes, plans, feature flags, audit log, theme settings); remove super-admin UI from `apps/teacher`.
4. Merge `design-system-sync`, then `premium-components`; use the new shared tokens/components everywhere; add charts to every Teacher/Student section from the analytics endpoints.
5. Mobile (T-10): secure token storage, session restore, push (FCM) and deep links, offline drafts for attendance/marks, Android release build and signing, run on an emulator. Mobile has exactly two roles (Teacher/Faculty, Student); never add Super Admin there.
6. QA (T-11): cross-tenant and cross-role tests (a student must not read another student's results; a faculty member only their batches), revoked membership, disabled feature flags, duplicate submissions, accessibility, reduced motion, performance on mid-range Android.
7. DevOps (T-12): backup/restore drill, rollback doc, monitoring/alerts, object storage for uploads (base64-in-JSON uploads do not fit Vercel's 4.5 MB body limit), email provider for password reset and invitations.
8. Public site: privacy policy and terms pages, pricing from configuration, no invented testimonials or numbers.

## 6. Owner actions still pending (remind them)

- Create the first Super Admin: in their own terminal set `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` (12+ chars), `SUPER_ADMIN_NAME`, run `npm run bootstrap:admin --workspace=@padhai-pilot/api` (after `npm run build:api`). Never ask for the password in chat.
- Set the API function `maxDuration` to 30 s in Vercel → project `padhai-pilot` → Settings → Functions.
- Provide a throwaway PostgreSQL URL for migration rehearsal.
- Later: object storage, email/push provider, Android signing keystore, custom domains.

## 7. Working conventions and gotchas

- npm only (no pnpm/yarn), no Expo. Windows machine; Git Bash and PowerShell both available. Multi-line shell heredocs frequently fail in the Claude harness — use file-writing tools instead.
- `packages/shared/dist` is tracked in git on purpose (Vercel builds portals without building shared first): run `npm run build:shared` and commit `dist` when you change `packages/shared/src`.
- Fonts: exactly Playfair Display, Raleway, Inter. The Teacher Portal (`apps/teacher/src/app/globals.css`) is the master visual reference; do not introduce another palette. Mobile fonts are bundled in `apps/mobile/assets/fonts` and `android/app/src/main/assets/fonts` (run `npx react-native-asset` on a Mac for iOS).
- Commit trailers used so far: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; use your own tool's attribution going forward.
- Report honestly: "Implemented" is not "Verified". Unit tests against mocks are not end-to-end verification against PostgreSQL.
