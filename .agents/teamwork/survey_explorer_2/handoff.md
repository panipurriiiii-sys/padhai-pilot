# Technical Survey Report: Teacher and Student Web Portals (`apps/teacher`, `apps/student`)

**Agent**: Survey Explorer 2 (Web Portals Researcher)  
**Date**: 2026-10-31  
**Working Directory**: `A:\padhai-pilot\.agents\teamwork\survey_explorer_2`  
**Mission**: Comprehensive technical survey of the Teacher Web portal (`apps/teacher`) and Student Web portal (`apps/student`) for the Batches and Student Rosters enhancements (R1–R5).

---

## 1. Observation

### 1.1 Web Architecture, Routing, and Dependency Setup
- **Next.js Version**: Both `apps/teacher` and `apps/student` use Next.js `16.4.3` with React `19.3.0` and Tailwind CSS `^4` (Turbopack enabled) using the Next.js **App Router** (`app/layout.tsx` and `app/page.tsx`).
- **Dependencies (`apps/teacher/package.json`)**:
  ```json
  "dependencies": {
    "@padhai-pilot/shared": "*",
    "jspdf": "^4.2.1",
    "jspdf-autotable": "^5.0.9",
    "lucide-react": "^1.16.0",
    "next": "16.4.3",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  }
  ```
- **Dependencies (`apps/student/package.json`)**:
  ```json
  "dependencies": {
    "@padhai-pilot/shared": "*",
    "lucide-react": "^1.16.0",
    "next": "16.4.3",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  }
  ```
  *Critical Observation*: `apps/student` does **not** have `jspdf` or `jspdf-autotable` installed.
- **Routing & Navigation Architecture**:
  - `apps/teacher/src/app/page.tsx`: Single-page client dashboard controlled by state `const [currentTab, setCurrentTab] = useState<NavTab>('dashboard')`. Renders components dynamically based on `currentTab` (`BatchesView`, `StudentFeeAlertView`, `AttendanceView`, `InvitationsView`, `TuitionBrandingView`, etc.).
  - `apps/student/src/app/page.tsx`: Monolithic single-page client component (2,764 lines) containing 13 tabs (`OVERVIEW`, `DIARY`, `MATERIALS`, `TIMETABLE`, `ATTENDANCE`, `ASSIGNMENTS`, `TESTS`, `RESULTS`, `FEES`, `QUERIES`, `PLANNER`, `DOCUMENTS`, `PROFILE`), plus right-side slide-over modals and notification drawers.
- **State Management & Data Fetching**:
  - Neither web portal uses Zustand or TanStack Query.
  - State is managed via native React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
  - API communication is handled through typed API clients in `src/lib/api.ts` wrapping the standard `fetch` API with Bearer token authentication stored in `localStorage` (`padhaipilot_teacher_token` and `padhaipilot_student_token`).
- **Design Tokens & System**:
  - Global CSS tokens are defined in `@padhai-pilot/shared/theme.css` (compiled from `packages/shared/src/theme/theme.ts` via `packages/shared/scripts/build-css.mjs`).
  - Follows the "Paper-Desk" design token system:
    - Surfaces: `--bg-desk` (`#F8F7F4`), `--bg-paper` (`#FFFFFF`), `--bg-paper-warm` (`#FAF8F5`), `--bg-surface-subtle` (`#F3EFE9`).
    - Inks: `--ink-primary` (`#1C1917`), `--ink-secondary` (`#44403C`), `--ink-muted` (`#78716C`), `--ink-faint` (`#A8A29E`).
    - Borders: `--border-paper` (`#E3DFD9`), `--border-input` (`#DDD8D2`), `--border-focus` (`#1677FF`).
    - Brand: `--brand-electric` (`#1677FF`), `--brand-hover` (`#0A6FE8`), `--brand-subtle-bg` (`#EFF6FF`).
    - Status:
      - Success: `--status-success-bg` (`#ECFDF5`), `--status-success-text` (`#047857`).
      - Warning: `--status-warning-bg` (`#FFFBEB`), `--status-warning-text` (`#B45309`).
      - Error: `--status-error-bg` (`#FEF2F2`), `--status-error-text` (`#B91C1C`).
    - Typography tokens:
      - Display headers: `Playfair Display` (`font-display`)
      - Interface & labels: `Raleway` (`font-primary` / `font-sans`)
      - Numbers & dense tables: `Inter` (`font-data`)
