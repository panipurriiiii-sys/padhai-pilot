-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER', 'FACULTY', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'LATE', 'GRADED', 'RESUBMIT');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('NORMAL', 'URGENT');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('UNIT_TEST', 'MONTHLY_EXAM', 'TERM_EXAM', 'QUIZ', 'PRACTICAL', 'GENERAL');

-- CreateEnum
CREATE TYPE "ClassroomAssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('SCORED', 'ABSENT', 'PENDING', 'EXCUSED');

-- CreateTable
CREATE TABLE "Institute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#1677FF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "plan" TEXT NOT NULL DEFAULT 'STANDARD',
    "features" JSONB,
    "address" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "description" TEXT,
    "footerText" TEXT,
    "signatoryName" TEXT,
    "signatoryTitle" TEXT,
    "academicYear" TEXT DEFAULT '2026-2027',
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetPasswordToken" TEXT,
    "resetPasswordExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstituteMembership" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstituteMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "room" TEXT,
    "teacherId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT,
    "issuerId" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 100,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sessionTime" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "updatedBy" TEXT,
    "correctionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "maxMarks" INTEGER NOT NULL DEFAULT 100,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT,
    "attachmentUrl" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "marksObtained" DOUBLE PRECISION,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestQuiz" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "subject" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "totalMarks" INTEGER NOT NULL DEFAULT 100,
    "status" "TestStatus" NOT NULL DEFAULT 'PUBLISHED',
    "questions" JSONB NOT NULL,
    "resultsReleased" BOOLEAN NOT NULL DEFAULT false,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL,
    "resources" JSONB,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomAssessment" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "AssessmentType" NOT NULL DEFAULT 'UNIT_TEST',
    "assessmentDate" DATE NOT NULL,
    "maxMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passingMarks" DOUBLE PRECISION,
    "instructions" TEXT,
    "status" "ClassroomAssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "gradingPrecision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassroomAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentMark" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "obtainedMarks" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "grade" TEXT,
    "resultStatus" "ResultStatus" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "correctionReason" TEXT,
    "lastEditedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentMarkHistory" (
    "id" TEXT NOT NULL,
    "markId" TEXT NOT NULL,
    "previousMarks" DOUBLE PRECISION,
    "newMarks" DOUBLE PRECISION,
    "previousStatus" "ResultStatus" NOT NULL,
    "newStatus" "ResultStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "editedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentMarkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAudit" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RESULT_PUBLISHED',
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformFeatureFlag" (
    "key" TEXT NOT NULL,
    "isGloballyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isEmergencyDisabled" BOOLEAN NOT NULL DEFAULT false,
    "disabledReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "PlatformFeatureFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PlanEntitlement" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "quotaLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstituteFeatureConfig" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customQuota" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstituteFeatureConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureAuditLog" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "targetInstituteId" TEXT,
    "action" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstituteUsageCounter" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL DEFAULT 'TOTAL',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstituteUsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "compensationType" TEXT NOT NULL DEFAULT 'FIXED_MONTHLY',
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedSubjects" TEXT[],
    "delegatedPermissions" TEXT[],
    "emergencyContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryRecord" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "payPeriod" TEXT NOT NULL,
    "compensationModel" TEXT NOT NULL DEFAULT 'FIXED_MONTHLY',
    "classesConducted" INTEGER NOT NULL DEFAULT 0,
    "baseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPayable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyLeaveApplication" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "reason" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewerRemarks" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "substituteFacultyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyLeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTeachingDiary" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "lessonDate" TIMESTAMP(3) NOT NULL,
    "sessionTime" TEXT,
    "subject" TEXT NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "conceptsTaught" TEXT NOT NULL,
    "learningObjectives" TEXT,
    "teachingMethods" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "homeworkAssigned" TEXT,
    "referenceLinks" TEXT[],
    "attachmentUrl" TEXT,
    "followUpPlan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "audience" TEXT NOT NULL DEFAULT 'BATCH',
    "isCovered" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyTeachingDiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyMaterial" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CHAPTER_NOTES',
    "subject" TEXT NOT NULL,
    "chapter" TEXT,
    "content" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "isStudentVisible" BOOLEAN NOT NULL DEFAULT true,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeRecord" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT,
    "feeTitle" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "academicYear" TEXT DEFAULT '2026-2027',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeReminder" (
    "id" TEXT NOT NULL,
    "feeRecordId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentById" TEXT NOT NULL,

    CONSTRAINT "StudentFeeReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institute_slug_key" ON "Institute"("slug");

-- CreateIndex
CREATE INDEX "Institute_slug_idx" ON "Institute"("slug");

-- CreateIndex
CREATE INDEX "Institute_ownerId_idx" ON "Institute"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_resetPasswordToken_idx" ON "User"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "InstituteMembership_instituteId_idx" ON "InstituteMembership"("instituteId");

-- CreateIndex
CREATE INDEX "InstituteMembership_userId_idx" ON "InstituteMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstituteMembership_instituteId_userId_key" ON "InstituteMembership"("instituteId", "userId");

-- CreateIndex
CREATE INDEX "Batch_instituteId_idx" ON "Batch"("instituteId");

-- CreateIndex
CREATE INDEX "Batch_teacherId_idx" ON "Batch"("teacherId");

-- CreateIndex
CREATE INDEX "Enrollment_instituteId_idx" ON "Enrollment"("instituteId");

-- CreateIndex
CREATE INDEX "Enrollment_batchId_idx" ON "Enrollment"("batchId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_batchId_studentId_key" ON "Enrollment"("batchId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationCode_code_key" ON "InvitationCode"("code");

-- CreateIndex
CREATE INDEX "InvitationCode_instituteId_idx" ON "InvitationCode"("instituteId");

-- CreateIndex
CREATE INDEX "InvitationCode_code_idx" ON "InvitationCode"("code");

-- CreateIndex
CREATE INDEX "InvitationCode_issuerId_idx" ON "InvitationCode"("issuerId");

-- CreateIndex
CREATE INDEX "AttendanceSession_instituteId_idx" ON "AttendanceSession"("instituteId");

-- CreateIndex
CREATE INDEX "AttendanceSession_batchId_idx" ON "AttendanceSession"("batchId");

-- CreateIndex
CREATE INDEX "AttendanceSession_date_idx" ON "AttendanceSession"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_batchId_date_key" ON "AttendanceSession"("batchId", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");

-- CreateIndex
CREATE INDEX "Assignment_instituteId_idx" ON "Assignment"("instituteId");

-- CreateIndex
CREATE INDEX "Assignment_batchId_idx" ON "Assignment"("batchId");

-- CreateIndex
CREATE INDEX "Assignment_teacherId_idx" ON "Assignment"("teacherId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_assignmentId_idx" ON "AssignmentSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_studentId_idx" ON "AssignmentSubmission"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_assignmentId_studentId_key" ON "AssignmentSubmission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "TestQuiz_instituteId_idx" ON "TestQuiz"("instituteId");

-- CreateIndex
CREATE INDEX "TestQuiz_batchId_idx" ON "TestQuiz"("batchId");

-- CreateIndex
CREATE INDEX "TestQuiz_teacherId_idx" ON "TestQuiz"("teacherId");

-- CreateIndex
CREATE INDEX "TestAttempt_testId_idx" ON "TestAttempt"("testId");

-- CreateIndex
CREATE INDEX "TestAttempt_studentId_idx" ON "TestAttempt"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TestAttempt_testId_studentId_key" ON "TestAttempt"("testId", "studentId");

-- CreateIndex
CREATE INDEX "LessonPlan_instituteId_idx" ON "LessonPlan"("instituteId");

-- CreateIndex
CREATE INDEX "LessonPlan_batchId_idx" ON "LessonPlan"("batchId");

-- CreateIndex
CREATE INDEX "LessonPlan_teacherId_idx" ON "LessonPlan"("teacherId");

-- CreateIndex
CREATE INDEX "TimetableSlot_instituteId_idx" ON "TimetableSlot"("instituteId");

-- CreateIndex
CREATE INDEX "TimetableSlot_batchId_idx" ON "TimetableSlot"("batchId");

-- CreateIndex
CREATE INDEX "TimetableSlot_teacherId_idx" ON "TimetableSlot"("teacherId");

-- CreateIndex
CREATE INDEX "Announcement_instituteId_idx" ON "Announcement"("instituteId");

-- CreateIndex
CREATE INDEX "Announcement_batchId_idx" ON "Announcement"("batchId");

-- CreateIndex
CREATE INDEX "AuditLog_instituteId_idx" ON "AuditLog"("instituteId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "ClassroomAssessment_instituteId_idx" ON "ClassroomAssessment"("instituteId");

-- CreateIndex
CREATE INDEX "ClassroomAssessment_batchId_idx" ON "ClassroomAssessment"("batchId");

-- CreateIndex
CREATE INDEX "ClassroomAssessment_teacherId_idx" ON "ClassroomAssessment"("teacherId");

-- CreateIndex
CREATE INDEX "ClassroomAssessment_assessmentDate_idx" ON "ClassroomAssessment"("assessmentDate");

-- CreateIndex
CREATE INDEX "AssessmentMark_assessmentId_idx" ON "AssessmentMark"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentMark_studentId_idx" ON "AssessmentMark"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentMark_assessmentId_studentId_key" ON "AssessmentMark"("assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "AssessmentMarkHistory_markId_idx" ON "AssessmentMarkHistory"("markId");

-- CreateIndex
CREATE INDEX "AssessmentAudit_assessmentId_idx" ON "AssessmentAudit"("assessmentId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_instituteId_idx" ON "Notification"("instituteId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "PlatformFeatureFlag_isGloballyEnabled_idx" ON "PlatformFeatureFlag"("isGloballyEnabled");

-- CreateIndex
CREATE INDEX "PlatformFeatureFlag_isEmergencyDisabled_idx" ON "PlatformFeatureFlag"("isEmergencyDisabled");

-- CreateIndex
CREATE INDEX "PlanEntitlement_plan_idx" ON "PlanEntitlement"("plan");

-- CreateIndex
CREATE INDEX "PlanEntitlement_featureKey_idx" ON "PlanEntitlement"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "PlanEntitlement_plan_featureKey_key" ON "PlanEntitlement"("plan", "featureKey");

-- CreateIndex
CREATE INDEX "InstituteFeatureConfig_instituteId_idx" ON "InstituteFeatureConfig"("instituteId");

-- CreateIndex
CREATE INDEX "InstituteFeatureConfig_featureKey_idx" ON "InstituteFeatureConfig"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "InstituteFeatureConfig_instituteId_featureKey_key" ON "InstituteFeatureConfig"("instituteId", "featureKey");

-- CreateIndex
CREATE INDEX "FeatureAuditLog_featureKey_idx" ON "FeatureAuditLog"("featureKey");

-- CreateIndex
CREATE INDEX "FeatureAuditLog_targetInstituteId_idx" ON "FeatureAuditLog"("targetInstituteId");

-- CreateIndex
CREATE INDEX "FeatureAuditLog_createdAt_idx" ON "FeatureAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "InstituteUsageCounter_instituteId_idx" ON "InstituteUsageCounter"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "InstituteUsageCounter_instituteId_metricKey_period_key" ON "InstituteUsageCounter"("instituteId", "metricKey", "period");

-- CreateIndex
CREATE INDEX "FacultyProfile_instituteId_idx" ON "FacultyProfile"("instituteId");

-- CreateIndex
CREATE INDEX "FacultyProfile_userId_idx" ON "FacultyProfile"("userId");

-- CreateIndex
CREATE INDEX "FacultyProfile_staffId_idx" ON "FacultyProfile"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_instituteId_userId_key" ON "FacultyProfile"("instituteId", "userId");

-- CreateIndex
CREATE INDEX "SalaryRecord_instituteId_idx" ON "SalaryRecord"("instituteId");

-- CreateIndex
CREATE INDEX "SalaryRecord_facultyId_idx" ON "SalaryRecord"("facultyId");

-- CreateIndex
CREATE INDEX "SalaryRecord_payPeriod_idx" ON "SalaryRecord"("payPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryRecord_instituteId_facultyId_payPeriod_key" ON "SalaryRecord"("instituteId", "facultyId", "payPeriod");

-- CreateIndex
CREATE INDEX "FacultyLeaveApplication_instituteId_idx" ON "FacultyLeaveApplication"("instituteId");

-- CreateIndex
CREATE INDEX "FacultyLeaveApplication_facultyId_idx" ON "FacultyLeaveApplication"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyLeaveApplication_status_idx" ON "FacultyLeaveApplication"("status");

-- CreateIndex
CREATE INDEX "DailyTeachingDiary_instituteId_idx" ON "DailyTeachingDiary"("instituteId");

-- CreateIndex
CREATE INDEX "DailyTeachingDiary_batchId_idx" ON "DailyTeachingDiary"("batchId");

-- CreateIndex
CREATE INDEX "DailyTeachingDiary_facultyId_idx" ON "DailyTeachingDiary"("facultyId");

-- CreateIndex
CREATE INDEX "DailyTeachingDiary_lessonDate_idx" ON "DailyTeachingDiary"("lessonDate");

-- CreateIndex
CREATE INDEX "StudyMaterial_instituteId_idx" ON "StudyMaterial"("instituteId");

-- CreateIndex
CREATE INDEX "StudyMaterial_batchId_idx" ON "StudyMaterial"("batchId");

-- CreateIndex
CREATE INDEX "StudyMaterial_facultyId_idx" ON "StudyMaterial"("facultyId");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_instituteId_idx" ON "StudentFeeRecord"("instituteId");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_studentId_idx" ON "StudentFeeRecord"("studentId");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_status_idx" ON "StudentFeeRecord"("status");

-- CreateIndex
CREATE INDEX "StudentFeeReminder_feeRecordId_idx" ON "StudentFeeReminder"("feeRecordId");

-- CreateIndex
CREATE INDEX "StudentFeeReminder_studentId_idx" ON "StudentFeeReminder"("studentId");

-- AddForeignKey
ALTER TABLE "InstituteMembership" ADD CONSTRAINT "InstituteMembership_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstituteMembership" ADD CONSTRAINT "InstituteMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuiz" ADD CONSTRAINT "TestQuiz_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuiz" ADD CONSTRAINT "TestQuiz_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "TestQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomAssessment" ADD CONSTRAINT "ClassroomAssessment_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomAssessment" ADD CONSTRAINT "ClassroomAssessment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomAssessment" ADD CONSTRAINT "ClassroomAssessment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMark" ADD CONSTRAINT "AssessmentMark_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ClassroomAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMark" ADD CONSTRAINT "AssessmentMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMarkHistory" ADD CONSTRAINT "AssessmentMarkHistory_markId_fkey" FOREIGN KEY ("markId") REFERENCES "AssessmentMark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAudit" ADD CONSTRAINT "AssessmentAudit_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ClassroomAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstituteFeatureConfig" ADD CONSTRAINT "InstituteFeatureConfig_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstituteUsageCounter" ADD CONSTRAINT "InstituteUsageCounter_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyLeaveApplication" ADD CONSTRAINT "FacultyLeaveApplication_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyLeaveApplication" ADD CONSTRAINT "FacultyLeaveApplication_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyLeaveApplication" ADD CONSTRAINT "FacultyLeaveApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTeachingDiary" ADD CONSTRAINT "DailyTeachingDiary_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTeachingDiary" ADD CONSTRAINT "DailyTeachingDiary_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTeachingDiary" ADD CONSTRAINT "DailyTeachingDiary_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeRecord" ADD CONSTRAINT "StudentFeeRecord_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeRecord" ADD CONSTRAINT "StudentFeeRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeRecord" ADD CONSTRAINT "StudentFeeRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeReminder" ADD CONSTRAINT "StudentFeeReminder_feeRecordId_fkey" FOREIGN KEY ("feeRecordId") REFERENCES "StudentFeeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

