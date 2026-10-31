# Local API routes

(api-core owns the other sections; this file holds the **finance / leaves / branding / pdf / attachments** section from `local/api-finance-docs`. Types: `packages/shared/src/types/finance.ts`.)

All routes need `Authorization: Bearer <jwt>` (or the session cookie). Tenant id and user id come from the JWT only. "Staff" = TUITION_OWNER, INSTITUTE_ADMIN, INSTITUTE_MANAGER, FACULTY, TEACHER; non-management staff act only on batches they lead/are assigned to (else 403; other-institute ids 404).

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