- **Automated Test Suites**:
  - Both `apps/teacher/package.json` and `apps/student/package.json` completely lack test scripts (only `dev`, `build`, `start`, `lint`).
  - There are zero test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`) in `apps/teacher` or `apps/student`.
  - All existing test suites in the repository are in `apps/api` (38+ Vitest specs) and `apps/mobile` (Jest).

---

### 1.2 Teacher Web Portal (`apps/teacher`) Detailed Inspection

#### 1.2.1 Batch Views & Management (`src/components/BatchesView.tsx`)
- **Batch List**: Renders batch cards in a responsive grid displaying `name`, `code` (badge), `studentCount`, `subject`, `room`, and `gradeLevel`. Selecting a card sets `activeBatch` (`lines 103-142`).
- **Batch Creation Modal**: Accessible via the "Create New Batch" button (`lines 232-329`). Form inputs include `name` (required), `subject` (required), `code`, `gradeLevel` (default: "Class 12"), and `room`. Invokes `onCreateBatch` passed down from `app/page.tsx:144-154`.
- **Selected Batch Student Roster Table**:
  - Lines 172–228: Displays a table of enrolled students for the selected batch.
  - Columns currently rendered: `Roll Number`, `Student Name`, `Email`, `Attendance %`, `Status` (hardcoded green "Active").
- **Exact Deficiencies in `BatchesView.tsx`**:
  1. **No Batch Editing**: There is no button, form, or modal to edit an existing batch's name, subject, schedule, or room.
  2. **No Quick-Copy or Invite Sharing**: Although `batch.code` is rendered inside a static badge (`line 118`), there is no copy-to-clipboard action button, no toast feedback, and no shareable invite link generator.
  3. **No Batch Fee Configuration**: There is no UI to configure or edit the batch's fee structure (total fee amount, due date, installment schedule).
  4. **No Fee Tracking in Student Roster**: The table only tracks attendance rate and active status. It completely omits fee payment statuses (`PENDING`, `PAID`, `OVERDUE`, `PARTIAL`), fee amounts, and balance due.
  5. **No Manual Payment Verification**: There is no action to mark a student's pending fee as paid/received.
  6. **No In-Place Batch Promotion**: There is no button or modal to promote the batch to the next class or grade.

#### 1.2.2 Invitations Tab (`src/components/InvitationsView.tsx`)
- Provides token-based student invitation creation (`lines 1-317`) with `maxUses` and `expiryDays`.
- This is a separate token generator tab and does not satisfy the requirement for quick-copying batch codes or generating batch-specific shareable invite links directly inside the batch management view.

#### 1.2.3 Existing Fee Reminders Tab (`src/components/StudentFeeAlertView.tsx`)
- Located at `src/components/StudentFeeAlertView.tsx` (accessible to tuition owners via sidebar `studentFees`).
- Displays summary cards (`totalReceivable`, `totalCollected`, `totalPending`, `overdueCount`) and a table of student fee records with columns: `Student Name & Roll No`, `Fee Head / Installment`, `Total Amount`, `Paid / Balance Due`, `Due Date`, `Status`, `Fee Reminder`.
- Primary action is dispatching fee reminders (`IN_APP`, `SMS`, `EMAIL`) via `teacherApi.dispatchFeeReminder` (`lines 68-98`).
- **Deficiencies in `StudentFeeAlertView.tsx`**:
  - No manual payment verification workflow (no "Mark Received" / "Verify Payment" action to transition status from `PENDING` to `PAID`).
  - No batch-level fee assignment/configuration controls.
  - No receipt download or generation functionality.

#### 1.2.4 Teacher API Client (`src/lib/api.ts`)
- Current batch endpoints:
  - `getBatches()`: `GET /teacher/batches`
  - `getBatchRoster(batchId)`: `GET /teacher/batches/${batchId}/students`
  - `createBatch(data)`: `POST /teacher/batches`
- Current fee endpoints:
  - `getFeeRecords(batchId?)`: `GET /tuition/fees`
  - `getFeeSummary()`: `GET /tuition/fees/summary`
  - `dispatchFeeReminder(dto)`: `POST /tuition/fees/remind`
- **Missing API Methods in `apps/teacher/src/lib/api.ts`**:
  1. `updateBatch(id, data: { name, subject, gradeLevel, room, scheduleSummary? })` (`PUT /teacher/batches/:id`)
  2. `promoteBatch(id, data: { nextGradeLevel, newBatchName? })` (`POST /teacher/batches/:id/promote`)
  3. `configureBatchFee(batchId, data: { feeTitle, amount, dueDate, academicYear? })` (`POST /teacher/batches/:id/fee`)
  4. `verifyStudentPayment(feeRecordId, data: { amount, paymentMode, remarks? })` (`POST /tuition/fees/:id/verify`)

#### 1.2.5 PDF Generator (`src/lib/pdfGenerator.ts`)
- Only exports `generateAssessmentResultPdf` and `downloadAssessmentResultPdf` (`lines 26-245`).
- Line 29: Hardcodes fallback branding `instituteName = 'PadhaiPilot Tuition Institute'`, directly violating requirement R3.
- Completely lacks any Fee Receipt PDF generator.

---

### 1.3 Student Web Portal (`apps/student`) Detailed Inspection

#### 1.3.1 Fees and Receipts Display (`src/app/page.tsx:1850-1940`)
- Tab `activeTab === 'FEES'` displays:
  - Balance summary cards: Total Fee Payable (`feesData.totalFees`), Amount Paid (`feesData.paidAmount`), Outstanding Balance (`feesData.balanceDue`).
  - Official Fee Receipts & Installments table (`lines 1888-1938`):
    - Columns: `Receipt / Invoice #`, `Description`, `Due Date`, `Amount`, `Status`, `Action`.
    - **Critical Finding (Line 1923-1932)**:
      ```tsx
      <a
        href="https://media-hosting.dhyeyp254.workers.dev/1793338782614.json"
        target="_blank"
        rel="noreferrer"
        className="text-xs text-electric hover:underline flex items-center gap-1 font-semibold"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Receipt PDF</span>
      </a>
      ```
      The download button targets a hardcoded dummy Cloudflare worker JSON link instead of downloading a real, white-labeled PDF receipt.
    - `feesData` is fetched via `studentApi.getFees()`, calling `GET /student/fees` (`apps/student/src/lib/api.ts:425-446`).

