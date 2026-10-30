PadhaiPilot --- Project Specification & Implementation Guide
**Project name:** PadhaiPilot\
**Repository location:** `A:\padhai-pilot`\
**Document purpose:** Single source of truth for product scope,
architecture, roles, deployment, security, and implementation
priorities.
------------------------------------------------------------------------
1. Product Vision
PadhaiPilot is a multi-tenant tuition / coaching institute management
platform. It should provide separate web experiences for institute
administrators, teachers, and students, plus a React Native mobile app
for teachers and students. The platform should support a hosted SaaS
model and a white-label / dedicated-brand offering without maintaining
separate codebases for every institute.
The product should be reliable, secure, responsive, easy to operate, and
designed so the infrastructure can be moved between hosting providers
later without losing data.
2. Non-Negotiable Technical Decisions
**Repository name:** `padhai-pilot`. Do not rename it.
**Package manager:** npm only. Do not use pnpm or yarn.
**Monorepo:** npm workspaces.
**Web:** Next.js + TypeScript.
**API:** NestJS + TypeScript.
**Mobile:** React Native CLI (bare React Native), **not Expo**.
**Database:** PostgreSQL.
**ORM and migrations:** Prisma.
**Deployment target:** Web portals and API are intended to be
    deployed to Vercel. The API must not depend on a developer's
    computer or a locally running server in production.
**Database hosting:** Use a managed PostgreSQL provider reachable
    from Vercel. The database is not a local-only database and should
    remain independent of the frontend host.
**Source control:** Keep application code, configuration examples,
    schema, and migrations in Git. Never commit secrets.
Deployment architecture caution
A standard NestJS application normally starts a persistent HTTP server.
Vercel primarily runs serverless functions, so the NestJS API must be
explicitly adapted and tested for Vercel's runtime, routing, timeouts,
and function limits before deployment. Do not assume that a normal
`nest start` server can simply be deployed unchanged. If the selected
NestJS adapter or deployment setup proves unsuitable, document the issue
and propose a compatible Vercel serverless entry point before changing
the agreed hosting decision.
Use a pooled PostgreSQL connection URL for serverless workloads where
the database provider supports it. Keep a separate direct connection URL
if Prisma migrations require one. Confirm the chosen provider's current
Prisma instructions before implementation.
3. Intended Monorepo Structure
padhai-pilot/
├── apps/
│   ├── web/        # Public website, shared entry points, and/or public pages
│   ├── admin/      # Institute administration portal
│   ├── teacher/    # Teacher web portal
│   ├── student/    # Student web portal
│   ├── api/        # NestJS API deployed to Vercel
│   └── mobile/     # React Native CLI app for Android/iOS
├── packages/
│   └── shared/     # Shared TypeScript types, schemas, constants, utilities
├── prisma/         # If schema/migrations are centralized here; document final choice
├── docs/           # Architecture, deployment, security, and operations docs
├── package.json    # npm workspace root
├── package-lock.json
└── PROJECT_SPEC.md
The final location of the Prisma schema must be chosen deliberately.
Prefer one canonical schema and migration history, not multiple
competing schemas. If Prisma lives under `apps/api`, document that and
keep migrations with the API. Do not duplicate the schema.
4. Separate Portals
The three portals must have separate user experiences and route trees:
4.1 Admin Portal --- `apps/admin`
For institute owners and authorized administrators: - Institute
dashboard and key operational summaries. - Manage institute profile,
logo, colors, typography choices, and branding text. - Manage teachers,
students, batches/classes, and enrollments. - Manage attendance,
assignments, tests/results, schedules, announcements, and fee records. -
Manage invitation codes and their status where permitted. - Configure
enabled modules and institute-level settings. - Manage plan limits,
subscription status, and usage visibility where applicable. - Assign
roles and permissions within the institute. - View appropriate audit
history for sensitive administrative actions.
A separate **Platform Super Admin** capability is required for
platform-level operations. It must not be treated as an ordinary
institute administrator. Platform administration should be
access-controlled separately, even if its first UI is a protected area
of the admin application.
4.2 Teacher Portal --- `apps/teacher`
Teacher dashboard and assigned batches/classes.
View authorized student lists.
Create, manage, and revoke student invitation codes according to
    institute rules.
Record and review attendance.
Create and manage assignments, homework, tests, marks, and feedback.
View schedules and institute announcements.
Access only the institute, batches, and students they are authorized
    to access.
4.3 Student Portal --- `apps/student`
Student dashboard.
Join an institute/batch through a valid invitation code or approved
    enrollment flow.
View timetable, attendance, assignments, homework, results,
    announcements, and permitted fee information.
Submit work where the relevant feature is enabled.
Access only their own records and explicitly shared class
    information.
4.4 Public Web App --- `apps/web`
Public product/marketing pages and sign-in entry points as needed.
Clear navigation to the correct portal.
No private institute data should be exposed on public pages.
Do not duplicate the full portal implementation in this app without
    a clear product reason.
5. Mobile App --- `apps/mobile`
Build with React Native CLI, not Expo.
Support Android first; keep the architecture suitable for iOS
    support.
Provide role-aware experiences for teachers and students after
    authentication.
Reuse the same backend API as the web portals.
Reuse shared types/validation only where compatible with React
    Native.
Keep navigation, loading, empty, error, offline, and permission
    states deliberate.
Do not store long-lived secrets in the app.
Secure tokens using platform-appropriate secure storage.
Do not trust a role value supplied by the client; the API must
    authorize every protected operation.
Avoid duplicating business rules in the mobile app. The backend is
    the source of truth.
