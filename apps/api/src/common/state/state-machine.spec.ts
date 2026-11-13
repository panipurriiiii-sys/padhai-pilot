import { describe, it, expect } from 'vitest';
import {
  validateStateTransition,
  INSTITUTE_TRANSITIONS,
  LEAVE_TRANSITIONS,
  INVITATION_TRANSITIONS,
  SUBMISSION_TRANSITIONS,
  FEE_PAYMENT_TRANSITIONS,
} from './state-machine.js';
import { BadRequestException } from '@nestjs/common';

describe('State Machine Transition Validator', () => {
  it('allows valid transitions according to allowedMap', () => {
    expect(() => validateStateTransition('Institute', 'TRIAL', 'ACTIVE', INSTITUTE_TRANSITIONS)).not.toThrow();
    expect(() => validateStateTransition('Institute', 'ACTIVE', 'SUSPENDED', INSTITUTE_TRANSITIONS)).not.toThrow();
    expect(() => validateStateTransition('Institute', 'SUSPENDED', 'ACTIVE', INSTITUTE_TRANSITIONS)).not.toThrow();
  });

  it('allows same-state no-op transitions', () => {
    expect(() => validateStateTransition('Institute', 'ACTIVE', 'ACTIVE', INSTITUTE_TRANSITIONS)).not.toThrow();
    expect(() => validateStateTransition('Leave', 'PENDING', 'PENDING', LEAVE_TRANSITIONS)).not.toThrow();
  });

  it('throws BadRequestException for invalid transitions', () => {
    // Cannot jump from SUSPENDED directly to TRIAL
    expect(() => validateStateTransition('Institute', 'SUSPENDED', 'TRIAL', INSTITUTE_TRANSITIONS)).toThrow(BadRequestException);

    // Cannot transition from terminal ARCHIVED state
    expect(() => validateStateTransition('Institute', 'ARCHIVED', 'ACTIVE', INSTITUTE_TRANSITIONS)).toThrow(BadRequestException);

    // Cannot cancel an already REJECTED leave
    expect(() => validateStateTransition('Leave', 'REJECTED', 'CANCELLED', LEAVE_TRANSITIONS)).toThrow(BadRequestException);

    // Cannot accept an already REVOKED invitation
    expect(() => validateStateTransition('Invitation', 'REVOKED', 'ACCEPTED', INVITATION_TRANSITIONS)).toThrow(BadRequestException);

    // Cannot issue an already VOIDED payment
    expect(() => validateStateTransition('Payment', 'VOIDED', 'ISSUED', FEE_PAYMENT_TRANSITIONS)).toThrow(BadRequestException);
  });

  it('provides descriptive error messages with allowed targets', () => {
    try {
      validateStateTransition('Leave', 'REJECTED', 'APPROVED', LEAVE_TRANSITIONS);
    } catch (err: any) {
      expect(err.message).toContain('Invalid Leave status transition');
      expect(err.message).toContain('none (terminal state)');
    }
  });
});

