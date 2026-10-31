# Project: Padhai-Pilot Production Enhancements

## Architecture
Padhai-Pilot is a production Turborepo monorepo structured across backend, web portals, mobile application, and shared libraries:

- **Backend API (`apps/api`)**:
  - NestJS 11 with Prisma 6.4.1 ORM targeting PostgreSQL.
  - Fail-closed database resilience: Whenever database connectivity is lost (`!prisma.isConnected`), API endpoints fail closed with HTTP 503 (`ServiceUnavailableException`) instead of returning mock or fallback data.
  - Strict role-based access control via `RolesGuard` and `AccessService` tenant boundaries.
- **Teacher Web Portal (`apps/teacher`)**:
  - Next.js 14/16 App Router client dashboard for tuition owners and faculty.
  - Paper-Desk luxury design system (`@padhai-pilot/shared/theme.css`).
  - Standardized API client (`src/lib/api.ts`) communicating with NestJS backend.
- **Student Web Portal (`apps/student`)**:
  - Next.js 14/16 App Router student portal.
  - Dedicated views for Timetable, Broadcasts, Fees/Receipts, and Student Leaves.
- **Mobile Application (`apps/mobile`)**:
  - Strictly bare React Native CLI (v0.88.1, zero Expo dependencies).
  - TypeScript strict mode enabled throughout.
  - Client state: Zustand stores (`useAuthStore.ts`, `useNavigationStore.ts`).
  - Server state: TanStack Query (`@tanstack/react-query`).
  - Strict Paper-Desk design tokens (`src/theme/tokens.ts`).
- **Shared Package (`packages/shared`)**:
  - Shared TypeScript types, DTO contracts, and design tokens (`theme.ts`, `tokens.json`, `theme.css`).

---