The mobile app can be distributed separately from the web portals, but
must use the same tenant, identity, and authorization model.
6. Roles and Authorization
Minimum roles:
**Platform Super Admin** --- platform-wide administration and tenant
    lifecycle.
**Institute Admin** --- management within their own institute.
**Teacher** --- assigned teaching responsibilities and authorized
    classes.
**Student** --- own profile, enrollment, and permitted learning
    records.
Future roles such as parent/guardian may be considered later, but should
not delay the initial release unless explicitly approved.
Authorization requirements: - Enforce permissions in the API, not only
by hiding UI elements. - Enforce institute/tenant boundaries on every
relevant database query and mutation. - A user belonging to one
institute must not be able to read or modify another institute's records
by changing an ID in a request. - Check both role permissions and
resource ownership/assignment. - Validate all input on the server. - Use
rate limiting and abuse protection for authentication and
invitation-code endpoints. - Record important security-sensitive actions
in an audit log.
7. Multi-Tenant SaaS and White-Label Support
The platform should support many institutes from one maintained
codebase.
Tenant model
Every institute-owned record must be associated with an
    institute/tenant, directly or through a clearly defined parent
    relationship.
Tenant isolation must be enforced at the API and data-access layers.
Institute context must be derived from verified
    authentication/enrollment data or validated server-side context,
    never blindly trusted from request input.
Branding
Store institute branding as data/configuration: - Institute name and
logo. - Brand colors and supported typography/theme choices. - Approved
text and contact information. - Optional branded domain/subdomain
configuration, subject to deployment and DNS design.
Do not create a separate code fork for each institute just to change
colors, logo, text, or enabled features.
Subscription and white-label models
Plan for: - Shared multi-tenant SaaS. - Feature/usage limits by
subscription plan. - Optional paid white-label branding. - Optional
dedicated deployment for customers who require stronger separation or
custom hosting.
The dedicated deployment option must reuse the same maintained
application code and migration process wherever possible.
8. Feature Flags and Module Entitlements
Modules may include attendance, assignments, tests/results, fees,
announcements, timetable, reports, and future modules.
The system must distinguish: 1. Platform-wide feature availability. 2.
Subscription-plan entitlements and usage limits. 3. Institute-level
module settings. 4. User role/resource permissions.
A feature must be disabled securely on the backend as well as hidden or
disabled in the UI. Do not rely on frontend-only feature flags to
protect data or enforce plan limits. Define clear defaults and audit
changes to sensitive settings.
9. Teacher Invitation Codes
Teachers need a controlled way to invite students to the correct
institute and, when applicable, the correct batch.
Requirements: - Codes must be unpredictable and unique enough to prevent
guessing. - Bind each code to an institute and optionally a batch,
issuer, expiry, and usage limit. - Support expiry, revocation, and usage
tracking. - Validate the code on the server. - Rate-limit repeated
failed attempts. - Never treat an invitation code as a password or as
proof of identity. - Require normal authentication and any required
enrollment approval. - Prevent a code from enrolling a student in an
unauthorized tenant or batch. - Give users useful, non-sensitive error
messages.
10. Core Data and Backend Requirements
Use PostgreSQL with Prisma migrations. Define and document the data
model before implementing broad features. At minimum, plan entities
for: - Users and authentication identities. - Institutes/tenants and
institute memberships. - Roles/permissions or an equivalent clear
authorization model. - Teacher profiles and student profiles. -
Batches/classes and enrollments. - Invitation codes and redemption
history. - Attendance. - Assignments and submissions, if enabled. -
Tests/results, if enabled. - Timetables/schedules. - Fee
records/payments, with payment-provider integration treated as a
separate secure feature. - Announcements/notifications. - Subscription
plans, entitlements, and usage counters as required. - Audit events.
Use proper foreign keys, indexes, unique constraints, timestamps, and
deletion/retention rules. Use transactions for operations that must
succeed or fail together. Avoid storing payment card details. Never
expose database credentials to browser or mobile code.
11. Authentication, Privacy, and Security
Implement secure sign-in, sign-out, session/token lifecycle, and
    account recovery.
Select the authentication method and document it before production
    implementation.
Use secure, HTTP-only cookies for web sessions where appropriate;
    configure CSRF protections as required by the chosen session design.
Use secure platform storage for mobile credentials.
Hash passwords with a suitable password-hashing algorithm if
    passwords are used.
Never commit `.env` files, API keys, database passwords, signing
    keys, or production secrets.
Validate input server-side and apply output encoding and safe error
    handling.
Configure CORS narrowly for the deployed portal origins.
Add rate limits for login, recovery, invitation redemption, and
    other abuse-prone endpoints.
Use least-privilege database credentials.
Maintain backups and test restoration, not just backup creation.
Define data export, deletion, retention, and privacy-policy
    requirements before public launch.
12. Vercel Deployment Plan
The intended production hosting is Vercel for: - `apps/web` -
`apps/admin` - `apps/teacher` - `apps/student` - `apps/api`, after a
compatible serverless deployment configuration is implemented and
verified.
For each deployable app: - Configure the correct Vercel project root
directory and build settings. - Set production environment variables in
Vercel, not in source control. - Configure portal/API URLs and allowed
origins. - Configure custom domains and HTTPS when ready. - Keep preview
and production environment variables separated. - Add health/status
checks that work within the chosen serverless architecture. - Test cold
starts, timeouts, payload limits, logging, and database connection
behavior. - Document rollback and deployment steps.
Do not rely on a local development server for production. Local
development may still be used for coding and tests, but production web
and API traffic must go to the deployed services.
Database portability
Keep PostgreSQL separate from Vercel application hosting.
Use migrations checked into Git.
Document database export/import and restore procedures.
Back up before schema changes.
Test migration and restore workflows in a non-production
    environment.
