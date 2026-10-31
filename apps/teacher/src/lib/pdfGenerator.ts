import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  ClassroomAssessment,
  AssessmentMarkItem,
  SubjectScoreConfig,
  AttendanceStatus,
} from '@padhai-pilot/shared';

export interface GeneratePdfOptions {
  assessment: {
    title: string;
    subject: string;
    subjects?: SubjectScoreConfig[];
    isMultiSubject?: boolean;
    batchName?: string;
    assessmentDate: string;
    category?: string;
    maxMarks: number;
    passingMarks?: number;
  };
  roster: AssessmentMarkItem[];
  instituteName?: string;
}

export function generateAssessmentResultPdf({
  assessment,
  roster,
  instituteName = '',
}: GeneratePdfOptions): jsPDF {
  // Use landscape if more than 3 subjects for wide table readability
  const isMulti = assessment.isMultiSubject && (assessment.subjects?.length ?? 0) > 0;
  const isWide = isMulti && (assessment.subjects?.length ?? 0) >= 3;
  const orientation = isWide ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch

  // 1. BRANDING HEADER
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 56, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(instituteName.toUpperCase(), margin, 26);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('OFFICIAL ACADEMIC EVALUATION & MARKS REGISTER', margin, 42);

  const genDateStr = `Generated: ${new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`;
  doc.text(genDateStr, pageWidth - margin, 42, { align: 'right' });

  // 2. ASSESSMENT METADATA BOX
  let currentY = 72;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 54, 4, 4, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(assessment.title, margin + 12, currentY + 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const subText = isMulti
    ? `Combined Subjects: ${assessment.subjects?.map((s) => s.name).join(', ')}`
    : `Subject: ${assessment.subject}`;
  const batchText = `Batch: ${assessment.batchName || 'Default Batch'}`;
  const dateText = `Date: ${assessment.assessmentDate}`;
  const maxText = `Max Marks: ${assessment.maxMarks} (Pass: ${assessment.passingMarks || Math.round(assessment.maxMarks * 0.4)})`;

  doc.text(`${batchText}  |  ${subText}`, margin + 12, currentY + 34);
  doc.text(`${dateText}  |  ${maxText}`, margin + 12, currentY + 46);

  // Stats pill in metadata
  const total = roster.length;
  const present = roster.filter((r) => r.attendanceStatus === 'PRESENT').length;
  const absent = roster.filter((r) => r.attendanceStatus === 'ABSENT').length;
  const scored = roster.filter((r) => r.obtainedMarks !== null && r.obtainedMarks !== undefined);
  const avg =
    scored.length > 0
      ? Math.round(scored.reduce((s, r) => s + (r.obtainedMarks || 0), 0) / scored.length)
      : 0;

  const statsColX = pageWidth - margin - 12;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Enrolled: ${total} | Present: ${present} | Absent: ${absent}`, statsColX, currentY + 24, {
    align: 'right',
  });
  doc.text(`Class Average: ${avg} / ${assessment.maxMarks}`, statsColX, currentY + 40, {
    align: 'right',
  });

  currentY += 66;

  // 3. TABLE COLUMNS SETUP
  const tableHeaders: string[] = ['Roll No', 'Student Name', 'Status'];

  if (isMulti && assessment.subjects && assessment.subjects.length > 0) {
    assessment.subjects.forEach((s) => {
      tableHeaders.push(`${s.name} (${s.maxMarks})`);
    });
    tableHeaders.push(`Total (${assessment.maxMarks})`);
  } else {
    tableHeaders.push(`Obtained (${assessment.maxMarks})`);
  }

  tableHeaders.push('Percentage', 'Grade', 'Result');

  // Table Body Rows
  const tableData: (string | number)[][] = roster.map((row) => {
    const isAbsent = row.attendanceStatus === 'ABSENT';
    const rowValues: (string | number)[] = [
      row.rollNumber || '--',
      row.studentName,
      row.attendanceStatus,
    ];

    if (isMulti && assessment.subjects && assessment.subjects.length > 0) {
      assessment.subjects.forEach((s) => {
        if (isAbsent) {
          rowValues.push('AB');
        } else {
          const score = row.subjectMarks?.[s.name];
          rowValues.push(score !== undefined && score !== null ? score : '--');
        }
      });
      rowValues.push(isAbsent ? 'AB' : row.obtainedMarks !== null && row.obtainedMarks !== undefined ? row.obtainedMarks : '--');
    } else {
      rowValues.push(isAbsent ? 'AB' : row.obtainedMarks !== null && row.obtainedMarks !== undefined ? row.obtainedMarks : '--');
    }

    rowValues.push(
      isAbsent ? '--' : row.percentage !== null && row.percentage !== undefined ? `${Math.round(row.percentage)}%` : '--',
    );
    rowValues.push(isAbsent ? '--' : row.grade || '--');
    rowValues.push(
      isAbsent
        ? 'ABSENT'
        : row.percentage !== null && row.percentage !== undefined
        ? row.percentage >= 40
          ? 'PASSED'
          : 'FAILED'
        : 'PENDING',
    );

    return rowValues;
  });

  // Render Table
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableData,
    margin: { left: margin, right: margin, bottom: 60 },
    theme: 'grid',
    headStyles: {
      fillColor: [29, 78, 216], // primary blue #1D4ED8
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 4.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 46 }, // Roll No
      1: { halign: 'left' },                  // Name
      2: { halign: 'center', cellWidth: 54 }, // Status
    },
    didParseCell: (data) => {
      // Style Absent rows / cells
      if (data.section === 'body') {
        const row = roster[data.row.index];
        if (row && row.attendanceStatus === 'ABSENT') {
          if (data.column.index === 2) {
            data.cell.styles.textColor = [239, 68, 68]; // red
            data.cell.styles.fontStyle = 'bold';
          }
        } else if (data.column.index === 2) {
          data.cell.styles.textColor = [16, 185, 129]; // green
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // 4. SIGNATURES & VERIFICATION FOOTER
  const finalY = (doc as any).lastAutoTable?.finalY || pageHeight - 80;
  const sigY = Math.min(finalY + 36, pageHeight - 48);

  // If table ran close to bottom, add new page for signature block
  if (sigY > pageHeight - 40) {
    doc.addPage();
    renderSignatureBlock(doc, margin, pageWidth, 60);
  } else {
    renderSignatureBlock(doc, margin, pageWidth, sigY);
  }

  return doc;
}

function renderSignatureBlock(doc: jsPDF, margin: number, pageWidth: number, y: number) {
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(margin, y, margin + 140, y);
  doc.line(pageWidth - margin - 140, y, pageWidth - margin, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Evaluator / Teacher Signature', margin, y + 12);
  doc.text('Principal / Director Stamp', pageWidth - margin - 140, y + 12);
}

export function downloadAssessmentResultPdf(options: GeneratePdfOptions, filename?: string): void {
  const doc = generateAssessmentResultPdf(options);
  const cleanTitle = (options.assessment.title || 'Assessment_Results').replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalName = filename || `Result_Sheet_${cleanTitle}.pdf`;
  doc.save(finalName);
}

