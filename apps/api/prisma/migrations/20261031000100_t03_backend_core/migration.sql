-- AlterTable
ALTER TABLE "Institute" ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "isDedicatedDb" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWhiteLabel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxStudents" INTEGER,
ADD COLUMN     "maxTeachers" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "subdomain" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InstituteMembership" ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedById" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TestQuiz" ADD COLUMN     "closesAt" TIMESTAMP(3),
ALTER COLUMN "questions" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "TestAttempt" ADD COLUMN     "totalMarks" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorEmail" TEXT,
ADD COLUMN     "details" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SUCCESS';

-- AlterTable
ALTER TABLE "ClassroomAssessment" ADD COLUMN     "isMultiSubject" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subjects" JSONB;

-- AlterTable
ALTER TABLE "AssessmentMark" ADD COLUMN     "subjectMarks" JSONB;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "dedupeKey" TEXT;

-- AlterTable
ALTER TABLE "StudentFeeReminder" ADD COLUMN     "dedupeKey" TEXT;

-- CreateTable
CREATE TABLE "BatchFaculty" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "BatchFaculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceCorrectionRequest" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT,
    "sessionId" TEXT,
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewerNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceCorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicQuery" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT,
    "facultyId" TEXT,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "questionText" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicQueryReply" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicQueryReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyTask" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDocument" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "academicPeriod" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "downloadUrl" TEXT NOT NULL,
    "fileSize" TEXT,
    "issuedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyInvitation" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "tokenHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FACULTY',
    "designation" TEXT NOT NULL,
    "assignedSubjects" TEXT[],
    "batchIds" TEXT[],
    "delegatedPermissions" TEXT[],
    "compensationType" TEXT NOT NULL DEFAULT 'FIXED_MONTHLY',
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "lastSentAt" TIMESTAMP(3),
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationOutbox" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT,
    "userId" TEXT,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestQuestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MCQ',
    "options" TEXT[],
    "correctOptionIndex" INTEGER,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "selectedOptionIndex" INTEGER,
    "textAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "marksAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "targetAudience" TEXT NOT NULL DEFAULT 'ALL',
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchFaculty_instituteId_idx" ON "BatchFaculty"("instituteId");

