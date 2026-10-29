export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'INACTIVE' | 'RESIGNED';
export type CompensationType = 'FIXED_MONTHLY' | 'HOURLY_PER_CLASS' | 'HYBRID';
export type SalaryStatus = 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID';
export type LeaveType = 'CASUAL' | 'SICK' | 'ACADEMIC_DUTY' | 'EMERGENCY' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type TeachingDiaryAudience = 'PRIVATE_DRAFT' | 'OWNER_ONLY' | 'BATCH';
export type TeachingDiaryStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type StudyMaterialCategory = 'CHAPTER_NOTES' | 'HANDOUT' | 'WORKSHEET' | 'FORMULA_SHEET' | 'REVISION_GUIDE' | 'PRACTICE_PAPER';
export type FeeStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
export type ReminderChannel = 'IN_APP' | 'SMS' | 'EMAIL' | 'WHATSAPP';
export type DelegatedPermission = 'MANAGE_ATTENDANCE' | 'MANAGE_MARKS' | 'VIEW_FEES' | 'MANAGE_TIMETABLE' | 'PUBLISH_DIARY' | 'MANAGE_FACULTIES' | 'MANAGE_SALARIES' | 'APPROVE_LEAVES';
export interface TuitionBrandingProfile {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor: string;
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    website?: string;
    description?: string;
    footerText?: string;
    signatoryName?: string;
    signatoryTitle?: string;
    academicYear: string;
    ownerId?: string;
    totalStudents: number;
    totalFaculty: number;
    totalBatches: number;
}
export interface UpdateTuitionBrandingDto {
    name?: string;
    logoUrl?: string;
    primaryColor?: string;
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    website?: string;
    description?: string;
    footerText?: string;
    signatoryName?: string;
    signatoryTitle?: string;
    academicYear?: string;
}
export interface FacultyMember {
    id: string;
    userId: string;
    staffId: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    designation: string;
    employmentStatus: EmploymentStatus;
    compensationType: CompensationType;
    baseSalary: number;
    hourlyRate: number;
    joiningDate: string;
    assignedSubjects: string[];
    delegatedPermissions: DelegatedPermission[];
    assignedBatchesCount: number;
    assignedBatches?: Array<{
        id: string;
        name: string;
        code: string;
        subject: string;
        gradeLevel: string;
    }>;
    weeklyLectureCount: number;
    emergencyContact?: string;
}
export interface CreateFacultyDto {
    fullName: string;
    email: string;
    phone?: string;
    designation: string;
    staffId: string;
    compensationType: CompensationType;
    baseSalary: number;
    hourlyRate?: number;
    joiningDate?: string;
    assignedSubjects: string[];
    delegatedPermissions?: DelegatedPermission[];
    batchIds?: string[];
}
export interface UpdateFacultyDto {
    fullName?: string;
    phone?: string;
    designation?: string;
    employmentStatus?: EmploymentStatus;
    compensationType?: CompensationType;
    baseSalary?: number;
    hourlyRate?: number;
    assignedSubjects?: string[];
    delegatedPermissions?: DelegatedPermission[];
    batchIds?: string[];
}
export interface SalaryStatementItem {
    id: string;
    instituteId: string;
    facultyId: string;
    facultyName: string;
    staffId: string;
    designation: string;
    payPeriod: string;
    compensationModel: CompensationType;
    classesConducted: number;
    baseAmount: number;
    additions: number;
    deductions: number;
    advances: number;
    netPayable: number;
    status: SalaryStatus;
    paymentDate?: string;
    paymentMethod?: string;
    paymentReference?: string;
    remarks?: string;
    createdAt: string;
    updatedAt: string;
}
export interface GenerateSalaryDto {
    facultyId: string;
    payPeriod: string;
    compensationModel: CompensationType;
    classesConducted?: number;
    baseAmount: number;
    additions?: number;
    deductions?: number;
    advances?: number;
    remarks?: string;
}
export interface RecordSalaryPaymentDto {
    paymentMethod: string;
    paymentReference: string;
    paymentDate: string;
    remarks?: string;
}
export interface FacultyLeaveItem {
    id: string;
    instituteId: string;
    facultyId: string;
    facultyName: string;
    staffId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    attachmentUrl?: string;
    status: LeaveStatus;
    reviewedById?: string;
    reviewerName?: string;
    reviewerRemarks?: string;
    reviewedAt?: string;
    substituteFacultyId?: string;
    substituteFacultyName?: string;
    createdAt: string;
}
export interface ApplyFacultyLeaveDto {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    attachmentUrl?: string;
    substituteFacultyId?: string;
}
export interface ReviewFacultyLeaveDto {
    status: 'APPROVED' | 'REJECTED';
    reviewerRemarks?: string;
    substituteFacultyId?: string;
}
export interface DailyTeachingDiaryEntry {
    id: string;
    instituteId: string;
    batchId: string;
    batchName: string;
    batchCode: string;
    facultyId: string;
    facultyName: string;
    lessonDate: string;
    sessionTime?: string;
    subject: string;
    chapterTitle: string;
    conceptsTaught: string;
    learningObjectives?: string;
    teachingMethods?: string;
    durationMinutes: number;
    homeworkAssigned?: string;
    referenceLinks: string[];
    attachmentUrl?: string;
    followUpPlan?: string;
    status: TeachingDiaryStatus;
    audience: TeachingDiaryAudience;
    isCovered: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CreateTeachingDiaryDto {
    batchId: string;
    lessonDate: string;
    sessionTime?: string;
    subject: string;
    chapterTitle: string;
    conceptsTaught: string;
    learningObjectives?: string;
    teachingMethods?: string;
    durationMinutes?: number;
    homeworkAssigned?: string;
    referenceLinks?: string[];
    attachmentUrl?: string;
    followUpPlan?: string;
    status?: TeachingDiaryStatus;
    audience?: TeachingDiaryAudience;
}
export interface UpdateTeachingDiaryDto extends Partial<CreateTeachingDiaryDto> {
}
export interface TeachingDiaryOverview {
    totalEntriesThisMonth: number;
    batchesCovered: number;
    activeFacultyCount: number;
    recentEntries: DailyTeachingDiaryEntry[];
    subjectCoverageMap: Record<string, number>;
}
export interface StudyMaterialItem {
    id: string;
    instituteId: string;
    batchId: string;
    batchName: string;
    facultyId: string;
    facultyName: string;
    title: string;
    category: StudyMaterialCategory;
    subject: string;
    chapter?: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isStudentVisible: boolean;
    downloadCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface CreateStudyMaterialDto {
    batchId: string;
    title: string;
    category: StudyMaterialCategory;
    subject: string;
    chapter?: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isStudentVisible?: boolean;
}
export interface StudentFeeItem {
    id: string;
    instituteId: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    batchId?: string;
    batchName?: string;
    feeTitle: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    dueDate: string;
    status: FeeStatus;
    academicYear: string;
    lastReminderSentAt?: string;
    reminderCount: number;
    createdAt: string;
}
export interface DispatchFeeReminderDto {
    feeRecordId: string;
    channel: ReminderChannel;
    customMessage?: string;
}
export interface FeeSummaryOverview {
    totalReceivable: number;
    totalCollected: number;
    totalPending: number;
    overdueCount: number;
    remindersSentThisMonth: number;
}
