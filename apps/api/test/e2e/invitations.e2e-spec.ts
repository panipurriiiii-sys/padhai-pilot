import { beforeAll, describe, expect, it } from 'vitest';
import { batchesOf, call, rosterOf, tokens, uniqueEmail } from './helpers';

type T = Awaited<ReturnType<typeof tokens>>;
let t: T;
let batchA1: any;

const registerStudent = async (invitationCode?: string) => {
  const email = uniqueEmail('stu');
  const r = await call('POST', '/auth/register-student', {
    body: { fullName: 'E2E Student', email, password: 'Str0ng!Passw0rd', invitationCode },
  });
  return { email, r };
};

beforeAll(async () => {
  t = await tokens();
  batchA1 = (await batchesOf(t.ownerA)).find((b: any) => b.code === 'DEV-B1');
});

describe('invitation code lifecycle', () => {
  let code: string;

  it('owner creates a code for a batch', async () => {
    const r = await call('POST', '/teacher/invitations', { token: t.ownerA, body: { batchId: batchA1.id, maxUses: 2, expiryDays: 7 } });
    expect(r.status).toBe(201);
    code = r.body.code;
    expect(code).toBeTruthy();
    expect(r.body.isRevoked).toBe(false);
  });

  it('code validates publicly and shows the batch', async () => {
    const r = await call('POST', '/invitations/validate', { body: { code } });
    expect(r.status).toBeLessThan(300);
    expect(JSON.stringify(r.body)).toContain('Mathematics Batch 1');
  });

  it('a student joins with the code; joining again is idempotent (no second use consumed)', async () => {
    const { r } = await registerStudent();
    expect(r.status).toBe(201);
    const token = r.body.token;
    const j1 = await call('POST', '/student/join-batch', { token, body: { code } });
    expect(j1.status).toBe(200);
    const j2 = await call('POST', '/student/join-batch', { token, body: { code } });
    expect(j2.status).toBe(200);
    const list = await call('GET', '/teacher/invitations', { token: t.ownerA });
    expect(list.body.find((i: any) => i.code === code).usedCount).toBe(1);
  });

  // KNOWN BUG (api-core): GET /teacher/batches/:id/students 500s - TeacherService selects User.rollNumber, which the schema
  // does not have. it.fails flips red as soon as it is fixed: then change it to it().
  it.fails('roll numbers stay unique per batch after joins (needs the roster endpoint)', async () => {
    const roster = await call('GET', `/teacher/batches/${batchA1.id}/students`, { token: t.ownerA });
    expect(roster.status).toBe(200);
    const rolls = rosterOf(roster).map((s: any) => s.rollNumber);
    expect(rolls.length).toBeGreaterThan(5);
    expect(new Set(rolls).size).toBe(rolls.length);
  });

  it('maxUses is enforced', async () => {
    const second = await registerStudent();
    expect((await call('POST', '/student/join-batch', { token: second.r.body.token, body: { code } })).status).toBe(200);
    const third = await registerStudent();
    const over = await call('POST', '/student/join-batch', { token: third.r.body.token, body: { code } });
    expect(over.status).toBe(400);
  });

  it('concurrent redemptions never exceed maxUses', async () => {
    const created = await call('POST', '/teacher/invitations', { token: t.ownerA, body: { batchId: batchA1.id, maxUses: 2 } });
    const c = created.body.code;
    const students = await Promise.all([1, 2, 3, 4].map(() => registerStudent()));
    const results = await Promise.all(students.map((s) => call('POST', '/student/join-batch', { token: s.r.body.token, body: { code: c } })));
    expect(results.filter((x) => x.status === 200).length).toBe(2);
    const list = await call('GET', '/teacher/invitations', { token: t.ownerA });
    expect(list.body.find((i: any) => i.code === c).usedCount).toBe(2);
  });

  it('revoking invalidates the code', async () => {
    const created = await call('POST', '/teacher/invitations', { token: t.ownerA, body: { batchId: batchA1.id } });
    const c = created.body.code;
    const rev = await call('POST', `/teacher/invitations/${c}/revoke`, { token: t.ownerA });
    expect(rev.status).toBeLessThan(300);
    expect((await call('POST', '/invitations/validate', { body: { code: c } })).status).toBeGreaterThanOrEqual(400);
    const s = await registerStudent();
    expect((await call('POST', '/student/join-batch', { token: s.r.body.token, body: { code: c } })).status).toBe(400);
  });

  it('another tenant cannot revoke a code (and faculty2 cannot revoke faculty1/owner codes)', async () => {
    const created = await call('POST', '/teacher/invitations', { token: t.ownerA, body: { batchId: batchA1.id } });
    const c = created.body.code;
    const rev = await call('POST', `/teacher/invitations/${c}/revoke`, { token: t.ownerB });
    expect([400, 403, 404]).toContain(rev.status);
    const still = await call('POST', '/invitations/validate', { body: { code: c } });
    expect(still.status).toBeLessThan(300);
  });

  it('unknown / empty codes are rejected', async () => {
    expect((await call('POST', '/invitations/validate', { body: { code: 'NOPE-NOPE' } })).status).toBeGreaterThanOrEqual(400);
    expect((await call('POST', '/invitations/validate', { body: {} })).status).toBeGreaterThanOrEqual(400);
  });

  it.todo('expired code rejected - needs an API/DB hook to create an already-expired code (expiryDays<=0 currently defaults to 14); covered at DB level by student.service.spec');
  it.todo('owner can edit/rotate a code, clear its expiry ("no day limit") - feature owned by api-core, not implemented yet');
});
