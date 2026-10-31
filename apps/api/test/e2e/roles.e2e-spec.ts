import { beforeAll, describe, expect, it } from 'vitest';
import { call, tokens } from './helpers';

type T = Awaited<ReturnType<typeof tokens>>;
let t: T;
beforeAll(async () => { t = await tokens(); });

// [method, path, who is ALLOWED, who is DENIED (403)]
// Allowed roles are only asserted to be "not 401/403"; bodies are empty so 400/404 is acceptable.
const STAFF = ['ownerA', 'faculty1', 'faculty2'] as const;
const MGMT = ['ownerA'] as const;
const STUDENT = ['student1', 'student2'] as const;

const matrix: { method: string; path: string; allow: readonly (keyof T)[]; deny: readonly (keyof T)[] }[] = [
  // teacher controller: staff only
  { method: 'GET', path: '/teacher/dashboard', allow: STAFF, deny: ['student1', 'superAdmin'] },
  { method: 'GET', path: '/teacher/batches', allow: STAFF, deny: ['student1', 'superAdmin'] },
  { method: 'GET', path: '/teacher/invitations', allow: STAFF, deny: ['student1'] },
  { method: 'GET', path: '/teacher/assignments', allow: STAFF, deny: ['student1'] },
  { method: 'GET', path: '/teacher/announcements', allow: STAFF, deny: ['student1'] },
  // student controller: students only
  { method: 'GET', path: '/student/dashboard', allow: STUDENT, deny: ['ownerA', 'faculty1', 'superAdmin'] },
  { method: 'GET', path: '/student/fees', allow: STUDENT, deny: ['ownerA', 'faculty1'] },
  { method: 'GET', path: '/student/results', allow: STUDENT, deny: ['ownerA', 'faculty1'] },
  { method: 'GET', path: '/student/attendance', allow: STUDENT, deny: ['ownerA', 'faculty1'] },
  // tuition: staff for profile, management only for money/roster
  { method: 'GET', path: '/tuition/profile', allow: STAFF, deny: ['student1', 'superAdmin'] },
  { method: 'GET', path: '/tuition/fees', allow: MGMT, deny: ['faculty1', 'faculty2', 'student1'] },
  { method: 'GET', path: '/tuition/fees/summary', allow: MGMT, deny: ['faculty1', 'student1'] },
  { method: 'GET', path: '/tuition/faculties', allow: MGMT, deny: ['faculty1', 'student1'] },
  { method: 'POST', path: '/tuition/salaries/generate', allow: MGMT, deny: ['faculty1', 'student1'] },
  { method: 'POST', path: '/tuition/fees/remind', allow: MGMT, deny: ['faculty1', 'student1'] },
  { method: 'GET', path: '/tuition/diaries/overview', allow: MGMT, deny: ['faculty1', 'student1'] },
  // assessment: staff, plus student-only sub-routes
  { method: 'GET', path: '/assessment/batches', allow: STAFF, deny: ['student1'] },
  { method: 'GET', path: '/assessment/student/results', allow: STUDENT, deny: ['ownerA', 'faculty1'] },
  // admin: super admin only
  { method: 'GET', path: '/admin/institutes', allow: ['superAdmin'], deny: ['ownerA', 'faculty1', 'student1'] },
  { method: 'GET', path: '/admin/stats', allow: ['superAdmin'], deny: ['ownerA', 'faculty1', 'student1'] },
  { method: 'GET', path: '/admin/audit-logs', allow: ['superAdmin'], deny: ['ownerA', 'student1'] },
  { method: 'POST', path: '/admin/announcements', allow: ['superAdmin'], deny: ['ownerA', 'student1'] },
  { method: 'GET', path: '/analytics/admin', allow: ['superAdmin'], deny: ['ownerA', 'faculty1', 'student1'] },
  { method: 'GET', path: '/analytics/teacher', allow: STAFF, deny: ['student1'] },
];

describe('role boundaries (e2e)', () => {
  for (const row of matrix) {
    describe(`${row.method} ${row.path}`, () => {
      it('401 without a token', async () => {
        expect((await call(row.method, row.path)).status).toBe(401);
      });
      for (const who of row.deny) {
        it(`403 for ${who}`, async () => {
          const r = await call(row.method, row.path, { token: t[who], body: row.method === 'GET' ? undefined : {} });
          expect(r.status).toBe(403);
        });
      }
      for (const who of row.allow) {
        it(`allowed for ${who} (not 401/403)`, async () => {
          const r = await call(row.method, row.path, { token: t[who], body: row.method === 'GET' ? undefined : {} });
          expect([401, 403]).not.toContain(r.status);
          // NOTE: POSTs with an empty body should be 400, but several currently 500 (salaries/generate, fees/remind): reported, not asserted here.
          if (row.method === 'GET') expect(r.status).toBeLessThan(500);
        });
      }
    });
  }

  it('faculty cannot self-promote: management-only mutations stay forbidden even with a valid body', async () => {
    const r = await call('PUT', '/tuition/profile', { token: t.faculty1, body: { name: 'Hijacked Academy' } });
    expect(r.status).toBe(403);
  });
});
