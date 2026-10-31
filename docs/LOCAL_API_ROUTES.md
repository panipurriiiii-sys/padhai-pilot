# Local API routes (api-core) - academic core

Types are exported from `@padhai-pilot/shared` (`packages/shared/src/types/academic.ts`). Roles: **STAFF** = TUITION_OWNER, INSTITUTE_ADMIN, INSTITUTE_MANAGER, FACULTY, TEACHER; **MGMT** = the first three. Tenant and role always come from the JWT. Faculty only see/act on batches they lead or are assigned to (others -> 403, other tenants -> 404). All lists are bounded (`?limit=`). DB down -> 503.

## Batches (`/teacher`, STAFF)
| Method | Path | Notes / types |
|---|---|---|
| GET | `/teacher/batches?includeArchived=true&limit=` | `TeacherBatch[]` |
| POST | `/teacher/batches` | body `CreateBatchPayload` -> `TeacherBatch` (201). `teacherId` MGMT only. Duplicate code -> 409 |
| PATCH | `/teacher/batches/:batchId` | body `UpdateBatchPayload` -> `TeacherBatch`. Lead teacher or MGMT only |
| POST | `/teacher/batches/:batchId/archive` , `/unarchive` | -> `TeacherBatch` (data kept) |
| POST | `/teacher/batches/:batchId/promote` | body `PromoteBatchPayload` (`targetBatchId` XOR `newBatch`) -> `PromoteBatchResult`. Idempotent: repeat returns `alreadyPromoted:true`, `movedCount:0`. Source enrolments become `PROMOTED` (history kept), target gets new ACTIVE rows |
| GET | `/teacher/batches/:batchId/students` | `BatchRoster` (ACTIVE only; roll number comes from the enrolment) |
| PATCH | `/teacher/batches/:batchId/students/:studentId` | body `{rollNumber}` |
| DELETE | `/teacher/batches/:batchId/students/:studentId` | enrolment -> REMOVED (lead/MGMT) |

## Enrollment codes (`/teacher/invitations`, STAFF) - same routes for web and mobile
No default expiry (`expiresAt:null`). Code format `ABCD-EF23`. Responses are `EnrollmentCode` (includes `status` ACTIVE|EXPIRED|REVOKED|EXHAUSTED, `remainingUses`, `shareText`, `shareLink`; set `STUDENT_PORTAL_URL` for absolute links, link is `<base>/?code=CODE`).
| Method | Path | Notes |
|---|---|---|
| GET | `/teacher/invitations?batchId=&limit=` | `EnrollmentCode[]` (MGMT: whole institute; faculty: own + their batches) |
| POST | `/teacher/invitations` | `CreateEnrollmentCodePayload` (batchId required for faculty; `expiryDays` legacy still accepted) |
| PATCH | `/teacher/invitations/:id` | `UpdateEnrollmentCodePayload`: change `maxUses` (>= usedCount), set/clear `expiresAt` (null clears), `label` |
| POST | `/teacher/invitations/:id/revoke` | `{success, message, code}`; `:id` may also be the code string (old clients) |
| POST | `/teacher/invitations/:id/reactivate` | `EnrollmentCode` |
| POST | `/teacher/invitations/:id/regenerate` | `EnrollmentCode` with a new code string (old string dies; usage/limits kept) |
| POST | `/invitations/validate` (public, rate-limited) | `{code}` -> `{valid, batchName, instituteName}` |
| POST | `/student/validate-invitation`, `/student/join-batch` | unchanged routes; redemption is atomic (guarded `updateMany`), idempotent, rejects archived batches, null expiry supported, code is case-insensitive |

## Weekly timetable (STAFF)
| Method | Path | Notes |
|---|---|---|
| GET | `/teacher/timetable?batchId=` | `TimetableSlotItem[]` (all batches the caller may see) |
| GET | `/teacher/batches/:batchId/timetable` | `TimetableSlotItem[]` |
| POST | `/teacher/batches/:batchId/timetable` | `CreateTimetableSlotPayload` -> `TimetableSlotItem` (201). Times 24h `HH:mm`. Overlap on same teacher / room / batch the same day -> **409** `TimetableConflictError` |
| PATCH | `/teacher/timetable/:slotId` | `UpdateTimetableSlotPayload` (same conflict rules) |
| DELETE | `/teacher/timetable/:slotId` | `{success:true}` |
| GET | `/student/timetable` (STUDENT, existing) | slots of the student's ACTIVE batches only, grouped by day |

