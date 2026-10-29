import { AssessmentType, AttendanceStatus } from '@padhai-pilot/shared';

export class MarkDraftEntryDto {
  studentId!: string;
  attendanceStatus!: AttendanceStatus;
  obtainedMarks?: number | null;
  feedback?: string;
  isEligible?: boolean;
}

export class BulkSaveDraftDto {
  assessmentId?: string;
  batchId!: string;
  subject!: string;
  title!: string;
  category?: AssessmentType;
  assessmentDate!: string;
  maxMarks!: number;
  passingMarks?: number;
  instructions?: string;
  marks!: MarkDraftEntryDto[];
}

export class CorrectMarkDto {
  obtainedMarks!: number;
  reason!: string;
}
