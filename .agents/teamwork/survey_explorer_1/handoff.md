# Technical Survey Report: Batches & Student Rosters Backend, Schema, and Test Infrastructure

**Surveyor:** Survey Explorer 1 (Role: Backend & DB Researcher)  
**Date:** 2026-10-31  
**Scope:** Backend API (`apps/api`), Prisma ORM Schema (`apps/api/prisma/schema.prisma`), Shared Contracts (`packages/shared`), and Testing Infrastructure (`vitest`).

---

## 1. Observation

### 1.1 Prisma Schema & Database Models (`apps/api/prisma/schema.prisma`)
* **Batch Model (`schema.prisma:158-188`)**:
  ```prisma
  model Batch {
    id          String   @id @default(cuid())
    instituteId String
    name        String
    code        String
    subject     String
    gradeLevel  String
    room        String?
    teacherId   String
    isActive    Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    institute          Institute           @relation(fields: [instituteId], references: [id], onDelete: Cascade)
    teacher            User                @relation("TeacherBatches", fields: [teacherId], references: [id])
    enrollments        Enrollment[]
    attendanceSessions AttendanceSession[]
    assignments        Assignment[]
    tests              TestQuiz[]
    lessonPlans        LessonPlan[]
    timetableSlots     TimetableSlot[]
    invitations        InvitationCode[]
    announcements      Announcement[]
    classroomAssessments ClassroomAssessment[]
    teachingDiaries      DailyTeachingDiary[]
    studyMaterials       StudyMaterial[]
    studentFeeRecords    StudentFeeRecord[]

    @@index([instituteId])
    @@index([teacherId])
  }
  ```
  - `code` is a standard string, indexed neither uniquely nor tenant-scoped.
  - `gradeLevel` is a plain string (e.g., `"Class 11"`, `"Class 12 / Repeaters"`).
  - No batch fee fields exist in `Batch` (e.g. `feeAmount`, `feeDueDate`, `feeTitle`).
  - No batch-level promotion history tracking exists.

* **Student Enrollment & Profile Models (`schema.prisma:190-207`, `103-140`)**:
  ```prisma
  model Enrollment {
    id          String   @id @default(cuid())
    instituteId String
    batchId     String
    studentId   String
    rollNumber  String
    status      String   @default("ACTIVE")
    joinedAt    DateTime @default(now())

    institute Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
    batch     Batch     @relation(fields: [batchId], references: [id], onDelete: Cascade)
    student   User      @relation("StudentEnrollments", fields: [studentId], references: [id], onDelete: Cascade)

    @@unique([batchId, studentId])
    @@index([instituteId])
    @@index([batchId])
    @@index([studentId])
  }
  ```
  - An enrollment securely ties `studentId` to `batchId` within `instituteId` with unique constraint `@@unique([batchId, studentId])`.
  - Cascading deletes ensure deleting a batch cascades to enrollments, but in-place promotion preserves the existing `batch.id`, thus preserving all `Enrollment` rows and roll numbers automatically.

* **Batch Invitation Codes (`schema.prisma:209-228`)**:
  ```prisma
  model InvitationCode {
    id          String   @id @default(cuid())
    code        String   @unique
    instituteId String
    batchId     String?
    issuerId    String
    maxUses     Int      @default(100)
    usedCount   Int      @default(0)
    expiresAt   DateTime
    isRevoked   Boolean  @default(false)
    createdAt   DateTime @default(now())

    institute Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
    batch     Batch?    @relation(fields: [batchId], references: [id], onDelete: SetNull)
    issuer    User      @relation("CreatedInvitations", fields: [issuerId], references: [id])

    @@index([instituteId])
    @@index([code])
    @@index([issuerId])
  }
  ```
  - Invitation codes already have a global `@unique` constraint and optional relation to `batchId`.

