import type { UserRole } from '@padhai-pilot/shared';

/** Everyone who works inside an institute's Teacher Portal. */
export const STAFF_ROLES: UserRole[] = ['TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER', 'FACULTY', 'TEACHER'];

/** Owner-level operators: faculty roster, payroll, leave approval, fees, branding. */
export const MANAGEMENT_ROLES: UserRole[] = ['TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER'];

export const STUDENT_ROLES: UserRole[] = ['STUDENT'];

export const isManagement = (role: string): boolean => (MANAGEMENT_ROLES as string[]).includes(role);
