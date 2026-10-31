export type FeeRecordStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'OTHER';
export interface FeeInstalmentInput {
    label?: string;
    amount: number;
    /** ISO date (YYYY-MM-DD) */
    dueDate: string;
}
/** POST /finance/batches/:batchId/structures */
export interface CreateBatchFeeStructureRequest {
    title: string;
    /** Total amount per student when `instalments` is omitted (single instalment). */
    amount?: number;
    dueDate?: string;
    instalments?: FeeInstalmentInput[];
    academicYear?: string;
}
export interface BatchFeeStructureItem {
    id: string;
    batchId: string;
    title: string;
    academicYear?: string;
    status: 'ACTIVE' | 'VOID';
    schedule: Array<{
        label: string;
        amount: number;
        dueDate: string;
    }>;
    totalPerStudent: number;
    studentsCharged: number;
    createdAt: string;
}
export interface FeePaymentItem {
    id: string;
    feeRecordId: string;
    studentId: string;
    amount: number;
    paidOn: string;
    mode: PaymentMode;
    reference?: string;
    note?: string;
    receiptNumber: string;
    status: 'ISSUED' | 'VOIDED';
    voidReason?: string;
    voidedAt?: string;
    recordedByName?: string;
    createdAt: string;
}
export interface FeeLedgerItem {
    id: string;
    studentId: string;
    studentName?: string;
    rollNumber?: string;
    batchId?: string;
    batchName?: string;
    structureId?: string;
    feeTitle: string;
    instalmentNo: number;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    dueDate: string;
    status: FeeRecordStatus;
    academicYear?: string;
    payments: FeePaymentItem[];
}
/** POST /finance/fees/:feeRecordId/payments */
export interface RecordFeePaymentRequest {
    amount: number;
    paidOn: string;
    mode: PaymentMode;
    reference?: string;
    note?: string;
}
/** POST /finance/payments/:paymentId/void */
export interface VoidFeePaymentRequest {
    reason: string;
}
export interface BatchFeeSummary {
    batchId: string;
    totalReceivable: number;
    totalCollected: number;
    totalPending: number;
    overdueAmount: number;
    studentCount: number;
    paidCount: number;
    partialCount: number;
    pendingCount: number;
    overdueCount: number;
}
/** POST /finance/reminders/send  (on demand; deduped per fee record + channel + day) */
export interface SendFeeRemindersRequest {
    batchId?: string;
    feeRecordIds?: string[];
    /** Reminds records due within `daysBefore` days or already overdue. Default 3. */
    daysBefore?: number;
    channels?: Array<'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP'>;
    customMessage?: string;
}
export interface SendFeeRemindersResult {
    considered: number;
    /** In-app notification rows created (real delivery to the student's inbox). */
    inAppCreated: number;
    /** External channels have no provider: recorded as NOT_SENT, never reported as delivered. */
    externalNotSent: number;
    skippedDuplicates: number;
}
/** GET /student/finance/fees */
export interface StudentFeeLedger {
    totalFees: number;
    paidAmount: number;
    balanceDue: number;
    overdueAmount: number;
    status: 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING';
    fees: FeeLedgerItem[];
    receipts: FeePaymentItem[];
}
export interface FeeReceiptData {
    receiptNumber: string;
    paymentId: string;
    paidOn: string;
    amount: number;
    mode: PaymentMode;
    reference?: string;
    studentName: string;
    rollNumber?: string;
    batchName?: string;
    feeTitle: string;
    feeTotal: number;
    paidToDate: number;
    balanceAfter: number;
    status: 'ISSUED' | 'VOIDED';
}
export type StudentLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
/** POST /student/leaves */
export interface ApplyStudentLeaveRequest {
    startDate: string;
    endDate: string;
    reason: string;
    batchId?: string;
}
/** PUT /finance/leaves/:id/review  (staff) */
export interface ReviewStudentLeaveRequest {
    status: 'APPROVED' | 'REJECTED';
    remarks?: string;
}
export interface StudentLeaveItem {
    id: string;
    studentId: string;
    studentName?: string;
    rollNumber?: string;
    batchId?: string;
    batchName?: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: StudentLeaveStatus;
    reviewerName?: string;
    reviewerRemarks?: string;
    reviewedAt?: string;
    createdAt: string;
}
/** GET /branding (any signed-in user of the institute, read-only) ; PUT /branding (owner/admin/manager). */
export interface InstituteLetterhead {
    name: string;
    logoUrl?: string;
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    website?: string;
    footerText?: string;
    signatoryName?: string;
    signatoryTitle?: string;
    primaryColor?: string;
}
export type UpdateInstituteLetterheadRequest = Partial<InstituteLetterhead>;
/** Hosts a stored file URL may point to (media upload flow). */
export declare const ALLOWED_MEDIA_HOSTS: readonly ["media.dhyey.cc", "media-hosting.dhyeyp254.workers.dev"];
export type DocumentKind = 'fee-receipt' | 'report-card' | 'salary-slip' | 'attendance-report' | 'result-sheet';