* **Student Fee Records & Reminders (`schema.prisma:786-824`)**:
  ```prisma
  model StudentFeeRecord {
    id           String    @id @default(cuid())
    instituteId  String
    studentId    String
    batchId      String?
    feeTitle     String    // e.g. "Term 2 Tuition Fee", "JEE Test Series Pack"
    totalAmount  Float
    paidAmount   Float     @default(0)
    dueDate      DateTime
    status       String    @default("PENDING") // PAID, PARTIAL, PENDING, OVERDUE
    academicYear String?   @default("2026-2027")
    createdAt    DateTime  @default(now())
    updatedAt    DateTime  @updatedAt

    institute Institute            @relation(fields: [instituteId], references: [id], onDelete: Cascade)
    student   User                 @relation("StudentFeeRecords", fields: [studentId], references: [id], onDelete: Cascade)
    batch     Batch?               @relation(fields: [batchId], references: [id])
    reminders StudentFeeReminder[]

    @@index([instituteId])
    @@index([studentId])
    @@index([status])
  }
  ```
  - Noticeable omission: `StudentFeeRecord` lacks payment verification metadata (`paidAt`, `paymentMode`, `transactionRef`, `receiptNumber`, `verifiedBy`).
  - No `FeeReceipt` model exists in the database.
  - `StudentFeeReminder` tracks reminder dispatch channels (`IN_APP`, `SMS`, `EMAIL`, `WHATSAPP`).

* **In-App Notifications (`schema.prisma:547-565`)**:
  ```prisma
  model Notification {
    id          String   @id @default(cuid())
    instituteId String
    userId      String
    title       String
    message     String
    type        String   @default("RESULT_PUBLISHED")
    link        String?
    isRead      Boolean  @default(false)
    createdAt   DateTime @default(now())

    institute Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId])
    @@index([instituteId])
    @@index([isRead])
  }
  ```
  - Standardized notification entity with `userId`, `type`, `link`, `isRead`.

* **Institute Branding (`schema.prisma:53-76`)**:
  - `Institute` model stores `name`, `logoUrl`, `primaryColor`, `address`, `contactPhone`, `contactEmail`, `website`, `signatoryName`, `signatoryTitle`, `footerText`, `academicYear`.

---

### 1.2 Backend API Architecture (`apps/api/src`)

* **Health Check & Database Fail-Closed (`apps/api/src/health/health.controller.ts:13-22`)**:
  ```typescript
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'padhai-pilot-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: this.prisma?.isConnected ? 'connected' : 'fallback-active',
      environment: process.env.NODE_ENV || 'development',
    };
  }
  ```
  - **Issue Observed**: `checkHealth()` returns HTTP 200 with `'fallback-active'` when `!this.prisma?.isConnected`.
  - Contrast with `assertDb` in `apps/api/src/common/db/db.ts:13-17`:
    ```typescript
    export function assertDb(prisma: DbStatus): void {
      if (!prisma.isConnected) {
        throw new ServiceUnavailableException('The data service is temporarily unavailable. Please try again shortly.');
      }
    }
    ```
  - Contrast with `AccessService.db()` in `apps/api/src/common/access/access.service.ts:53-56`:
    ```typescript
    db(): PrismaService {
      assertDb(this.prisma);
      return this.prisma;
    }
    ```
  - In `HealthController`, when DB is disconnected, it does not fail closed with HTTP 503 (`ServiceUnavailableException`).

* **Existing Batch Endpoints (`apps/api/src/teacher/teacher.controller.ts:34-56`)**:
  ```typescript
  @Get('batches')
  getBatches(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getBatches(user);
  }

  @Get('batches/:batchId/students')
  getBatchRoster(
    @Param('batchId') batchId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.getBatchRoster(batchId, user);
  }

  @Post('batches')
  @HttpCode(HttpStatus.CREATED)
  createBatch(
    @Body() body: { name: string; code: string; subject: string; gradeLevel: string; room?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.createBatch(body, user);
  }
  ```
  - **Omissions Observed**:
    1. No `PUT /teacher/batches/:batchId` or `PATCH /teacher/batches/:batchId` to edit existing batch details (name, subject, schedule/room, gradeLevel).
    2. No `POST /teacher/batches/:batchId/promote` to execute in-place batch promotion.
    3. No `POST /teacher/batches/:batchId/fees` or batch fee assignment endpoint.
  - **Service Layer Discrepancy**: `teacher.service.ts` currently reads and writes to an in-memory `this.memoryStore` (`teacher.service.ts:451-497`) rather than delegating queries to `AccessService` / Prisma ORM.

