# PadhaiPilot — Engineering Tracker

Single source of truth for work in flight. Statuses: Not Started · In Progress · Implemented · In Review · Verified · Blocked.
"Implemented" means code exists; "Verified" means the workflow was exercised (tests or a real run) and reviewed.
Last updated: 2026-10-31. Facts about the codebase live in `docs/PROJECT_AUDIT.md`.

## Deployment facts (verified against the Vercel account `bhau-ki-team`)

| Vercel project | Root directory | Production URL | State |
|---|---|---|---|
| `padhai-pilot` | `apps/api` | https://padhai-pilot.vercel.app | READY, `/api/health` 200 (database connected) |
| `admin.padhai-pilot` | `apps/admin` | https://adminpadhai-pilot-pi.vercel.app | READY |
| `student.padhai-pilot` | `apps/student` | https://studentpadhai-pilot.vercel.app | READY |
| `padhai-pilot-grwp` | `apps/teacher` | https://padhai-pilot-grwp.vercel.app | READY |
| `padhaipilot` | `apps/web` | https://padhaipilot.vercel.app | READY |

All five are linked to GitHub `main` (auto-deploy on push). GitHub Actions `deploy.yml` is a dry run (no `VERCEL_TOKEN` secret); Vercel's Git integration does the real deploys.
API project env: `DATABASE_URL`, `DATABASE_URL_POOLED`, `JWT_SECRET` (production only), Upstash/KV and Postgres variables. **`CORS_ORIGINS` is not set**, so browsers on the portal origins are blocked by the API's exact-origin allow-list until it is added (value below).

`CORS_ORIGINS` (API project, Production + Preview):
```
https://adminpadhai-pilot-pi.vercel.app,https://adminpadhai-pilot-bhau-ki-team.vercel.app,https://studentpadhai-pilot.vercel.app,https://studentpadhai-pilot-bhau-ki-team.vercel.app,https://padhai-pilot-grwp.vercel.app,https://padhai-pilot-grwp-bhau-ki-team.vercel.app,https://padhaipilot.vercel.app,https://padhaipilot-bhau-ki-team.vercel.app
```

## Status update (end of session 1)

Verified live on 2026-10-31: `CORS_ORIGINS` is set on the API project and deployed (commit `75782fc` on `main`); `/api/health` 200; the four portal origins pass preflight; an unlisted origin gets 403; every portal URL returns 200. A browser login through each portal has not been tested. `JWT_SECRET` was rotated by the owner.

Background agents were started and push to their own branches (never `main`). When they finish, review and merge in this order — the backend owns `schema.prisma`, so it goes first:

1. `backend-core` — real Prisma services, offline migrations, faculty invitations, analytics endpoints. Needs the owner-run migration steps in `docs/database-and-migrations.md` (backup, rehearse on a throwaway DB, `migrate resolve`, `migrate deploy`) before it can be deployed.
2. `design-system-sync` — shared tokens, runtime theme config. Its theme-config Prisma models must be merged into the schema through the backend branch.
3. `premium-components` — SVG library, motion, charts, 3D. Merge after 2 (it builds on the shared tokens).

Owner actions still open: create the first Super Admin (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` of 12+ characters, `npm run bootstrap:admin --workspace=@padhai-pilot/api`, run locally against production); set the API function `maxDuration` to 30 s in Project Settings → Functions; provide a throwaway PostgreSQL URL to rehearse migrations; later, object storage, email/push provider, Android signing keystore.

Not started: T-07 to T-12 (Teacher/Student/Admin portal completion on the real services, mobile secure storage + push + Android release build, independent QA, DevOps runbook). They depend on `backend-core`.

## Ownership (to avoid conflicting versions of shared contracts)

| Area | Owner |
|---|---|
| Prisma schema, migrations, domain models, API contracts, authN/authZ, tenant isolation | Backend & Database (B) |
| Design tokens, theme config API, shared components, SVG/animation library | Design System (D1 theme, D2 components) |
| Final integration, release decisions, cross-team contracts | Engineering Director (this session) |

Rule: only B edits `apps/api/prisma/schema.prisma`. Other workstreams request schema changes through B (or hand B a patch) — the theme-config models from D1 are merged by B.

## Workstreams

| ID | Workstream | Branch | Status | Depends on | Review |
|---|---|---|---|---|---|
| T-01 | Audit and security baseline (auth hardening, role guards, CORS, JWT) | `main` | Implemented, deployed; live-verified: health 200, demo route 404, unauthenticated 401, unlisted-origin preflight 403 | — | Self |
| T-02 | Mobile data layer + student/faculty screens on real routes | `main` | Implemented (`tsc` 0 errors, jest 77) — not run on a device | T-03 for real data | Self |
| T-03 | Backend & DB: replace in-memory/hard-coded services with tenant-scoped Prisma, new tables, offline migrations, faculty invitations | `backend-core` | Not Started | DB for staging (owner) | Pending |
| T-04 | Global design-system sync + runtime theme config | `design-system-sync` | In Progress (agent) | T-03 for the schema merge | Pending |
| T-05 | Premium components, SVG library, motion system | `premium-components` | In Progress (agent) | T-04 tokens | Pending |
| T-06 | Production portals reachable from browsers (CORS allow-list, API URL default) | `portals-live` | Implemented in branch; needs the `CORS_ORIGINS` env var set by the owner | owner action | Pending |
| T-07 | Teacher Portal CRUD completion on real services | — | Not Started | T-03 | — |
| T-08 | Student Portal completion on real services | — | Not Started | T-03 | — |
| T-09 | Platform Admin: DB-backed institutes, plans, flags, audit | — | Not Started | T-03 | — |
| T-10 | Mobile: secure storage, push, deep links, Android release build | — | Not Started | T-03 | — |
| T-11 | Independent QA / security / performance review | — | Not Started | T-03, T-07..T-09 | — |
| T-12 | DevOps: migrations runbook, backups, monitoring, rollback | — | Not Started | T-03 | — |

## Blockers needing the owner

1. Add `CORS_ORIGINS` (above) to the API Vercel project, then redeploy it. (An attempt to set it through the Vercel API was blocked by the permission system, so the owner must do it in the dashboard or approve the CLI action.)
2. A non-production PostgreSQL URL (Neon/Supabase branch) for T-03 — migrations are authored offline but must be rehearsed on a throwaway database before touching production.
3. Create the first Super Admin once production auth is confirmed: `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` (12+ chars), then `npm run bootstrap:admin --workspace=@padhai-pilot/api`.
4. Later: object storage, email/push provider, Android signing keystore, custom domains.