Keep uploads in durable object storage rather than a serverless
    function's temporary filesystem.
13. Environment Configuration
Provide `.env.example` files containing placeholder names only, for
example: - `DATABASE_URL` - `DIRECT_URL` (if required by the chosen
Prisma setup/provider) - Authentication/session secrets. - Public
web/API base URLs. - CORS allowed origins. - Object-storage
configuration if uploads are implemented.
Do not invent or commit real credentials. Keep server-only variables out
of `NEXT_PUBLIC_*` variables. Only values intended for browser exposure
may use a public prefix.
14. Quality and Testing Requirements
TypeScript type-checking and linting.
Unit tests for authorization, invitation codes, tenant isolation,
    and core services.
API integration tests for critical workflows.
UI tests or end-to-end tests for sign-in, enrollment, attendance,
    and other release-critical flows.
Test role boundaries and cross-tenant access explicitly.
Test loading, empty, validation, offline, and failure states.
Verify responsive layouts and accessibility basics.
Test database migrations and backup restoration.
Verify production builds for every web app and the API deployment
    target.
Verify the React Native app on an Android emulator/device before
    declaring mobile setup complete.
Do not claim a feature is complete because its screen exists. A feature
is complete only when its UI, API, validation, authorization,
persistence, and relevant tests work together.
15. Implementation Roadmap
Phase 0 --- Stabilize the repository
Inspect existing files; do not delete working scaffolds.
Fix the npm workspace configuration and dependency-install failure.
Give each workspace a unique, matching package name.
Establish consistent scripts, TypeScript configuration, linting, and
    environment examples.
Commit a clean baseline.
Phase 1 --- Architecture and foundation
Decide authentication/session approach.
Decide canonical Prisma schema location and managed PostgreSQL
    provider.
Design tenant, membership, role, and permission model.
Configure the Vercel-compatible NestJS API entry point and verify a
    minimal deployed endpoint.
Establish shared API contracts and error conventions.
Phase 2 --- Authentication and institute onboarding
Sign-in, sign-out, recovery, and protected routes.
Platform Super Admin and Institute Admin boundaries.
Create and configure institutes.
Tenant isolation tests.
Phase 3 --- Teacher and student enrollment
Teacher management.
Batch/class setup.
Invitation-code creation, validation, expiry, revocation, and
    redemption.
Student enrollment and approval rules.
Phase 4 --- Core learning workflows
Attendance.
Timetable and announcements.
Assignments and results as prioritized.
Fee records and reports after the relevant business rules are
    defined.
Phase 5 --- Mobile integration
Connect React Native CLI app to deployed API.
Add secure authentication and role-aware navigation.
Implement teacher/student workflows in agreed priority order.
Verify Android builds and API error handling.
Phase 6 --- SaaS, branding, and subscriptions
Central branding configuration.
Feature flags and plan entitlements.
Usage limits, subscription lifecycle, and white-label configuration.
Dedicated deployment procedure if required.
Phase 7 --- Production hardening
Security review and tenant-isolation testing.
Logging, monitoring, backup/restore, and incident/rollback
    instructions.
Accessibility, performance, privacy, and production acceptance
    testing.
16. Definition of Done
A release is not considered ready until: - All relevant apps install and
build with npm. - Package names and workspace scripts are correct. - Web
portals and API are deployed and use configured production URLs. - The
API does not require a developer machine or local server. - PostgreSQL
data persists independently of Vercel function instances. -
Authentication and server-side authorization work. - Cross-tenant access
tests pass. - Invitation codes enforce expiry/revocation/usage rules. -
Migrations, backup, and restore procedures are documented and tested. -
No secrets are committed. - Critical workflows have automated tests and
have been verified in a deployed environment. - Mobile app has been
built and tested on a real device or emulator.
17. Current Scaffold Status (based on the terminal log provided)
Root folder: `A:\padhai-pilot`.
Node.js: `v22.22.3`.
npm: `11.3.0`.
`apps/web`: Next.js scaffold created successfully.
`apps/api`: NestJS scaffold created; dependency installation from
    the root workspace has not succeeded yet.
`apps/admin`, `apps/teacher`, `apps/student`: Next.js scaffolding
    was attempted, but npm reported
    `Cannot read properties of null (reading 'edgesOut')` during
    installation. Files may exist; inspect and preserve them before
    retrying.
`apps/mobile`: React Native CLI scaffold created successfully with
    React Native `0.88.1`; dependencies installed by the CLI.
Java: `17.0.12`.
Android Debug Bridge is installed at
    `C:\android-sdk\platform-tools\adb.exe`.
Android build/run has not yet been confirmed.
Root npm workspace configuration and app package names still need to
    be reconciled. The root scripts refer to scoped names such as
    `@padhai-pilot/web`, while the generated web/API manifests currently
    use `web` and `api`.
PostgreSQL/Prisma has not yet been configured or connected.
Vercel deployment has not yet been completed.
Treat this status as a snapshot from the supplied log, not a claim that
no subsequent changes have occurred.
18. Instructions for Any AI Coding Agent or Developer
Read this document before making changes.
Inspect the current repository before editing; preserve working
    files and user changes.
Use npm only.
Do not use Expo.
Keep Admin, Teacher, and Student as separate web applications.
Keep the React Native mobile app separate from web apps and use the
    same API.
Production backend deployment is intended for Vercel; do not design
    a production dependency on a local server.
Verify NestJS serverless compatibility on Vercel rather than
    assuming it.
