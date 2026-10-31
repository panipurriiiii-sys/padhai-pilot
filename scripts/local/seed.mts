// DEV-ONLY seed for the LOCAL harness database. Refuses to run in production or against any non-local DB.
// Creates two institutes (so cross-tenant isolation can be exercised), owner/faculty/students, batches,
// attendance, assignments, marks, fees, announcements. Idempotent: re-running wipes and recreates dev data.
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../apps/api/src/common/security/password.ts';
import { DATABASE_URL, assertLocalDb } from './lib.mjs';

if (process.env.NODE_ENV === 'production') throw new Error('local:seed is DEV ONLY and refuses NODE_ENV=production.');
assertLocalDb();

export const DEV_PASSWORD = 'DevPass#2026';
const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

const day = (offset: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

async function user(email: string, fullName: string, role: any, hash: string) {
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, fullName, role, isActive: true },
    create: { email, fullName, role, passwordHash: hash, isEmailVerified: true },
  });
}

async function seedInstitute(opts: {
  slug: string; name: string; ownerEmail: string; ownerName: string;
  faculty: { email: string; name: string; subject: string; role: 'TEACHER' | 'FACULTY' }[];
  studentPrefix: string; studentCount: number;
}, hash: string) {
  const existing = await prisma.institute.findUnique({ where: { slug: opts.slug } });
  if (existing) await prisma.institute.delete({ where: { id: existing.id } });
  const owner = await user(opts.ownerEmail, opts.ownerName, 'TUITION_OWNER', hash);
  const inst = await prisma.institute.create({
    data: {
      name: opts.name, slug: opts.slug, ownerId: owner.id, plan: 'PRO',
      address: '12 Dev Street, Localtown 400001', contactPhone: '+91 90000 00000',
      contactEmail: opts.ownerEmail, signatoryName: opts.ownerName, signatoryTitle: 'Director',
    },
  });
  await prisma.instituteMembership.create({ data: { instituteId: inst.id, userId: owner.id, role: 'TUITION_OWNER' } });

  const fac = [];
  for (const [i, f] of opts.faculty.entries()) {
    const u = await user(f.email, f.name, f.role, hash);
    await prisma.instituteMembership.create({ data: { instituteId: inst.id, userId: u.id, role: f.role } });
    await prisma.facultyProfile.create({
      data: {
        instituteId: inst.id, userId: u.id, staffId: `${opts.slug.toUpperCase().slice(0, 3)}-${101 + i}`,
        designation: `${f.subject} Faculty`, assignedSubjects: [f.subject], baseSalary: 30000,
        delegatedPermissions: ['MANAGE_ATTENDANCE', 'MANAGE_MARKS'],
      },
    });
    fac.push({ ...f, id: u.id });
  }

  const batches = [];
  for (const [i, f] of fac.entries()) {
    const b = await prisma.batch.create({
      data: {
        instituteId: inst.id, name: `${f.subject} Batch ${i + 1}`, code: `${opts.slug.toUpperCase().slice(0, 3)}-B${i + 1}`,
        subject: f.subject, gradeLevel: `Class ${9 + i}`, room: `Room ${i + 1}`, teacherId: f.id,
      },
    });
    batches.push(b);
    await prisma.timetableSlot.create({
      data: { instituteId: inst.id, batchId: b.id, teacherId: f.id, subject: f.subject, dayOfWeek: 'MONDAY', startTime: '16:00', endTime: '17:00', room: b.room },
    });
  }

  const students = [];
  for (let s = 0; s < opts.studentCount; s++) {
    const u = await user(`${opts.studentPrefix}${s + 1}@dev.local`, `${opts.name.split(' ')[0]} Student ${s + 1}`, 'STUDENT', hash);
    await prisma.instituteMembership.create({ data: { instituteId: inst.id, userId: u.id, role: 'STUDENT' } });
    const batch = batches[s % batches.length];
    await prisma.enrollment.create({ data: { instituteId: inst.id, batchId: batch.id, studentId: u.id, rollNumber: String(Math.floor(s / batches.length) + 1).padStart(2, '0') } });
    students.push({ id: u.id, batchId: batch.id });
  }

  for (const b of batches) {
    const mine = students.filter((s) => s.batchId === b.id);
    // attendance: 3 past days
    for (const off of [-3, -2, -1]) {
      const sess = await prisma.attendanceSession.create({ data: { instituteId: inst.id, batchId: b.id, teacherId: b.teacherId, date: day(off) } });
      await prisma.attendanceRecord.createMany({
        data: mine.map((s, i) => ({ sessionId: sess.id, studentId: s.id, status: (i + off) % 4 === 0 ? 'ABSENT' : 'PRESENT', updatedBy: b.teacherId })),
      });
    }
    // assignment
    const a = await prisma.assignment.create({
      data: { instituteId: inst.id, batchId: b.id, teacherId: b.teacherId, title: `${b.subject} Worksheet 1`, instructions: 'Solve all questions.', subject: b.subject, dueDate: day(5), maxMarks: 20 },
    });
    if (mine[0]) {
      await prisma.assignmentSubmission.create({ data: { assignmentId: a.id, studentId: mine[0].id, content: 'Done', status: 'GRADED', marksObtained: 17, feedback: 'Good', gradedAt: new Date(), gradedBy: b.teacherId } });
    }
    // published assessment + marks
    const as = await prisma.classroomAssessment.create({
      data: { instituteId: inst.id, batchId: b.id, teacherId: b.teacherId, title: `${b.subject} Unit Test 1`, subject: b.subject, assessmentDate: day(-7), maxMarks: 50, passingMarks: 18, status: 'PUBLISHED', publishedAt: new Date(), publishedBy: b.teacherId },
    });
    await prisma.assessmentMark.createMany({
      data: mine.map((s, i) => ({ assessmentId: as.id, studentId: s.id, obtainedMarks: 25 + i * 3, percentage: ((25 + i * 3) / 50) * 100, grade: 'B', resultStatus: 'SCORED', isPublished: true })),
    });
    // fees: first student PAID, rest PENDING/PARTIAL
    for (const [i, s] of mine.entries()) {
      const total = 12000;
      const paid = i === 0 ? total : i === 1 ? 5000 : 0;
      await prisma.studentFeeRecord.create({
        data: { instituteId: inst.id, studentId: s.id, batchId: b.id, feeTitle: `${b.subject} Term 1 Fee`, totalAmount: total, paidAmount: paid, dueDate: day(i === 2 ? -5 : 15), status: paid === total ? 'PAID' : paid > 0 ? 'PARTIAL' : i === 2 ? 'OVERDUE' : 'PENDING' },
      });
    }
    await prisma.announcement.create({ data: { instituteId: inst.id, batchId: b.id, authorId: b.teacherId, title: `Welcome to ${b.name}`, content: 'Classes begin Monday. (dev seed)' } });
  }
  await prisma.announcement.create({ data: { instituteId: inst.id, authorId: owner.id, title: 'Institute notice', content: 'Diwali holiday notice (dev seed)', priority: 'URGENT' } });
  await prisma.invitationCode.create({
    data: { code: `${opts.slug.toUpperCase().replace(/[^A-Z]/g, '')}-DEV-JOIN`, instituteId: inst.id, batchId: batches[0].id, issuerId: owner.id, expiresAt: day(365) },
  });
  return { inst, owner, fac, batches, students };
}