## Academic broadcast (STAFF)
| Method | Path | Notes |
|---|---|---|
| GET | `/teacher/announcements?batchId=&limit=` | `BroadcastItem[]` |
| POST | `/teacher/announcements` | `CreateBroadcastPayload` -> `CreateBroadcastResult`. No `batchId` = whole institute (MGMT only). Creates one `Notification` (type ANNOUNCEMENT, dedupeKey `announcement:<id>`) per active student |
| DELETE | `/teacher/announcements/:id` | author or MGMT; also removes its notifications |
| GET | `/student/announcements` (STUDENT, existing) | institute-wide + own batches |

## Other changes
* `POST /teacher/assignments` accepts optional `attachmentUrl` (http/https).
* `GET /teacher/reports` now returns real aggregates (rates are `null` when there is no data).
* Attendance `POST /teacher/attendance` rejects students not actively enrolled in the batch.
* Migration: `apps/api/prisma/migrations/20261101000000_academic_core` (additive: Batch.schedule/archivedAt, Enrollment.endedAt/promotedFromBatchId, InvitationCode.expiresAt nullable + label/revokedAt/updatedAt, TimetableSlot.notes/updatedAt, table BatchPromotion).

## Faculty onboarding and admin (changed)
* `POST /faculty-invitations` (MGMT) -> `{token, acceptPath: "/join-faculty?token=...", expiresAt, deliveryStatus:"NOT_SENT"}`; token shown once, only its sha256 is stored; expiry 1..30 days; supersedes earlier pending invites for the same email.
* `GET /faculty-invitations` (MGMT) list; `POST /faculty-invitations/:id/revoke`; `POST /faculty-invitations/:id/resend` (rotates the token).
* `GET /faculty-invitations/:token` public preview; `POST /faculty-invitations/accept` `{token,password,fullName?,phone?}`: atomic single-use claim; an existing account must give its current password (never overwritten), existing owner/student memberships are refused.
* `POST /tuition/faculties` no longer creates users (400 -> use invitations); it only updates people who already hold a FACULTY/TEACHER membership.
* `/tuition/diaries`, `/tuition/materials`: faculty see only their own / their batches' entries; students see only enrolled-batch materials (none -> `[]`).
* `/admin/*` (SUPER_ADMIN): now PostgreSQL-backed; 503 when DB is down; `GET /admin/stats` users no longer has `estimatedDailyActive`.

## finance / leaves / branding / pdf / attachments

### Batch fees (staff) - prefix `/finance`
| Method | Path | Body / query | Returns |
|---|---|---|---|
| POST | `/finance/batches/:batchId/structures` | `CreateBatchFeeStructureRequest` (`title`, either `amount`+`dueDate` or `instalments[{label?,amount,dueDate}]`, `academicYear?`) | `BatchFeeStructureItem`. Creates a PENDING `StudentFeeRecord` per ACTIVE enrolled student per instalment. New joins via invite code inherit active structures automatically (`inheritBatchFees` in `finance/fee-core.ts`; api-core must call it in any other enrolment path: manual add, batch promotion). |
| GET | `/finance/batches/:batchId/structures` | | `BatchFeeStructureItem[]` |
| POST | `/finance/structures/:id/void` | `{reason}` | `{success}`; 409 if live payments exist |
| GET | `/finance/batches/:batchId/fees?studentId=` | | `FeeLedgerItem[]` (status computed: PENDING/PARTIAL/PAID/OVERDUE; includes payments) |
| GET | `/finance/batches/:batchId/summary` | | `BatchFeeSummary` |
| POST | `/finance/fees/:feeRecordId/payments` | `RecordFeePaymentRequest` (`amount`, `paidOn` YYYY-MM-DD, `mode`, `reference?`, `note?`) | `FeePaymentItem` (numbered receipt `RCT-YYYY-00001`). Overpayment 400. Student gets an in-app notification. |
| POST | `/finance/payments/:paymentId/void` | `{reason}` | `FeePaymentItem` (status VOIDED; receipt row/number kept, immutable). "Edit" = void + record again. |
| POST | `/finance/reminders/send` | `SendFeeRemindersRequest` | `SendFeeRemindersResult`. On demand, no cron. In-app = real notification rows; EMAIL/SMS/WHATSAPP are stored `NOT_SENT` (no provider). Deduped per fee+channel+day. |

