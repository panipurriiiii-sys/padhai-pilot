export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'TUITION_OWNER' | 'INSTITUTE_ADMIN' | 'TEACHER' | 'STUDENT';
  instituteId: string;
  instituteName: string;
  avatarUrl?: string;
}