#### 1.3.2 In-App Notifications Drawer (`src/app/page.tsx:2307-2359`)
- Slide-over notifications drawer toggled by `showNotifications` state.
- Renders `InAppNotification[]` (`title`, `message`, `type`, `createdAt`, `isRead`).
- Calls `studentApi.getNotifications()` (`GET /assessment/student/notifications`) and `studentApi.markNotificationAsRead(id)` (`PUT /assessment/student/notifications/${id}/read`).
- Currently displays assessment and general notifications, but lacks specialized visual styling or deeplinking for fee assignment or fee update alerts (e.g., clicking on a fee notification does not switch the active tab to `FEES`).

---

## 2. Logic Chain

1. **R1 (Batch Editing & Shareable Code)**:
   - *Observation*: `BatchesView.tsx:103-142` renders batches as static clickable cards with `batch.code` inside a badge. `apps/teacher/src/lib/api.ts:238-275` provides only `getBatches`, `getBatchRoster`, and `createBatch`.
   - *Inference*: Teachers are currently incapable of correcting typos in batch names, updating room assignments, changing schedules, or copying/sharing invite links from the web interface.
   - *Deduction*: An `updateBatch` API client method must be added, along with an "Edit Batch" modal in `BatchesView.tsx`. Quick-copy clipboard action with toast feedback and a shareable URL generator must be added to both the batch cards and the selected batch details header.

