# PadhaiPilot — Project Audit

**Audit date:** 2026-10-31 · **Branch:** `main` at `c0a0cd8` plus the uncommitted changes listed in §13.
**Method:** Read `PROJECT_SPEC.md`, `rules.txt`, every file in `docs/`, all manifests, the Prisma schema, the full auth stack and the API entry points; sized every app; ran the commands quoted in §12. Statuses below come from what was read or run, not from earlier claims in `PROJECT_SPEC.md`. Where I did not inspect something I say so.

Status vocabulary: **Not Started · In Progress · Implemented · Verified · Blocked**. Nothing in this repository is **Verified** end to end yet — see §12 for why.

---

## 1. Executive summary

The repository is a **large, well-organised demo-grade scaffold**, not a launch-ready product. Roughly 40k lines of TypeScript exist across the API, four Next.js apps and a React Native app, with a coherent domain model and a good feature-flag design. But:

1. **There is no real persistence path.** `apps/api/prisma/` has a schema and **no migrations** (never run against a database). Almost every API service has an in-memory "resilient fallback" store (`isConnected` branches: tuition 27, assessment 13, student 7, admin 5, …) and the tests exercise those memory stores, not PostgreSQL.
2. **Authentication was insecure** (fixed in this session for the auth module — see §13): plaintext password storage and comparison, universal backdoor passwords (`password123`, `demo`) accepted for any account, a JWT secret hard-coded in source *and identical to the secret in the local `.env`*, seeded demo accounts including a `SUPER_ADMIN` with a known password, demo-login endpoints, `CORS origin: true` with credentials, and a reset token returned in the response.
3. **`PROJECT_SPEC.md` §20–22 overstate completion.** They state "Production Ready & Verified", "Zero compile or TypeScript errors" and a passing `nest build`. At the start of this audit `npm run build:api` **failed** (TS2739 in `features.service.ts`, then TS2353/TS2307 in the admin module), and the mobile app **does not type-check** (30 errors).
4. **The Platform Admin app is almost entirely mock.** `AdminService` keeps institutes in a `Map`; its DB writes used columns that do not exist in the schema and swallowed every error. `apps/admin` is a single 1,353-line page with a demo login.
5. **Cross-portal workflows are not verified.** No workflow in the brief (diary → student, bulk marks → published result, leave → timetable, fee reminder → student alert, …) has an automated or manual end-to-end check against a real database.

**Recommended next step:** run the first migration against a *non-production* Neon/Supabase database, then remove every `isConnected` fallback service-by-service while moving its tests to a real test database (see §14).

---

## 2. Existing architecture

| Layer | Reality |
|---|---|
| Monorepo | npm workspaces, 7 workspaces, unique `@padhai-pilot/*` names (the old naming mismatch is resolved). One root `package-lock.json`. |
| API | NestJS 11, ESM (`"type": "module"`), controllers + services per domain, Prisma client, Upstash Redis REST wrapper. Vercel entry `apps/api/api/index.ts` (cached Express app) with a catch-all rewrite. |
| Database | PostgreSQL via Prisma. One schema (`apps/api/prisma/schema.prisma`, 824 lines, 38 models/enums). **No migrations directory.** |
| Auth | JWT (HS256), Bearer header or `token` cookie, `AuthGuard` + `RolesGuard`. No refresh tokens, no server-side session store, no email verification flow, no email provider. |
| Web apps | Next.js 16 / React 19 / Tailwind 4. Each portal is effectively a **single client-rendered page (`/`)** with its own `lib/api.ts` — no Server Components data fetching, no shared API client. |
| Mobile | React Native CLI 0.88 (no Expo ✔), Zustand + React Query, own `services/api/*` clients. Android Gradle project present. |
| Shared | `@padhai-pilot/shared`: types, design tokens (`tokens/theme.css`). Types are **not** consistently used by the apps (mobile imports types that do not exist — §6). |
| CI/CD | `.github/workflows/ci.yml` and `deploy.yml` (Node 20, `npm ci`). Not run in this audit. |

## 3. Working features (what is genuinely true)

*Implemented = code present and exercised by a passing unit test or successful build. Not "Verified".*

