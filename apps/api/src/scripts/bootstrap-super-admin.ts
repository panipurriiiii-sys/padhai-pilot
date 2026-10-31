/**
 * One-time, operator-run provisioning of the PadhaiPilot Platform Owner (SUPER_ADMIN).
 * There is deliberately no HTTP route for this: public registration can never create a SUPER_ADMIN.
 *
 *   SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='<12+ chars>' SUPER_ADMIN_NAME='Your Name' \
 *     npm run bootstrap:admin --workspace=@padhai-pilot/api
 *
 * Uses DIRECT_URL when present (migration-style connection), otherwise DATABASE_URL.
 * Refuses to run if a SUPER_ADMIN already exists. The password is read from the environment and never logged.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../common/security/password.js';

const MIN_ADMIN_PASSWORD_LENGTH = 12;

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SUPER_ADMIN_NAME?.trim() || 'Platform Owner';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('SUPER_ADMIN_EMAIL must be a valid email.');
  if (!password || password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(`SUPER_ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
  });
  try {
    if (await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' }, select: { id: true } })) {
      throw new Error('A SUPER_ADMIN already exists. Refusing to create another.');
    }
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new Error('A user with that email already exists.');
    }
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash: await hashPassword(password),
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
      },
      select: { id: true, email: true },
    });
    console.log(`SUPER_ADMIN created: ${user.email} (${user.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
