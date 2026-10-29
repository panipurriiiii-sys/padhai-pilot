# PadhaiPilot — Advanced Tuition Management, Faculty, Payroll & Learning Diary

This specification documents the production implementation of the **Tuition Owner Model, Faculty Management, Payroll/Salary Statements, Leave Approvals, Daily Teaching Diary (Lesson Journal), Study Material Vault, and Fee Reminders** in PadhaiPilot.

---

## 1. Role Hierarchy & Multi-Tenant Authority

PadhaiPilot implements a 5-tier role hierarchy:

1. **`SUPER_ADMIN` (Platform Super Admin):** Platform governor who controls feature flags, tenant quotas, emergency kill switches, and platform configuration.
2. **`TUITION_OWNER` (Tuition / Coaching Class Owner):** Tenant owner who manages coaching identity, faculty remuneration, leave approvals, student fees, and institutional oversight.
3. **`INSTITUTE_ADMIN` (Delegated Operational Manager):** Operational administrators managing timetables, attendance registers, and marks entry.
4. **`TEACHER` (Faculty):** Subject teachers who log daily teaching diaries, take attendance, grade assignments, upload study materials, and submit leave requests.
5. **`STUDENT` (Enrolled Candidate):** Candidates enrolled in specific batches who view verified lesson notes, study materials, attendance, and fee status.

---

## 2. Database Models (PostgreSQL & Prisma)

The following models are fully persisted in `apps/api/prisma/schema.prisma`:

1. **`FacultyProfile`**: Links to `User` and `Institute`. Stores `staffId` (e.g. `FAC-101`), `designation`, `employmentStatus` (`ACTIVE`, `ON_LEAVE`, `PROBATION`, `INACTIVE`), `compensationType` (`FIXED_MONTHLY`, `HOURLY_PER_CLASS`), `baseSalary`, `hourlyRate`, `assignedSubjects`, and `delegatedPermissions`.
2. **`SalaryRecord`**: Monthly payroll ledger records for each faculty. Calculates `netPayable = baseAmount + additions - deductions - advances`. Tracks statuses `DRAFT` -> `REVIEWED` -> `APPROVED` -> `PAID`, with payment reference (UTR) and payment method.
3. **`FacultyLeaveApplication`**: Self-service faculty leave requests (`CASUAL`, `SICK`, `ACADEMIC_DUTY`, `EMERGENCY`). Mandatory rule enforced: **Reviewer cannot review or approve their own leave**. Supports substitute faculty assignment.
4. **`DailyTeachingDiary`**: Authoritative lesson journal entry recording date, session time, batch, subject, chapter title, concepts taught, learning objectives, homework assigned, reference links, and follow-up plan. Audience scoped (`PRIVATE_DRAFT`, `OWNER_ONLY`, `BATCH`).
5. **`StudyMaterial`**: Resource vault for chapter notes, DPP worksheets, formula sheets, handouts, and revision guides. Scoped to batches with student visibility controls.
6. **`StudentFeeRecord` & `StudentFeeReminder`**: Dues ledger tracking installment amounts, paid amounts, balance due, and due dates. Dispatches alerts across channels (`IN_APP`, `SMS`, `WHATSAPP`, `EMAIL`).

---

## 3. NestJS API Endpoints (`/api/tuition`)

| Endpoint | Method | Role / Guard | Description |
| :--- | :--- | :--- | :--- |
| `/tuition/profile` | `GET` | AuthGuard | Get tuition branding profile & aggregate statistics |
| `/tuition/profile` | `PUT` | AuthGuard (Owner/Admin) | Update tuition identity, address, contact, signatory & year |
| `/tuition/faculties` | `GET` | AuthGuard | List faculties with workload count & assigned batches |
| `/tuition/faculties` | `POST` | AuthGuard (Owner/Admin) | Invite / onboard new faculty member |
| `/tuition/faculties/:id` | `PUT` | AuthGuard (Owner/Admin) | Update faculty terms, status, and permissions |
| `/tuition/salaries` | `GET` | AuthGuard | Month-wise payroll ledger records |
| `/tuition/salaries/generate` | `POST` | AuthGuard (Owner/Admin) | Generate monthly compensation statement |
| `/tuition/salaries/:id/pay` | `PUT` | AuthGuard (Owner/Admin) | Record payment clearance (UTR reference, method, date) |
| `/tuition/leaves` | `GET` | AuthGuard | View leave applications (all or filtered by faculty) |
| `/tuition/leaves/apply` | `POST` | AuthGuard (Teacher/Faculty) | Submit leave request with substitute proposal |
| `/tuition/leaves/:id/review` | `PUT` | AuthGuard (Owner/Admin) | Review leave (enforces no self-approval) |
| `/tuition/diaries` | `GET` | AuthGuard | Daily teaching diary entries filterable by batch/faculty |
| `/tuition/diaries/overview` | `GET` | AuthGuard | Monthly curriculum delivery overview & subject map |
| `/tuition/diaries` | `POST` | AuthGuard (Teacher/Faculty) | Create daily lesson journal entry |
| `/tuition/diaries/:id` | `PUT` | AuthGuard (Author/Owner) | Edit existing diary entry |
| `/tuition/materials` | `GET` | AuthGuard | List study materials by batch |
| `/tuition/materials` | `POST` | AuthGuard (Teacher/Faculty) | Upload/publish study material |
| `/tuition/fees` | `GET` | AuthGuard (Owner/Admin) | Student fee dues and overdue balances |
| `/tuition/fees/summary` | `GET` | AuthGuard (Owner/Admin) | Total receivable, collected, and pending KPIs |
| `/tuition/fees/record` | `POST` | AuthGuard (Owner/Admin) | Create fee installment record |
| `/tuition/fees/remind` | `POST` | AuthGuard (Owner/Admin) | Dispatch reminder alert to student |

---

## 4. Frontend Views (AK Paper-Desk Theme)

All views strictly respect the design system tokens:
- **Typography**: `Playfair Display` (editorial titles), `Raleway` (primary UI, forms, buttons), `Inter` (dense data, roll numbers, currency, timestamps).
- **Surfaces**: Light warm paper theme (`#F8F7F4`, `#FFFFFF`, `#FAF8F5`, `#F3EFE9`) using `.paper-card`, `.kpi-card`, `.btn-primary`, `.btn-secondary`, `.badge-code`.
- **Views**:
  1. `DailyTeachingDiaryView.tsx`: Lesson journal, pre-fill from timetable, audience visibility toggles, and live student-facing preview card.
  2. `FacultyManagementView.tsx`: Faculty directory, weekly lecture workload counter, and onboarding invite drawer.
  3. `FacultySalaryView.tsx`: Monthly payroll ledger, payment UTR recording, and branded printable salary slip modal.
  4. `FacultyLeaveView.tsx`: Leave application form, pending approvals list, and substitute teacher assignment.
  5. `StudyMaterialView.tsx`: Chapter notes, worksheets, and formula sheet distributor.
  6. `StudentFeeAlertView.tsx`: Fee dues ledger and multi-channel reminder dispatcher.
  7. `TuitionBrandingView.tsx`: Academy white-label branding and live official letterhead preview.