- Feature/entitlement engine: registry (23 features), 5-stage precedence evaluator, `FeatureFlagGuard`, audit model, unit-tested (10 tests). **Implemented.**
- Tenant isolation checks at service level for teacher batch rosters (unit-tested against the memory store). **Implemented (memory store only).**
- Invitation-code generation / revocation; student redemption (now atomic in the DB path). **Implemented; DB path untested against PostgreSQL.**
- Bulk attendance, assessment draft → publish lifecycle, tuition services (faculty, salary, leave, diary, materials, fee alerts) — unit-tested on the memory store. **Implemented (memory store only).**
- Rate-limit wrapper on Upstash REST with in-process fallback. **Implemented.**
- All four web apps compile and statically prerender (`next build` ✔, §12).

## 4. Partially implemented

| Area | State |
|---|---|
| Student portal (`apps/student`) | One 2,763-line `page.tsx`; many modules; data via memory fallbacks. In Progress. |
| Teacher portal (`apps/teacher`) | 31 files / 13k lines; rich views (marks, diary, salary, leave, materials, fee alerts). Backed by memory fallbacks. In Progress. |
| Mobile Teacher/Student | 48 files / ~10k lines, custom role navigation. **No secure-storage library is installed** (no Keychain/Keystore wrapper, no AsyncStorage/MMKV), no Reanimated, no push/deep-link packages — the spec's "secure token storage" is Not Started. In Progress. |
| PDF generation | Client-side `jspdf` only (`teacher/src/lib/pdfGenerator.ts`). No server/bulk PDFs, no durable storage. In Progress. |
| Media upload | Base64-in-JSON endpoint (`tuition.service.ts:~1378`, 20 MB preflight) plus a Cloudflare worker CDN reference. Vercel's 4.5 MB request limit makes the API path unreliable; **no durable object storage integrated**. In Progress / Blocked on storage provider. |
| Fee reminders | Records and in-app alerts only; no scheduler, no provider delivery. In Progress. |

## 5. Missing (Not Started)

- **Faculty invitation flow** (owner invites → faculty accepts → account created). Public faculty self-registration is now blocked in production precisely because this does not exist. *Highest-priority product gap.*
- Email delivery (verification, password reset, invitations) — no provider configured.
- Email verification and account recovery that works in production (the reset token is created but cannot be delivered).
- Prisma migrations, seed strategy for non-demo environments, backup/restore documentation and drills.
- Server-side PDF generation, CSV/XLSX import/export, bulk-import validation with row-level errors.
- Push notifications, deep links, offline draft storage on mobile.
- Student ↔ faculty messaging beyond the "doubts" stub; parent/guardian features (explicitly later).
- Server Components / SSR data layer; shared typed API client; OpenAPI or equivalent contract.
- Playwright/E2E tests; any integration test against PostgreSQL.
- Public marketing content beyond a single 301-line landing page; privacy policy and terms pages.
- Docs required by the brief that do not exist yet: `architecture.md`, `tenant-configuration.md`, `teacher-portal-crud-matrix.md`, `mobile-feature-matrix.md`, `api-contracts.md`, `database-and-migrations.md`, `deployment-vercel.md` (a differently named `vercel-deployment-and-cicd.md` exists), `security-and-tenant-isolation.md`, `performance-and-cost.md`, `launch-checklist.md`.

## 6. Broken

