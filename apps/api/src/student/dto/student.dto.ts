export class ValidateInvitationDto {
  code!: string;
}

export class JoinInstituteDto {
  code!: string;
}

export class SubmitAssignmentDto {
  content?: string;
  attachmentUrl?: string;
  isDraft?: boolean;
}

export class TestAnswerItemDto {
  questionId!: string;
  selectedOptionIndex?: number;
  textAnswer?: string;
}

export class SubmitTestAttemptDto {
  answers!: TestAnswerItemDto[];
}

export class AttendanceCorrectionRequestDto {
  sessionId?: string;
  date!: string;
  reason!: string;
}

export class CreateAcademicQueryDto {
  subject!: string;
  topic?: string;
  questionText!: string;
  attachmentUrl?: string;
  facultyId?: string;
}

export class CreateStudyTaskDto {
  title!: string;
  subject?: string;
  dueDate?: string;
  priority?: 'NORMAL' | 'HIGH' | 'LOW';
}

export class UpdateStudyTaskDto {
  isCompleted?: boolean;
  title?: string;
}

export class CreateSupportRequestDto {
  category!: 'PROFILE_CORRECTION' | 'ATTENDANCE_MISMATCH' | 'PAYMENT_ISSUE' | 'ACADEMIC_HELP' | 'TECHNICAL_SUPPORT';
  subject!: string;
  description!: string;
}

export class UpdateStudentProfileDto {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    results: boolean;
    fees: boolean;
  };
}
