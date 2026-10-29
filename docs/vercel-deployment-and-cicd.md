# PadhaiPilot — Vercel Deployment & CI/CD Guide

This guide details how to deploy **PadhaiPilot** (Backend API & Teacher Portal) to **Vercel**, how the in-memory Redis fallback works, and how the multi-portal **GitHub Actions CI/CD** pipeline operates.

---

## 1. Redis Mode: Disabled & Local In-Memory Fallback

As configured, external Redis dependencies have been completely bypassed for development and initial Vercel deployment:

* **Zero External Dependencies:** `REDIS_ENABLED="false"` in `apps/api/.env`.
* **Zero Network Latency:** Rate limiting and session caching run 100% in-memory using an internal sliding-window map.
* **No Outage Risk:** The app will never fail, hang, or log timeout warnings due to missing Redis instances or unconfigured Upstash credentials.
* **Future Upgrade (Optional):** When ready to use cloud Redis at scale, simply set `REDIS_ENABLED="true"` and provide `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

## 2. Vercel Deployment Strategy

PadhaiPilot is an npm monorepo. On Vercel, deploying the Backend API and the Web Portals as **two linked Vercel Projects** is the recommended production architecture.

### A. Deploying the Backend API (`apps/api`)

1. In the Vercel Dashboard, click **Add New Project** and select the `padhai-pilot` repository.
2. Configure **Root Directory**: `apps/api`
3. **Framework Preset**: `Other` (or auto-detected Node.js)
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist` (Serverless functions are routed automatically via `apps/api/api/index.ts` and `apps/api/vercel.json`)
6. **Environment Variables**:
   * `NODE_ENV`: `production`
   * `JWT_SECRET`: `<your-random-production-jwt-secret>`
   * `REDIS_ENABLED`: `false`
   * `DATABASE_URL`: `postgresql://<user>:<password>@<neon-or-supabase-host>:5432/<dbname>?sslmode=require&pgbouncer=true`
   * `DIRECT_URL`: `postgresql://<user>:<password>@<neon-or-supabase-host>:5432/<dbname>?sslmode=require`
7. Click **Deploy**. Your API will be live at `https://<your-api-domain>.vercel.app/api`.

### B. Deploying the Teacher Portal (`apps/teacher`)

1. In the Vercel Dashboard, click **Add New Project** and select the `padhai-pilot` repository.
2. Configure **Root Directory**: `apps/teacher`
3. **Framework Preset**: `Next.js`
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next`
6. **Environment Variables**:
   * `NEXT_PUBLIC_API_URL`: `https://<your-api-domain>.vercel.app/api`
7. Click **Deploy**. Your portal will be live at `https://<your-teacher-domain>.vercel.app`.

---

## 3. GitHub Actions CI/CD Pipeline

The automated pipeline is configured in `.github/workflows/`:

### 1. `ci.yml` — Continuous Integration (Runs on every Push and PR)
* **Job 1 (`typecheck`):** Validates `@padhai-pilot/shared` types and compiles Prisma schema.
* **Job 2 (`backend-api`):** Runs the full 58-test Vitest suite, compiles the NestJS API, and verifies the Vercel serverless entry point (`apps/api/api/index.ts`).
* **Job 3 (`teacher-portal`):** Runs Next.js build and typechecks the entire Teacher Portal UI.
* **Job 4 (`monorepo-portals`):** Builds other workspace portals (`web`, `admin`, `student`) with `--if-present`.
* **Job 5 (`deployment-readiness`):** Verifies all `vercel.json` configurations and guarantees release integrity.

### 2. `deploy.yml` — Continuous Deployment (Vercel Production Dispatch)
* Triggered on pushes to `main`/`master` or manually via **Run Workflow** in GitHub Actions.
* Uses GitHub Secrets:
  * `VERCEL_TOKEN`: Your Vercel API token.
  * `VERCEL_ORG_ID`: Your Vercel Organization ID.
  * `VERCEL_PROJECT_ID_API`: Project ID for the backend API.
  * `VERCEL_PROJECT_ID_TEACHER`: Project ID for the Teacher Portal.
* Includes dry-run notices if tokens are not yet added, ensuring builds succeed without errors.