| # | Item | Evidence | Status |
|---|---|---|---|
| B1 | API did not compile | `tsc -p tsconfig.build.json`: TS2739 (`ROLE_WEIGHTS` missing `INSTITUTE_MANAGER`, `FACULTY`); TS2353 ×2 (`subdomain`, `status` not on `Institute`); TS2307 (`class-validator` not installed) | **Fixed this session**; build now exits 0. |
| B2 | Mobile does not type-check | `tsc --noEmit` → TS5101 (deprecated `baseUrl`) and, with that silenced, **30 errors**: `teacherService.ts` imports non-existent shared types (`BatchStudentRoster`, `AssessmentItem`, `CreateAssessmentDto`, `BulkSaveDraftDto`, `DailyTeachingDiaryItem`), `todayStatus` not on `BatchSummary`, `FeesScreen` query-type mismatch, etc. | Open. |
| B3 | `DTO` validation never ran | `admin.dto.ts` used `class-validator` that was not installed and no `ValidationPipe` existed anywhere. All request bodies were unvalidated. | Dependencies + global `ValidationPipe` added this session. **Only the admin DTOs use decorators; every other controller still takes untyped inline bodies** — Open. |
| B4 | Non-spec font | `apps/admin/src/app/layout.tsx` and `apps/web/src/app/layout.tsx` load **Geist**. The brief allows only Playfair Display, Raleway, Inter. | Open. |
| B5 | Super-admin UI inside Teacher app | `apps/teacher/src/app/page.tsx`, `AuthModal.tsx`, `AuthWelcomeScreen.tsx` reference `SUPER_ADMIN`; spec §21 describes a `PlatformSuperAdminFeatureView` in `apps/teacher`. Platform control must live only in `apps/admin`. | Open — needs removal/migration to `apps/admin`. |
| B6 | Request body limits | `main.ts` raises limits to 35 MB, but `NestFactory.create` also registers Nest's default 100 kB parser first, and Vercel caps request bodies at ~4.5 MB. Large uploads through the API cannot be relied on. | Open. |
| B7 | `AdminService` is memory-backed | Institutes, audit logs and stats live in `Map`s; DB writes swallowed errors. | Compile fix only; **not production-capable**. |

## 7. Dependency & installation

- `npm install` for the API workspace succeeded (`class-validator`, `class-transformer` added; lockfile +42 lines). No clean-room `npm ci` was run in this audit — **not verified**.
- `npm audit` reports 17 vulnerabilities (3 critical, 7 high) in the full tree. Not triaged.
- `apps/api` has a `postinstall: prisma generate`; the mobile app keeps its own `package-lock.json` inside a workspace, which can conflict with the root lockfile — should be removed after confirming Metro/Gradle resolution.
- Local `.env` contains real-looking cloud DB and Redis credentials. It is correctly git-ignored and untracked (`git ls-files .env` is empty). **No command in this session wrote to that database.**

## 8. Database status

38 Prisma models/enums covering institutes, memberships, batches, enrollments, invitations, attendance, assignments, tests, assessments/marks/history, notifications, feature flags/entitlements/audit/usage, faculty, salary, leave, diary, study material, fee records/reminders. Reasonable indexes on the main foreign keys.

Gaps: no migrations; `Institute` lacks `status`/`subdomain`/`customDomain` that the admin code assumes; no `FacultyInvitation`, `Document`, `Message`, `Outbox`/idempotency-key, `Session`/`RefreshToken`, or `PlatformSetting` tables; fee `StudentFeeReminder` has no uniqueness key to prevent duplicates.

## 9. Authentication status

Fixed this session (all in `apps/api/src/auth`, `common/security`, `common/guards`; covered by 15 new tests):

| Before | After |
|---|---|
| Passwords stored/compared as plaintext | `scrypt` (node:crypto, no native addon) with per-password salt, constant-time compare; unknown accounts still burn a hash to equalise timing |
| `password123` / `demo` accepted for **any** account | removed |
| `JWT_SECRET \|\| 'padhaipilot-production-secret-key-2026'` | no default; production throws without a ≥32-char secret **and rejects the old literal** |
| Seeded `SUPER_ADMIN` / owner / teacher / student with known password, always on | seeded only when `NODE_ENV !== 'production'` |
| `/auth/demo-*` active everywhere | 404 in production |
| `email \|\| 'teacher@…'`, `password \|\| 'password123'` login defaults | removed; missing credentials → 400 |
| Reset token returned in the HTTP response; reset only touched the memory store | token returned only in demo mode; DB path stores a SHA-256 of the token, 1 h expiry, single-use atomic consume; response identical for unknown emails |
| `change-password` accepted `'demo'` and did nothing on the DB path | verifies current password against hash on both paths |
| Min password length 6 | 8–128 |
| Public `/auth/register` accepted `role: TEACHER` and created a new institute for them | public sign-up creates only `TUITION_OWNER`; `TEACHER` is refused in production |
| Student register: default institute `inst_apex_academy` when no code; code `usedCount` incremented non-atomically | no code → account with no membership; redemption is a single guarded `updateMany` inside the registration transaction |
| JWT 7 days | 12 h (`JWT_EXPIRES_IN`), HS256 pinned on verify |
| `CORS origin: true` + credentials; Vercel handler echoed any `Origin` | allow-list from `CORS_ORIGINS`; native clients without `Origin` pass |
| No `SUPER_ADMIN` provisioning path | `npm run bootstrap:admin` (operator-run, refuses if one exists; no HTTP route) |

