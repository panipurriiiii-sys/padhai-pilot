export type UserRole =
  | 'SUPER_ADMIN'
  | 'TUITION_OWNER'
  | 'INSTITUTE_ADMIN'
  | 'INSTITUTE_MANAGER'
  | 'FACULTY'
  | 'TEACHER'
  | 'STUDENT';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  instituteId: string;
  instituteName?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface InstituteConfig {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  features: {
    attendance: boolean;
    assignments: boolean;
    testsAndResults: boolean;
    fees: boolean;
    announcements: boolean;
    timetable: boolean;
  };
  attendanceRules: {
    allowLate: boolean;
    allowExcused: boolean;
    cutoffHoursForEdit: number;
  };
}

export interface BatchSummary {
  id: string;
  name: string;
  code: string;
  subject: string;
  gradeLevel: string;
  instituteId: string;
  teacherId: string;
  teacherName?: string;
  studentCount: number;
  scheduleSummary?: string;
  room?: string;
  createdAt: string;
}

export interface StudentRosterItem {
  id: string;
  fullName: string;
  rollNumber: string;
  email: string;
  phone?: string;
  enrollmentStatus: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  batchId: string;
  batchName?: string;
  attendanceRate: number;
  joinedAt: string;
}

export interface InvitationCode {
  id: string;
  code: string;
  instituteId: string;
  batchId?: string;
  batchName?: string;
  issuerId: string;
  issuerName?: string;
  maxUses: number;
  usedCount: number;
  /** null = never expires. */
  expiresAt: string | null;
  isRevoked: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'EXHAUSTED';
  shareText?: string;
  shareLink?: string;
  createdAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRecordItem {
  studentId: string;
  studentName?: string;
  rollNumber?: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  batchId: string;
  batchName?: string;
  teacherId: string;
  date: string;
  sessionTime?: string;
  records: AttendanceRecordItem[];
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
}

export interface Assignment {
  id: string;
  instituteId?: string;
  batchId: string;
  batchName?: string;
  teacherId: string;
  teacherName?: string;
  title: string;
  instructions: string;
  subject: string;
  dueDate: string;
  maxMarks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  submissionCount: number;
  totalStudents: number;
  attachmentUrl?: string;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submittedAt: string;
  content?: string;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RESUBMIT';
  marksObtained?: number;
  feedback?: string;
}

export interface TestQuestion {
  id: string;
  text: string;
  type: 'MCQ' | 'TEXT';
  options?: string[];
  correctOptionIndex?: number;
  marks: number;
}

export interface TestQuiz {
  id: string;
  instituteId?: string;
  batchId: string;
  batchName?: string;
  teacherId: string;
  title: string;
  instructions?: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'ARCHIVED';
  questions: TestQuestion[];
  resultsReleased: boolean;
  scheduledDate: string;
  attemptCount?: number;
  averageScore?: number;
  createdAt: string;
}

export interface LessonPlan {
  id: string;
  instituteId?: string;
  batchId: string;
  batchName?: string;
  teacherId: string;
  title: string;
  topic: string;
  subject: string;
  weekNumber: number;
  content: string;
  resources?: { title: string; type: 'PDF' | 'LINK'; url: string }[];
  isCompleted: boolean;
  createdAt: string;
}

export interface TimetableSlot {
  id: string;
  batchId: string;
  batchName: string;
  subject: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  room?: string;
  isToday?: boolean;
}

export interface AnnouncementItem {
  id: string;
  instituteId: string;
  batchId?: string;
  batchName?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT';
  createdAt: string;
}

export * from './analytics.js';

export interface TeacherDashboardMetrics {
  todayClassesCount: number;
  assignedBatchesCount: number;
  totalStudentsCount: number;
  pendingAttendanceCount: number;
  pendingReviewsCount: number;
  recentAnnouncements: AnnouncementItem[];
  todaySchedule: TimetableSlot[];
  activeBatches: BatchSummary[];
}

// -------------------------------------------------------------
// CLASSROOM ASSESSMENTS, BULK ATTENDANCE & MARKS ENTRY
// -------------------------------------------------------------

export type AssessmentType = 'UNIT_TEST' | 'MONTHLY_EXAM' | 'TERM_EXAM' | 'QUIZ' | 'PRACTICAL' | 'GENERAL';

export type ClassroomAssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ResultStatus = 'SCORED' | 'ABSENT' | 'PENDING' | 'EXCUSED';

export interface SubjectScoreConfig {
  name: string;
  maxMarks: number;
  passingMarks?: number;
}

export interface ClassroomAssessment {
  id: string;
  instituteId: string;
  batchId: string;
  batchName?: string;
  teacherId: string;
  teacherName?: string;
  title: string;
  subject: string;
  subjects?: SubjectScoreConfig[];
  isMultiSubject?: boolean;
  category: AssessmentType;
  assessmentDate: string;
  maxMarks: number;
  passingMarks?: number;
  instructions?: string;
  status: ClassroomAssessmentStatus;
  publishedAt?: string;
  publishedBy?: string;
  gradingPrecision: number;
  studentCount?: number;
  scoredCount?: number;
  absentCount?: number;
  pendingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentMarkItem {
  id?: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  attendanceStatus: AttendanceStatus;
  obtainedMarks?: number | null;
  subjectMarks?: Record<string, number | null>;
  percentage?: number | null;
  grade?: string | null;
  resultStatus: ResultStatus;
  feedback?: string;
  isPublished: boolean;
  correctionReason?: string;
  lastEditedBy?: string;
  isEligible?: boolean;
}

export interface BulkMarksSaveDraftPayload {
  assessmentId?: string;
  batchId: string;
  subject: string;
  subjects?: SubjectScoreConfig[];
  isMultiSubject?: boolean;
  title: string;
  category?: AssessmentType;
  assessmentDate: string;
  maxMarks: number;
  passingMarks?: number;
  instructions?: string;
  marks: {
    studentId: string;
    attendanceStatus: AttendanceStatus;
    obtainedMarks?: number | null;
    subjectMarks?: Record<string, number | null>;
    feedback?: string;
    isEligible?: boolean;
  }[];
}

export interface PublishAssessmentPayload {
  assessmentId: string;
}

export interface CorrectMarkPayload {
  markId: string;
  obtainedMarks: number;
  reason: string;
}

export interface StudentAssessmentResult {
  markId: string;
  assessmentId: string;
  title: string;
  subject: string;
  category: AssessmentType;
  assessmentDate: string;
  maxMarks: number;
  obtainedMarks?: number | null;
  percentage?: number | null;
  grade?: string | null;
  resultStatus: ResultStatus;
  attendanceStatus: AttendanceStatus;
  feedback?: string;
  publishedAt?: string;
}

export interface InAppNotification {
  id: string;
  instituteId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function calculateGradeAndPercentage(
  obtainedMarks: number | null | undefined,
  maxMarks: number,
): { percentage: number | null; grade: string | null } {
  if (obtainedMarks === null || obtainedMarks === undefined || maxMarks <= 0) {
    return { percentage: null, grade: null };
  }

  const percentage = Math.round((obtainedMarks / maxMarks) * 100 * 10) / 10;
  let grade = 'F';

  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B+';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';
  else grade = 'F';

  return { percentage, grade };
}

export * from './features.js';
export * from './tuition.js';
export * from './student.js';
export * from './academic.js';

export * from './analytics.js';
export * from './finance.js';