## Feature Inventory
Every feature identified during the survey phase is assigned to a specific milestone. No feature is left unassigned.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Conflict Resolution & Schema Hygiene | Resolve git conflict markers in `schema.prisma` and `tuition.service.ts`; add `StudentLeaveApplication`, timetable fields, and branding models | M1 | Survey 1, Survey 3 |
| F2 | Fail-Closed 503 Database Resilience | Enforce HTTP 503 on database unavailability across `HealthController` and all production endpoints; zero mock fallbacks | M1 | ORIGINAL_REQUEST §R6 |
| F3 | Enrollment Code Without Day Limits | Generate enrollment codes with perpetual/no forced day limits | M2 | ORIGINAL_REQUEST §R1 |
| F4 | Manual Code Regeneration & Expiry | Allow teachers to manually regenerate, update, or expire enrollment codes at any time | M2 | ORIGINAL_REQUEST §R1 |
| F5 | Student Batch Joining & Expired Code Rejection | Validate active enrollment code on join; reject expired/revoked codes with clean errors | M2 | ORIGINAL_REQUEST §R1 |
| F6 | Batch Code Quick-Copy & Native Sharing | Mobile & Web one-tap copy to clipboard and native `Share.share()` API integration | M2 | Survey 2, Survey 3 |
| F7 | Weekly Timetable CRUD Backend | Full batch-wise timetable CRUD (`GET`, `POST`, `PUT`, `DELETE /teacher/batches/:batchId/timetable`) | M3 | ORIGINAL_REQUEST §R2 |
| F8 | Teacher Web Timetable UI | Interactive weekly timetable management schedule in Teacher Web | M3 | ORIGINAL_REQUEST §R2 |
| F9 | Teacher Mobile Timetable Screens | Timetable viewing and slot management in React Native mobile app | M3 | ORIGINAL_REQUEST §R2 |
| F10 | Student Timetable Viewing | Batch-specific weekly timetable viewing on Student Web and Mobile | M3 | ORIGINAL_REQUEST §R2 |
| F11 | Academic Broadcast Publishing | Broadcast announcements creation with title, content, and batch targeting | M4 | ORIGINAL_REQUEST §R3 |
| F12 | Student Broadcast Feed & Alerts | Display published broadcasts on Student Web and Mobile | M4 | ORIGINAL_REQUEST §R3 |
| F13 | Tuition Logo Upload & Storage | Multipart logo upload endpoint storing files safely in configured storage/upload directory | M5 | ORIGINAL_REQUEST §R4 |
| F14 | Tuition Branding & Letterhead Customization | Tuition branding settings (name, colors, signatory, contact) & customized letterhead preview | M5 | ORIGINAL_REQUEST §R4 |
| F15 | White-Labeled Document Generation | Generated letterheads, marksheets, and fee receipts strictly omit "Padhai-Pilot" branding | M5 | ORIGINAL_REQUEST §R4 |
| F16 | Student Fee Tracking & Balance Alerts | Student fee balance computation, overdue tracking, and in-app balance alerts | M6 | ORIGINAL_REQUEST §R5 |
| F17 | Student Leaves Submission & Status Tracking | Student leave application submission (dates, reason) and status tracker (pending/approved/rejected) | M6 | ORIGINAL_REQUEST §R5 |
| F18 | Teacher Leaves Approval Workflow | Teacher review, approval, and rejection interface with optional remarks | M6 | ORIGINAL_REQUEST §R5 |
| F19 | E2E Test Suite (Tiers 1-4) | Comprehensive opaque-box test runner covering enrollment, timetable, broadcasts, branding, and leaves | E2E Track | ORIGINAL_REQUEST §Verification |
| F20 | Adversarial Coverage Hardening (Tier 5) | White-box stress testing, boundary condition verification, and coverage hardening | M7 | Project Pattern |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite Track | Design and implement opaque-box test infrastructure & test cases (Tiers 1-4); publish `TEST_READY.md` | none | PLANNED |
| M1 | Core Schema, DB Fail-Closed 503 & Contracts | Fix conflict markers in schema/services, implement fail-closed 503, add Prisma models (`StudentLeaveApplication`, timetable, branding), update shared contracts | none | PLANNED |
| M2 | Enrollment Code Management | Perpetual codes, manual regeneration/expiry, batch joining, quick-copy & native sharing across API, Teacher Web, Student Web, Mobile | M1 | PLANNED |
| M3 | Weekly Teaching Timetable Management | Batch-wise timetable CRUD across backend API, Teacher Web management UI, Student Web view, and Mobile screens | M1 | PLANNED |
| M4 | Academic Broadcast Announcements | Academic broadcast publishing with batch targeting, feed viewing and alerts across API, Web, and Mobile | M1 | PLANNED |
| M5 | Tuition Branding & White-Labeled Letterhead | Logo file upload, tuition branding customization, letterhead preview & white-labeled document generation | M1 | PLANNED |
| M6 | Student Fees, Balance Alerts & Student Leaves | Fee tracking, balance alerts, and full Student Leaves lifecycle across backend API, Web, and Mobile | M1 | PLANNED |
| M7 | Final Milestone: E2E Test Suite & Hardening | Phase 1: Pass 100% of Tiers 1-4 E2E tests (`TEST_READY.md`). Phase 2: Tier 5 adversarial coverage hardening | M2, M3, M4, M5, M6, E2E | PLANNED |

---

## Interface Contracts

### 1. Enrollment Code Management
- `POST /api/teacher/batches/:batchId/enrollment-code`:
  - Request: `{ customCode?: string; isPerpetual: boolean }`
  - Response: `{ code: string; isPerpetual: boolean; expiresAt: string | null; isActive: boolean }`
- `PUT /api/teacher/batches/:batchId/enrollment-code/regenerate`:
  - Response: `{ code: string; isPerpetual: boolean; expiresAt: string | null; isActive: boolean }`
- `PUT /api/teacher/batches/:batchId/enrollment-code/expire`:
  - Response: `{ success: boolean; isRevoked: boolean }`
- `POST /api/student/enroll`:
  - Request: `{ enrollmentCode: string }`
  - Response: `{ success: boolean; batchId: string; batchName: string; rollNumber: string }`
  - Error: HTTP 400 `{ error: "Enrollment code has expired or is invalid" }`

### 2. Weekly Timetable Management
- `GET /api/teacher/batches/:batchId/timetable` / `GET /api/student/batches/:batchId/timetable`:
  - Response: `TimetableSlotDto[]` (`id`, `batchId`, `dayOfWeek: 1..7`, `startTime: "HH:mm"`, `endTime: "HH:mm"`, `subject`, `room`, `teacherName`)
- `POST /api/teacher/batches/:batchId/timetable`:
  - Request: `{ dayOfWeek: number; startTime: string; endTime: string; subject: string; room?: string }`
  - Response: `TimetableSlotDto`
