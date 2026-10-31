import type { DocSpec } from './pdf-layout.js';

/** Pure builders: data in, layout spec out (unit-testable without PDFs or a database). */

export const money = (n: number): string =>
  `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const ddmmyyyy = (iso: string): string => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}-${m}-${y}` : iso;
};
export { ddmmyyyy };

export interface ReceiptInput {
  receiptNumber: string;
  paidOn: string;
  amount: number;
  mode: string;
  reference?: string;
  voided: boolean;
  voidReason?: string;
  studentName: string;
  rollNumber?: string;
  batchName?: string;
  feeTitle: string;
  feeTotal: number;
  paidToDate: number;
  academicYear?: string;
  receivedBy?: string;
}

export function feeReceiptSpec(r: ReceiptInput): DocSpec {
  const balance = Math.max(0, r.feeTotal - r.paidToDate);
  return {
    title: r.voided ? 'Fee Receipt (Cancelled)' : 'Fee Receipt',
    docNumber: r.receiptNumber,
    meta: [
      ['Date', ddmmyyyy(r.paidOn)],
      ['Student', r.studentName],
      ['Roll number', r.rollNumber ?? '-'],
      ['Batch', r.batchName ?? '-'],
      ['Payment mode', r.mode.replace(/_/g, ' ')],
      ['Reference', r.reference ?? '-'],
      ...(r.academicYear ? ([['Academic year', r.academicYear]] as Array<[string, string]>) : []),
      ...(r.receivedBy ? ([['Received by', r.receivedBy]] as Array<[string, string]>) : []),
    ],
    sections: [
      {
        table: {
          columns: [
            { header: 'Particulars', width: 5 },
            { header: 'Amount', width: 2, align: 'right' },
          ],
          rows: [[r.feeTitle, money(r.amount)]],
          totals: [['Amount received', money(r.amount)]],
        },
      },
      {
        heading: 'Fee status',
        keyValues: [
          ['Total fee', money(r.feeTotal)],
          ['Paid to date', money(r.paidToDate)],
          ['Balance due', money(balance)],
        ],
      },
      ...(r.voided ? [{ paragraph: `This receipt has been cancelled${r.voidReason ? `: ${r.voidReason}` : '.'}` }] : []),
    ],
    note: 'This is a computer generated receipt and is valid without a physical stamp.',
  };
}

export interface ReportCardInput {
  studentName: string;
  rollNumber?: string;
  batchName: string;
  academicYear?: string;
  attendancePct?: number;
  rows: Array<{ title: string; subject: string; date: string; max: number; obtained: number | null; pct: number | null; grade: string | null; status: string }>;
  generatedOn?: string;
}

export function reportCardSpec(r: ReportCardInput): DocSpec {
  const scored = r.rows.filter((x) => x.obtained !== null);
  const obtained = scored.reduce((a, x) => a + (x.obtained ?? 0), 0);
  const max = scored.reduce((a, x) => a + x.max, 0);
  const pct = max > 0 ? Math.round((obtained / max) * 1000) / 10 : null;
  return {
    title: 'Student Report Card',
    meta: [
      ['Student', r.studentName],
      ['Roll number', r.rollNumber ?? '-'],
      ['Batch', r.batchName],
      ['Academic year', r.academicYear ?? '-'],
      ...(r.attendancePct !== undefined ? ([['Attendance', `${num(r.attendancePct)}%`]] as Array<[string, string]>) : []),
    ],
    sections: [
      {
        heading: 'Assessment results',
        table: {
          columns: [
            { header: 'Assessment', width: 4 },
            { header: 'Subject', width: 2.4 },
            { header: 'Date', width: 1.8 },
            { header: 'Max', width: 1, align: 'right' },
            { header: 'Marks', width: 1.2, align: 'right' },
            { header: '%', width: 1, align: 'right' },
            { header: 'Grade', width: 1, align: 'center' },
          ],
          rows: r.rows.map((x) => [
            x.title,
            x.subject,
            ddmmyyyy(x.date),
            num(x.max),
            x.obtained === null ? x.status : num(x.obtained),
            x.pct === null ? '-' : num(x.pct),
            x.grade ?? '-',
          ]),
          totals: [['Overall', max > 0 ? `${num(obtained)} / ${num(max)}${pct !== null ? ` (${num(pct)}%)` : ''}` : '-']],
        },
      },
    ],
    note: 'Only results published by the institute are shown.',
    generatedOn: r.generatedOn,
  };
}