**Still open:** role/institute are read from the JWT, so a revoked membership stays valid until expiry (needs refresh tokens or a per-request membership check — cost trade-off to decide); no email verification; web portals keep the JWT in `localStorage` (XSS-exposed) in addition to the httpOnly cookie; mobile has no secure token storage dependency at all (see §4); `RolesGuard` is applied per controller but *resource-level* checks (e.g. student → own record) live in services and are only tested on memory stores; global rate limiting beyond login/register/forgot is not applied.

> **Action required from you:** the local `.env` `JWT_SECRET` is **exactly the string that was committed in source**. If the same value is set in Vercel (or anywhere deployed), anyone who has seen this repository can forge a `SUPER_ADMIN` token. Rotate it in every environment now. I did not change `.env` or any Vercel setting.

## 10. Portal & mobile integration status

| Application | Real-API integration | Notes |
|---|---|---|
| `apps/web` | n/a | Static landing page; sign-in entry points to be verified; Geist font (B4). |
| `apps/admin` | Calls `/api/admin/*`; backed by memory service | Demo login in `page.tsx`; single-file app; no first-run provisioning UI. |
| `apps/teacher` | Calls API via `lib/api.ts` (872 lines) | Demo-login code in `AuthModal.tsx` / `api.ts`; contains super-admin references (B5). |
| `apps/student` | Calls API via `lib/api.ts` | Demo student login in `api.ts`. |
| `apps/mobile` | `services/api/*`, default base URL `https://padhai-pilot.vercel.app/api` | Does not type-check (B2); demo-login in `authService.ts`; never run on a device/emulator in this audit. |

The demo-login helpers in all four clients now call endpoints that return 404 in production; the UI affordances for them still exist and must be removed or hidden behind `NEXT_PUBLIC_DEMO` before launch.

## 11. Other readiness areas

- **Vercel deployment:** entry point and rewrites exist; **no deployment was attempted or verified**. Cold start of Nest + Prisma, 4.5 MB body limit (B6), pooled `DATABASE_URL` vs `DIRECT_URL` (schema currently has no `directUrl`), and the root `vercel.json` rewrite pointing at `/apps/api/api/index.ts` all need real verification.
- **Security (non-auth):** no CSRF strategy for the cookie path (SameSite=Lax mitigates cross-site POST but a cross-origin Vercel API will need `None`); security headers/Helmet absent; no upload MIME/size enforcement beyond the base64 preflight; `HealthController` exposes `uptime`/environment (low).
- **Performance/cost:** Redis is used for rate limiting and dashboard/config caches (reasonable). Portals are single client pages, so no server-component savings yet. No measurements taken — **no cost claims are made**.
- **UI/UX:** consistent token system (`shared/tokens`, "AK Paper-Desk" light theme in teacher; dark luxury theme in student — **two different looks**, contrary to "one identity"). I did not open the apps in a browser in this audit, so visual quality is **not assessed**. Palette extraction from the reference portfolio was not re-done.
- **Testing:** 107 API unit tests (memory-backed); 1 mobile jest file; no web tests; `test/app.e2e-spec.ts` not run.

## 12. Commands run and results

| Command | Result |
|---|---|
| `npm run build:shared` | ✔ |
| `npm run build:api` (baseline) | ✘ TS2739 in `features.service.ts` |
| `vitest run` in `apps/api` (baseline) | ✔ 92/92 |
| `npm run build --workspace=@padhai-pilot/{web,admin,teacher,student}` (baseline) | ✔ all four (each prerenders `/` and `/_not-found`) |
| `tsc --noEmit` in `apps/mobile` (baseline) | ✘ TS5101; 30 errors once silenced |
| `npm install class-validator class-transformer --workspace=@padhai-pilot/api --ignore-scripts` | ✔ |
| `npm run build:api` (after fixes) | ✔ exit 0 |
| `vitest run` in `apps/api` (after fixes) | ✔ **107/107** (11 files) |

Not run: `npm ci` from clean, lint, mobile jest, Android build, any Vercel deployment, any command against PostgreSQL/Redis, any browser check.

