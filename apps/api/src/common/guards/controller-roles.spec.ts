import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard.js';
import { StudentController } from '../../student/student.controller.js';
import { TeacherController } from '../../teacher/teacher.controller.js';
import { TuitionController } from '../../tuition/tuition.controller.js';
import { AssessmentController } from '../../assessment/assessment.controller.js';
import { AdminController } from '../../admin/admin.controller.js';

const guard = new RolesGuard(new Reflector());

function allows(controller: { prototype: object }, method: string, role: string): boolean {
  const handler = (controller.prototype as Record<string, unknown>)[method] as () => unknown;
  expect(typeof handler, `${controller.constructor.name}.${method} should exist`).toBe('function');
  const ctx = {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1', role } }) }),
  } as unknown as ExecutionContext;
  try {
    return guard.canActivate(ctx);
  } catch {
    return false;
  }
}

const methodsOf = (c: { prototype: object }) =>
  Object.getOwnPropertyNames(c.prototype).filter((m) => m !== 'constructor');

describe('controller role boundaries', () => {
  it('Teacher Portal controllers reject students on every route', () => {
    for (const c of [TeacherController, TuitionController]) {
      for (const m of methodsOf(c)) expect(allows(c, m, 'STUDENT'), `${c.name}.${m}`).toBe(false);
    }
  });

  it('student routes reject staff and admin roles', () => {
    for (const m of methodsOf(StudentController)) {
      for (const role of ['TEACHER', 'FACULTY', 'TUITION_OWNER', 'SUPER_ADMIN']) {
        expect(allows(StudentController, m, role), `${role} -> StudentController.${m}`).toBe(false);
      }
      expect(allows(StudentController, m, 'STUDENT'), `STUDENT -> ${m}`).toBe(true);
    }
  });

  it('assessment: teacher routes are staff-only, /student routes are student-only', () => {
    const studentRoutes = ['getStudentPublishedResults', 'getStudentNotifications', 'getStudentStudyMaterials', 'markNotificationRead'];
    for (const m of methodsOf(AssessmentController)) {
      const isStudentRoute = studentRoutes.includes(m) || /^(getStudent|markNotification)/.test(m);
      expect(allows(AssessmentController, m, 'STUDENT'), `STUDENT -> ${m}`).toBe(isStudentRoute);
      expect(allows(AssessmentController, m, 'FACULTY'), `FACULTY -> ${m}`).toBe(!isStudentRoute);
    }
  });

  it('owner-only tuition operations reject plain faculty', () => {
    for (const m of ['updateProfile', 'generateSalary', 'recordPayment', 'reviewLeave']) {
      expect(allows(TuitionController, m, 'FACULTY'), `FACULTY -> ${m}`).toBe(false);
      expect(allows(TuitionController, m, 'TEACHER'), `TEACHER -> ${m}`).toBe(false);
      expect(allows(TuitionController, m, 'TUITION_OWNER'), `OWNER -> ${m}`).toBe(true);
    }
    // faculty keep the self-service routes
    for (const m of ['applyLeave', 'getLeaves', 'getSalaries']) {
      expect(allows(TuitionController, m, 'FACULTY'), `FACULTY -> ${m}`).toBe(true);
    }
  });

  it('platform admin routes are SUPER_ADMIN only', () => {
    for (const m of methodsOf(AdminController)) {
      for (const role of ['TUITION_OWNER', 'FACULTY', 'TEACHER', 'STUDENT']) {
        expect(allows(AdminController, m, role), `${role} -> AdminController.${m}`).toBe(false);
      }
    }
  });
});