export interface SalarySlipInput {
  facultyName: string;
  designation?: string;
  payPeriod: string;
  compensationModel: string;
  classesConducted: number;
  baseAmount: number;
  additions: number;
  deductions: number;
  advances: number;
  netPayable: number;
  status: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  remarks?: string;
}

export function salarySlipSpec(s: SalarySlipInput): DocSpec {
  return {
    title: 'Salary Slip',
    docNumber: `SAL-${s.payPeriod}`,
    meta: [
      ['Employee', s.facultyName],
      ['Designation', s.designation ?? '-'],
      ['Pay period', s.payPeriod],
      ['Pay model', s.compensationModel.replace(/_/g, ' ')],
      ['Classes conducted', String(s.classesConducted)],
      ['Status', s.status.replace(/_/g, ' ')],
      ...(s.paymentDate ? ([['Paid on', ddmmyyyy(s.paymentDate)]] as Array<[string, string]>) : []),
      ...(s.paymentMethod ? ([['Paid via', s.paymentMethod.replace(/_/g, ' ')]] as Array<[string, string]>) : []),
      ...(s.paymentReference ? ([['Reference', s.paymentReference]] as Array<[string, string]>) : []),
    ],
    sections: [
      {
        table: {
          columns: [
            { header: 'Earnings', width: 3 },
            { header: 'Amount', width: 1.4, align: 'right' },
            { header: 'Deductions', width: 3 },
            { header: 'Amount', width: 1.4, align: 'right' },
          ],
          rows: [
            ['Base pay', money(s.baseAmount), 'Deductions', money(s.deductions)],
            ['Additions / incentives', money(s.additions), 'Advances recovered', money(s.advances)],
          ],
          totals: [['Net payable', money(s.netPayable)]],
        },
      },
      ...(s.remarks ? [{ heading: 'Remarks', paragraph: s.remarks }] : []),
    ],
    note: 'This is a computer generated salary slip.',
  };
}

export interface AttendanceBatchInput {
  batchName: string;
  from: string;
  to: string;
  sessions: number;
  rows: Array<{ roll: string; name: string; present: number; absent: number; late: number; excused: number }>;
}
export function attendanceBatchSpec(a: AttendanceBatchInput): DocSpec {
  const pct = (r: AttendanceBatchInput['rows'][number]) => {
    const total = r.present + r.absent + r.late + r.excused;
    return total ? Math.round(((r.present + r.late) / total) * 1000) / 10 : 0;
  };
  return {
    title: 'Attendance Report',
    meta: [
      ['Batch', a.batchName],
      ['Period', `${ddmmyyyy(a.from)} to ${ddmmyyyy(a.to)}`],
      ['Sessions held', String(a.sessions)],
      ['Students', String(a.rows.length)],
    ],
    sections: [
      {
        table: {
          columns: [
            { header: 'Roll', width: 1.4 },
            { header: 'Student', width: 4 },
            { header: 'Present', width: 1.2, align: 'right' },
            { header: 'Absent', width: 1.2, align: 'right' },
            { header: 'Late', width: 1, align: 'right' },
            { header: 'Excused', width: 1.2, align: 'right' },
            { header: 'Attendance', width: 1.5, align: 'right' },
          ],
          rows: a.rows.map((r) => [r.roll, r.name, String(r.present), String(r.absent), String(r.late), String(r.excused), `${num(pct(r))}%`]),
        },
      },
    ],
    note: 'Attendance % counts Present and Late as attended.',
  };
}