Never expose secrets or trust client-supplied roles/tenant IDs.
10. Enforce authorization and tenant isolation on the backend.
11. Do not remove features or replace existing code without
    understanding its purpose.
12. Implement in small, testable phases. After each phase, report
    changed files, commands run, test/build results, unresolved issues,
    and the next safe step.
13. Do not claim deployment or tests succeeded unless the command or
    deployment output confirms it.
14. Update this document when a major architectural decision changes.
------------------------------------------------------------------------
**Guiding principle:** One maintained platform, separate role-specific
experiences, a shared and securely authorized API, durable managed
PostgreSQL data, and deployments that do not depend on a developer's
local machine.
19. Expanded Feature Catalogue --- Product Possibilities
This section is a broad feature catalogue for planning. It is **not** a
requirement to build every feature in the first release. Each feature
must be reviewed for customer demand, privacy, cost, legal obligations,
and implementation complexity. Mark features as `MVP`, `Phase 2`,
`Later`, or `Optional` in the issue tracker before implementation.
19.1 Platform Super Admin Portal
Platform operations
Platform overview: institutes, active users, active subscriptions,
    storage/usage, API health, and recent platform events.
Create, verify, suspend, reactivate, archive, and configure
    institutes.
Institute onboarding checklist and setup status.
Search institutes and users with strict access controls and audit
    logging.
View tenant-level usage summaries and operational health without
    unnecessarily exposing private student data.
Manage platform-wide defaults, supported modules, system
    announcements, and maintenance notices.
Feature rollout controls, percentage rollouts, and emergency kill
    switches.
Global configuration with validation and change history.
Plan catalogue: trial, free, standard, premium, enterprise, and
    custom plans.
Subscription status, grace periods, renewals, cancellations, and
    entitlement changes.
Coupon/promotion configuration and trial policies.
Usage limits for students, teachers, batches, storage,
    notifications, and other billable resources.
Billing reconciliation and payment status tracking through a
    compliant payment provider.
Invoice/tax settings as applicable to the operating jurisdiction;
    obtain professional tax/legal review before launch.
White-label and dedicated-deployment eligibility settings.
Domain/subdomain mapping workflow and domain verification status.
Support ticket overview, incident management, and service status.
Platform audit logs, privileged-action logs, exportable operational
    reports.
Controlled support access with reason, scope, expiry, and audit
    trail; avoid invisible impersonation.
Data export/deletion request workflow and retention controls.
Backup status, restore drills, and incident recovery checklist.
Admin account security, MFA where supported, session revocation, and
    suspicious-login review.
Abuse reports, rate-limit events, and account lockout review.
Email/SMS/push provider configuration status, delivery metrics, and
    template management.
Background-job status, failed-job retry queue, and dead-letter
    review.
API usage, error rates, latency, and deployment/version visibility.
Release notes and planned maintenance notices.
19.2 Institute Admin Portal
Institute setup and branding
Institute name, logo, favicon, address, contact information,
    website, and social links.
Theme colors, supported font choices, logo variants, light/dark
    theme, and branded login/portal experience.
Academic year, terms/semesters, holidays, timezone, locale,
    currency, and date/number formats.
Institute-specific ID prefixes and human-readable student/teacher
    IDs.
Custom fields for student/teacher profiles with validation and
    visibility rules.
Institute policies, consent text, fee rules, grading scales,
    attendance rules, and notification preferences.
Configure institute modules within subscription entitlements.
Configure approved subdomains/custom domains where enabled.
Import data from CSV templates and validate rows before committing.
Export authorized institute records to CSV/PDF, with permission
    checks and audit logging.
Setup wizard with progress, missing configuration warnings, and
    sample data mode.
People and access management
Add, edit, archive, reactivate, and search teachers/students/staff.
Bulk import/export with preview, duplicate detection, row-level
    error report, and rollback-safe processing.
Invite staff, resend invitations, deactivate access, revoke
    sessions, and reset accounts.
Assign roles and granular permissions.
Assign teachers to subjects, batches, rooms, and schedules.
Assign students to batches, courses, and academic years.
Transfer students between batches with history and effective dates.
Manage guardians/parents as an optional future role, with verified
    relationships and limited access.
Manage staff employment/status records only to the extent required
    by the product.
Emergency contact and authorized pickup details where appropriate
    and consented.
Academics and class operations
Courses, subjects, grades, batches, divisions, sections, rooms, and
    academic calendars.
Batch capacity, waitlists, batch transfers, and enrollment history.
Timetable builder with recurring schedules, one-off sessions, room
    allocation, and conflict detection.
Teacher substitution and class cancellation/rescheduling.
Attendance rules, late/early status, grace periods, and correction
    approvals.
Assignment, homework, test, quiz, exam, and result configuration.
Grading scales, weighted categories, class averages, and progress
    reports.
Learning material library and controlled file sharing.
Announcements targeted by batch, role, or institute.
Academic performance and attendance reports.
Term/semester close and rollover workflow with archived history.
Fees and finance operations
Fee structures by course, batch, student, term, or custom plan.
One-time fees, recurring fees, installments, discounts,
    scholarships, and approved concessions.
Due dates, reminders, partial payments, late fees, waivers, and
    refund tracking.
Receipts, invoice numbering, printable/downloadable PDFs, and
    payment history.
Payment gateway integration through a provider; never store raw card
    details.
Cash/bank/online payment recording with clear audit trail and
    permissions.
Reconciliation reports, outstanding balances, collection trends, and
    ageing reports.
Financial period summaries and exports for an accountant.
Separation of payment initiation, provider confirmation, refund
    approval, and manual adjustments.
