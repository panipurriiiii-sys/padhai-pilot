## 2026-10-31T07:22:28Z

Add agents who will work on mobile, web, and backend everywhere to implement and deliver production-ready features in Padhai-Pilot: Enrollment Code generation without day limits, manual batch-wise Weekly Teaching Timetable CRUD, New Academic Broadcasts, Tuition Branding & Letterhead with logo upload, and Student Fees & Balance Alerts with a new Student Leaves section.

Working directory: A:\padhai-pilot
Integrity mode: development

## Requirements

### R1. Enrollment Code Management
Implement functional enrollment code generation across backend API (`apps/api`), Teacher Web (`apps/teacher`), Student Web (`apps/student`), and Mobile (`apps/mobile`). Enrollment codes must have no forced day limits, and teachers must be able to manually regenerate/change or expire the enrollment code at any time.

### R2. Weekly Teaching Timetable Management
Provide full CRUD (Create, Read, Update, Delete) functionality for the weekly teaching timetable across backend and frontend applications. Teachers must be able to manually create, view, update, and delete timetables batch-wise.

### R3. Academic Broadcasts
Implement functional academic broadcast announcements across backend API, Teacher Web, Student Web, and Mobile, enabling teachers to publish announcements and students to receive and view them.

### R4. Tuition Branding & Letterhead
Provide tuition branding and letterhead customization for teachers, including uploading tuition logos (stored via the configured media/file storage service or environment upload directory) and generating white-labeled documents without Padhai-Pilot platform branding.

### R5. Student Fees, Balance Alerts & Student Leaves
Enhance student fee tracking and balance alert notifications, and add a dedicated Student Leaves section across web and mobile where students can submit leave applications (specifying dates and reason) and teachers can review, approve, or reject them.

### R6. Architectural Standards & Fail-Closed Resilience
Maintain the Turborepo architecture across NestJS API (`apps/api`), Next.js 14 web apps (`apps/teacher`, `apps/student`), and React Native CLI mobile app (`apps/mobile`, strictly bare RN CLI, strictly no Expo, TypeScript strict, Zustand, TanStack Query, Paper-Desk theme tokens). Backend NestJS services must fail closed with HTTP 503 if the database is unavailable, with zero mock data in production endpoints.

## Acceptance Criteria

### Enrollment Code
- [ ] Teachers can generate enrollment codes without day expiration limits on Teacher Web and Mobile.
- [ ] Teachers can manually regenerate/change an existing enrollment code or expire it.
- [ ] Students can enroll in batches using active enrollment codes on Student Web and Mobile; expired codes are rejected.

### Weekly Teaching Timetable
- [ ] Teachers can manually create new timetable schedules batch-wise.
- [ ] Teachers can view, edit, and delete existing weekly timetable entries on Web and Mobile.
- [ ] Students can view their batch-specific weekly teaching timetable on Web and Mobile.

### Academic Broadcasts
- [ ] Teachers can create and publish new academic broadcast announcements with title, content, and batch targeting.
- [ ] Published broadcasts are displayed to students on Student Web and Mobile.

### Tuition Branding & Letterhead
- [ ] Teachers can upload their tuition logo, stored via configured media/file storage or upload directory.
- [ ] Teachers can configure tuition branding and preview customized letterheads.
- [ ] Generated letterhead documents are white-labeled, prominently displaying tuition branding with no Padhai-Pilot branding.

### Fees & Student Leaves
- [ ] Fee balance alerts are properly triggered and visible to students with outstanding balances.
- [ ] Students can submit leave requests with start date, end date, and reason on Student Web and Mobile.
- [ ] Teachers can view pending student leave requests and approve or reject them on Teacher Web and Mobile.
- [ ] Students can see the status (pending, approved, rejected) of their submitted leave applications.

### Architecture & Verification
- [ ] Mobile app runs on bare React Native CLI without Expo, adhering to Paper-Desk theme tokens, Zustand, and TanStack Query.
- [ ] Backend NestJS services fail closed with HTTP 503 when the database is unavailable, with no mock data returned by production endpoints.
- [ ] TypeScript typecheck, linting, and build pass across the workspace, along with automated test suites verifying enrollment code lifecycle, timetable CRUD, broadcast creation, logo uploads, and leave request flows.

## 2026-10-31T08:16:40Z

Sentinel Liveness Check: All 3 survey explorers (survey_explorer_1, survey_explorer_2, survey_explorer_3) have delivered their handoff.md reports. Please proceed with synthesizing findings into PROJECT.md and dispatching project milestones.

