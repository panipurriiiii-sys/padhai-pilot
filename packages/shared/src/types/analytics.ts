/**
 * Type contracts for analytics endpoints across Student, Faculty/Owner, and Platform Admin scopes.
 */

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AttendanceTrendPoint {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  subject?: string;
}

export interface SubjectPerformanceItem {
  subject: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  assessmentsCount: number;
}

export interface ExamScoreTrendPoint {
  assessmentId: string;
  title: string;
  date: string;
  percentage: number;
  classAveragePercentage?: number;
}

export interface HomeworkCompletionSummary {
  totalAssigned: number;
  submitted: number;
  graded: number;
  pending: number;
  completionRatePercentage: number;
}

export interface StudentAnalyticsSummary {
  studentId: string;
  attendanceRate: number;
  attendanceTrend: AttendanceTrendPoint[];
  subjectPerformance: SubjectPerformanceItem[];
  examScoreTrend: ExamScoreTrendPoint[];
  homeworkSummary: HomeworkCompletionSummary;
}

export interface BatchAttendanceTrend {
  batchId: string;
  batchName: string;
  averageAttendancePercentage: number;
  sessionsCount: number;
}

export interface GradeDistributionBucket {
  grade: string;
  studentCount: number;
  percentage: number;
}

export interface SubjectComparisonItem {
  subject: string;
  averageScorePercentage: number;
  totalStudents: number;
  assessmentCount: number;
}

export interface AssignmentSubmissionStat {
  assignmentId: string;
  title: string;
  dueDate: string;
  totalStudents: number;
  submittedCount: number;
  submissionRatePercentage: number;
}

export interface SyllabusCoverageItem {
  batchId: string;
  batchName: string;
  subject: string;
  totalTopics: number;
  completedTopics: number;
  coveragePercentage: number;
}

export interface TeacherAnalyticsSummary {
  instituteId: string;
  teacherId?: string;
  batchAttendanceTrends: BatchAttendanceTrend[];
  gradeDistribution: GradeDistributionBucket[];
  subjectComparison: SubjectComparisonItem[];
  assignmentSubmissions: AssignmentSubmissionStat[];
  syllabusCoverage: SyllabusCoverageItem[];
}

export interface PlatformAdminAnalyticsSummary {
  totalInstitutes: number;
  activeInstitutes: number;
  institutesByPlan: Record<string, number>;
  totalStudents: number;
  totalTeachers: number;
  recentActivityCounts: {
    assessmentsCreated: number;
    attendanceRecorded: number;
    activeLoginsLast24h: number;
  };
}