2. **R2 (Batch Fee Configuration & Manual Payment Verification)**:
   - *Observation*: `BatchesView.tsx:172-228` renders student rosters with attendance rate and active status only. `StudentFeeAlertView.tsx` lists student fees but only exposes a reminder dispatch workflow. Neither view has controls to define batch fee amounts or mark student dues as received.
   - *Inference*: Enrolled students currently have no fee structure initialized at the batch level, and teachers have no web mechanism to inspect payment statuses or verify manual offline payments (cash, bank transfer, UPI).
   - *Deduction*: `BatchesView.tsx` must be extended with:
     - A "Configure Fee Structure" modal for the batch.
     - Student roster table columns for Fee Amount, Status (`PENDING`, `PAID`, `OVERDUE`), and Balance.
     - An inline "Mark as Paid" / "Verify Payment" action button with confirmation dialog for each student with pending dues.
     - `apps/teacher/src/lib/api.ts` must expose `setBatchFee` and `verifyPayment`.

3. **R3 (Student Fee Alerts & White-Labeled Receipts)**:
   - *Observation*: `apps/student/src/app/page.tsx:1924` links to a mock JSON endpoint on Cloudflare workers. `apps/student/package.json` does not include `jspdf`. `apps/teacher/src/lib/pdfGenerator.ts:29` defaults to `"PadhaiPilot Tuition Institute"` and only produces assessment mark sheets.
   - *Inference*: Students cannot download real PDF fee receipts, and any generated PDF currently violates the white-label requirement by hardcoding platform branding.
   - *Deduction*:
     - A dedicated, white-labeled `generateFeeReceiptPdf` function must be created (using `jspdf` and `jspdf-autotable`), prominently displaying the Teacher/Institute name, logo, address, contact details, receipt number, date, student roll number, amount paid, and authorized signatory, while completely omitting the string "Padhai-Pilot" or platform logos.
     - `jspdf` and `jspdf-autotable` must be added to `apps/student/package.json` (or receipts served via an API PDF endpoint), and the hardcoded mock link in `apps/student/src/app/page.tsx` must be replaced with the download trigger.
     - Fee alerts must be dispatched as `InAppNotification` records and displayed with a distinct fee alert badge in the student notification drawer.

4. **R4 (In-Place Batch Promotion)**:
   - *Observation*: `BatchesView.tsx` has no promotion controls, and `apps/teacher/src/lib/api.ts` has no promotion method.
   - *Inference*: Teachers wanting to advance a batch to the next grade (e.g., Class 11 to Class 12) have no UI mechanism to do so, risking manual re-enrollment or lost academic/fee history.
   - *Deduction*: `BatchesView.tsx` needs a "Promote Batch" action and modal that captures the new grade level and updated batch name, calling an in-place promotion endpoint (`POST /teacher/batches/:id/promote`) that retains student memberships and fee history.

5. **R5 (Automated Test Verification & System Reliability)**:
   - *Observation*: `apps/teacher` and `apps/student` have zero tests. The root workspace only runs backend Vitest tests.
   - *Inference*: Frontend batch editing, code copying, fee workflows, and receipt generation are completely uncovered by automated tests.
   - *Deduction*: Automated component and integration tests must be introduced to verify:
     - Batch editing and shareable code generation.
     - Batch fee configuration and student fee status initialization to `PENDING`.
     - Payment verification transitions (`PENDING` -> `PAID`).
     - White-labeled PDF fee receipt rendering without "Padhai-Pilot" branding.
     - In-place batch promotion preserving roster size.

---

## 3. Caveats

