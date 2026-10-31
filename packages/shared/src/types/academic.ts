// Academic-core API contract (batches, enrolment codes, promotion, weekly timetable, broadcast).
// Single source of truth for apps/api, apps/teacher, apps/student and apps/mobile.
// Routes are listed in docs/LOCAL_API_ROUTES.md.

export type WeekDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// ---------------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------------

/** Row of GET /teacher/batches (BatchSummary in index.ts plus lifecycle fields). */
export interface TeacherBatch {
  id: string;
  instituteId: string;
  name: string;
  code: string;
  subject: string;
  gradeLevel: string;
  room: string | null;
  schedule: string | null;
  teacherId: string;
  teacherName?: string;
  isActive: boolean;
  archivedAt: string | null;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchPayload {
  name: string;
  code?: string;
  subject: string;
  gradeLevel?: string;
  room?: string;
  schedule?: string;
  /** Management roles only: assign another active faculty member as lead teacher. */
  teacherId?: string;
}

/** PATCH /teacher/batches/:batchId. Every field is optional; send only what changes. */
export interface UpdateBatchPayload {
  name?: string;
  code?: string;
  subject?: string;
  gradeLevel?: string;
  room?: string | null;
  schedule?: string | null;
}

export interface PromoteBatchPayload {
  /** Existing target batch in the same institute. Exactly one of targetBatchId / newBatch is required. */
  targetBatchId?: string;
  /** Create the target batch as part of the promotion (the caller becomes its lead teacher). */
  newBatch?: CreateBatchPayload;
  /** Optional subset of student ids. Default: every ACTIVE enrolment of the source batch. */
  studentIds?: string[];
  /** Archive the source batch once its roster has been moved. Default false. */
  archiveSource?: boolean;
}

export interface PromoteBatchResult {
  success: boolean;
  promotionId: string | null;
  sourceBatchId: string;
  targetBatchId: string;
  targetBatchName: string;
  /** Students moved by THIS call. 0 on an idempotent repeat. */
  movedCount: number;
  /** Students skipped (already ACTIVE in the target batch, or not in the requested subset). */
  skippedCount: number;
  alreadyPromoted: boolean;
  sourceArchived: boolean;
}

export interface BatchRosterStudent {
  id: string;
  fullName: string;
  rollNumber: string;
  email: string;
  phone: string | null;
  enrollmentStatus: 'ACTIVE' | 'PROMOTED' | 'REMOVED';
  joinedAt: string;
}

export interface BatchRoster {
  batch: Pick<TeacherBatch, 'id' | 'name' | 'code' | 'subject' | 'gradeLevel' | 'room' | 'teacherId' | 'isActive'>;
  students: BatchRosterStudent[];
}

// ---------------------------------------------------------------------------
// Enrolment (invitation) codes
// ---------------------------------------------------------------------------

export type EnrollmentCodeStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'EXHAUSTED';

/** Row of GET /teacher/invitations and the response of every code mutation. */
export interface EnrollmentCode {
  id: string;
  code: string;
  instituteId: string;
  batchId: string | null;
  batchName: string | null;
  issuerId: string;
  issuerName?: string;
  label: string | null;
  maxUses: number;
  usedCount: number;
  remainingUses: number;
  /** null = never expires (the default). */
  expiresAt: string | null;
  isRevoked: boolean;
  status: EnrollmentCodeStatus;
  createdAt: string;
  updatedAt: string;
  /** Ready-to-paste message for WhatsApp / SMS, includes the code and the join link. */
  shareText: string;
  /** Deep link a student can open; the portal pre-fills the code. */
  shareLink: string;
}

export interface CreateEnrollmentCodePayload {
  /** Required for faculty; management may omit it for a general institute-admission code. */
  batchId?: string;
  /** 1..10000, default 100. */
  maxUses?: number;
  /** Optional absolute expiry (ISO). Omit or null = no expiry. */
  expiresAt?: string | null;
  /** Legacy convenience (web/mobile older builds): expiry in days from now. Omit = no expiry. */
  expiryDays?: number;
  label?: string;
}

/** PATCH /teacher/invitations/:id. Omit a field to leave it unchanged; expiresAt:null clears the expiry. */
export interface UpdateEnrollmentCodePayload {
  maxUses?: number;
  expiresAt?: string | null;
  expiryDays?: number | null;
  label?: string | null;
}

// ---------------------------------------------------------------------------
// Weekly timetable
// ---------------------------------------------------------------------------

export interface TimetableSlotItem {
  id: string;
  batchId: string;
  batchName: string;
  teacherId: string;
  teacherName?: string;
  subject: string;
  dayOfWeek: WeekDay;
  /** 24h "HH:mm". */
  startTime: string;
  endTime: string;
  room: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimetableSlotPayload {
  subject: string;
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  /** Management roles only; default = the batch's lead teacher (or the caller for faculty). */
  teacherId?: string;
}

export type UpdateTimetableSlotPayload = Partial<CreateTimetableSlotPayload>;

/** 409 body returned when a slot overlaps another one. */
export interface TimetableConflictError {
  statusCode: 409;
  message: string;
  conflicts: Array<{
    kind: 'TEACHER' | 'ROOM' | 'BATCH';
    slotId: string;
    batchName: string;
    dayOfWeek: WeekDay;
    startTime: string;
    endTime: string;
  }>;
}

// ---------------------------------------------------------------------------
// Academic broadcast
// ---------------------------------------------------------------------------

export interface BroadcastItem {
  id: string;
  instituteId: string;
  /** null = whole institute. */
  batchId: string | null;
  batchName: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT';
  createdAt: string;
}

export interface CreateBroadcastPayload {
  /** Omit for an institute-wide announcement (management roles only). */
  batchId?: string;
  title: string;
  content: string;
  priority?: 'NORMAL' | 'URGENT';
}

export interface CreateBroadcastResult extends BroadcastItem {
  /** In-app notification rows created for students (deduplicated per student + announcement). */
  notifiedCount: number;
}
