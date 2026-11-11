/**
 * Seeds two test accounts into the real database:
 *   adi@gmail.com   → TEACHER  (attached to the first active Institute)
 *   testing@gmail.com → STUDENT (attached to the first active Institute)
 *
 * Password for both: Password@123
 *
 * Usage (run from repo root):
 *   DATABASE_URL="<direct-url>" npm run seed:test-accounts --workspace=@padhai-pilot/api
 *
 * Safe to re-run: skips accounts that already exist (by email).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../common/security/password.js';

const TEST_PASSWORD = 'Password@123';

const ACCOUNTS = [
  { email: 'adi@gmail.com', fullName: 'Aditya (Teacher)', role: 'TEACHER' as const },
  { email: 'testing@gmail.com', fullName: 'Testing Student', role: 'STUDENT' as const },
];

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL or DIRECT_URL must be set.');

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const institute = await prisma.institute.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });
    if (!institute) throw new Error('No active Institute found. Register a tuition first.');
    console.log(`Using institute: ${institute.name} (${institute.id})`);

    const passwordHash = await hashPassword(TEST_PASSWORD);

    for (const acc of ACCOUNTS) {
      const existing = await prisma.user.findUnique({ where: { email: acc.email }, select: { id: true } });
      if (existing) {
        console.log(`SKIP — ${acc.email} already exists`);
        continue;
      }
      const user = await prisma.user.create({
        data: {
          email: acc.email,
          fullName: acc.fullName,
          passwordHash,
          role: acc.role,
          isActive: true,
          isEmailVerified: true,
          memberships: {
            create: { instituteId: institute.id, role: acc.role, status: 'ACTIVE' },
          },
        },
        select: { id: true, email: true, role: true },
      });
      console.log(`CREATED ${user.role}: ${user.email} (${user.id})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
