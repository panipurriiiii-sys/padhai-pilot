# Project: Batches and Student Rosters Enhancements

## Architecture
Padhai-Pilot is a multi-tenant tuition/coaching institute management platform organized as an npm workspace monorepo:
- **Backend API (`apps/api`)**: NestJS + TypeScript + Prisma ORM (PostgreSQL) + Vitest.
  - Strict tenant isolation and role-based access control (`RolesGuard`, `assertBatchAccess`).
  - Fail-closed database resilience: Whenever database connectivity is lost (`!prisma.isConnected`), API endpoints fail closed with HTTP 503 (`ServiceUnavailableException`) instead of returning mock or fallback data.
  - Zero mock or sample data in production endpoints.
- **Teacher Web Portal (`apps/teacher`)**: Next.js 14/16 App Router + TypeScript + Tailwind CSS (Paper-Desk design tokens).
  - Used by `TUITION_OWNER`, `INSTITUTE_MANAGER`, and `FACULTY` / `TEACHER`.
  - Batch management, student roster, fee tracking, manual payment verification, batch promotion, white-labeled PDFs.
- **Student Web Portal (`apps/student`)**: Next.js 14/16 App Router + TypeScript + Tailwind CSS (Paper-Desk design tokens).
  - Used by `STUDENT`.
  - Student fee records, dues display, in-app notifications drawer, white-labeled fee receipt viewing and downloading.
- **Mobile Application (`apps/mobile`)**: Bare React Native CLI (v0.88.1, strictly NO Expo) + TypeScript strict + Zustand + TanStack Query + Paper-Desk luxury design tokens (Playfair Display, Raleway, Inter).
  - Teacher mobile workflows: batch editing, code quick-copy & native Share API, fee configuration, roster payment status inspection, manual payment verification, in-place batch promotion.
  - Student mobile workflows: fee alerts, receipt viewing and downloading.
