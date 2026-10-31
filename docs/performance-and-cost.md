# Performance and Cost

Facts below were read from the Vercel account (`bhau-ki-team`) on 2026-10-31 and from the repository. No monthly bill is promised; measure in the Vercel dashboard (Usage) before and after changes.

## Current deployment shape

| Project | Root | Functions | Notes |
|---|---|---|---|
| `padhai-pilot` (API) | `apps/api` | One serverless function (`api/index.ts`) running the whole NestJS app; Node 24; Fluid compute on; region `iad1` | Cold start = Nest bootstrap + Prisma client. The Express app is cached across invocations in the same instance |
| `admin.padhai-pilot`, `student.padhai-pilot`, `padhai-pilot-grwp` (teacher), `padhaipilot` (web) | `apps/<name>` | None at runtime: each is a statically prerendered Next.js page served from the CDN | The portals fetch data from the API from the browser, so they cost build minutes and bandwidth only |

Database: Prisma Postgres (`db.prisma.io`). The API function region `iad1` sits next to it, which keeps API↔DB latency low. Users in India pay one trans-continental round trip per API call; that is the price of keeping the function next to the database. Moving both to a Mumbai region would need a new database, so it is a deliberate later decision, not a quick toggle.

Fluid compute is already on for every project, which lets one instance serve concurrent requests instead of one instance per request. That is the single biggest invocation-cost lever and needs no change.

## Changes made in the repository

- Every project's `vercel.json` has `ignoreCommand: [ "$VERCEL_GIT_COMMIT_REF" != "main" ]`, so pushes to feature branches no longer build previews for five projects. Only `main` builds. Previews can still be created manually (`vercel deploy`) when a branch needs a look. The projects already have "affected projects only" builds enabled, so a change that touches one app does not rebuild the others.
- API function `maxDuration` should be capped (about 30 s) so a runaway request cannot bill for minutes. It is not set in `vercel.json` because the API project uses the NestJS framework preset and a `functions` pattern that does not match its generated function fails the deployment; set it under Project Settings → Functions instead.
- Portals fall back to the production API URL when `NEXT_PUBLIC_API_URL` is unset (a relative `/api` would have hit the portal's own static site).

## Levers still open (ordered by expected saving)

1. **Fewer API calls per screen.** Dashboards currently fan out into several requests; analytics endpoints should return one bounded payload per screen. React Query on mobile already uses 2–30 minute stale times and no polling; keep that rule for the web portals.
2. **Bounded queries.** Every list endpoint needs a default limit and indexed filters (tenant + foreign key + date). This is part of the Backend workstream (`docs/api-contracts.md`).
3. **Pooled connections.** The API must use the pooled Prisma URL with `connection_limit=1` per instance; confirm the value of `DATABASE_URL` in Vercel before launch.
4. **Redis only where measured.** Upstash is used for rate limiting and a few caches. Do not add Redis calls for cheap lookups; a Redis command costs more than a primary-key read.
5. **No always-on workers.** Fee reminders and notifications should be written as rows and delivered on demand or by a single scheduled function, not by polling.
6. **Bundle weight.** 3D (Three.js) and chart libraries are lazy-loaded and only on screens that use them; mobile uses `react-native-svg` charts rather than a full graphics engine unless measured otherwise.
7. **Region.** Revisit when there are enough Indian users to justify a Mumbai database.
