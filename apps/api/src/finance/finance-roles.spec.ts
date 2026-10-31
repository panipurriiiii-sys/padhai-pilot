import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { FinanceController, StudentFinanceController } from './finance.controller.js';
import { BrandingController } from './branding.service.js';
import { DocumentsController } from '../documents/documents.controller.js';

const guard = new RolesGuard(new Reflector());
function allows(c: { prototype: object }, method: string, role: string): boolean {
  const handler = (c.prototype as Record<string, unknown>)[method] as () => unknown;
  expect(typeof handler, method).toBe('function');
  const ctx = {
    getHandler: () => handler,
    getClass: () => c,
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u', role } }) }),
  } as unknown as ExecutionContext;
  try {
    return guard.canActivate(ctx);
  } catch {
    return false;
  }
}
const methodsOf = (c: { prototype: object }) => Object.getOwnPropertyNames(c.prototype).filter((m) => m !== 'constructor');

describe('finance/branding/documents role boundaries', () => {
  it('staff finance routes reject students and platform admins', () => {
    for (const m of methodsOf(FinanceController)) {
      expect(allows(FinanceController, m, 'STUDENT'), m).toBe(false);
      expect(allows(FinanceController, m, 'SUPER_ADMIN'), m).toBe(false);
      expect(allows(FinanceController, m, 'TEACHER'), m).toBe(true);
    }
  });
  it('student finance/leave routes reject staff', () => {
    for (const m of methodsOf(StudentFinanceController)) {
      expect(allows(StudentFinanceController, m, 'STUDENT'), m).toBe(true);
      for (const r of ['TEACHER', 'FACULTY', 'TUITION_OWNER']) expect(allows(StudentFinanceController, m, r), `${r} ${m}`).toBe(false);
    }
  });
  it('branding: everyone reads, only management writes', () => {
    expect(allows(BrandingController, 'get', 'STUDENT')).toBe(true);
    expect(allows(BrandingController, 'get', 'FACULTY')).toBe(true);
    for (const r of ['STUDENT', 'FACULTY', 'TEACHER']) expect(allows(BrandingController, 'update', r), r).toBe(false);
    for (const r of ['TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER']) expect(allows(BrandingController, 'update', r), r).toBe(true);
  });
  it('documents: salary slips and result sheets are staff-only', () => {
    for (const m of ['salarySlip', 'resultSheet']) expect(allows(DocumentsController, m, 'STUDENT'), m).toBe(false);
    for (const m of ['feeReceipt', 'reportCard', 'attendance']) expect(allows(DocumentsController, m, 'STUDENT'), m).toBe(true);
    for (const m of methodsOf(DocumentsController)) expect(allows(DocumentsController, m, 'SUPER_ADMIN'), m).toBe(false);
  });
});