### Student fees - `STUDENT`
| GET | `/student/finance/fees` | | `StudentFeeLedger` (fees with payments, balance, overdue, `receipts[]`) |
(Existing `GET /student/fees` is unchanged.) Notifications appear in the existing student notifications endpoint (`type` FEE_PAYMENT, FEE_PAYMENT_VOID, FEE_REMINDER, STUDENT_LEAVE_REVIEW).

### Student leave
| Method | Path | Role | Body | Returns |
|---|---|---|---|---|
| POST | `/student/leaves` | STUDENT | `ApplyStudentLeaveRequest` | `StudentLeaveItem` (teacher of the batch is notified) |
| GET | `/student/leaves` | STUDENT | | `StudentLeaveItem[]` |
| POST | `/student/leaves/:id/cancel` | STUDENT | | `StudentLeaveItem` (PENDING only) |
| GET | `/finance/leaves?status=&batchId=` | staff | | `StudentLeaveItem[]` (owner: all; teacher: own batches) |
| PUT | `/finance/leaves/:id/review` | staff of that batch | `{status:'APPROVED'\|'REJECTED', remarks?}` (remarks required on reject) | `StudentLeaveItem`; student notified |

### Branding / letterhead
| GET | `/branding` | any signed-in user | | `InstituteLetterhead` (read-only for students/faculty) |
| PUT | `/branding` | TUITION_OWNER, INSTITUTE_ADMIN, INSTITUTE_MANAGER | partial `InstituteLetterhead` (`null`/`''` clears) | `InstituteLetterhead` |

Logo flow: upload the image with the existing `POST /tuition/media-upload` (20 MB preflight unchanged), then `PUT /branding {logoUrl}` with the returned URL. `logoUrl` must be https on `media.dhyey.cc`, `*.dhyey.cc` or `media-hosting.dhyeyp254.workers.dev` and end in `.png/.jpg/.jpeg` (PDF embedding supports PNG/JPEG only). `PUT /tuition/profile` applies the same validation.

### PDF documents - prefix `/documents` (server rendered, `application/pdf`, `Cache-Control: private, no-store`)
Fetch with the bearer token as a blob and open/save it (a plain `<a href>` cannot send the header). Header = institute logo/name/address/contact, footer = institute footer text, signatory block = institute signatory. The platform name is never printed.

| GET | Path | Roles |
|---|---|---|
| | `/documents/fee-receipt/:paymentId` | staff of the batch, or the paying student |
| | `/documents/report-card/:studentId?batchId=` | staff of the batch; student (own, `:studentId` ignored; published results only) |
| | `/documents/salary-slip/:salaryRecordId` | management, or the faculty member (non-DRAFT) |
| | `/documents/attendance-report?batchId=&studentId=&from=&to=` | staff (batch roster, or one student); student (self; `batchId` optional if enrolled in one batch). Range <= 1 year, default last 30 days. |
| | `/documents/result-sheet/:assessmentId` | staff of the batch |

### Assignment attachments
- `POST /teacher/assignments` accepts `attachmentUrl?` (same host/extension validation: pdf, doc(x), ppt(x), xls(x), txt, png, jpg).
- `PUT /teacher/assignments/:assignmentId` (new) edits title/instructions/subject/dueDate/maxMarks and `attachmentUrl` (`null`/`''` removes).
- `GET /student/assignments` already returns `attachmentUrl` per assignment.

### Schema / migration
Models `BatchFeeStructure`, `FeePayment`, `InstituteCounter`, `StudentLeaveApplication` in a separated block at the end of `schema.prisma`; additive columns on `StudentFeeRecord` (`structureId`, `instalmentNo`, `voidedAt`, `voidReason`, unique `[structureId, studentId, instalmentNo]`). Migration `20261031000300_finance_leaves` (offline `migrate diff`, not applied anywhere).
