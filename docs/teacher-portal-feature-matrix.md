# PadhaiPilot — Teacher Portal & Assessment Feature Matrix

**Status:** Complete & Production-Verified  
**Architecture:** Next.js 16 (App Router + Turbopack) | NestJS 11 Serverless API | PostgreSQL (Prisma ORM) | Upstash Redis REST  
**Global Typography:** Playfair Display (Display headings), Raleway (UI interface & body), Inter (Data tables & numbers)  

---

## 1. Feature Implementation Matrix

| Module / Feature | Specification | Implementation State | Verification Method |
|---|---|---|---|
| **Class & Batch Selection** | Authorized teacher batches, subjects, and roster retrieval | ✅ Complete (`AssessmentService.getTeacherBatches`, `getBatchRoster`) | `assessment.service.spec.ts` + `BulkMarksEntryView.tsx` |
| **Student Roster & Exclusion** | "Select All Eligible", single-student toggling, search filter, exclusion preservation | ✅ Complete | Client & Server filtering verified |
| **Bulk Attendance Entry** | Present (`P`), Absent (`A`), Late (`L`), Excused (`E`), "Mark All Present", "Mark All Absent" | ✅ Complete | Separate from marks; records attendance status per session |
| **Absent Student Protection** | Absent students NEVER silently converted to zero; marked `ABSENT` with null score | ✅ Complete | Verified in `assessment.service.spec.ts` |
| **Assessment Configuration** | Assessment title, category, date, single maxMarks applied globally, passing marks | ✅ Complete (`ClassroomAssessment` model) | Prisma schema + API tests |
| **Spreadsheet Marks Table** | Tab/Arrow key navigation, live percentage & grade calculation, inline bounds validation | ✅ Complete (`BulkMarksEntryView.tsx`) | Next.js 16 Turbopack build |
| **Marks Server Validation** | Reject negative, reject > maxMarks, reject malformed strings | ✅ Complete (`AssessmentService.bulkSaveDraft`) | `assessment.service.spec.ts` |
| **Draft Persistence (Stage A)** | Persist in PostgreSQL, preserve valid rows, non-blocking errors | ✅ Complete | `POST /assessment/draft` |
| **Review Dialog (Stage B)** | Pre-publish verification modal with breakdown counts & blocking error warnings | ✅ Complete | Modal in `BulkMarksEntryView.tsx` |
| **Bulk Publishing (Stage C)** | Idempotent transaction, sets status `PUBLISHED`, timestamp, publisher audit log | ✅ Complete | `POST /assessment/:id/publish` |
| **Student Portal Results** | Authenticated student sees only their own published results; drafts strictly hidden | ✅ Complete (`apps/student`) | `GET /assessment/student/results` |
| **Cross-Student Isolation** | Student A cannot view Student B marks; zero cross-tenant leakage | ✅ Complete | `assessment.service.spec.ts` |
| **In-App Notifications** | Automatic notification created for students on result publishing; unread badges | ✅ Complete (`Notification` model) | `GET /assessment/student/notifications` |
| **Mark Correction & Audit** | Teachers revise published marks with mandatory reason; preserves audit history | ✅ Complete (`AssessmentMarkHistory`) | `PUT /assessment/:id/marks/:id/correct` |
| **Export & Reporting** | CSV result sheet download + printable view layout | ✅ Complete | `GET /assessment/:id/export` + CSV download |

---

## 2. API Endpoints Reference

### Teacher Endpoints (`/api/assessment`)
- `GET /api/assessment/batches`: Retrieve teacher's authorized batches.
- `GET /api/assessment/batches/:batchId/roster`: Retrieve students enrolled in batch.
- `GET /api/assessment?batchId=...`: List classroom assessments.
- `GET /api/assessment/:id`: Retrieve assessment details and existing student marks roster.
- `POST /api/assessment/draft`: Bulk save draft attendance and marks in PostgreSQL.
- `GET /api/assessment/:id/review`: Summary breakdown before publishing results.
- `POST /api/assessment/:id/publish`: Bulk publish results to students and dispatch in-app notifications.
- `PUT /api/assessment/:id/marks/:markId/correct`: Correct published student marks with mandatory reason and audit history.
- `GET /api/assessment/:id/export`: Export class result sheet as CSV.

### Student Endpoints (`/api/assessment/student`)
- `GET /api/assessment/student/results`: Retrieve verified published results for the authenticated student only.
- `GET /api/assessment/student/notifications`: List in-app notifications.
- `PUT /api/assessment/student/notifications/:id/read`: Mark notification as read.

---

## 3. Automated Test Verification

All automated tests executed with Vitest v3.2.7:

```bash
✓ src/app.controller.spec.ts (1 test)
✓ src/redis/redis.service.spec.ts (10 tests)
✓ src/config/config.service.spec.ts (3 tests)
✓ src/teacher/teacher.service.spec.ts (8 tests)
✓ src/auth/auth.service.spec.ts (5 tests)
✓ src/assessment/assessment.service.spec.ts (11 tests)
Total: 38 passed (38 tests across 6 test suites)
```

### Production Build Results
- `@padhai-pilot/shared`: `npm run typecheck` -> Exit 0
- `@padhai-pilot/api`: `npm run build` -> Exit 0 (`nest build` complete)
- `@padhai-pilot/teacher`: `npm run build` -> Exit 0 (Turbopack static pages prerendered)
- `@padhai-pilot/student`: `npm run build` -> Exit 0 (Turbopack static pages prerendered)

