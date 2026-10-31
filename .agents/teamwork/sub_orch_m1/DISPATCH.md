# Dispatch for sub_orch_m1

**Identity**: sub_orch_m1 (Sub-Orchestrator for Milestone 1)
**Working Directory**: A:\padhai-pilot\.agents\teamwork\sub_orch_m1
**Parent Conversation ID**: 822ea61b-28ad-416b-8373-a40b0bcfe2f2
**Required Reading**:
- A:\padhai-pilot\.agents\teamwork\ORIGINAL_REQUEST.md
- A:\padhai-pilot\PROJECT.md
- A:\padhai-pilot\.agents\teamwork\survey_explorer_1\handoff.md
- A:\padhai-pilot\.agents\teamwork\survey_explorer_3\handoff.md

## Scope & Objective
You own **Milestone 1: Core Schema, Database Fail-Closed 503 Resilience & Shared Contracts**:
1. **Conflict Cleanup**:
   - Resolve git merge conflict markers in `apps/api/prisma/schema.prisma` (line 1163 `>>>>>>> backend-core`) and `apps/api/src/tuition/tuition.service.ts` (line 93 `<<<<<<< HEAD`).
2. **Fail-Closed 503 Database Resilience**:
   - Update `HealthController` (`apps/api/src/health/health.controller.ts`) and database access checks so that if `!this.prisma?.isConnected`, the service fails closed with HTTP 503 (`ServiceUnavailableException`), with zero mock data fallbacks in production endpoints.
3. **Prisma Schema Enhancements**:
   - Add/verify `StudentLeaveApplication` model (`id`, `instituteId`, `studentId`, `batchId`, `startDate`, `endDate`, `reason`, `status: PENDING/APPROVED/REJECTED`, `remarks`, `reviewedById`, `reviewedAt`, `createdAt`, `updatedAt`).
   - Add/verify `TimetableSlot` model fields and relationships.
   - Add/verify `AcademicBroadcast` / `Announcement` model fields and relationships.
   - Add/verify `StudentFeeRecord` payment verification fields (`paidAt`, `paymentMode`, `transactionRef`, `receiptNumber`, `verifiedById`).
   - Add/verify `Institute` branding fields (`name`, `logoUrl`, `primaryColor`, `signatoryName`, `signatoryTitle`, `address`, `contactPhone`, `contactEmail`, `footerText`).
4. **Shared Package Contracts**:
   - Ensure `packages/shared` exports matching TypeScript DTO interfaces and types for enrollment codes, timetable slots, broadcasts, branding, fees, and student leaves.
5. **Verification**:
   - Run `npx prisma validate --schema=apps/api/prisma/schema.prisma` and ensure `prisma generate` passes.
   - Run unit tests in `apps/api` and typecheck in `packages/shared`.
6. Follow the standard iteration cycle (Explorer -> Worker -> Reviewers -> Challengers -> Auditor) or direct delegation. Update `SCOPE.md`, `progress.md`, and report completion via `send_message`.
