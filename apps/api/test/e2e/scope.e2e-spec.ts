import { beforeAll, describe, expect, it } from 'vitest';
import { batchesOf, call, rosterOf, tokens } from './helpers';

type T = Awaited<ReturnType<typeof tokens>>;
let t: T;
let ids: Record<string, string>;
let batchA1: any;
let batchA2: any;

beforeAll(async () => {
  t = await tokens();
  const a = await batchesOf(t.ownerA);
  batchA1 = a.find((b) => b.code === 'DEV-B1');
  batchA2 = a.find((b) => b.code === 'DEV-B2');
  ids = {
    s1: (await call('GET', '/auth/me', { token: t.student1 })).body.user.id,
    s2: (await call('GET', '/auth/me', { token: t.student2 })).body.user.id,
  };
});

describe('students only see their own data', () => {
  it('fees: student1 sees exactly their own receipts', async () => {
    const mine = await call('GET', '/student/fees', { token: t.student1 });
    const other = await call('GET', '/student/fees', { token: t.student2 });
    expect(mine.status).toBe(200);
    // student1 is the first in batch 1 => fully PAID in the seed; student2 is first in batch 2 => also PAID but a different record.
    const mineIds = (mine.body.receipts ?? []).map((r: any) => r.id);
    const otherIds = (other.body.receipts ?? []).map((r: any) => r.id);
    expect(mineIds.length).toBeGreaterThan(0);
    expect(mineIds.some((id: string) => otherIds.includes(id))).toBe(false);
    // the owner-side list shows the same record for the same student (no cross-student mixing)
    const ownerList = await call('GET', '/tuition/fees', { token: t.ownerA });
    const mineOwner = ownerList.body.filter((f: any) => f.studentId === ids.s1);
    expect(mineOwner.map((f: any) => f.id).sort()).toEqual([...mineIds].sort());
  });

  it('results: only published marks of the student themself', async () => {
    const r = await call('GET', '/student/results', { token: t.student1 });
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);
    for (const row of r.body) expect(row.title).toMatch(/Mathematics/);
  });

  it('attendance: records belong to the student (3 seeded days)', async () => {
    const r = await call('GET', '/student/attendance', { token: t.student1 });
    expect(r.status).toBe(200);
    expect(r.body.totalClasses).toBeGreaterThanOrEqual(3); // idempotency spec may add sessions
    expect(r.body.records.every((x: any) => /Mathematics/.test(x.subjectName))).toBe(true);
  });

  it('batch-2 student does not see batch-1 batch announcements / assignments', async () => {
    const ann = await call('GET', '/student/announcements', { token: t.student2 });
    expect(ann.status).toBe(200);
    expect(JSON.stringify(ann.body)).not.toContain('Welcome to Mathematics Batch 1');
    const asg = await call('GET', '/student/assignments', { token: t.student2 });
    expect(JSON.stringify(asg.body)).not.toContain('Mathematics Worksheet 1');
  });

  it('a student cannot read the staff-side roster or fee list', async () => {
    expect((await call('GET', `/teacher/batches/${batchA1.id}/students`, { token: t.student1 })).status).toBe(403);
    expect((await call('GET', '/tuition/fees', { token: t.student1 })).status).toBe(403);
  });
});

describe('faculty only reach assigned batches', () => {
  it('faculty1 lists only batch 1; faculty2 only batch 2; owner lists both', async () => {
    const f1 = await batchesOf(t.faculty1);
    const f2 = await batchesOf(t.faculty2);
    expect(f1.map((b) => b.id)).toEqual([batchA1.id]);
    expect(f2.map((b) => b.id)).toEqual([batchA2.id]);
    expect((await batchesOf(t.ownerA)).length).toBeGreaterThanOrEqual(2);
  });

  it("faculty1 cannot read faculty2's roster or attendance (the 'Batch unauthorized' guard)", async () => {
    const roster = await call('GET', `/teacher/batches/${batchA2.id}/students`, { token: t.faculty1 });
    expect(roster.status).toBe(403);
    const att = await call('GET', `/teacher/attendance/${batchA2.id}/2026-10-20`, { token: t.faculty1 });
    expect(att.status).toBe(403);
    const write = await call('POST', '/teacher/attendance', {
      token: t.faculty1,
      body: { batchId: batchA2.id, date: '2026-10-20', records: [{ studentId: ids.s2, status: 'ABSENT' }] },
    });
    expect(write.status).toBe(403);
  });

  // KNOWN BUG (api-core): roster 500s (TeacherService selects User.rollNumber, absent from the schema). it.fails -> it() once fixed.
  it.fails('faculty1 CAN read the roster of their own batch', async () => {
    const roster = await call('GET', `/teacher/batches/${batchA1.id}/students`, { token: t.faculty1 });
    expect(roster.status).toBe(200);
    expect(rosterOf(roster).length).toBe(5);
  });

  // KNOWN BUG (api-core): attendance GET 500s (TeacherService selects User.rollNumber). it.fails -> it() once fixed.
  it.fails('faculty1 CAN read attendance of their own batch (production 403 regression)', async () => {
    const att = await call('GET', `/teacher/attendance/${batchA1.id}/2026-10-20`, { token: t.faculty1 });
    expect(att.status).toBe(200);
  });

  it('faculty1 CAN list invitations (production 403 regression)', async () => {
    const inv = await call('GET', '/teacher/invitations', { token: t.faculty1 });
    expect(inv.status).toBe(200);
  });

  it('faculty1 cannot create an invitation code or assignment for faculty2 batch', async () => {
    const inv = await call('POST', '/teacher/invitations', { token: t.faculty1, body: { batchId: batchA2.id } });
    expect(inv.status).toBe(403);
    const asg = await call('POST', '/teacher/assignments', {
      token: t.faculty1,
      body: { batchId: batchA2.id, title: 'x', instructions: 'x', subject: 'Science', dueDate: '2027-01-01T00:00:00.000Z' },
    });
    expect(asg.status).toBe(403);
  });
});
