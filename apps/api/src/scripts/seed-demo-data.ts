/**
 * Seeds realistic demo data for adi@gmail.com (TEACHER) and testing@gmail.com (STUDENT).
 * Run AFTER seed-test-accounts.ts.
 *
 *   cd apps/api && npx tsx src/scripts/seed-demo-data.ts
 *
 * Safe to re-run: skips if the batch already exists for this teacher.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const teacher = await prisma.user.findUnique({ where: { email: 'adi@gmail.com' } });
  const student = await prisma.user.findUnique({ where: { email: 'testing@gmail.com' } });
  if (!teacher || !student) throw new Error('Run seed-test-accounts.ts first.');

  const institute = await prisma.institute.findFirst({
    where: { isActive: true }, orderBy: { createdAt: 'asc' }, select: { id: true, name: true },
  });
  if (!institute) throw new Error('No active institute found.');
  console.log(`Institute: ${institute.name}`);

  // ── 1. BATCH ──────────────────────────────────────────────────────────────
  const existingBatch = await prisma.batch.findFirst({
    where: { teacherId: teacher.id, name: 'JEE Physics — Batch A' },
  });
  if (existingBatch) {
    console.log('SKIP — demo data already seeded (batch exists).');
    return;
  }

  const batch = await prisma.batch.create({
    data: {
      instituteId: institute.id,
      teacherId: teacher.id,
      name: 'JEE Physics — Batch A',
      code: 'PHY-A-26',
      subject: 'Physics',
      gradeLevel: 'Class 12 / JEE',
      room: 'Room 3B',
      schedule: 'Mon / Wed / Fri  6:00 – 7:30 PM',
    },
  });
  console.log(`Batch: ${batch.name} (${batch.id})`);

  // ── 2. ENROLL STUDENT ─────────────────────────────────────────────────────
  await prisma.enrollment.create({
    data: {
      instituteId: institute.id,
      batchId: batch.id,
      studentId: student.id,
      rollNumber: 'PHY-A-01',
      status: 'ACTIVE',
    },
  });
  console.log(`Enrolled ${student.email} → roll PHY-A-01`);

  // ── 3. TIMETABLE ──────────────────────────────────────────────────────────
  const slots = [
    { dayOfWeek: 'MONDAY',    startTime: '18:00', endTime: '19:30' },
    { dayOfWeek: 'WEDNESDAY', startTime: '18:00', endTime: '19:30' },
    { dayOfWeek: 'FRIDAY',    startTime: '18:00', endTime: '19:30' },
  ];
  for (const s of slots) {
    await prisma.timetableSlot.create({
      data: { instituteId: institute.id, batchId: batch.id, teacherId: teacher.id, subject: 'Physics', room: 'Room 3B', ...s },
    });
  }
  console.log('Timetable: Mon/Wed/Fri 6-7:30 PM');

  // ── 4. ATTENDANCE (last 20 class days — Mon/Wed/Fri pattern) ──────────────
  const classDays: Date[] = [];
  for (let i = 1; i <= 60 && classDays.length < 20; i++) {
    const d = daysAgo(i);
    if ([1, 3, 5].includes(d.getDay())) classDays.push(d);
  }
  // Student present for 17 of 20 (85%)
  for (let i = 0; i < classDays.length; i++) {
    const session = await prisma.attendanceSession.create({
      data: { instituteId: institute.id, batchId: batch.id, teacherId: teacher.id, date: classDays[i] },
    });
    const present = i < 17; // 85% attendance
    await prisma.attendanceRecord.create({
      data: { sessionId: session.id, studentId: student.id, status: present ? 'PRESENT' : 'ABSENT' },
    });
  }
  console.log(`Attendance: ${classDays.length} sessions, 17 present`);

  // ── 5. ASSIGNMENTS ────────────────────────────────────────────────────────
  const assignments = [
    { title: 'Kinematics Practice Set', instructions: 'Solve all 20 problems from the kinematics sheet. Show full derivations.', dueDate: daysAgo(10), marksObtained: 82 },
    { title: 'Newton\'s Laws — Problem Sheet', instructions: 'Complete problems 1–15 on Newton\'s Laws of Motion.', dueDate: daysAgo(3), marksObtained: 76 },
    { title: 'Rotational Motion Assignment', instructions: 'Attempt all questions on moment of inertia and torque.', dueDate: daysFromNow(5), marksObtained: null },
    { title: 'Wave Optics — Derivations', instructions: 'Write derivations for Young\'s double slit and single slit diffraction.', dueDate: daysFromNow(12), marksObtained: null },
  ];

  for (const a of assignments) {
    const asgn = await prisma.assignment.create({
      data: {
        instituteId: institute.id,
        batchId: batch.id,
        teacherId: teacher.id,
        subject: 'Physics',
        status: 'PUBLISHED',
        title: a.title,
        instructions: a.instructions,
        dueDate: a.dueDate,
        maxMarks: 100,
      },
    });
    if (a.marksObtained !== null) {
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: asgn.id,
          studentId: student.id,
          content: 'Submitted via app',
          status: 'GRADED',
          marksObtained: a.marksObtained,
          gradedAt: new Date(),
          gradedBy: teacher.id,
          feedback: a.marksObtained >= 80 ? 'Good work, keep it up!' : 'Needs improvement in a few areas.',
        },
      });
    }
  }
  console.log(`Assignments: ${assignments.length} created, 2 submitted & graded`);

  // ── 6. TESTS ──────────────────────────────────────────────────────────────
  const tests = [
    { title: 'Unit Test 1 — Mechanics', scheduledDate: daysAgo(14), score: 68, totalMarks: 100 },
    { title: 'Monthly Test — Thermodynamics', scheduledDate: daysAgo(5), score: 74, totalMarks: 100 },
    { title: 'Unit Test 2 — Electrostatics', scheduledDate: daysFromNow(7), score: null, totalMarks: 100 },
  ];

  for (const t of tests) {
    const test = await prisma.testQuiz.create({
      data: {
        instituteId: institute.id,
        batchId: batch.id,
        teacherId: teacher.id,
        subject: 'Physics',
        status: 'PUBLISHED',
        resultsReleased: t.score !== null,
        title: t.title,
        scheduledDate: t.scheduledDate,
        closesAt: t.score !== null ? t.scheduledDate : daysFromNow(14),
        durationMinutes: 90,
        totalMarks: t.totalMarks,
        questions: [],
      },
    });
    if (t.score !== null) {
      await prisma.testAttempt.create({
        data: {
          testId: test.id,
          studentId: student.id,
          answers: [],
          score: t.score,
          totalMarks: t.totalMarks,
          status: 'GRADED',
          gradedAt: new Date(),
        },
      });
    }
  }
  console.log(`Tests: ${tests.length} created, 2 attempted & graded`);

  // ── 7. CLASSROOM ASSESSMENTS ──────────────────────────────────────────────
  const assessments = [
    { title: 'Term 1 Exam', category: 'TERM_EXAM' as const, date: daysAgo(20), marks: 71, maxMarks: 100 },
    { title: 'Class Quiz — Optics', category: 'QUIZ' as const, date: daysAgo(8), marks: 18, maxMarks: 25 },
  ];

  for (const a of assessments) {
    const ca = await prisma.classroomAssessment.create({
      data: {
        instituteId: institute.id,
        batchId: batch.id,
        teacherId: teacher.id,
        subject: 'Physics',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy: teacher.id,
        title: a.title,
        category: a.category,
        assessmentDate: a.date,
        maxMarks: a.maxMarks,
        passingMarks: a.maxMarks * 0.4,
      },
    });
    await prisma.assessmentMark.create({
      data: {
        assessmentId: ca.id,
        studentId: student.id,
        attendanceStatus: 'PRESENT',
        obtainedMarks: a.marks,
        percentage: (a.marks / a.maxMarks) * 100,
        grade: a.marks / a.maxMarks >= 0.85 ? 'A' : a.marks / a.maxMarks >= 0.7 ? 'B' : 'C',
        resultStatus: 'SCORED',
        isPublished: true,
        lastEditedBy: teacher.id,
      },
    });
  }
  console.log(`Classroom assessments: ${assessments.length} with marks`);

  // ── 8. FEE RECORDS ────────────────────────────────────────────────────────
  const fees = [
    { feeTitle: 'Term 1 Tuition Fee', totalAmount: 8500, paidAmount: 8500, dueDate: daysAgo(30), status: 'PAID' },
    { feeTitle: 'Term 2 Tuition Fee', totalAmount: 8500, paidAmount: 4000, dueDate: daysAgo(5), status: 'PARTIAL' },
    { feeTitle: 'JEE Test Series Pack', totalAmount: 2500, paidAmount: 0, dueDate: daysFromNow(10), status: 'PENDING' },
  ];

  for (const f of fees) {
    await prisma.studentFeeRecord.create({
      data: {
        instituteId: institute.id,
        studentId: student.id,
        batchId: batch.id,
        academicYear: '2026-2027',
        ...f,
      },
    });
  }
  console.log(`Fee records: ${fees.length} created`);

  // ── 9. ANNOUNCEMENTS ──────────────────────────────────────────────────────
  const announcements = [
    { title: 'Holiday on 15th November', content: 'No class on 15th November due to Diwali celebrations. Next class resumes on 18th November.', priority: 'HIGH' as const, daysBack: 3 },
    { title: 'Unit Test 2 Syllabus', content: 'Unit Test 2 on Electrostatics will cover Chapters 1–3: Electric Charges, Gauss\'s Law and Electric Potential. Total marks: 100.', priority: 'NORMAL' as const, daysBack: 2 },
    { title: 'Practice Material Uploaded', content: 'JEE 2024 previous year papers for Physics have been uploaded to the Study Vault. Please solve them before the next class.', priority: 'NORMAL' as const, daysBack: 1 },
  ];

  for (const ann of announcements) {
    const { daysBack, priority, ...rest } = ann;
    const created = await prisma.announcement.create({
      data: {
        instituteId: institute.id,
        batchId: batch.id,
        authorId: teacher.id,
        priority,
        createdAt: daysAgo(daysBack),
        ...rest,
      },
    });
    // Notification for student
    await prisma.notification.create({
      data: {
        instituteId: institute.id,
        userId: student.id,
        title: ann.title,
        message: ann.content.substring(0, 100) + (ann.content.length > 100 ? '…' : ''),
        type: 'ANNOUNCEMENT',
        priority: priority === 'HIGH' ? 'HIGH' : 'NORMAL',
        isRead: daysBack > 1,
        createdAt: daysAgo(daysBack),
        dedupeKey: `ann-${created.id}`,
      },
    });
  }
  console.log(`Announcements + notifications: ${announcements.length}`);

  // ── 10. EXTRA NOTIFICATIONS ───────────────────────────────────────────────
  const extraNotifs = [
    { title: 'Assignment Graded', message: 'Your Kinematics Practice Set has been graded. Marks: 82/100.', type: 'RESULT_PUBLISHED', isRead: true, daysBack: 9 },
    { title: 'Monthly Test Result', message: 'Your Thermodynamics test result is now available. Score: 74/100.', type: 'RESULT_PUBLISHED', isRead: false, daysBack: 4 },
    { title: 'Fee Due Reminder', message: 'Term 2 Tuition Fee balance of ₹4,500 is overdue. Please clear at the earliest.', type: 'FEE_REMINDER', isRead: false, daysBack: 2 },
  ];

  for (const n of extraNotifs) {
    await prisma.notification.create({
      data: {
        instituteId: institute.id,
        userId: student.id,
        type: n.type,
        priority: 'NORMAL',
        isRead: n.isRead,
        title: n.title,
        message: n.message,
        createdAt: daysAgo(n.daysBack),
        dedupeKey: `notif-${n.type}-${n.daysBack}`,
      },
    });
  }
  console.log(`Extra notifications: ${extraNotifs.length}`);

  console.log('\n✓ Demo data seeded successfully!');
  console.log(`  Teacher login: adi@gmail.com / Password@123`);
  console.log(`  Student login: testing@gmail.com / Password@123`);
}

main()
  .catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); })
  .finally(() => prisma.$disconnect());
