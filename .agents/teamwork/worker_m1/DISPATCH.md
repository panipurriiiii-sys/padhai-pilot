# Dispatch for worker_m1

**Identity**: worker_m1 (teamwork_worker)
**Working Directory**: A:\padhai-pilot\.agents\teamwork\worker_m1
**Mandatory Reading**:
- A:\padhai-pilot\.agents\teamwork\ORIGINAL_REQUEST.md
- A:\padhai-pilot\PROJECT.md
- A:\padhai-pilot\.agents\teamwork\survey_explorer_1\handoff.md
- A:\padhai-pilot\.agents\teamwork\survey_explorer_3\handoff.md

## Exclusive File Ownership
- `apps/api/prisma/schema.prisma`
- `apps/api/src/tuition/tuition.service.ts`
- `apps/api/src/health/health.controller.ts`
- `apps/api/src/common/db/*`
- `packages/shared/src/types/*`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mandate & Scope: Milestone 1
Execute all tasks for **Milestone 1: Core Schema, Database Fail-Closed 503 Resilience & Shared Contracts**:
1. **Fix Git Conflict Markers**:
   - Clean up line 1163 in `apps/api/prisma/schema.prisma` (`>>>>>>> backend-core`).
   - Clean up line 93 in `apps/api/src/tuition/tuition.service.ts` (`<<<<<<< HEAD`, `=======`, `>>>>>>>`).
2. **Fail-Closed 503 Database Resilience**:
   - Modify `HealthController` (`apps/api/src/health/health.controller.ts`) so that when `!this.prisma?.isConnected`, it returns HTTP 503 (`ServiceUnavailableException`) instead of returning HTTP 200 with `'fallback-active'`.
   - Ensure `assertDb` and database guards in `apps/api` fail closed with HTTP 503 across production endpoints when database is unreachable. Zero mock data fallbacks in production.
3. **Prisma Schema Enhancements**:
   - Add `StudentLeaveApplication` model:
     - `id String @id @default(cuid())`
     - `instituteId String`
     - `studentId String`
     - `batchId String`
     - `startDate DateTime`
     - `endDate DateTime`
     - `reason String`
     - `status String @default("PENDING")` // PENDING, APPROVED, REJECTED
     - `remarks String?`
     - `reviewedById String?`
     - `reviewedAt DateTime?`
     - `createdAt DateTime @default(now())`
     - `updatedAt DateTime @updatedAt`
     - Add appropriate relations to Institute, User (student), Batch, User (reviewedBy).
   - Verify/add `TimetableSlot` model and fields.
   - Verify/add `StudentFeeRecord` payment verification fields: `paidAt DateTime?`, `paymentMode String?`, `transactionRef String?`, `receiptNumber String? @unique`, `verifiedById String?`.
   - Add/verify `Institute` branding fields: `logoUrl String?`, `signatoryName String?`, `signatoryTitle String?`, `contactPhone String?`, `contactEmail String?`, `address String?`.
4. **Shared Contracts**:
   - Update `packages/shared/src/types` with TypeScript interfaces for:
     - Enrollment code DTOs (perpetual, regeneration, expiration)
     - Timetable slot DTOs
     - Academic broadcast DTOs
     - Tuition branding & letterhead DTOs
     - Student leave application DTOs (create, review, list)
     - Student fee & payment verification DTOs
5. **Build and Verification**:
   - Run `npx prisma validate --schema=apps/api/prisma/schema.prisma`
   - Run `npm run prisma:generate` or `npx prisma generate --schema=apps/api/prisma/schema.prisma`
   - Run `npm run build:shared`
   - Run unit tests in `apps/api` (`npm test --workspace=@padhai-pilot/api`) and verify passing tests.
6. Compile your findings, commands run, diffs, and verification results in `A:\padhai-pilot\.agents\teamwork\worker_m1\handoff.md` and send completion notification.
