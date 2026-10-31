export interface StudentAttendanceSummary {
    totalClasses: number;
    attended: number;
    absent: number;
    late: number;
    percentage: number;
    records: Array<{
        id: string;
        date: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
        subjectName?: string;
        remarks?: string;
    }>;
}
export interface StudentFeeSummary {
    totalFees: number;
    paidAmount: number;
    balanceDue: number;
    status: 'PAID' | 'PARTIAL' | 'OVERDUE';
    receipts: Array<{
        id: string;
        title: string;
        dueDate: string;
        amount: number;
        paidAmount: number;
        status: 'PAID' | 'PENDING' | 'OVERDUE';
        paidDate?: string;
        receiptNumber?: string;
    }>;
}
export interface StudentAnnouncementItem {
    id: string;
    title: string;
    content: string;
    date: string;
    priority: 'NORMAL' | 'URGENT';
    authorName?: string;
}
export interface StudentTeachingDiaryItem {
    id: string;
    lessonDate: string;
    sessionTime?: string;
    subject: string;
    facultyName: string;
    batchName: string;
    chapterTitle: string;
    conceptsTaught: string;
    learningObjectives?: string;
    homeworkAssigned?: string;
    attachmentUrl?: string;
    referenceLinks?: string[];
    createdAt: string;
}
export interface StudentAssignmentItem {
    id: string;
    title: string;
    instructions: string;
    subject: string;
    dueDate: string;
    maxMarks: number;
    attachmentUrl?: string;
    status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RESUBMIT';
    submission?: {
        submittedAt: string;
        content?: string;
        attachmentUrl?: string;
        marksObtained?: number;
        feedback?: string;
    };
}
export interface StudentTestItem {
    id: string;
    title: string;
    instructions?: string;
    subject: string;
    scheduledDate: string;
    durationMinutes: number;
    totalMarks: number;
    status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
    attempt?: {
        submittedAt: string;
        score: number;
        status: string;
        feedback?: string;
    };
}
export interface AcademicQueryItem {
    id: string;
    subject: string;
    topic?: string;
    questionText: string;
    attachmentUrl?: string;
    status: 'PENDING' | 'ANSWERED';
    facultyReply?: string;
    repliedAt?: string;
    facultyName?: string;
    createdAt: string;
}
export interface PersonalStudyTaskItem {
    id: string;
    title: string;
    subject?: string;
    dueDate?: string;
    priority: 'NORMAL' | 'HIGH' | 'LOW';
    isCompleted: boolean;
    createdAt: string;
}
export interface StudentDocumentItem {
    id: string;
    title: string;
    category: 'REPORT_CARD' | 'FEE_RECEIPT' | 'STUDY_MATERIAL' | 'TIMETABLE_SCHEDULE' | 'CERTIFICATE';
    issueDate: string;
    academicPeriod: string;
    downloadUrl: string;
    fileSize?: string;
}
export interface StudentTimetableSlot {
    time: string;
    subject: string;
    topic: string;
    room: string;
    faculty: string;
}
export interface StudentTimetableDay {
    day: string;
    slots: StudentTimetableSlot[];
}
export interface StudentProfile {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
    role: string;
    rollNumber: string;
    instituteId: string;
    instituteName: string;
    batchId: string;
    batchName: string;
    subject: string;
    academicYear: string;
    joinedAt: string;
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        inApp: boolean;
        results: boolean;
        fees: boolean;
    };
}
export interface StudentTestQuestion {
    id: string;
    text: string;
    options: string[];
    marks: number;
}
export interface StudentTestDetails {
    id: string;
    title: string;
    instructions?: string;
    subject: string;
    durationMinutes: number;
    totalMarks: number;
    questions: StudentTestQuestion[];
}
export interface StudentTestAttemptResult {
    success: boolean;
    score: number;
    totalMarks: number;
    percentage: number;
    feedback: string;
    submittedAt: string;
}
export interface StudentDashboard {
    student: {
        id: string;
        fullName: string;
        email: string;
        rollNumber: string;
        instituteName: string;
        batchName: string;
        academicYear: string;
    };
    stats: {
        totalTests: number;
        avgPercentage: number;
        attendanceRate: number;
        totalMaterials: number;
        pendingAssignments: number;
        feeBalance: number;
        classesAttended: number;
        totalClasses: number;
        upcomingTests: number;
    };
    recentResults: unknown[];
    recentMaterials: unknown[];
    recentDiaries: StudentTeachingDiaryItem[];
    upcomingAssignments: StudentAssignmentItem[];
    announcements: StudentAnnouncementItem[];
    timetable: StudentTimetableSlot[];
}