const hash = await hashPassword(DEV_PASSWORD);
await user('admin@dev.local', 'Dev Super Admin', 'SUPER_ADMIN', hash);

const a = await seedInstitute({
  slug: 'dev-academy', name: 'Dev Academy', ownerEmail: 'owner@dev.local', ownerName: 'Dev Owner',
  faculty: [
    { email: 'faculty1@dev.local', name: 'Dev Faculty One', subject: 'Mathematics', role: 'TEACHER' },
    { email: 'faculty2@dev.local', name: 'Dev Faculty Two', subject: 'Science', role: 'FACULTY' },
  ],
  studentPrefix: 'student', studentCount: 10,
}, hash);
// Second tenant: used by e2e cross-tenant isolation tests.
const b = await seedInstitute({
  slug: 'rival-institute', name: 'Rival Institute', ownerEmail: 'owner2@dev.local', ownerName: 'Rival Owner',
  faculty: [{ email: 'rfaculty1@dev.local', name: 'Rival Faculty', subject: 'English', role: 'TEACHER' }],
  studentPrefix: 'rstudent', studentCount: 3,
}, hash);

console.log(`[local:seed] done. Institutes: ${a.inst.name} (${a.students.length} students, ${a.batches.length} batches), ${b.inst.name}.`);
console.log(`[local:seed] password for every dev account: ${DEV_PASSWORD}  (admin@dev.local, owner@dev.local, faculty1/2@dev.local, student1..10@dev.local, owner2@dev.local, rfaculty1@dev.local, rstudent1..3@dev.local)`);
await prisma.$disconnect();
