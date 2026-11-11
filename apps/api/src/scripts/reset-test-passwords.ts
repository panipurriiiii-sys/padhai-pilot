/**
 * Resets adi@gmail.com and testing@gmail.com to password "Password@123", active + email-verified.
 *
 *   cd apps/api && npx tsx src/scripts/reset-test-passwords.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../common/security/password.js';

const EMAILS = ['adi@gmail.com', 'testing@gmail.com'];

function resolveUrl() {
  const pooled = process.env.DATABASE_URL_POOLED;
  if (pooled) return pooled.includes('pgbouncer') ? pooled : `${pooled}${pooled.includes('?') ? '&' : '?'}pgbouncer=true`;
  const direct = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (direct) return direct;
  throw new Error('No DATABASE_URL set');
}

const prisma = new PrismaClient({ datasources: { db: { url: resolveUrl() } } });

async function main() {
  const passwordHash = await hashPassword('Password@123');
  for (const email of EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, isActive: true, isEmailVerified: true, passwordHash: true },
    });
    if (!user) { console.log(`MISSING ${email} — run seed-test-accounts first`); continue; }
    const before = await verifyPassword('Password@123', user.passwordHash);
    console.log(`${email}: role=${user.role} active=${user.isActive} verified=${user.isEmailVerified} passwordWasValid=${before}`);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, isActive: true, isEmailVerified: true },
      select: { id: true },
    });
    console.log(`  → reset OK`);
  }
}

main()
  .catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); })
  .finally(() => prisma.$disconnect());