* **Existing Fee Management (`apps/api/src/tuition/tuition.controller.ts:233-265` & `tuition.service.ts:1500-1655`)**:
  - `GET /tuition/fees`: Lists student fee records for an institute or batch.
  - `GET /tuition/fees/summary`: Returns total receivable, total collected, balance, overdue count.
  - `POST /tuition/fees/record`: Creates a fee record for an *individual* student (`CreateStudentFeeRecordDto`).
  - `POST /tuition/fees/remind`: Dispatches fee reminder.
  - **Omissions Observed**:
    1. No endpoint exists to set batch-level fees and automatically initialize fee records with `PENDING` status for all enrolled students in that batch.
    2. No endpoint exists to manually verify a student fee payment (`PENDING` -> `PAID`), capture verification details, and generate a receipt number.

* **Existing Receipt Generation & Client-Side PDF (`apps/student/src/app/page.tsx:1922-1933` & `apps/teacher/src/lib/pdfGenerator.ts:26-55`)**:
  - In `apps/student/src/app/page.tsx:1924`, the receipt download link is hardcoded to a mock JSON URL:
    `<a href="https://media-hosting.dhyeyp254.workers.dev/1793338782614.json" target="_blank">`
  - In `apps/teacher/src/lib/pdfGenerator.ts:26-30`:
    ```typescript
    export function generateAssessmentResultPdf({
      assessment,
      roster,
      instituteName = 'PadhaiPilot Tuition Institute',
    }: GeneratePdfOptions): jsPDF
    ```
    - Uses `jspdf` and `jspdf-autotable`.
    - It contains hardcoded fallback platform branding: `'PadhaiPilot Tuition Institute'`!
    - Violates requirement R3: *"Generate consistent, industry-grade, white-labeled PDF fee receipts upon payment confirmation that prominently display the Teacher's name / Institute branding and details, omitting any 'Padhai-Pilot' platform branding."*
  - No PDF generation library (`jspdf`, `pdfkit`) is currently installed in `apps/api/package.json`.

* **RolesGuard and Access Boundaries (`apps/api/src/common/guards/roles.guard.ts`, `apps/api/src/common/security/roles.ts:4-7`)**:
  ```typescript
  export const STAFF_ROLES: UserRole[] = ['TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER', 'FACULTY', 'TEACHER'];
  export const MANAGEMENT_ROLES: UserRole[] = ['TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER'];
  export const STUDENT_ROLES: UserRole[] = ['STUDENT'];
  ```
  - In `AccessService.assertBatchAccess(user, batchId)`:
    - `isManagement(user.role)`: Has full tenant-scoped authority over any batch in their institute.
    - `FACULTY` / `TEACHER`: Must be assigned as batch teacher (`batch.teacherId === user.id`) or in `batchFaculty`.
    - `STUDENT`: Forbidden from teacher endpoints by `@Roles(...STAFF_ROLES)`.
  - Batch editing, fee assignment, promotion, and payment verification fall within `@Roles(...STAFF_ROLES)` guarded by `assertBatchAccess`.

---

### 1.3 Testing Infrastructure (`apps/api`)

* **Runner Configuration (`apps/api/vitest.config.ts`, `apps/api/package.json:19-20`)**:
  - Test command: `npm test --workspace=@padhai-pilot/api` -> `vitest run`.
  - Unit tests run against hand-written Prisma stubs (`vi.fn()`) using mock database factories (e.g. `src/student/student.service.spec.ts`).
* **Test Suite Execution Result**:
  - Single spec execution: `npm test --workspace=@padhai-pilot/api -- src/student/student.service.spec.ts` passes 18/18 tests in 1.67 seconds.
  - Full suite execution (`npm test --workspace=@padhai-pilot/api`):
    - 9 test suites passed (107 tests passed).
    - 6 test suites failed with `Error: Test timed out in 5000ms.` because `UPSTASH_REDIS_REST_URL` in `.env` points to a live cloud host (`https://holy-kit-243293.upstash.io`), which timed out during test execution. In test environments where Redis is not mocked or disabled, `redis.service.ts` calls fail to settle within 5000ms.
  - Existing `student.service.spec.ts` demonstrates how to test fail-closed behavior without real DB:
    ```typescript
    it('fails closed with 503 when the database is not connected', async () => {
      const db = makeDb();
      db.isConnected = false;
      await expect(makeService(db).getAssignments(student)).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
    ```

---

## 2. Logic Chain