export interface AttendanceStudentInput {
  studentName: string;
  rollNumber?: string;
  batchName: string;
  from: string;
  to: string;
  records: Array<{ date: string; status: string; note?: string }>;
}
export function attendanceStudentSpec(a: AttendanceStudentInput): DocSpec {
  const c = (s: string) => a.records.filter((r) => r.status === s).length;
  const total = a.records.length;
  const pct = total ? Math.round(((c('PRESENT') + c('LATE')) / total) * 1000) / 10 : 0;
  return {
    title: 'Student Attendance Report',
    meta: [
      ['Student', a.studentName],
      ['Roll number', a.rollNumber ?? '-'],
      ['Batch', a.batchName],
      ['Period', `${ddmmyyyy(a.from)} to ${ddmmyyyy(a.to)}`],
      ['Sessions', String(total)],
      ['Attendance', `${num(pct)}%`],
    ],
    sections: [
      { keyValues: [['Present', String(c('PRESENT'))], ['Absent', String(c('ABSENT'))], ['Late', String(c('LATE'))], ['Excused', String(c('EXCUSED'))]] },
      {
        table: {
          columns: [
            { header: 'Date', width: 2 },
            { header: 'Status', width: 2 },
            { header: 'Note', width: 5 },
          ],
          rows: a.records.map((r) => [ddmmyyyy(r.date), r.status, r.note ?? '']),
        },
      },
    ],
  };
}

export interface ResultSheetInput {
  title: string;
  subject: string;
  batchName: string;
  date: string;
  maxMarks: number;
  passingMarks?: number;
  published: boolean;
  rows: Array<{ roll: string; name: string; obtained: number | null; pct: number | null; grade: string | null; status: string }>;
}
export function resultSheetSpec(r: ResultSheetInput): DocSpec {
  const scored = r.rows.filter((x) => x.obtained !== null);
  const avg = scored.length ? scored.reduce((a, x) => a + (x.obtained ?? 0), 0) / scored.length : 0;
  const high = scored.length ? Math.max(...scored.map((x) => x.obtained ?? 0)) : 0;
  const passed = r.passingMarks === undefined ? undefined : scored.filter((x) => (x.obtained ?? 0) >= (r.passingMarks ?? 0)).length;
  return {
    title: 'Result Sheet',
    meta: [
      ['Assessment', r.title],
      ['Subject', r.subject],
      ['Batch', r.batchName],
      ['Date', ddmmyyyy(r.date)],
      ['Maximum marks', num(r.maxMarks)],
      ['Passing marks', r.passingMarks === undefined ? '-' : num(r.passingMarks)],
      ['Appeared', `${scored.length} of ${r.rows.length}`],
      ['Class average', scored.length ? num(Math.round(avg * 10) / 10) : '-'],
      ['Highest', scored.length ? num(high) : '-'],
      ['Passed', passed === undefined ? '-' : String(passed)],
      ['Status', r.published ? 'Published' : 'DRAFT - not published'],
    ],
    sections: [
      {
        table: {
          columns: [
            { header: 'Roll', width: 1.4 },
            { header: 'Student', width: 4 },
            { header: 'Marks', width: 1.3, align: 'right' },
            { header: '%', width: 1, align: 'right' },
            { header: 'Grade', width: 1, align: 'center' },
            { header: 'Result', width: 1.6 },
          ],
          rows: r.rows.map((x) => [
            x.roll,
            x.name,
            x.obtained === null ? '-' : num(x.obtained),
            x.pct === null ? '-' : num(x.pct),
            x.grade ?? '-',
            x.obtained !== null && r.passingMarks !== undefined ? (x.obtained >= r.passingMarks ? 'Pass' : 'Fail') : x.status,
          ]),
        },
      },
    ],
  };
}
