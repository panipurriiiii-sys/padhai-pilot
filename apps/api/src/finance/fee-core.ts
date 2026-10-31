import { BadRequestException } from '@nestjs/common';
import type { FeeRecordStatus } from '@padhai-pilot/shared';

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export interface ScheduleEntry {
  label: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
}

/** Computed (never trusted from the client) status of a fee record. */
export function computeFeeStatus(
  input: { totalAmount: number; paidAmount: number; dueDate: Date; voidedAt?: Date | null },
  now: Date = new Date(),
): FeeRecordStatus {
  if (input.voidedAt) return 'VOID';
  const total = round2(input.totalAmount);
  const paid = round2(input.paidAmount);
  if (paid >= total) return 'PAID';
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const due = Date.UTC(input.dueDate.getUTCFullYear(), input.dueDate.getUTCMonth(), input.dueDate.getUTCDate());
  if (due < today) return 'OVERDUE';
  return paid > 0 ? 'PARTIAL' : 'PENDING';
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDay(value: unknown, field: string): Date {
  if (typeof value !== 'string') throw new BadRequestException(`${field} is required.`);
  const v = value.trim().slice(0, 10);
  const d = new Date(`${v}T00:00:00.000Z`);
  if (!DATE_RE.test(v) || Number.isNaN(d.getTime())) throw new BadRequestException(`${field} must be a valid date (YYYY-MM-DD).`);
  return d;
}

export function parseAmount(value: unknown, field: string): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 10_000_000) {
    throw new BadRequestException(`${field} must be a positive amount.`);
  }
  return round2(n);
}

/** Validates the create-structure body and returns the normalised schedule (1..24 instalments). */
export function buildSchedule(body: {
  amount?: unknown;
  dueDate?: unknown;
  instalments?: unknown;
}): ScheduleEntry[] {
  if (Array.isArray(body.instalments) && body.instalments.length > 0) {
    if (body.instalments.length > 24) throw new BadRequestException('At most 24 instalments are allowed.');
    return body.instalments.map((raw, i) => {
      const r = (raw ?? {}) as Record<string, unknown>;
      const label = typeof r.label === 'string' && r.label.trim() ? r.label.trim().slice(0, 60) : `Instalment ${i + 1}`;
      return {
        label,
        amount: parseAmount(r.amount, `instalments[${i}].amount`),
        dueDate: parseDay(r.dueDate, `instalments[${i}].dueDate`).toISOString().slice(0, 10),
      };
    });
  }
  return [
    {
      label: '',
      amount: parseAmount(body.amount, 'amount'),
      dueDate: parseDay(body.dueDate, 'dueDate').toISOString().slice(0, 10),
    },
  ];
}

export function recordTitle(structureTitle: string, entry: ScheduleEntry, count: number): string {
  return count > 1 ? `${structureTitle} - ${entry.label}` : structureTitle;
}

/** Minimal transaction client shape needed to create fee records for a student of a batch. */
interface FeeTx {
  batchFeeStructure: { findMany: (args: any) => Promise<any[]> };
  studentFeeRecord: { createMany: (args: any) => Promise<{ count: number }> };
}

/**
 * New enrolments inherit every ACTIVE fee structure of the batch as PENDING records. Idempotent
 * (unique structureId + studentId + instalmentNo, skipDuplicates). Call inside the enrolment transaction.
 */
export async function inheritBatchFees(
  tx: FeeTx,
  instituteId: string,
  batchId: string,
  studentId: string,
): Promise<number> {
  const structures = await tx.batchFeeStructure.findMany({
    where: { instituteId, batchId, status: 'ACTIVE' },
    select: { id: true, title: true, academicYear: true, schedule: true },
    take: 50,
  });
  const data: any[] = [];
  for (const s of structures) {
    const schedule = (Array.isArray(s.schedule) ? s.schedule : []) as ScheduleEntry[];
    schedule.forEach((entry, idx) => {
      data.push({
        instituteId,
        studentId,
        batchId,
        structureId: s.id,
        instalmentNo: idx + 1,
        feeTitle: recordTitle(s.title, entry, schedule.length),
        totalAmount: entry.amount,
        paidAmount: 0,
        dueDate: new Date(`${entry.dueDate}T00:00:00.000Z`),
        status: 'PENDING',
        academicYear: s.academicYear ?? undefined,
      });
    });
  }
  if (data.length === 0) return 0;
  const res = await tx.studentFeeRecord.createMany({ data, skipDuplicates: true });
  return res.count;
}