- **Shared Packages (`packages/shared`)**: Centralized design tokens, theme CSS, and cross-platform TypeScript contracts.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Fix Merge Conflicts | Clean git merge conflict markers in `schema.prisma:1163` and `tuition.service.ts:93` | M1 | Survey |
| 2 | Schema Verification Metadata | Add `paidAt`, `paymentMode`, `transactionRef`, `receiptNumber`, `verifiedById` to `StudentFeeRecord` | M1 | Survey / R2, R3 |
| 3 | Fail-Closed 503 Health Check | Update `HealthController` to fail closed with HTTP 503 on database disconnect | M1 | Survey / R5 |
| 4 | Backend Batch Edit API | `PUT /api/teacher/batches/:batchId` with `assertBatchAccess` and cache invalidation | M1 | Survey / R1 |
| 5 | Backend Batch Fee Config API | `POST /api/teacher/batches/:batchId/fees` initializing `StudentFeeRecord` (status `PENDING`) for all enrolled students & notifications | M1 | Survey / R2, R3 |
| 6 | Backend Manual Payment Verification API | `PUT /api/teacher/fees/:recordId/verify` transitioning status `PENDING` -> `PAID`, recording receiptNumber & notification | M1 | Survey / R2, R3 |
| 7 | Backend White-Labeled Receipt API | `GET /api/tuition/fees/:feeRecordId/receipt` serving receipt data with Institute/Teacher branding (omitting Padhai-Pilot branding) | M1 | Survey / R3 |
| 8 | Backend In-Place Batch Promotion API | `POST /api/teacher/batches/:batchId/promote` updating `gradeLevel` and `name` in-place inside `prisma.$transaction` preserving all enrollments and fee history | M1 | Survey / R4 |
| 9 | Backend Automated Tests | Vitest unit/integration tests for batch editing, fee assignment, payment verification, promotion, and fail-closed 503 handling | M1 | Survey / R5 |
| 10 | Teacher Web Batch Editing | Batch edit modal in `BatchesView.tsx` (name, subject, schedule, room) | M2 | Survey / R1 |
| 11 | Teacher Web Quick-Copy & Share Link | One-click clipboard copy action and shareable batch code / invite link with toast in `BatchesView.tsx` | M2 | Survey / R1 |
| 12 | Teacher Web Batch Fee Config | Batch fee configuration modal to define/update fees in `BatchesView.tsx` | M2 | Survey / R2 |
| 13 | Teacher Web Student Roster Fee Tracking | Student roster table display of fee status chips (`PENDING`, `PAID`, `OVERDUE`), amounts, and balance due | M2 | Survey / R2 |
| 14 | Teacher Web Manual Payment Verification | Teacher action to mark student fee as received/paid with audit details in `BatchesView.tsx` / `StudentFeeAlertView.tsx` | M2 | Survey / R2 |
| 15 | Teacher Web In-Place Batch Promotion | Batch promotion action and confirmation modal in `BatchesView.tsx` | M2 | Survey / R4 |
| 16 | Student Web Fee Alerts & Notifications | In-app notification drawer alerts for fee assignment and payment updates | M2 | Survey / R3 |
| 17 | Student Web White-Labeled PDF Receipts | PDF fee receipt generator and download action omitting Padhai-Pilot branding, featuring Teacher/Institute branding | M2 | Survey / R3 |
| 18 | Teacher Mobile Batch Editing | Edit batch modal in `TeacherClassesScreen.tsx` (name, subject, schedule) | M3 | Survey / R1 |
| 19 | Teacher Mobile Quick-Copy & Native Share | Batch code quick-copy (clipboard) and native Share API (`Share.share()`) | M3 | Survey / R1 |
| 20 | Teacher Mobile Batch Fee Config | Batch fee configuration in mobile batch management | M3 | Survey / R2 |
| 21 | Teacher Mobile Student Roster Fee Tracking | Roster table display of student fee status chips (`PENDING`, `PAID`) | M3 | Survey / R2 |
| 22 | Teacher Mobile Manual Payment Verification | Action to mark individual student fees as received/paid in mobile | M3 | Survey / R2 |
| 23 | Teacher Mobile In-Place Batch Promotion | In-place batch promotion action and confirmation dialog in mobile | M3 | Survey / R4 |
| 24 | Student Mobile Fee Alerts | Mobile in-app fee alert listener and badge display | M3 | Survey / R3 |
| 25 | Student Mobile Fee Receipt Viewing & Download | Modal receipt inspection and download/export action in `FeesScreen.tsx` | M3 | Survey / R3 |
| 26 | Mobile Automated Tests | Jest test suite additions verifying mobile batch edit, share, fee status, and promotion workflows | M3 | Survey / R5 |
| 27 | Opaque-Box E2E Test Suite (Tiers 1-4) | Comprehensive requirement-driven opaque-box test suite publishing `TEST_READY.md` | E2E Track | Survey / R5 |
| 28 | Monorepo Test Orchestration | Root test orchestration (`npm run test:all`) verifying API, Web, and Mobile suites | M4 | Survey / R5 |
| 29 | Final Milestone Verification & Hardening | 100% E2E test pass across all tiers + Tier 5 adversarial coverage hardening | M4 | Survey / R5 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Core & Database Foundation | Schema merge fix, StudentFeeRecord verification metadata, fail-closed 503 health check, batch edit/fee/verify/promote/receipt endpoints in `apps/api`, backend Vitest tests | none | PLANNED |
| M2 | Teacher & Student Web Portals | Teacher Web batch editing, quick-copy/share batch code, batch fee config, roster fee status tracking, manual payment verification, batch promotion modal, Student Web fee alerts, white-labeled PDF receipt generation/download | M1 | PLANNED |
| M3 | Teacher & Student Mobile App (RN CLI) | Bare RN CLI: Teacher Mobile batch editing, native Share API & clipboard copy, fee config, roster fee statuses, manual payment verification, batch promotion, Student Mobile fee alerts & receipt viewing/download, Jest tests | M1 | PLANNED |
| M4 | Final Milestone: E2E Integration & Verification | Phase 1: 100% E2E test pass across Tiers 1-4 from E2E Track; root test runner orchestration; Phase 2: Tier 5 adversarial coverage hardening | M1, M2, M3, E2E Track | PLANNED |
| E2E | E2E Testing Track | Design test runner, create Tiers 1-4 test cases (>=11*N + max(5, N/2)), publish `TEST_INFRA.md` and `TEST_READY.md` | none (Parallel) | IN_PROGRESS |

---

## Interface Contracts

