import { apiClient } from './client';
import type {
  ApplyStudentLeaveRequest,
  BatchFeeStructureItem,
  BatchFeeSummary,
  CreateBatchFeeStructureRequest,
  FeeLedgerItem,
  FeePaymentItem,
  InstituteLetterhead,
  RecordFeePaymentRequest,
  ReviewStudentLeaveRequest,
  SendFeeRemindersRequest,
  SendFeeRemindersResult,
  StudentFeeLedger,
  StudentLeaveItem,
} from '@padhai-pilot/shared';

export type {
  ApplyStudentLeaveRequest,
  BatchFeeStructureItem,
  BatchFeeSummary,
  FeeLedgerItem,
  FeePaymentItem,
  InstituteLetterhead,
  RecordFeePaymentRequest,
  StudentFeeLedger,
  StudentLeaveItem,
};

const list = <T>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

/** Routes per docs/LOCAL_API_ROUTES.md (api-finance-docs). Tenant/user always come from the JWT. */
export const financeService = {
  // Teacher: batch fees
  getStructures: async (batchId: string) =>
    list(await apiClient.get<BatchFeeStructureItem[]>(`/finance/batches/${batchId}/structures`)),
  createStructure: (batchId: string, data: CreateBatchFeeStructureRequest) =>
    apiClient.post<BatchFeeStructureItem>(`/finance/batches/${batchId}/structures`, data),
  getLedger: async (batchId: string, studentId?: string) =>
    list(await apiClient.get<FeeLedgerItem[]>(`/finance/batches/${batchId}/fees${studentId ? `?studentId=${studentId}` : ''}`)),
  getSummary: (batchId: string) => apiClient.get<BatchFeeSummary>(`/finance/batches/${batchId}/summary`),
  recordPayment: (feeRecordId: string, data: RecordFeePaymentRequest) =>
    apiClient.post<FeePaymentItem>(`/finance/fees/${feeRecordId}/payments`, data),
  voidPayment: (paymentId: string, reason: string) =>
    apiClient.post<FeePaymentItem>(`/finance/payments/${paymentId}/void`, { reason }),
  sendReminders: (data: SendFeeRemindersRequest) =>
    apiClient.post<SendFeeRemindersResult>('/finance/reminders/send', data),

  // Student: fees and receipts
  getStudentLedger: () => apiClient.get<StudentFeeLedger>('/student/finance/fees'),

  // Student leave
  applyStudentLeave: (data: ApplyStudentLeaveRequest) => apiClient.post<StudentLeaveItem>('/student/leaves', data),
  getStudentLeaves: async () => list(await apiClient.get<StudentLeaveItem[]>('/student/leaves')),
  cancelStudentLeave: (id: string) => apiClient.post<StudentLeaveItem>(`/student/leaves/${id}/cancel`, {}),
  getLeavesForReview: async (status?: string) =>
    list(await apiClient.get<StudentLeaveItem[]>(`/finance/leaves${status ? `?status=${status}` : ''}`)),
  reviewLeave: (id: string, data: ReviewStudentLeaveRequest) =>
    apiClient.put<StudentLeaveItem>(`/finance/leaves/${id}/review`, data),

  // Branding (read-only on mobile)
  getBranding: () => apiClient.get<InstituteLetterhead>('/branding'),
};

export const documentPaths = {
  feeReceipt: (paymentId: string) => `/documents/fee-receipt/${paymentId}`,
  reportCard: (studentId: string, batchId?: string) => `/documents/report-card/${studentId}${batchId ? `?batchId=${batchId}` : ''}`,
  salarySlip: (id: string) => `/documents/salary-slip/${id}`,
  attendanceReport: (q: { batchId?: string; studentId?: string; from?: string; to?: string }) => {
    const qs = Object.entries(q)
      .filter(([, v]) => !!v)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return `/documents/attendance-report${qs ? `?${qs}` : ''}`;
  },
  resultSheet: (assessmentId: string) => `/documents/result-sheet/${assessmentId}`,
};