1. **Database Schema Enhancements Required**:
   - Observations 1.1 reveal that `StudentFeeRecord` currently lacks `paidAt`, `paymentMode`, `transactionRef`, `receiptNumber`, and `verifiedBy`. Without these columns, manual payment verification cannot record audit details or produce a unique receipt number for white-labeled receipt generation.
   - Adding `paidAt DateTime?`, `paymentMode String?`, `transactionRef String?`, `receiptNumber String? @unique`, `verifiedById String?` to `StudentFeeRecord` satisfies R2 and R3 with minimal schema complexity and full relational integrity.
   - `Batch` currently has `id`, `name`, `code`, `subject`, `gradeLevel`, `room`, `teacherId`. To support R1 and R2, `Batch` should support optional fee configuration metadata (e.g., `feeAmount Float?`, `feeTitle String?`, `feeDueDate DateTime?`), or batch fee assignment can populate `StudentFeeRecord` rows for all enrolled students in one transaction.

2. **In-Place Batch Promotion Mechanics (R4)**:
   - Observation 1.1 confirms that `Enrollment`, `StudentFeeRecord`, `AttendanceSession`, and `ClassroomAssessment` reference `Batch` via `batchId`.
   - Promoting a batch "in-place" means mutating the existing `Batch` record's `gradeLevel` (e.g., updating `"Class 11"` to `"Class 12"`), optionally updating its `name` (e.g., `"Physics 11-A"` to `"Physics 12-A"`), within a single `prisma.$transaction`.
   - Because `batch.id` remains unchanged, all existing `Enrollment` records, `StudentFeeRecord` payment histories, and academic records remain 100% preserved with zero data duplication or foreign key re-pointing.
   - An `AuditLog` entry should be created within the same transaction to preserve an audit trail of who promoted the batch, previous grade, new grade, and timestamp.

3. **Fee Status Transition & Batch Fee Assignment (R2, R3)**:
   - When a teacher configures a batch fee (`feeTitle`, `totalAmount`, `dueDate`):
     - The service queries all active enrollments for that batch (`prisma.enrollment.findMany({ where: { batchId, status: 'ACTIVE' } })`).
     - Inside a `prisma.$transaction`, for every enrolled student who does not already have an active fee record for this title in this batch, a `StudentFeeRecord` is created with `status: 'PENDING'`, `paidAmount: 0`, and `dueDate`.
     - In-app `Notification`s are simultaneously created for all enrolled students (`type: 'FEE_ASSIGNED'`, `title: 'New Fee Assigned: ...'`).
   - When a teacher manually verifies payment (`verifyFeePayment`):
     - The service accepts `studentFeeRecordId`, `paidAmount`, `paymentMode` (`'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'`), `transactionRef?`, `remarks?`.
     - Inside `prisma.$transaction`, the record is updated to `status: 'PAID'` (or `'PARTIAL'`), with `paidAt = new Date()`, `receiptNumber = 'REC-${Date.now()}-${randomBytes(2).toString('hex').toUpperCase()}'`, `verifiedById = user.id`.
     - An in-app `Notification` is created for the student (`type: 'FEE_PAID'`, `title: 'Fee Payment Verified'`).

4. **Fail-Closed on DB Down (R5)**:
   - Observation 1.2 shows `HealthController` currently returns HTTP 200 with `'fallback-active'`.
   - To guarantee backend services fail closed on DB down (HTTP 503):
     - `HealthController` must verify `this.prisma?.isConnected` and throw `ServiceUnavailableException` (HTTP 503) if disconnected.
     - All new batch and fee endpoints in `TeacherService` must use `this.access.db()` (which invokes `assertDb()`), immediately failing with HTTP 503 if the database is unreachable, never falling back to mock or stale memory data in production.

5. **White-Labeled Receipt Generation & Branding (R3)**:
   - In accordance with R3 and Observation 1.2, fee receipts must completely omit `"Padhai-Pilot"` / `"PadhaiPilot"` branding and prominently display Teacher Name / Institute Branding.
   - Institute branding metadata (`name`, `logoUrl`, `address`, `contactPhone`, `contactEmail`, `signatoryName`, `signatoryTitle`) is loaded from `Institute`.
   - A dedicated endpoint (`GET /api/tuition/fees/:feeRecordId/receipt` or `GET /api/student/fees/:feeRecordId/receipt`) can return the full structured receipt DTO with teacher/institute branding.
   - For PDF generation, a shared, pure client-side PDF utility (using `jspdf` and `jspdf-autotable` already installed in the monorepo) or a standardized serverless-compatible PDF generator creates the downloadable PDF omitting all platform branding.

