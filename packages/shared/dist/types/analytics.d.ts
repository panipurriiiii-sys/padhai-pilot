/**
 * Real analytics & reporting types shared across backend API, Teacher Portal, Student Portal, and Mobile.
 * Single source of truth for charts, dashboards, and reporting metrics.
 */
export interface AttendanceTrendPoint {
    label: string;
    rate: number;
}
export interface SubmissionMetrics {
    totalAssigned: number;
    submittedCount: number;
    gradedCount: number;
    pendingReviewCount: number;
}
export interface BatchPerformanceRow {
    batchName: string;
    code: string;
    studentCount: number;
    averageAttendance: number;
    assignmentTurnaround: string;
}
export interface TeacherReportsSummary {
    totalBatches: number;
    totalStudents: number;
    averageClassAttendance: string;
    totalTestsConducted: number;
}
export interface TeacherReports {
    attendanceTrends: AttendanceTrendPoint[];
    submissionMetrics: SubmissionMetrics;
    batchPerformance: BatchPerformanceRow[];
    summary: TeacherReportsSummary;
}
export interface AttendanceRegisterBreakdown {
    present: number;
    absent: number;
    late: number;
    excused: number;
}
export interface StudentMonthlyAttendancePoint {
    month: string;
    rate: number;
    attended: number;
    total: number;
}
export interface StudentResultTrendPoint {
    testTitle: string;
    percentage: number | null;
    obtainedMarks?: number | null;
    maxMarks?: number | null;
    subject?: string;
    date?: string;
}
export interface StudentSubjectAverageRow {
    subject: string;
    averagePercentage: number;
    testCount: number;
}
export interface StudentAssignmentBreakdown {
    pending: number;
    submitted: number;
    graded: number;
    late: number;
    resubmit: number;
    total: number;
}
export interface StudentFeeBreakdown {
    totalFees: number;
    paidAmount: number;
    balanceDue: number;
    paidPercentage: number;
}
export interface StudentTaskProgressMetrics {
    completed: number;
    pending: number;
    total: number;
    completionRate: number;
}
export interface StudentAnalyticsContract {
    monthlyAttendance: StudentMonthlyAttendancePoint[];
    resultTrends: StudentResultTrendPoint[];
    subjectAverages: StudentSubjectAverageRow[];
    assignmentBreakdown: StudentAssignmentBreakdown;
    feeBreakdown: StudentFeeBreakdown;
    taskProgress: StudentTaskProgressMetrics;
}
export interface StudentAttendanceDay {
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    subject: string;
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
    /** Average of all published scores for this assessment; null when it cannot be computed. */
    classAveragePercentage: number | null;
}
export interface HomeworkCompletionSummary {
    totalAssigned: number;
    submitted: number;
    graded: number;
    pending: number;
    completionRatePercentage: number | null;
}
export interface StudentAnalyticsSummary {
    studentId: string;
    attendanceRate: number | null;
    attendanceTrend: StudentAttendanceDay[];
    subjectPerformance: SubjectPerformanceItem[];
    examScoreTrend: ExamScoreTrendPoint[];
    homeworkSummary: HomeworkCompletionSummary;
}
export interface BatchAttendanceTrend {
    batchId: string;
    batchName: string;
    averageAttendancePercentage: number | null;
    sessionsCount: number;
}
export interface GradeDistributionBucket {
    grade: string;
    studentCount: number;
    percentage: number;
}
export interface SubjectComparisonItem {
    subject: string;
    averageScorePercentage: number | null;
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
    teacherId: string;
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