## 13. Changes made in this session (uncommitted)

`apps/api`: new `src/common/security/{password,runtime}.ts`; rewritten `src/auth/auth.service.ts` and `auth.controller.ts`; `common/guards/auth.guard.ts`; `main.ts` and `api/index.ts` (CORS allow-list, `ValidationPipe`, fail-fast JWT secret); `features/features.service.ts` (role weights); `admin/admin.service.ts` (schema-valid fields); new `src/scripts/bootstrap-super-admin.ts` + `bootstrap:admin` script; new `auth.security.spec.ts`; `package.json`/`package-lock.json` (+`class-validator`, `class-transformer`). Root `.env.example` documents `JWT_SECRET`, `JWT_EXPIRES_IN`, bootstrap variables, and exact-origin CORS. `PROJECT_SPEC.md` gets a correction note.

## 14. Recommended repair order

1. **Rotate `JWT_SECRET` everywhere** (you). Commit the work above.
2. **Database reality:** create a throw-away PostgreSQL (Neon/Supabase branch), add `directUrl`, generate the initial Prisma migration, add a DB-backed test harness. *Blocked on a non-production database URL from you.*
3. **Delete the `isConnected` fallbacks** service-by-service (auth → tuition → student → assessment → admin), porting each service's tests to the real DB. This is the single largest piece of remaining work.
4. **Faculty invitation flow** (model + endpoints + Teacher Portal UI + mobile) and email provider selection (cost-aware: Resend/Brevo free tier).
5. **Move platform control out of `apps/teacher`** into `apps/admin`; build `apps/admin` as a real multi-page app on the DB-backed `AdminService`; add first-run guidance for the bootstrapped Super Admin.
6. **Fix mobile type errors (B2)**, remove demo login affordances from all clients, then Android emulator verification.
7. **Contract layer:** export the DTO/response types actually used by the apps from `@padhai-pilot/shared`; one typed fetch client shared by the three portals.
8. **Storage + PDFs:** pick durable object storage (R2/Vercel Blob/Supabase Storage), signed upload URLs (removes B6), server-side PDF generation.
9. **Design pass:** unify theme across portals, remove Geist, welcome/onboarding flows per portal, then accessibility pass.
10. **Deploy to Vercel preview** with real env vars, run smoke tests, then write the remaining docs listed in §5.


---

## 15. Addendum — mobile & role-authorization findings (2026-10-31, second pass)

**Live API:** `https://padhai-pilot.vercel.app/api/health` returned `200`, `database: connected`, `environment: production` (took ~2.7 s, i.e. a cold start). The deployed build is the **pre-hardening** code from `main`, so the backdoor passwords, the leaked JWT secret and the open CORS policy described in §9 are **still live until the `audit/auth-hardening` branch is merged and redeployed**. I did not log in, register or write anything on the live service.

**A1 — No role authorization on any non-admin controller (fixed in this pass).** `StudentController`, `TeacherController`, `TuitionController` and `AssessmentController` used only `AuthGuard`. Any signed-in user, including a student, could call staff routes in their institute — e.g. read every faculty member's salary (`GET /tuition/salaries`), generate/pay salaries, approve leave, edit institute branding, publish assessments. Now: class-level `@Roles` (student routes → `STUDENT`; teacher/assessment/tuition → staff roles), owner-only routes → management roles, `/assessment/student/*` → `STUDENT`; salaries and leaves are pinned to the caller's own records unless the caller is management (the old leave check only handled `TEACHER`, not `FACULTY`). Covered by `controller-roles.spec.ts` (5 tests). **Still open:** feature-flag guards (`FeatureFlagGuard`) are not applied to these controllers, and resource-level checks (delegated faculty permissions such as `VIEW_FEES`) are not enforced.

**A2 — The backend itself returns fabricated data.** `StudentService` returns hard-coded values for every student: `rollNumber: 'APX-2026-001'`, batch "JEE Advanced — Mathematics Alpha", a fixed timetable, and process-wide in-memory query/task lists shared by *all* students (`memAcademicQueries`, `memStudyTasks`; `getTimetable(_user)`, `getAnnouncements(_user)`, `getStudyTasks(_user)` ignore the user). Real students on the live API therefore see invented and cross-student data. This must be replaced with DB-scoped queries before any client — web or mobile — can be called "end to end on live".

