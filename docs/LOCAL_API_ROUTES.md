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
