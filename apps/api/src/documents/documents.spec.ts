import { describe, it, expect, vi } from 'vitest';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderDocument, sanitizePdfText } from './pdf-layout.js';
import { attendanceBatchSpec, attendanceStudentSpec, feeReceiptSpec, reportCardSpec, resultSheetSpec, salarySlipSpec, money } from './document-specs.js';
import { fetchLogoBytes } from './documents.service.js';
import type { InstituteLetterhead } from '@padhai-pilot/shared';

const brand: InstituteLetterhead = {
  name: 'Apex Science Academy',
  address: '12, Civil Lines, Near Central Park, Jaipur, Rajasthan 302006',
  contactPhone: '+91 98765 43210',
  contactEmail: 'office@apexacademy.in',
  website: 'https://apexacademy.in',
  footerText: 'Apex Science Academy - Building scientific temper since 2009',
  signatoryName: 'Dr. R. K. Sharma',
  signatoryTitle: 'Director',
  primaryColor: '#14532D',
};
const OUT = process.env.PDF_OUT;
const logoPath = process.env.PDF_LOGO;

async function render(name: string, spec: Parameters<typeof renderDocument>[0], withLogo = true) {
  const logo = withLogo && logoPath ? new Uint8Array(readFileSync(logoPath)) : undefined;
  const res = await renderDocument(spec, brand, logo);
  if (OUT) {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, `${name}.pdf`), res.bytes);
  }
  expect(Buffer.from(res.bytes.slice(0, 5)).toString()).toBe('%PDF-');
  return res;
}

const receipt = feeReceiptSpec({
  receiptNumber: 'RCT-2026-00007', paidOn: '2026-11-01', amount: 4500, mode: 'UPI', reference: 'UTR 4091823', voided: false,
  studentName: 'Aarav Mehta', rollNumber: 'STU-A12F', batchName: 'Class 10 - Science (Morning)', feeTitle: 'Tuition fee - Term 1',
  feeTotal: 12000, paidToDate: 4500, academicYear: '2026-2027', receivedBy: 'Neha Verma',
});

describe('PDF documents', () => {
  it('sanitises text for standard fonts (rupee sign, unsupported glyphs)', () => {
    expect(sanitizePdfText('₹500')).toBe('Rs. 500');
    expect(sanitizePdfText('Hello नमस्ते')).toBe('Hello ??????');
    expect(money(1234.5)).toBe('Rs. 1,234.50');
  });

  it('never puts the platform name in the document specs', () => {
    const specs = [
      receipt,
      salarySlipSpec({ facultyName: 'F', payPeriod: '2026-10', compensationModel: 'FIXED_MONTHLY', classesConducted: 0, baseAmount: 1, additions: 0, deductions: 0, advances: 0, netPayable: 1, status: 'PAID' }),
      reportCardSpec({ studentName: 'S', batchName: 'B', rows: [] }),
    ];
    expect(JSON.stringify(specs)).not.toMatch(/padhai/i);
  });

  it('renders a fee receipt (1 page) with and without a logo', async () => {
    expect((await render('fee-receipt', receipt)).pageCount).toBe(1);
    expect((await render('fee-receipt-nologo', receipt, false)).pageCount).toBe(1);
  });

  it('renders a cancelled receipt', async () => {
    const s = feeReceiptSpec({ ...{ receiptNumber: 'RCT-2026-00008', paidOn: '2026-11-02', amount: 100, mode: 'CASH', studentName: 'A', feeTitle: 'T', feeTotal: 100, paidToDate: 0 }, voided: true, voidReason: 'Entered against wrong student' });
    expect(s.title).toContain('Cancelled');
    await render('fee-receipt-cancelled', s);
  });

  it('renders a salary slip', async () => {
    await render('salary-slip', salarySlipSpec({
      facultyName: 'Neha Verma', designation: 'Senior Physics Faculty', payPeriod: '2026-10', compensationModel: 'HOURLY_PER_CLASS', classesConducted: 42,
      baseAmount: 33600, additions: 2000, deductions: 500, advances: 3000, netPayable: 32100, status: 'PAID', paymentDate: '2026-11-02', paymentMethod: 'BANK_TRANSFER', paymentReference: 'UTR 99120', remarks: 'Includes Diwali incentive.',
    }));
  });

  it('renders a report card with wrapped text', async () => {
    await render('report-card', reportCardSpec({
      studentName: 'Aarav Mehta', rollNumber: 'STU-A12F', batchName: 'Class 10 - Science (Morning)', academicYear: '2026-2027', attendancePct: 92.5,
      rows: [
        { title: 'Unit Test 1 - Motion and Measurement of Distances', subject: 'Physics', date: '2026-08-12', max: 50, obtained: 44, pct: 88, grade: 'A', status: '' },
        { title: 'Monthly Exam September', subject: 'Chemistry', date: '2026-09-20', max: 100, obtained: 71.5, pct: 71.5, grade: 'B+', status: '' },
        { title: 'Quiz', subject: 'Maths', date: '2026-10-02', max: 20, obtained: null, pct: null, grade: null, status: 'Absent' },
      ],
    }));
  });

  it('paginates long tables with a repeated header and page numbers', async () => {
    const rows = Array.from({ length: 90 }, (_, i) => ({ roll: `R${String(i + 1).padStart(3, '0')}`, name: `Student Number ${i + 1}`, present: 20 - (i % 5), absent: i % 5, late: i % 3, excused: 0 }));
    const res = await render('attendance-batch', attendanceBatchSpec({ batchName: 'Class 10 - Science (Morning)', from: '2026-10-01', to: '2026-10-31', sessions: 22, rows }));
    expect(res.pageCount).toBeGreaterThan(1);
  });

  it('renders student attendance and result sheet', async () => {
    await render('attendance-student', attendanceStudentSpec({ studentName: 'Aarav Mehta', rollNumber: 'STU-A12F', batchName: 'Class 10', from: '2026-10-01', to: '2026-10-31', records: [{ date: '2026-10-01', status: 'PRESENT' }, { date: '2026-10-02', status: 'ABSENT', note: 'Fever' }, { date: '2026-10-03', status: 'LATE' }] }));
    await render('result-sheet', resultSheetSpec({
      title: 'Unit Test 2', subject: 'Physics', batchName: 'Class 10 - Science', date: '2026-10-20', maxMarks: 50, passingMarks: 18, published: true,
      rows: [
        { roll: 'R001', name: 'Aarav Mehta', obtained: 44, pct: 88, grade: 'A', status: '' },
        { roll: 'R002', name: 'Diya Singh', obtained: 15, pct: 30, grade: 'F', status: '' },
        { roll: 'R003', name: 'Kabir Rao', obtained: null, pct: null, grade: null, status: 'Absent' },
      ],
    }));
  });
});

describe('fetchLogoBytes', () => {
  it('refuses non-media hosts without fetching', async () => {
    const f = vi.fn();
    expect(await fetchLogoBytes('https://evil.example.com/logo.png', f as unknown as typeof fetch)).toBeUndefined();
    expect(f).not.toHaveBeenCalled();
  });
  it('returns undefined on failure instead of throwing', async () => {
    const f = vi.fn().mockRejectedValue(new Error('boom'));
    expect(await fetchLogoBytes('https://media.dhyey.cc/docs/x-fail.png', f as unknown as typeof fetch)).toBeUndefined();
  });
  it('rejects oversized logos by content-length', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => '99999999' }, arrayBuffer: async () => new ArrayBuffer(1) });
    expect(await fetchLogoBytes('https://media.dhyey.cc/docs/x-big.png', f as unknown as typeof fetch)).toBeUndefined();
  });
});