### 1. Batch Management Contract (`apps/api` <-> Web/Mobile)
- **`PUT /api/teacher/batches/:batchId`**:
  - Request: `{ name: string, subject: string, gradeLevel: string, room?: string }`
  - Response: `{ id: string, name: string, code: string, subject: string, gradeLevel: string, room?: string, updatedAt: string }`
  - Guard: `@Roles(...STAFF_ROLES)`, `assertBatchAccess`
- **`POST /api/teacher/batches/:batchId/promote`**:
  - Request: `{ nextGradeLevel: string, newBatchName?: string }`
  - Response: `{ id: string, name: string, gradeLevel: string, studentCount: number, message: string }`
  - Semantics: In-place update inside `prisma.$transaction`. Preserves existing `batchId`, enrollments, fee history.

### 2. Fee Management & Verification Contract (`apps/api` <-> Web/Mobile)
- **`POST /api/teacher/batches/:batchId/fees`**:
  - Request: `{ feeTitle: string, totalAmount: number, dueDate: string, academicYear?: string }`
  - Response: `{ success: boolean, recordsCreated: number, batchId: string }`
  - Semantics: Bulk-initializes `StudentFeeRecord` with `status: 'PENDING'` for all active enrolled students, emits in-app notifications.
- **`PUT /api/teacher/fees/:recordId/verify`**:
  - Request: `{ paidAmount: number, paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE', transactionRef?: string, remarks?: string }`
  - Response: `{ id: string, status: 'PAID', paidAmount: number, paidAt: string, receiptNumber: string, verifiedById: string }`
  - Semantics: Transitions fee record to `PAID`, assigns unique receipt number, creates student notification.

### 3. White-Labeled Fee Receipt Contract (`apps/api` <-> Web/Mobile)
- **`GET /api/tuition/fees/:feeRecordId/receipt`**:
  - Response:
    ```json
    {
      "receiptNumber": "REC-2026-XXXX",
      "issueDate": "2026-10-31T08:00:00Z",
      "paidAt": "2026-10-31T08:00:00Z",
      "paymentMode": "UPI",
      "transactionRef": "UPI/123456789",
      "institute": {
        "name": "Apex IIT Academy",
        "logoUrl": "https://...",
        "address": "123 Knowledge Park, Kota",
        "contactPhone": "+91 9876543210",
        "contactEmail": "admin@apexiit.com",
        "signatoryName": "Prof. R. K. Sharma",
        "signatoryTitle": "Director & Head of Academics"
      },
      "teacher": {
        "name": "Prof. R. K. Sharma",
        "email": "teacher@apexiit.com"
      },
      "student": {
        "name": "Aarav Patel",
        "rollNumber": "AP-2026-001",
        "email": "aarav@student.com"
      },
      "batch": {
        "name": "Class 12 Physics Elite",
        "gradeLevel": "Class 12"
      },
      "feeTitle": "Term 2 Tuition Fee",
      "totalAmount": 15000,
      "paidAmount": 15000,
      "balanceDue": 0,
      "status": "PAID"
    }
    ```
  - **Constraint**: Omit ANY "Padhai-Pilot" / "PadhaiPilot" branding in receipt payload and generated PDF. Prominently display Institute and Teacher details.

### 4. Database Resilience Contract
- **HTTP 503 Fail-Closed**:
  - `GET /health` and protected endpoints must return HTTP 503 (`ServiceUnavailableException`) when `!prisma.isConnected`.
  - Zero mock or fallback data returned in production endpoints.

---

## Code Layout
- Backend API: `apps/api/src/teacher/`, `apps/api/src/tuition/`, `apps/api/src/health/`, `apps/api/prisma/schema.prisma`
- Teacher Web: `apps/teacher/src/components/BatchesView.tsx`, `apps/teacher/src/components/StudentFeeAlertView.tsx`, `apps/teacher/src/lib/api.ts`
- Student Web: `apps/student/src/app/page.tsx`, `apps/student/src/lib/receiptPdf.ts`
- Mobile: `apps/mobile/src/features/teacher/TeacherClassesScreen.tsx`, `apps/mobile/src/features/student/FeesScreen.tsx`, `apps/mobile/src/services/api/teacherService.ts`
- E2E Tests: `tests/e2e/`, `tests/fixtures/`, root `package.json`
