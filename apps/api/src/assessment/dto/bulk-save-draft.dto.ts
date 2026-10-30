import { AssessmentType, AttendanceStatus, SubjectScoreConfig } from '@padhai-pilot/shared';

export class SubjectScoreConfigDto implements SubjectScoreConfig {
  name!: string;
  maxMarks!: number;
  passingMarks?: number;
}

export class MarkDraftEntryDto {
  studentId!: string;
  attendanceStatus!: AttendanceStatus;
  obtainedMarks?: number | null;
  subjectMarks?: Record<string, number | null>;
  feedback?: string;
  isEligible?: boolean;
}

export class BulkSaveDraftDto {
  assessmentId?: string;
  batchId!: string;
  subject!: string;
  subjects?: SubjectScoreConfigDto[];
  isMultiSubject?: boolean;
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
