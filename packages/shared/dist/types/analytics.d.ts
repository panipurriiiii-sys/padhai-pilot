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
