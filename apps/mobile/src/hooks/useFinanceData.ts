import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../services/api/financeService';
import type { RecordFeePaymentRequest } from '../services/api/financeService';
import type { CreateBatchFeeStructureRequest, ReviewStudentLeaveRequest } from '@padhai-pilot/shared';

const MIN = 60 * 1000;

export const financeKeys = {
  structures: (b: string) => ['finance', 'structures', b] as const,
  ledger: (b: string) => ['finance', 'ledger', b] as const,
  summary: (b: string) => ['finance', 'summary', b] as const,
  studentLedger: ['student', 'finance', 'ledger'] as const,
  studentLeaves: ['student', 'leaves'] as const,
  leaveReview: ['finance', 'leaves'] as const,
  branding: ['branding'] as const,
};

export const useFeeLedger = (batchId?: string) =>
  useQuery({
    queryKey: financeKeys.ledger(batchId ?? ''),
    queryFn: () => financeService.getLedger(batchId as string),
    enabled: !!batchId,
    staleTime: MIN,
  });
export const useFeeSummary = (batchId?: string) =>
  useQuery({
    queryKey: financeKeys.summary(batchId ?? ''),
    queryFn: () => financeService.getSummary(batchId as string),
    enabled: !!batchId,
    staleTime: MIN,
  });
export const useFeeStructures = (batchId?: string) =>
  useQuery({
    queryKey: financeKeys.structures(batchId ?? ''),
    queryFn: () => financeService.getStructures(batchId as string),
    enabled: !!batchId,
    staleTime: MIN,
  });

export const useFeeMutations = (batchId: string) => {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: financeKeys.ledger(batchId) });
    qc.invalidateQueries({ queryKey: financeKeys.summary(batchId) });
    qc.invalidateQueries({ queryKey: financeKeys.structures(batchId) });
  };
  return {
    createStructure: useMutation({
      mutationFn: (data: CreateBatchFeeStructureRequest) => financeService.createStructure(batchId, data),
      onSuccess: refresh,
    }),
    recordPayment: useMutation({
      mutationFn: (v: { feeRecordId: string; data: RecordFeePaymentRequest }) =>
        financeService.recordPayment(v.feeRecordId, v.data),
      onSuccess: refresh,
    }),
    voidPayment: useMutation({
      mutationFn: (v: { paymentId: string; reason: string }) => financeService.voidPayment(v.paymentId, v.reason),
      onSuccess: refresh,
    }),
    sendReminders: useMutation({
      mutationFn: () => financeService.sendReminders({ batchId, channels: ['IN_APP'] }),
      onSuccess: refresh,
    }),
  };
};

export const useStudentFeeLedger = () =>
  useQuery({ queryKey: financeKeys.studentLedger, queryFn: financeService.getStudentLedger, staleTime: 2 * MIN });
export const useStudentLeaves = () =>
  useQuery({ queryKey: financeKeys.studentLeaves, queryFn: financeService.getStudentLeaves, staleTime: MIN });
export const useStudentLeaveMutations = () => {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: financeKeys.studentLeaves });
  return {
    apply: useMutation({ mutationFn: financeService.applyStudentLeave, onSuccess: refresh }),
    cancel: useMutation({ mutationFn: financeService.cancelStudentLeave, onSuccess: refresh }),
  };
};
export const useLeavesForReview = () =>
  useQuery({ queryKey: financeKeys.leaveReview, queryFn: () => financeService.getLeavesForReview(), staleTime: MIN });
export const useReviewLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; data: ReviewStudentLeaveRequest }) => financeService.reviewLeave(v.id, v.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.leaveReview }),
  });
};
export const useBranding = () =>
  useQuery({ queryKey: financeKeys.branding, queryFn: financeService.getBranding, staleTime: 30 * MIN });
