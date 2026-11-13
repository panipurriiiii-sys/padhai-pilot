import { BadRequestException } from '@nestjs/common';

/**
 * Universal state machine transition validator for PadhaiPilot.
 * Guarantees that business entities progress through explicitly permitted lifecycles.
 */
export function validateStateTransition<T extends string>(
  entityName: string,
  fromState: T,
  toState: T,
  allowedMap: Record<T, readonly T[]>,
): void {
  // Idempotent: transitioning to the same state is a safe no-op
  if (fromState === toState) {
    return;
  }

  const validTargets = allowedMap[fromState];
  if (!validTargets || !validTargets.includes(toState)) {
    const allowedMsg = validTargets && validTargets.length > 0 ? validTargets.join(', ') : 'none (terminal state)';
    throw new BadRequestException(
      `Invalid ${entityName} status transition: cannot transition from '${fromState}' to '${toState}'. Allowed transitions from '${fromState}': [${allowedMsg}].`,
    );
  }
}

/** Institute Tenant Lifecycle Transitions */
export type InstituteStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export const INSTITUTE_TRANSITIONS: Record<InstituteStatus, readonly InstituteStatus[]> = {
  TRIAL: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'],
  ACTIVE: ['SUSPENDED', 'ARCHIVED', 'TRIAL'],
  SUSPENDED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [], // Terminal
};

/** Leave Application Lifecycle Transitions */
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export const LEAVE_TRANSITIONS: Record<LeaveStatus, readonly LeaveStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['CANCELLED'], // Can withdraw/cancel approved leave before start
  REJECTED: [], // Terminal
  CANCELLED: [], // Terminal
};

/** Faculty / Student Invitation Token Lifecycle Transitions */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
export const INVITATION_TRANSITIONS: Record<InvitationStatus, readonly InvitationStatus[]> = {
  PENDING: ['ACCEPTED', 'REVOKED', 'EXPIRED'],
  ACCEPTED: [], // Terminal
  REVOKED: [], // Terminal
  EXPIRED: [], // Terminal
};

/** Assignment Submission Evaluation Lifecycle Transitions */
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RESUBMIT';
export const SUBMISSION_TRANSITIONS: Record<SubmissionStatus, readonly SubmissionStatus[]> = {
  PENDING: ['SUBMITTED', 'LATE'],
  SUBMITTED: ['GRADED', 'RESUBMIT'],
  LATE: ['GRADED', 'RESUBMIT'],
  GRADED: ['RESUBMIT'], // Teacher can reopen graded work for student corrections
  RESUBMIT: ['SUBMITTED', 'LATE'],
};

/** Fee Payment Lifecycle Transitions */
export type FeePaymentStatus = 'ISSUED' | 'VOIDED';
export const FEE_PAYMENT_TRANSITIONS: Record<FeePaymentStatus, readonly FeePaymentStatus[]> = {
  ISSUED: ['VOIDED'],
  VOIDED: [], // Terminal
};

