import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { buildSchedule, computeFeeStatus, inheritBatchFees, parseAmount, round2 } from './fee-core.js';
import { validateMediaUrl, LOGO_EXTENSIONS, DOCUMENT_EXTENSIONS } from '../common/security/media-url.js';

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const NOW = new Date('2026-11-10T09:00:00.000Z');

describe('computeFeeStatus', () => {
  it('PENDING / PARTIAL / PAID / OVERDUE / VOID', () => {
    expect(computeFeeStatus({ totalAmount: 1000, paidAmount: 0, dueDate: d('2026-12-01') }, NOW)).toBe('PENDING');
    expect(computeFeeStatus({ totalAmount: 1000, paidAmount: 400, dueDate: d('2026-12-01') }, NOW)).toBe('PARTIAL');
    expect(computeFeeStatus({ totalAmount: 1000, paidAmount: 1000, dueDate: d('2026-01-01') }, NOW)).toBe('PAID');
    expect(computeFeeStatus({ totalAmount: 1000, paidAmount: 400, dueDate: d('2026-11-01') }, NOW)).toBe('OVERDUE');
    expect(computeFeeStatus({ totalAmount: 1000, paidAmount: 0, dueDate: d('2026-11-10') }, NOW)).toBe('PENDING'); // due today is not overdue
    expect(computeFeeStatus({ totalAmount: 1000, paidAmount: 0, dueDate: d('2026-12-01'), voidedAt: NOW }, NOW)).toBe('VOID');
  });
  it('rounds money safely', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(computeFeeStatus({ totalAmount: 0.3, paidAmount: 0.1 + 0.2, dueDate: d('2026-01-01') }, NOW)).toBe('PAID');
  });
});

describe('buildSchedule / parseAmount', () => {
  it('single amount + due date', () => {
    expect(buildSchedule({ amount: 5000, dueDate: '2026-12-05' })).toEqual([{ label: '', amount: 5000, dueDate: '2026-12-05' }]);
  });
  it('instalments', () => {
    const s = buildSchedule({ instalments: [{ amount: 2000, dueDate: '2026-12-05' }, { label: 'Term 2', amount: 3000, dueDate: '2027-02-05' }] });
    expect(s.map((x) => x.label)).toEqual(['Instalment 1', 'Term 2']);
  });
  it('rejects bad input', () => {
    expect(() => buildSchedule({ amount: -1, dueDate: '2026-12-05' })).toThrow(BadRequestException);
    expect(() => buildSchedule({ amount: 10, dueDate: 'tomorrow' })).toThrow(BadRequestException);
    expect(() => parseAmount('abc', 'amount')).toThrow(BadRequestException);
    expect(() => buildSchedule({ instalments: Array.from({ length: 25 }, () => ({ amount: 1, dueDate: '2026-12-05' })) })).toThrow(BadRequestException);
  });
});

describe('inheritBatchFees', () => {
  it('creates PENDING records for every instalment of every active structure, idempotently', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 3 });
    const tx = {
      batchFeeStructure: {
        findMany: vi.fn().mockResolvedValue([
          { id: 's1', title: 'Tuition', academicYear: '2026-2027', schedule: [{ label: 'Q1', amount: 100, dueDate: '2026-12-01' }, { label: 'Q2', amount: 100, dueDate: '2027-03-01' }] },
          { id: 's2', title: 'Books', academicYear: null, schedule: [{ label: '', amount: 50, dueDate: '2026-12-01' }] },
        ]),
      },
      studentFeeRecord: { createMany },
    };
    expect(await inheritBatchFees(tx, 'inst', 'b1', 'stu')).toBe(3);
    const args = createMany.mock.calls[0][0];
    expect(args.skipDuplicates).toBe(true);
    expect(args.data.map((r: any) => [r.feeTitle, r.instalmentNo, r.status, r.paidAmount])).toEqual([
      ['Tuition - Q1', 1, 'PENDING', 0],
      ['Tuition - Q2', 2, 'PENDING', 0],
      ['Books', 1, 'PENDING', 0],
    ]);
    expect(args.data.every((r: any) => r.instituteId === 'inst' && r.studentId === 'stu')).toBe(true);
  });
});

describe('validateMediaUrl', () => {
  it('accepts media hosts over https with allowed extensions', () => {
    expect(validateMediaUrl('https://media.dhyey.cc/docs/a.png', 'logo', LOGO_EXTENSIONS)).toBe('https://media.dhyey.cc/docs/a.png');
    expect(validateMediaUrl('https://media-hosting.dhyeyp254.workers.dev/1793338917831.pdf', 'att', DOCUMENT_EXTENSIONS)).toContain('1793338917831.pdf');
    expect(validateMediaUrl('', 'x', LOGO_EXTENSIONS)).toBeUndefined();
  });
  it('rejects http, other hosts, credentials tricks, bad extensions', () => {
    for (const u of [
      'http://media.dhyey.cc/a.png',
      'https://evil.example.com/a.png',
      'https://media.dhyey.cc.evil.com/a.png',
      'https://user:pw@media.dhyey.cc/a.png',
      'javascript:alert(1)',
      'https://media.dhyey.cc/a.exe',
    ]) {
      expect(() => validateMediaUrl(u, 'x', LOGO_EXTENSIONS), u).toThrow(BadRequestException);
    }
    expect(() => validateMediaUrl('https://media.dhyey.cc/a.pdf', 'logo', LOGO_EXTENSIONS)).toThrow(BadRequestException);
  });
});