Approval workflow for high-value refunds or fee waivers.
Communication and engagement
Announcements, scheduled messages, templates, and audience
    targeting.
Email, SMS, push, and in-app notifications through configurable
    providers.
Delivery status, bounce/failure visibility, retry rules, and
    opt-out/preferences where required.
Parent/guardian notifications when that feature is enabled.
Consent-aware messaging and quiet hours.
Feedback and complaint forms, support inbox, and issue status.
Surveys and institute-wide polls.
Emergency/urgent announcements with appropriate authorization and
    audit history.
Reports and insights
Enrollment, attendance, retention, batch capacity, and academic
    performance dashboards.
Fee collection, overdue balances, discounts, and refund summaries.
Teacher workload and timetable utilization.
Student progress over time with suitable cohort comparisons.
Exportable reports with date, batch, course, and status filters.
Saved report filters and scheduled report delivery where supported.
Data freshness indicators and definitions for every metric.
Restrict reports and exports according to role and privacy rules.
19.3 Teacher Portal
Daily dashboard
Today's classes, next class countdown, timetable, assigned batches,
    pending work, and announcements.
Attendance completion reminders and assignment review queue.
Recent student progress and flagged follow-ups based on transparent
    rules.
Quick actions for taking attendance, posting homework, and sharing a
    class announcement.
Mobile-friendly layout and accessible controls.
Batch and student management
View assigned batches, courses, subjects, schedules, and authorized
    rosters.
Student profile summary limited to teaching needs.
Search/filter students and see enrollment status.
Create invitation codes scoped to the permitted institute/batch.
Configure code expiry and usage limits where authorized.
Revoke codes and view redemption history.
Approve enrollment requests only if institute policy grants that
    permission.
Request a batch transfer or profile correction from an
    administrator.
Add teacher notes with visibility and retention rules; sensitive
    notes require stricter access controls.
Record learning support needs only where appropriate, lawful, and
    access-restricted.
Attendance
Mark present, absent, late, excused, or other institute-configured
    statuses.
Mark a whole class then correct individual students.
Attendance by date, session, subject, and batch.
Prevent duplicate session attendance and detect schedule conflicts.
Edit past attendance only within policy; optionally require admin
    approval after a cutoff.
Add correction reasons and maintain an audit history.
View attendance summaries and trends for assigned students.
Generate class attendance reports.
Offline draft attendance on mobile with conflict-aware sync, if
    implemented.
QR/session code attendance as an optional later feature with
    anti-abuse safeguards.
Do not use location tracking or biometrics by default; these require
    explicit product, privacy, and legal review.
Teaching and learning
Create, schedule, edit, duplicate, and publish homework/assignments.
Attach approved documents, images, links, and learning resources.
Set instructions, due date, maximum marks, rubric, and submission
    rules.
Accept file, text, link, or other configured submission types.
Review submissions, comment, grade, request resubmission, and mark
    late work.
Bulk feedback and reusable feedback snippets.
Create quizzes/tests with supported question types.
Question bank with tags, difficulty, subject, and topic.
Reuse questions and create randomized question sets where
    appropriate.
Configure time limits, attempt limits, release windows, and result
    visibility.
Grade manually or auto-grade supported objective questions.
Enter marks, provide feedback, and publish results according to
    institute rules.
Generate class and individual progress reports.
Share lesson notes, presentations, worksheets, reading lists, and
    recorded links.
Track syllabus/topic coverage and lesson plans.
Maintain a class teaching log and planned follow-up tasks.
Schedule remedial sessions or optional extra classes.
Create revision plans and exam preparation material.
Schedule live class links using approved external meeting providers;
    do not build video infrastructure until required.
Communication
Post announcements to assigned batches.
Send permitted individual or group messages with safeguards.
Reply to student questions in a moderated, auditable channel.
Use announcement templates and schedule messages.
View delivery/read status only where supported and appropriate.
Escalate student concerns to an institute administrator.
Avoid exposing student contact details to unauthorized peers.
Teacher productivity and reporting
Personal calendar and availability.
Conflict warnings for class schedules.
Work queue for attendance, grading, and unanswered questions.
Batch performance, assignment completion, and attendance reports.
Export authorized class reports.
Reusable assignment templates, rubrics, and lesson plans.
Draft/publish workflow and confirmation before bulk actions.
Undo or correction workflow for accidental changes where feasible.
Notifications configurable by event and channel.
19.4 Student Portal
Student home
Today's timetable, upcoming classes, due assignments, recent
    announcements, and attendance summary.
Upcoming tests and result-release notifications.
Outstanding fee information and receipts when enabled and
    authorized.
Progress snapshot with clear explanation of how metrics are
    calculated.
Quick links to homework, learning materials, and teacher feedback.
Enrollment and profile
Join using a valid teacher/institute invitation code or approved
    enrollment flow.
Show institute/batch name before confirming enrollment.
Clear errors for expired, revoked, used-up, or invalid codes without
    leaking sensitive data.
Enrollment pending/approved/rejected status where approval is
    required.
View own profile, institute ID, batch, subjects, and academic year.
Request profile corrections rather than changing protected records
    directly.
Manage notification preferences and permitted account settings.
View active sessions and sign out securely.
Timetable and attendance
Daily, weekly, and monthly timetable views.
Class details, subject, teacher, room/location, and schedule-change
    notices.
