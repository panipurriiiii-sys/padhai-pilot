export class CreateFacultyInvitationDto {
  email!: string;
  fullName?: string;
  designation!: string;
  assignedSubjects!: string[];
  batchIds?: string[];
  delegatedPermissions?: string[];
  compensationType?: string;
  baseSalary?: number;
  hourlyRate?: number;
  expiryDays?: number;
}

export class AcceptFacultyInvitationDto {
  token!: string;
  password!: string;
  fullName?: string;
  phone?: string;
}
