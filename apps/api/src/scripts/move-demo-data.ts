/**
 * Moves the "JEE Physics — Batch A" demo data into the institute adi@gmail.com actually belongs to.
 * Only updates instituteId on rows belonging to that batch (and its demo notifications). No deletes.
 *
 *   cd apps/api && npx tsx src/scripts/move-demo-data.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

function resolveUrl() {
  const pooled = process.env.DATABASE_URL_POOLED;
  if (pooled) return pooled.includes('pgbouncer') ? pooled : `${pooled}${pooled.includes('?') ? '&' : '?'}pgbouncer=true`;
  const direct = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (direct) return direct;
  throw new Error('No DATABASE_URL set');
}

const prisma = new PrismaClient({ datasources: { db: { url: resolveUrl() } } });

async function main() {
  const teacher = await prisma.user.findUnique({ where: { email: 'adi@gmail.com' }, select: { id: true } });
  const student = await prisma.user.findUnique({ where: { email: 'testing@gmail.com' }, select: { id: true } });
  if (!teacher || !student) throw new Error('Test accounts missing.');

  const membership = await prisma.instituteMembership.findFirst({
    where: { userId: teacher.id, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
    select: { instituteId: true, institute: { select: { name: true } } },
  });
  if (!membership) throw new Error('adi@gmail.com has no active institute membership.');
  const target = membership.instituteId;
  console.log(`Target institute: ${membership.institute.name} (${target})`);

  const batch = await prisma.batch.findFirst({
    where: { teacherId: teacher.id, name: 'JEE Physics — Batch A' },
    select: { id: true, instituteId: true },
  });
  if (!batch) throw new Error('Demo batch not found.');
  if (batch.instituteId === target) console.log('Batch already in target institute; re-checking children.');

  const where = { batchId: batch.id };
  const data = { instituteId: target };

  const results: Record<string, number> = {};
  results.batch = (await prisma.batch.updateMany({ where: { id: batch.id }, data })).count;
  results.enrollment = (await prisma.enrollment.updateMany({ where, data })).count;
  results.timetable = (await prisma.timetableSlot.updateMany({ where, data })).count;
  results.attendance = (await prisma.attendanceSession.updateMany({ where, data })).count;
  results.assignments = (await prisma.assignment.updateMany({ where, data })).count;
  results.tests = (await prisma.testQuiz.updateMany({ where, data })).count;
  results.assessments = (await prisma.classroomAssessment.updateMany({ where, data })).count;
  results.fees = (await prisma.studentFeeRecord.updateMany({ where, data })).count;
  results.announcements = (await prisma.announcement.updateMany({ where, data })).count;

  const annIds = (await prisma.announcement.findMany({ where, select: { id: true } })).map((a) => `ann-${a.id}`);
  results.notifications = (
    await prisma.notification.updateMany({
      where: {
        userId: student.id,
        OR: [
          { dedupeKey: { in: annIds } },
          { dedupeKey: { in: ['notif-RESULT_PUBLISHED-9', 'notif-RESULT_PUBLISHED-4', 'notif-FEE_REMINDER-2'] } },
        ],
      },
      data,
    })
  ).count;

  console.log('Moved rows:', results);
}

main()
  .catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); })
  .finally(() => prisma.$disconnect());