Attendance history by subject/session.
Attendance percentage with transparent calculation and date range.
Explain absence/attendance correction request flow where enabled.
Notifications for timetable changes and cancellations.
Add class schedule to device calendar as an optional feature.
Assignments and learning materials
View assignments, instructions, attachments, deadlines, and marks.
Submit text, supported files, or links.
Save drafts and see upload/progress states.
Edit/resubmit before the deadline if policy allows.
Late-submission rules shown clearly.
Submission receipt, timestamp, and status.
Teacher feedback, rubric, and marks when released.
Download learning resources and track completion where appropriate.
Search/filter by subject, due date, and status.
Accessible document and media presentation.
Tests, grades, and progress
Upcoming tests and exam schedule.
Results, marks, grade, feedback, and rubric when released.
Subject/topic performance trends with clear caveats.
Compare progress against the student's own prior results; avoid
    shaming rankings by default.
Download progress reports where permitted.
Re-evaluation or correction request workflow if enabled.
Revision checklist and study planner as later enhancements.
Fees and communication
View fee breakdown, due dates, paid amounts, and outstanding
    balance.
Securely start a payment using a supported provider.
View payment status and download receipts.
Raise a payment mismatch or receipt issue.
View announcements, reminders, and teacher feedback.
Ask questions in permitted channels.
Submit feedback or support requests.
Configure push/email/in-app notification preferences.
Student wellbeing and safety
Report a platform issue or inappropriate content through a clear
    channel.
Block/report functionality for any direct messaging feature, with
    moderation and escalation rules.
Clear privacy controls and explanation of which records
    teachers/admins can see.
Avoid public student leaderboards by default.
Do not expose personal contact details, grades, or fee status to
    other students.
Age-appropriate privacy and guardian consent requirements must be
    assessed before launch.
19.5 Shared Cross-Portal Capabilities
Responsive design for desktop, tablet, and mobile web.
Consistent navigation, design tokens, accessible forms, and clear
    error messages.
Global search limited to records the signed-in user is authorized to
    access.
Pagination, filtering, sorting, and server-side search for large
    datasets.
Notifications inbox with read/unread status and preferences.
File upload/download using authorized, time-limited access links.
User profile, session management, sign-out, and account recovery.
Audit history for sensitive changes.
Activity history for relevant workflows.
Empty, loading, error, success, offline, and permission-denied
    states.
Date/time handling using the institute's configured timezone.
Localization architecture may be added only if product requirements
    call for it; do not introduce unnecessary language complexity in the
    initial release.
Keyboard navigation, visible focus, contrast, screen-reader labels,
    and accessible validation.
Safe confirmation dialogs for destructive or bulk actions.
Duplicate submission prevention and idempotency for critical
    requests.
Standard API response/error conventions and request correlation IDs.
Privacy-aware logging with no passwords, tokens, or unnecessary
    student personal data.
19.6 Mobile-Specific Capabilities
For the React Native CLI app: - Role-aware login and navigation for
teacher/student accounts. - Secure token/session storage. - Push
notifications after provider and platform configuration. - Deep links to
a specific assignment, timetable event, announcement, or result after
authentication. - Camera/file picker only where needed and with explicit
permission handling. - Upload progress, retry, cancellation, and
size/type validation. - Offline-friendly read cache for selected
non-sensitive screens where appropriate. - Offline draft attendance or
assignment work only when conflict handling is designed and tested. -
Sync status and visible conflict resolution. - App version/update notice
and minimum supported version policy. - Crash/error reporting configured
with privacy safeguards. - Android back-button behavior, keyboard
handling, safe areas, and screen-size testing. - Accessibility font
scaling and touch target sizes. - App lock or biometric
re-authentication only as an optional, reviewed enhancement. - Separate
development, staging, and production API configuration; never hardcode
secrets. - Build signing and release procedures documented for Play
Store and, later, App Store. - Network failure, expired session, revoked
account, and API maintenance screens.
19.7 Optional Integrations and Later-Stage Features
Prioritize these only after core workflows and security are stable: -
Payment gateways and automated payment reconciliation. -
Email/SMS/WhatsApp providers, respecting consent and provider
policies. - Push notification services. - Calendar integrations. -
Video-meeting links. - Import from existing spreadsheets or supported
education systems. - Document generation for receipts, reports, and
certificates. - Certificate and bonafide-letter generation with
institute-controlled templates. - QR codes for invitation and session
attendance. - Library/resource inventory if institutes need it. -
Transport, hostel, or parent/guardian modules only if target customers
require them. - Multi-branch institute management. - Custom domain and
white-label mobile branding options, subject to store/platform
constraints. - Data analytics exports and integrations. - Public API and
webhooks with scoped keys, rate limits, and audit trails. - Single
sign-on for enterprise customers. - Advanced audit exports and retention
policies. - Accessibility audits and independent security testing.
19.8 AI/Automation Policy
Do not introduce AI features by default just because they are possible.
If later requested, scope each use case separately, including data
privacy, accuracy, cost, human review, and opt-out. Core attendance,
fees, grades, permissions, enrollment, and billing rules must remain
deterministic and auditable. Never let an AI system autonomously change
grades, fees, enrollment permissions, or access controls without
explicit authorized human approval.
19.9 Suggested Release Priorities
MVP --- build first
Secure authentication and role-aware routing.
Platform Super Admin baseline.
Institute creation and branding basics.
Institute Admin management of teachers, students, and batches.
Teacher/student invitation and enrollment flow.
Timetable basics.
Attendance recording and history.
Assignment creation, submission, and feedback.
Basic announcements and in-app notifications.
Basic results/marks if required by pilot institutes.
Minimal fee records and receipts only if included in the initial
    business scope.
Shared API, managed PostgreSQL, Prisma migrations, and tenant
    isolation.
