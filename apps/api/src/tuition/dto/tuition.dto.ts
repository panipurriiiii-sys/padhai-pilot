import type {
  EmploymentStatus,
  CompensationType,
  SalaryStatus,
  LeaveType,
  TeachingDiaryAudience,
  TeachingDiaryStatus,
  StudyMaterialCategory,
  DelegatedPermission,
  ReminderChannel,
} from '@padhai-pilot/shared';

export class UpdateTuitionProfileDto {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  description?: string;
  footerText?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  academicYear?: string;
}

export class CreateFacultyDto {
  fullName!: string;
  email!: string;
  phone?: string;
  designation!: string;
  staffId!: string;
  compensationType!: CompensationType;
  baseSalary!: number;
  hourlyRate?: number;
  assignedSubjects!: string[];
  delegatedPermissions?: DelegatedPermission[];
  batchIds?: string[];
}

export class UpdateFacultyDto {
  fullName?: string;
  phone?: string;
  designation?: string;
  employmentStatus?: EmploymentStatus;
  compensationType?: CompensationType;
  baseSalary?: number;
  hourlyRate?: number;
  assignedSubjects?: string[];
  delegatedPermissions?: DelegatedPermission[];
  batchIds?: string[];
}

export class GenerateSalaryRecordDto {
  facultyId!: string;
  payPeriod!: string; // YYYY-MM
  compensationModel!: CompensationType;
  classesConducted?: number;
  baseAmount!: number;
  additions?: number;
  deductions?: number;
  advances?: number;
  remarks?: string;
}

export class RecordPaymentDto {
  paymentMethod!: string;
  paymentReference!: string;
  paymentDate!: string;
  remarks?: string;
}

export class ApplyFacultyLeaveDto {
  leaveType!: LeaveType;
  startDate!: string;
  endDate!: string;
  totalDays!: number;
  reason!: string;
  attachmentUrl?: string;
  substituteFacultyId?: string;
}

export class ReviewFacultyLeaveDto {
  status!: 'APPROVED' | 'REJECTED';
  reviewerRemarks?: string;
  substituteFacultyId?: string;
}

export class CreateTeachingDiaryDto {
  batchId!: string;
  lessonDate!: string;
  sessionTime?: string;
  subject!: string;
  chapterTitle!: string;
  conceptsTaught!: string;
  learningObjectives?: string;
  teachingMethods?: string;
  durationMinutes?: number;
  homeworkAssigned?: string;
  referenceLinks?: string[];
  attachmentUrl?: string;
  followUpPlan?: string;
  status?: TeachingDiaryStatus;
  audience?: TeachingDiaryAudience;
}

export class UpdateTeachingDiaryDto {
  lessonDate?: string;
  sessionTime?: string;
  subject?: string;
  chapterTitle?: string;
  conceptsTaught?: string;
  learningObjectives?: string;
  teachingMethods?: string;
  durationMinutes?: number;
  homeworkAssigned?: string;
  referenceLinks?: string[];
  attachmentUrl?: string;
  followUpPlan?: string;
  status?: TeachingDiaryStatus;
  audience?: TeachingDiaryAudience;
}

export class CreateStudyMaterialDto {
  batchId!: string;
  title!: string;
  category!: StudyMaterialCategory;
  subject!: string;
  chapter?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isStudentVisible?: boolean;
}

export class CreateStudentFeeRecordDto {
  studentId!: string;
  batchId?: string;
  feeTitle!: string;
  totalAmount!: number;
  paidAmount?: number;
  dueDate!: string;
  academicYear?: string;
}

export class DispatchFeeReminderDto {
  feeRecordId!: string;
  channel!: ReminderChannel;
  customMessage?: string;
}
