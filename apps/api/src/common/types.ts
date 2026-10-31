export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role:
    | 'SUPER_ADMIN'
    | 'TUITION_OWNER'
    | 'INSTITUTE_ADMIN'
    | 'INSTITUTE_MANAGER'
    | 'FACULTY'
    | 'TEACHER'
    | 'STUDENT';
  instituteId: string;
  instituteName: string;
  avatarUrl?: string;
  /** User.tokenVersion at issue time; checked on every request (see AccessService). */
  tv?: number;
}