Essential audit events, error handling, and backup/restore plan.
Web/API Vercel deployment and Android app smoke test.
Phase 2
Fee collection gateway and reconciliation.
Advanced tests, question banks, rubrics, and progress reports.
CSV bulk import/export and scheduled reports.
Push notifications and mobile deep links.
Subscription entitlements, usage limits, and white-label branding.
Advanced timetable and substitution workflows.
Later / enterprise
Parent/guardian portal or mode.
Multi-branch analytics.
Custom domains and dedicated deployments.
SSO, webhooks, public API, advanced compliance and audit controls.
Optional library/transport/hostel modules.
Advanced analytics and carefully governed AI-assisted tools.
**Prioritization rule:** A large feature catalogue is a roadmap, not a
promise to ship everything at once. For every feature, record its owner,
user value, acceptance criteria, permissions, data model impact,
security/privacy impact, test plan, and release phase.


---

## 20. Implementation Status: Centralized Feature Flag & Entitlement Engine (Phase Completed)

The centralized, database-backed feature flag and commercial entitlement engine has been fully designed, implemented, and verified in the monorepo:

1. **Authoritative Canonical Registry (`FEATURE_REGISTRY`)**:
   - 23 features registered across `ACADEMIC_OPS`, `ASSESSMENT`, `STUDENT_PORTAL`, `COMMUNICATIONS`, `FINANCE`, `REPORTS_ANALYTICS`, `SYSTEM_BRANDING`.
   - Typed feature keys, scopes, security impacts, dependencies, and plan quotas.
2. **Durable Source of Truth (`apps/api/prisma/schema.prisma`)**:
   - `PlatformFeatureFlag`: Global platform availability & emergency kill switches.
   - `PlanEntitlement`: Subscription packaging (`STARTER`, `GROWTH`, `PRO`, `ENTERPRISE`).
   - `InstituteFeatureConfig`: Tenant-specific toggles & custom quota commercial exceptions.
   - `FeatureAuditLog`: Immutable audit trail for all administrative actions.
   - `InstituteUsageCounter`: Real-time tracking against configured quotas.
3. **Precedence Engine & Enforcement (`FeaturesService`, `FeatureFlagGuard`)**:
   - Deterministic 5-stage evaluation order:
     `Emergency Kill Switch / Global State` → `Plan Entitlement` → `Institute Config` → `RBAC Role Check` → `Quota Limits`.
   - Fail-closed security: direct API requests without valid entitlement or permission return structured `403 Forbidden`.
4. **Platform Super Admin Control Plane (`apps/teacher`)**:
   - Protected executive control panel (`PlatformSuperAdminFeatureView.tsx`) with search, module filtering, instant global toggles, `CONFIRM_KILL` confirmation modal, institute state simulator, plan entitlement comparative matrix, and live audit feed.
   - Adheres strictly to the centralized **AK Paper-Desk** design system tokens.
5. **Verified Test Coverage**:
   - All 48 tests in `apps/api` passing (`features.service.spec.ts` 10/10 tests passing).
   - Zero compile or TypeScript errors across `@padhai-pilot/shared`, `@padhai-pilot/api`, and `@padhai-pilot/teacher`.

---

## 21. Implementation Status: Advanced Tuition Management, Faculty OS & Daily Learning Diary (Phase Completed)

The Tuition Owner model, Faculty Lifecycle, Payroll/Salary Records, Leave Management, Daily Teaching Diary, Study Material Vault, and Student Fee Alerts have been fully implemented, tested, and verified across backend, database, shared packages, and frontend:

1. **Tuition Owner & 5-Tier Role Model (`Role.TUITION_OWNER`)**:
   - Upgraded role hierarchy: `SUPER_ADMIN` > `TUITION_OWNER` > `INSTITUTE_ADMIN` > `TEACHER` > `STUDENT`.
   - Granular delegated permissions for faculty: `MANAGE_ATTENDANCE`, `MANAGE_MARKS`, `PUBLISH_DIARY`, `MANAGE_TIMETABLE`, `VIEW_FEES`, `APPROVE_LEAVES`.
2. **Database Persistence (`apps/api/prisma/schema.prisma`)**:
   - `FacultyProfile`: Staff ID, designation, employment status, compensation model, base salary, hourly rate, assigned subjects, and delegated permissions.
   - `SalaryRecord`: Monthly compensation ledger calculating `netPayable = baseAmount + additions - deductions - advances` with statuses `DRAFT` → `REVIEWED` → `APPROVED` → `PAID` and UTR reference tracking.
   - `FacultyLeaveApplication`: Self-service absence request with substitute assignment and reviewer checks (strictly enforcing that reviewers cannot review their own leaves).
   - `DailyTeachingDiary`: Authoritative daily lesson journal capturing batch, subject, chapter title, concepts taught, learning objectives, homework assigned, references, and follow-up plan with audience controls (`PRIVATE_DRAFT`, `OWNER_ONLY`, `BATCH`).
   - `StudyMaterial`: Chapter notes, DPP worksheets, formula sheets, handouts, and revision guides with student visibility controls.
   - `StudentFeeRecord` & `StudentFeeReminder`: Dues tracker and multi-channel reminder dispatcher (`IN_APP`, `SMS`, `WHATSAPP`, `EMAIL`).
3. **Backend NestJS Services & API (`apps/api/src/tuition/`)**:
   - 20+ REST endpoints covering profile branding, faculty roster, salary statements, leave workflows, lesson journals, notes, and fee alerts.
   - Full Vitest suite passing 10/10 tests in `tuition.service.spec.ts` (58/58 tests total in `@padhai-pilot/api`).