1. **Database Persistence Scope**: While the Prisma schema (`apps/api/prisma/schema.prisma`) already defines `Batch`, `Enrollment`, `StudentFeeRecord`, and `StudentFeeReminder`, any changes to batch fee structure fields or promotion history are managed on the API/database layer (surveyed in parallel by Survey Explorer 1).
2. **Client-Side vs Server-Side PDF Generation**: `apps/teacher` currently uses client-side PDF generation via `jspdf` and `jspdf-autotable` in `lib/pdfGenerator.ts`. For `apps/student`, generating receipts can either be done client-side by adding `jspdf` to `apps/student/package.json` or by fetching a backend-generated PDF stream. Client-side generation matches the existing architecture in `apps/teacher`.
3. **External Messaging Channels**: While email and external messaging alerts are specified in R3, the web portals themselves only trigger alerts via backend API endpoints (`/tuition/fees/remind`) and display received alerts in the `InAppNotification` drawer.

---

## 4. Conclusion

The current web portals possess strong visual foundations and consistent "Paper-Desk" design token integration, but feature critical gaps across requirements R1 through R5:

| Requirement | Area | Current State | Required Enhancement |
|---|---|---|---|
| **R1** | `apps/teacher` | Batch creation only; static code badge | Edit Batch modal, `updateBatch` API method, clipboard quick-copy, shareable invite link generator |
| **R2** | `apps/teacher` | Roster table shows attendance only; separate fee view only sends reminders | Batch fee configuration modal, roster fee status tracking (`PENDING`/`PAID`), manual payment verification modal & API call |
| **R3** | `apps/student` & `apps/teacher` | Hardcoded dummy JSON link for receipts; `pdfGenerator.ts` has hardcoded "PadhaiPilot" branding | White-labeled PDF receipt generator omitting platform branding; `jspdf` in student app; fee alert notifications in drawer |
| **R4** | `apps/teacher` | No batch promotion UI | In-place batch promotion modal & `promoteBatch` API method |
| **R5** | Both Portals | Zero automated tests in web portals | Introduce unit/component tests covering batch editing, code copy, fee transitions, receipt generation, and promotion |

---

## 5. Verification Method

### 5.1 Independent Codebase Inspection Points
1. **Teacher Batches View**: Inspect `A:\padhai-pilot\apps\teacher\src\components\BatchesView.tsx` (lines 30–67, 103–142, 172–228) to verify the absence of edit, copy-share, fee, payment verification, and promotion controls.
2. **Teacher API Client**: Inspect `A:\padhai-pilot\apps\teacher\src\lib\api.ts` (lines 238–275) to verify missing batch update and promotion methods.
3. **Teacher PDF Generator**: Inspect `A:\padhai-pilot\apps\teacher\src\lib\pdfGenerator.ts` (line 29) to verify hardcoded `"PadhaiPilot Tuition Institute"` branding and absence of fee receipts.
4. **Student Fees View**: Inspect `A:\padhai-pilot\apps\student\src\app\page.tsx` (lines 1850–1940, particularly lines 1923–1932) to verify hardcoded mock JSON URL for receipts.
5. **Shared Theme Tokens**: Inspect `A:\padhai-pilot\packages\shared\dist\theme\theme.css` to verify the "Paper-Desk" design token classes (`.paper-card`, `.btn-primary`, `.input-paper`, `--brand-electric`).

### 5.2 Verification Commands
Run the following commands from the repository root (`A:\padhai-pilot`):

1. **Verify TypeScript compilation for both web portals**:
   ```powershell
   npx tsc -p apps/teacher/tsconfig.json --noEmit
   npx tsc -p apps/student/tsconfig.json --noEmit
   ```
   *Expected Result*: Exit code 0, no diagnostic errors.

2. **Verify Shared package build**:
   ```powershell
   npm run typecheck
   ```
   *Expected Result*: Exit code 0.

3. **Verify absence of test suites in web apps**:
   ```powershell
   npm run test --workspace=@padhai-pilot/teacher
   ```
   *Expected Result*: Missing script error (confirming no test runner is currently configured in `apps/teacher`).