**A3 — The mobile data layer has never worked against the real API.** Of the student routes the app calls, these do not exist on the server: `/student/study-vault` (server: `/student/materials`), `/student/attendance/correction` (`…/correction-request`), `/student/assignments/submit` (`/student/assignments/:id/submit`), `/student/tests/:id/submit` (`…/attempt`), `/student/doubts` (`/student/queries`), `/student/study-planner[/tasks]` (`/student/study-tasks`), `/student/notifications` (`/assessment/student/notifications`), `/student/join-institute` (`/student/join-batch`). Every service method wrapped its call in `try/catch` and returned hard-coded sample data ("Aarav Patel", "Prof. Rajesh Sharma") on any error, so the app looked functional while showing no real data. Response field names also differ from the server (`entryDate/topicsCovered` vs `lessonDate/conceptsTaught`, `AttendanceSummary` vs `StudentAttendanceSummary`, …). The web student client has the same `try/catch → mock` pattern in several calls.

**Fixed in the mobile app in this pass:** request timeout 2.5 s → 20 s (a cold start alone exceeded the old limit); `authService` no longer fabricates a session when demo login fails and demo login throws outside `__DEV__`; the "Instant Demo Access" card and both "Role Switcher" previews render only in development builds; hard-coded teacher identity fallbacks removed from the teacher profile. Mobile `tsc` errors 30 → 17.

**Still to do for the mobile app (ordered):**
1. Replace the 26 mock-returning `catch` blocks in `studentService.ts` / `teacherService.ts` with real routes and server-shaped types (generate types from the server DTOs in `@padhai-pilot/shared`), then fix the screens `tsc` flags. Errors must reach the UI as error/empty states with retry.
2. Make the corresponding server services real (A2) — otherwise the mobile app can only show the same fabricated data as the web portals.
3. Persist the session in Keychain/Keystore-backed storage (no library installed) and handle 401 by signing out.
4. Remove the remaining sample-data defaults in screens, then run on an emulator against a staging API with seeded non-demo data.
5. Android release build + signing, push notifications, deep links (none started).


### Mobile status after the third pass (2026-10-31)

**Done (verified by `tsc --noEmit` = 0 errors and `jest` = 44/44):** the mobile data layer and all screens were rebuilt on the real server contract.
- `@padhai-pilot/shared` now owns the student API contract (`types/student.ts`); the API's `StudentService`, the web client and the mobile app can all import it. Mobile `studentService`/`teacherService` map 1:1 onto real controller routes with no `catch → sample data` fallbacks (jest asserts routes, bearer header, 401 sign-out, and that failures reject).
- Student: Home, Vault (diary + notes), Tests (homework submit/draft, server-scored tests), Results + Attendance (+ correction request), More (timetable, notifications, fees, planner, ask-a-teacher, documents, profile + join batch + sign out).
- Faculty: Home, Classes (roster + invite codes), Attendance, Bulk marks (draft → publish), Vault (diary + materials), More (homework + grading, announcements, timetable, own leave, own salary, sign out). Owner-only operations are deliberately absent from mobile.
- Every data screen uses one `QueryBoundary` (loading / error + retry / empty), pull-to-refresh, no polling; 401 signs the user out and clears the query cache; platform-admin sessions are refused; demo UI is development-only.

**Not done / not verified:**
1. **The backend still serves fabricated data** (A2): student endpoints return hard-coded values, the teacher/tuition/assessment services are in-memory and process-local (on Vercel, writes vanish between invocations). The app is *connected* to the real routes, but "real data end to end" requires rewriting those services on Prisma plus the missing tables (academic queries, study tasks, attendance corrections, support requests, documents) and a first migration. This is the next work item and needs a non-production database.
2. Session is memory-only (user signs in on every launch): needs Keychain/Keystore storage (native dependency, requires an Android build to verify).
3. Fonts: Playfair Display / Raleway / Inter are referenced but **not bundled** on Android (falls back to system serif/sans).
4. Android debug/release build and emulator run were **not** performed; push notifications, deep links, offline drafts not started.
5. `StatusBar.backgroundColor` removed (unsupported on RN 0.88); `GET /tuition/diaries` returns every faculty member's entries in the institute to any staff role (privacy review needed).
