/**
 * Patches missing announcements + notifications after seed-demo-data.ts failed mid-run.
 * Fully idempotent: finds-or-creates each announcement, always upserts notifications.
 *
 *   cd apps/api && npx tsx src/scripts/seed-demo-announcements.ts
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

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const teacher = await prisma.user.findUnique({ where: { email: 'adi@gmail.com' } });
  const student = await prisma.user.findUnique({ where: { email: 'testing@gmail.com' } });
  if (!teacher || !student) throw new Error('Run seed-test-accounts.ts first.');

  const batch = await prisma.batch.findFirst({
    where: { teacherId: teacher.id, name: 'JEE Physics — Batch A' },
    select: { id: true, instituteId: true },
  });
  if (!batch) throw new Error('Run seed-demo-data.ts first (batch not found).');

  const institute = await prisma.institute.findUnique({
    where: { id: batch.instituteId },
    select: { id: true, name: true },
  });
  if (!institute) throw new Error('Institute not found.');
  console.log(`Institute: ${institute.name}`);

  // ── ANNOUNCEMENTS + THEIR NOTIFICATIONS ──────────────────────────────────────
  const announcements = [
    { title: 'Holiday on 15th November', content: 'No class on 15th November due to Diwali celebrations. Next class resumes on 18th November.', priority: 'URGENT', daysBack: 3 },
    { title: 'Unit Test 2 Syllabus', content: "Unit Test 2 on Electrostatics will cover Chapters 1–3: Electric Charges, Gauss's Law and Electric Potential. Total marks: 100.", priority: 'NORMAL', daysBack: 2 },
    { title: 'Practice Material Uploaded', content: 'JEE 2024 previous year papers for Physics have been uploaded to the Study Vault. Please solve them before the next class.', priority: 'NORMAL', daysBack: 1 },
  ];

  for (const ann of announcements) {
    // Find existing or create
    const existing = await prisma.announcement.findFirst({
      where: { batchId: batch.id, title: ann.title },
      select: { id: true },
    });

    let annId: string;
    if (existing) {
      annId = existing.id;
      console.log(`SKIP announcement (exists): ${ann.title}`);
    } else {
      const created = await prisma.announcement.create({
        data: {
          instituteId: institute.id,
          batchId: batch.id,
          authorId: teacher.id,
          priority: ann.priority,
          createdAt: daysAgo(ann.daysBack),
          title: ann.title,
          content: ann.content,
        },
      });
      annId = created.id;
      console.log(`Created announcement: ${ann.title}`);
    }

    // Always upsert notification (creates it if missing)
    const dedupeKey = `ann-${annId}`;
    await prisma.notification.upsert({
      where: { userId_dedupeKey: { userId: student.id, dedupeKey } },
      create: {
        instituteId: institute.id,
        userId: student.id,
        title: ann.title,
        message: ann.content.substring(0, 100) + (ann.content.length > 100 ? '…' : ''),
        type: 'ANNOUNCEMENT',
        priority: ann.priority,
        isRead: ann.daysBack > 1,
        createdAt: daysAgo(ann.daysBack),
        dedupeKey,
      },
      update: {},
    });
  }

  // ── EXTRA NOTIFICATIONS ───────────────────────────────────────────────────────
  const extraNotifs = [
    { title: 'Assignment Graded', message: 'Your Kinematics Practice Set has been graded. Marks: 82/100.', type: 'RESULT_PUBLISHED', isRead: true, daysBack: 9 },
    { title: 'Monthly Test Result', message: 'Your Thermodynamics test result is now available. Score: 74/100.', type: 'RESULT_PUBLISHED', isRead: false, daysBack: 4 },
    { title: 'Fee Due Reminder', message: 'Term 2 Tuition Fee balance of ₹4,500 is overdue. Please clear at the earliest.', type: 'FEE_REMINDER', isRead: false, daysBack: 2 },
  ];

  for (const n of extraNotifs) {
    const dedupeKey = `notif-${n.type}-${n.daysBack}`;
    await prisma.notification.upsert({
      where: { userId_dedupeKey: { userId: student.id, dedupeKey } },
      create: {
        instituteId: institute.id,
        userId: student.id,
        type: n.type,
        priority: 'NORMAL',
        isRead: n.isRead,
        title: n.title,
        message: n.message,
        createdAt: daysAgo(n.daysBack),
        dedupeKey,
      },
      update: {},
    });
  }
  console.log(`Extra notifications: ${extraNotifs.length} upserted`);
  console.log('\n✓ Announcements + notifications done!');
  console.log('  Teacher: adi@gmail.com / Password@123');
  console.log('  Student: testing@gmail.com / Password@123');
}

main()
  .catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); })
  .finally(() => prisma.$disconnect());