-- CreateIndex
CREATE INDEX "BatchFaculty_facultyId_instituteId_idx" ON "BatchFaculty"("facultyId", "instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "BatchFaculty_batchId_facultyId_key" ON "BatchFaculty"("batchId", "facultyId");

-- CreateIndex
CREATE INDEX "AttendanceCorrectionRequest_instituteId_status_idx" ON "AttendanceCorrectionRequest"("instituteId", "status");

-- CreateIndex
CREATE INDEX "AttendanceCorrectionRequest_studentId_createdAt_idx" ON "AttendanceCorrectionRequest"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "AttendanceCorrectionRequest_batchId_status_idx" ON "AttendanceCorrectionRequest"("batchId", "status");

-- CreateIndex
CREATE INDEX "AcademicQuery_studentId_createdAt_idx" ON "AcademicQuery"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "AcademicQuery_instituteId_status_idx" ON "AcademicQuery"("instituteId", "status");

-- CreateIndex
CREATE INDEX "AcademicQuery_batchId_status_idx" ON "AcademicQuery"("batchId", "status");

-- CreateIndex
CREATE INDEX "AcademicQueryReply_queryId_createdAt_idx" ON "AcademicQueryReply"("queryId", "createdAt");

-- CreateIndex
CREATE INDEX "StudyTask_userId_isCompleted_dueDate_idx" ON "StudyTask"("userId", "isCompleted", "dueDate");

-- CreateIndex
CREATE INDEX "SupportRequest_userId_createdAt_idx" ON "SupportRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportRequest_instituteId_status_idx" ON "SupportRequest"("instituteId", "status");

-- CreateIndex
CREATE INDEX "StudentDocument_studentId_issueDate_idx" ON "StudentDocument"("studentId", "issueDate");

-- CreateIndex
CREATE INDEX "StudentDocument_instituteId_idx" ON "StudentDocument"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyInvitation_tokenHash_key" ON "FacultyInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "FacultyInvitation_instituteId_status_idx" ON "FacultyInvitation"("instituteId", "status");

-- CreateIndex
CREATE INDEX "FacultyInvitation_instituteId_email_idx" ON "FacultyInvitation"("instituteId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationOutbox_idempotencyKey_key" ON "NotificationOutbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "NotificationOutbox_status_createdAt_idx" ON "NotificationOutbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationOutbox_instituteId_idx" ON "NotificationOutbox"("instituteId");

-- CreateIndex
CREATE INDEX "TestQuestion_testId_idx" ON "TestQuestion"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "TestQuestion_testId_position_key" ON "TestQuestion"("testId", "position");

-- CreateIndex
CREATE INDEX "TestAttemptAnswer_questionId_idx" ON "TestAttemptAnswer"("questionId");

-- CreateIndex
CREATE INDEX "TestAttemptAnswer_studentId_idx" ON "TestAttemptAnswer"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TestAttemptAnswer_attemptId_questionId_key" ON "TestAttemptAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "PlatformAnnouncement_createdAt_idx" ON "PlatformAnnouncement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Institute_subdomain_key" ON "Institute"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Institute_customDomain_key" ON "Institute"("customDomain");

-- CreateIndex
CREATE INDEX "Institute_status_idx" ON "Institute"("status");

-- CreateIndex
CREATE INDEX "Batch_instituteId_isActive_idx" ON "Batch"("instituteId", "isActive");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_status_idx" ON "Enrollment"("studentId", "status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_createdAt_idx" ON "AttendanceRecord"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Assignment_batchId_dueDate_idx" ON "Assignment"("batchId", "dueDate");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_studentId_submittedAt_idx" ON "AssignmentSubmission"("studentId", "submittedAt");

-- CreateIndex
CREATE INDEX "TestQuiz_batchId_scheduledDate_idx" ON "TestQuiz"("batchId", "scheduledDate");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_instituteId_createdAt_idx" ON "AuditLog"("instituteId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "ClassroomAssessment_batchId_assessmentDate_idx" ON "ClassroomAssessment"("batchId", "assessmentDate");

-- CreateIndex
CREATE INDEX "AssessmentMark_studentId_isPublished_idx" ON "AssessmentMark"("studentId", "isPublished");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_instituteId_dueDate_idx" ON "StudentFeeRecord"("instituteId", "dueDate");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_studentId_dueDate_idx" ON "StudentFeeRecord"("studentId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeReminder_feeRecordId_dedupeKey_key" ON "StudentFeeReminder"("feeRecordId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "BatchFaculty" ADD CONSTRAINT "BatchFaculty_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchFaculty" ADD CONSTRAINT "BatchFaculty_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchFaculty" ADD CONSTRAINT "BatchFaculty_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrectionRequest" ADD CONSTRAINT "AttendanceCorrectionRequest_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrectionRequest" ADD CONSTRAINT "AttendanceCorrectionRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrectionRequest" ADD CONSTRAINT "AttendanceCorrectionRequest_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrectionRequest" ADD CONSTRAINT "AttendanceCorrectionRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicQuery" ADD CONSTRAINT "AcademicQuery_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicQuery" ADD CONSTRAINT "AcademicQuery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicQuery" ADD CONSTRAINT "AcademicQuery_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicQueryReply" ADD CONSTRAINT "AcademicQueryReply_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "AcademicQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyInvitation" ADD CONSTRAINT "FacultyInvitation_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationOutbox" ADD CONSTRAINT "NotificationOutbox_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "TestQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttemptAnswer" ADD CONSTRAINT "TestAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttemptAnswer" ADD CONSTRAINT "TestAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TestQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttemptAnswer" ADD CONSTRAINT "TestAttemptAnswer_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

