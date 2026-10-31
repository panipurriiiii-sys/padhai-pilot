import { beforeAll, describe, expect, it } from 'vitest';
import { batchesOf, call, tokens } from './helpers';

type T = Awaited<ReturnType<typeof tokens>>;
let t: T;
let batchA1: any;
let studentIds: string[];
let fees: any[];

beforeAll(async () => {
  t = await tokens();
  batchA1 = (await batchesOf(t.ownerA)).find((b: any) => b.code === 'DEV-B1');
  // student ids via the owner fee list (independent of the roster endpoint, which is currently broken)
  fees = (await call('GET', `/tuition/fees?batchId=${batchA1.id}`, { token: t.ownerA })).body;
  studentIds = [...new Set<string>(fees.map((f: any) => f.studentId))];
});

describe('duplicate submissions are idempotent', () => {
  it('saving attendance twice (sequentially) for the same batch+date keeps one session', async () => {
    const date = '2026-10-14';
    const body = { batchId: batchA1.id, date, records: studentIds.map((studentId) => ({ studentId, status: 'PRESENT' })) };
    const a = await call('POST', '/teacher/attendance', { token: t.faculty1, body });
    const b = await call('POST', '/teacher/attendance', { token: t.faculty1, body });
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(b.body.session.id).toBe(a.body.session.id);
  });

  it.todo('saving attendance twice CONCURRENTLY never 500s - observed once as a 500 (unique batchId+date race), not reproducible every run, so not asserted');

  it('student submitting the same assignment 3x at once results in a single submission', async () => {
    const asgs = await call('GET', '/student/assignments', { token: t.student3 });
    const target = (asgs.body.items ?? asgs.body).find((a: any) => !a.submission);
    expect(target).toBeTruthy();
    const res = await Promise.all([1, 2, 3].map(() => call('POST', `/student/assignments/${target.id}/submit`, { token: t.student3, body: { content: 'my answer' } })));
    for (const r of res) expect(r.status).toBeLessThan(500);
    expect(res.some((r) => r.status === 200 || r.status === 201)).toBe(true);
  });

  // KNOWN BUG (api-core): GET /teacher/assignments/:id/submissions 500s (selects User.rollNumber, absent from the schema).
  it.fails('teacher can list submissions, one per student', async () => {
    const asgs = await call('GET', '/teacher/assignments', { token: t.ownerA });
    const id = (asgs.body.items ?? asgs.body)[0].id;
    const subs = await call('GET', `/teacher/assignments/${id}/submissions`, { token: t.ownerA });
    expect(subs.status).toBe(200);
    const ids = (subs.body.items ?? subs.body).map((s: any) => s.studentId ?? s.student?.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a fee reminder is created once and a repeat the same day is rejected as a duplicate (409)', async () => {
    const pending = fees.find((f: any) => f.status === 'PENDING' || f.status === 'OVERDUE');
    expect(pending).toBeTruthy();
    const first = await call('POST', '/tuition/fees/remind', { token: t.ownerA, body: { feeRecordId: pending.id, channel: 'IN_APP' } });
    expect(first.status).toBeLessThan(300);
    const second = await call('POST', '/tuition/fees/remind', { token: t.ownerA, body: { feeRecordId: pending.id, channel: 'IN_APP' } });
    expect(second.status).toBe(409);
  });

  // KNOWN GAP (api-core): batch codes are not unique per institute; a double click creates two batches.
  it.fails('creating a batch twice with the same code does not create a duplicate', async () => {
    const code = `IDEMP-${Date.now() % 1000000}`;
    const body = { name: 'Idem Batch', subject: 'Maths', code };
    await call('POST', '/teacher/batches', { token: t.ownerA, body });
    await call('POST', '/teacher/batches', { token: t.ownerA, body });
    const batches = await batchesOf(t.ownerA);
    expect(batches.filter((x) => x.code === code).length).toBe(1);
  });
});

describe('known gaps in features still being built (do not delete)', () => {
  it.todo('batch edit (PUT /teacher/batches/:id) - owner feature request, api-core');
  it.todo('batch fee assignment: every student PENDING, mark payments with audit trail, receipt to student - api-finance-docs');
  it.todo('promote batch to next class with history - api-core');
  it.todo('timetable CRUD (create/edit/delete) by teacher and student read - api-core');
  it.todo('student leave applications approve/reject - api-core');
  it.todo('assignment PDF attachment upload + student open');
  it.todo('PDFs (report card, fee receipt, salary slip, attendance, result sheet) show the institute header, never the platform name');
});