---

## 3. Caveats

1. **Prisma Migration in Production**:
   - Adding columns (`paidAt`, `paymentMode`, `transactionRef`, `receiptNumber`, `verifiedById`) to `StudentFeeRecord` requires generating and applying a Prisma migration (`npx prisma migrate dev` or `prisma db push`). In read-only mode, schema edits cannot be applied directly to PostgreSQL without running migrations.
2. **Current `TeacherService` Memory Store**:
   - `TeacherService` has an extensive `memoryStore` implementation alongside injected `PrismaService`. To satisfy R5 (no mock data in production endpoints), new batch editing, fee configuration, and promotion methods must use Prisma ORM queries directly via `AccessService` rather than appending to in-memory arrays.
3. **Vitest Cloud Upstash Redis Dependency**:
   - The root `.env` includes live `UPSTASH_REDIS_REST_URL`. In offline or firewalled environments, tests that do not mock `RedisService` time out after 5000ms. In test files, `RedisService` should be mocked with an in-memory map stub or vitest timeout should be adjusted.

---

## 4. Conclusion

1. **Batch Editing & Code Sharing (R1)**:
   - The backend needs a `PUT /api/teacher/batches/:id` endpoint that validates permissions via `assertBatchAccess`, updates batch name, subject, gradeLevel, and room in PostgreSQL, and invalidates Redis cache.
   - Batch invitation codes (`InvitationCode`) already have unique codes and expiry. Quick-copy and shareable links can be generated directly using the existing code and institute slug.
2. **Batch Fee Configuration & Payment Verification (R2)**:
   - Add a `POST /api/teacher/batches/:batchId/fees` endpoint to define fee structures and bulk-initialize `StudentFeeRecord`s with `status = 'PENDING'` for all enrolled students in a single transaction.
   - Add a `PUT /api/teacher/fees/:recordId/verify` endpoint to manually verify student payments, transitioning status from `PENDING` to `PAID`, recording payment mode and timestamp, and assigning a unique receipt number.
3. **Student Alerts & White-Labeled Receipts (R3)**:
   - Use `Notification` model to emit in-app alerts on fee assignment and payment verification.
   - Serve fee receipt data via API containing 100% Institute/Teacher branding (`name`, `logoUrl`, `signatoryName`, `contactPhone`, `address`).
   - Implement receipt PDF generation using `jspdf` / `jspdf-autotable`, strictly omitting `"Padhai-Pilot"` and displaying only institute branding.
4. **In-Place Batch Promotion (R4)**:
   - Add a `POST /api/teacher/batches/:batchId/promote` endpoint to update `gradeLevel` and `name` in-place inside `prisma.$transaction`. Existing enrollments and fee records remain attached to `batchId`, preserving 100% of student roster and financial history.
5. **Fail-Closed Architecture (R5)**:
   - Update `HealthController` to return HTTP 503 when `!this.prisma?.isConnected`.
   - Ensure all new services call `this.access.db()`, failing closed with HTTP 503 when the database is unavailable.

---

## 5. Verification Method

To independently verify the survey observations and subsequent implementations:

1. **Prisma Schema Inspection**:
   - Run `npx prisma validate --schema=apps/api/prisma/schema.prisma` to verify schema integrity.
2. **Fail-Closed 503 Check**:
   - Test `HealthController` with a mock disconnected Prisma service:
     ```typescript
     const health = new HealthController({ isConnected: false } as any);
     // Must throw ServiceUnavailableException (HTTP 503) or return 503 status
     ```
3. **Unit Test Verification**:
   - Run existing student unit tests:
     `npm test --workspace=@padhai-pilot/api -- src/student/student.service.spec.ts`
   - Run target test suites once implemented:
     `npm test --workspace=@padhai-pilot/api -- src/teacher/teacher.service.spec.ts`
4. **Invalidation Conditions**:
   - If `apps/api/prisma/schema.prisma` is modified to remove `StudentFeeRecord` or `Enrollment`, relations described in Section 1.1 must be re-evaluated.
   - If Redis connection behavior is altered to disable graceful in-memory fallback during tests, test timeouts in vitest must be addressed.