- `PUT /api/teacher/timetable/:slotId`:
  - Request: `Partial<CreateTimetableSlotDto>`
  - Response: `TimetableSlotDto`
- `DELETE /api/teacher/timetable/:slotId`:
  - Response: `{ success: boolean }`

### 3. Academic Broadcasts
- `POST /api/teacher/broadcasts`:
  - Request: `{ title: string; content: string; batchIds: string[]; priority?: 'NORMAL' | 'URGENT' }`
  - Response: `BroadcastDto` (`id`, `title`, `content`, `batchIds`, `authorName`, `createdAt`)
- `GET /api/student/broadcasts`:
  - Response: `BroadcastDto[]` filtered to batches the student is actively enrolled in.

### 4. Tuition Branding & Logo Upload
- `POST /api/tuition/branding/logo`:
  - Multipart file upload: `logo` (image/png, image/jpeg, image/svg+xml; max 5MB)
  - Response: `{ logoUrl: string }`
- `GET /api/tuition/branding`:
  - Response: `TuitionBrandingDto` (`name`, `logoUrl`, `address`, `contactPhone`, `contactEmail`, `signatoryName`, `signatoryTitle`, `primaryColor`)
- `PATCH /api/tuition/branding`:
  - Request: `Partial<TuitionBrandingDto>`
  - Response: `TuitionBrandingDto`

### 5. Student Leaves Lifecycle
- `POST /api/student/leaves`:
  - Request: `{ batchId: string; startDate: string; endDate: string; reason: string }`
  - Response: `StudentLeaveDto` (`id`, `studentId`, `batchId`, `startDate`, `endDate`, `reason`, `status: 'PENDING'`, `createdAt`)
- `GET /api/student/leaves`:
  - Response: `StudentLeaveDto[]`
- `GET /api/teacher/leaves`:
  - Query: `?batchId=...&status=PENDING`
  - Response: `TeacherLeaveViewDto[]` (`id`, `studentName`, `rollNumber`, `batchName`, `startDate`, `endDate`, `reason`, `status`, `createdAt`)
- `PUT /api/teacher/leaves/:id/review`:
  - Request: `{ status: 'APPROVED' | 'REJECTED'; remarks?: string }`
  - Response: `StudentLeaveDto`

---

## Code Layout & Write Boundaries

To avoid concurrency collisions among parallel workers:
- **`apps/api`**:
  - `src/common/db/*`, `prisma/schema.prisma` -> Owned by M1
  - `src/teacher/teacher.controller.ts`, `src/teacher/teacher.service.ts` (Batch & Code endpoints) -> Owned by M2
  - `src/timetable/*` -> Owned by M3
  - `src/broadcast/*` -> Owned by M4
  - `src/tuition/branding.*` -> Owned by M5
  - `src/leaves/*`, `src/fees/*` -> Owned by M6
- **`apps/teacher`**:
  - `src/components/BatchesView.tsx`, `src/lib/api.ts` (batch code) -> Owned by M2
  - `src/components/TimetableView.tsx` -> Owned by M3
  - `src/components/BroadcastView.tsx` -> Owned by M4
  - `src/components/TuitionBrandingView.tsx`, `src/lib/pdfGenerator.ts` -> Owned by M5
  - `src/components/StudentLeavesView.tsx`, `src/components/StudentFeeAlertView.tsx` -> Owned by M6
- **`apps/student`**:
  - `src/app/page.tsx` (join batch modal) -> Owned by M2
  - `src/app/page.tsx` (TIMETABLE tab) -> Owned by M3
  - `src/app/page.tsx` (BROADCAST/NOTIFICATIONS tab) -> Owned by M4
  - `src/app/page.tsx` (FEES tab & white-labeled receipts) -> Owned by M5 & M6
  - `src/app/page.tsx` (LEAVES tab) -> Owned by M6
- **`apps/mobile`**:
  - `src/features/teacher/TeacherClassesScreen.tsx`, `src/features/student/JoinBatchModal.tsx` -> Owned by M2
  - `src/features/timetable/*` -> Owned by M3
  - `src/features/broadcasts/*` -> Owned by M4
  - `src/features/branding/*` -> Owned by M5
  - `src/features/leaves/*`, `src/features/fees/*` -> Owned by M6
- **`tests/e2e`**:
  - Owned exclusively by E2E Testing Track Orchestrator.