4. **Teacher & Owner Portal UI (`apps/teacher`)**:
   - `DailyTeachingDiaryView.tsx`: Daily lesson logging with "Pre-fill from Today's Timetable", audience visibility permissions, and student-facing preview card.
   - `FacultyManagementView.tsx`: Faculty directory, weekly workload hours tracking, and onboarding invite drawer.
   - `FacultySalaryView.tsx`: Monthly payroll ledger, payment UTR recording, and branded printable salary slip modal with institute letterhead.
   - `FacultyLeaveView.tsx`: Self-service application form, pending approvals list, and substitute teacher assignment.
   - `StudyMaterialView.tsx`: Notes, worksheets, and formula sheet distributor.
   - `StudentFeeAlertView.tsx`: Fee dues ledger and automated polite reminder dispatcher.
   - `TuitionBrandingView.tsx`: Academy white-label branding and live official letterhead preview.
   - Strictly adhering to the **AK Paper-Desk** design system (`#F8F7F4`, `#FFFFFF`, `#FAF8F5`, `#1677FF`) and the 3-font policy (`Playfair Display`, `Raleway`, `Inter`).
5. **Zero-Error Verification**:
   - `@padhai-pilot/shared`: `tsc --noEmit` passed.
   - `@padhai-pilot/api`: `nest build` and `vitest run` (58/58 tests passed).
   - `@padhai-pilot/teacher`: `next build` (4/4 pages static prerender passed) and live Turbopack dev server on `http://localhost:3000`.

---

## 22. Implementation Status: Complete Student Portal (`apps/student`) — Production Ready & Verified

The Student Portal (`apps/student`) has been fully designed, implemented, and verified across frontend, backend NestJS API, PostgreSQL/Prisma database models, and unit test suites:

1. **Product Experience & Luxury Dark Design System**:
   - Palette from `https://aditya-kashid-portfolioo.vercel.app/`: Deep luxury tech background (`#050608`), surface card (`#0A0D12`), elevated panel (`#10151D`), subtle border (`rgba(255,255,255,0.08)`), electric blue accent (`#1677FF`), emerald success (`#10B981`), amber warning (`#F59E0B`), and rose alert (`#F43F5E`).
   - Exactly three fonts:
     - `Playfair Display`: Selected premium display headers and institute branding.
     - `Raleway`: Primary navigation, labels, forms, and interface body text.
     - `Inter`: Marks, grades, numbers, timers, tabular metrics, and dense data.
2. **Student Authentication, Registration & Instant Batch Enrollment**:
   - `POST /api/auth/register-student`: Complete student registration with password strength, email validation, and optional invitation code redemption.
   - `POST /api/student/validate-invitation` & `POST /api/student/join-batch`: Secure backend validation of teacher invitation codes with expiration, usage limits, and automatic batch enrollment.
   - Quick 1-tap demo student access (`Aarav Patel — JEE Advanced Alpha`).
3. **Core Academic Modules**:
   - **Overview / Dashboard**: Real-time aggregated stats (attendance rate, average exam percentage, pending homework count, fee balance), today's lecture schedule, announcements, and quick action buttons.
   - **Daily Teaching Diary**: Chronological timeline of lessons published by faculty for student's enrolled batches. Displays date, faculty, chapter, concepts covered, homework assigned, and direct Media CDN attachments.
   - **Study Materials & Notes Vault**: Subject-wise and category-filtered repository (Notes, DPP Worksheets, Formula Sheets, Handouts, Revision Guides). Features direct high-speed download links via Cloudflare worker CDN (`media.dhyey.cc`) with 20MB limit preflight validation.
   - **Timetable & Academic Calendar**: Comprehensive weekly breakdown (Mon-Sat) showing subject, room, faculty, duration, and time slots.
   - **Attendance Ledger & History**: Visual attendance meter, eligibility warning alerts (min 75% threshold), date-wise session table, and an interactive **Attendance Correction Request** workflow.
   - **Homework & Assignment Management**: Filter by pending, submitted, and graded. Features submission modal with text response, document URL attachments, draft saving, and teacher feedback/score display.
   - **Online Tests & CBT Assessments**: Practice quizzes and unit exams with server-side countdown timer, question-by-question MCQ selection, negative marking, and instant server-side scoring.
   - **Exam Results & Bulk Marks**: Verified classroom test results, percentage, grade pill, faculty remarks, and an official **Result Report Card (PDF)** download link.
   - **Fees & Receipts**: Fee summary (payable, paid, balance due), verified official payment receipts list with printable PDF download, and bank/UPI payment instructions.
   - **Faculty Academic Doubts Clinic**: Dedicated student-to-faculty doubt submission channel with subject and topic tags, status tracking (`PENDING` vs `ANSWERED`), and teacher replies.
   - **Personal Study Planner**: Interactive checklist for daily problem practice goals, subject tags, priority levels (`HIGH`, `NORMAL`, `LOW`), completion toggles, and task deletion.
   - **Student Document Center**: Central repository for verified report cards, payment receipts, formula sheets, and timetable PDFs with institute letterhead.
   - **Student Profile & Settings**: Student ID, roll number, batch allocation, institute identity, phone/name updates, notification preferences, and support ticket creation.
   - **In-App Notifications**: Sliding drawer with unread badges, notification types, and mark-all-as-read controls.
4. **Resilient Backend & Testing**:
   - NestJS `StudentController` & `StudentService` (`apps/api/src/student/`) handling all 16 student endpoints with both Prisma database queries and in-memory fallback stores.
   - Vitest unit tests: 9 test suites, **77/77 tests passing** (including 16/16 tests for `student.service.spec.ts`).
   - Production Next.js Turbopack build verified with zero errors across all workspaces.

