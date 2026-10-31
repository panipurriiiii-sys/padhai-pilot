# Dispatch Log

## 2026-10-31T06:49:35Z
Implement Batches and Student Rosters enhancements across backend API, Teacher Web, Teacher Mobile, and Student Web/Mobile, including existing batch editing, shareable batch codes, batch fee configuration with pending fee tracking and manual payment verification, student fee alerts and white-labeled receipts, and in-place batch promotion to the next class.

Working directory: A:\padhai-pilot
Integrity mode: development

## Requirements

### R1. Existing Batch Editing & Shareable Batch Codes
Enable teachers on Teacher Web (`apps/teacher`) and Teacher Mobile (`apps/mobile`) to edit existing batch details (including name, subject, and schedule). Provide a quick-copy and shareable batch code / invite link so teachers can easily distribute it to students.

### R2. Batch Fee Configuration & Manual Payment Verification
Enable teachers to set and update fee structures for a batch, initializing all enrolled students with a pending fee status upon assignment. Provide a manual verification workflow allowing teachers to inspect payment statuses and mark student fees as received/paid.

### R3. Student Fee Alerts & White-Labeled Receipts
Send student-side fee alert notifications via in-app notifications and email / external messaging alerts when fees are assigned or updated. Generate consistent, industry-grade, white-labeled PDF fee receipts upon payment confirmation that prominently display the Teacher's name / Institute branding and details, omitting any "Padhai-Pilot" platform branding.

### R4. In-Place Batch Promotion
Allow teachers to promote an existing batch to the next class or grade level, updating the batch's class/grade in-place while preserving student enrollments, fee history, and academic records.

### R5. Cross-Platform Integration & Automated Verification
Implement all features end-to-end across NestJS (`apps/api`), Next.js 14 (`apps/teacher`, `apps/student`), and React Native CLI (`apps/mobile`), ensuring backend services fail closed on DB down (HTTP 503). Deliver automated tests covering batch editing, code sharing, fee status transitions, receipt generation, and batch promotion.

## Acceptance Criteria

### Batch Editing & Code Sharing
- [ ] Teachers can update existing batch information from both Web and Mobile teacher apps.
- [ ] Batch code is easily copied to the clipboard and shareable via standard sharing actions on both Web and Mobile.

### Fee Management & Verification
- [ ] Teachers can define and edit fee amounts for any batch.
- [ ] All enrolled students in a fee-configured batch initially show a pending fee status.
- [ ] Teachers can manually mark an individual student's fee as received/paid.

### Student Alerts & Receipts
- [ ] Students receive in-app notifications and email / external messaging alerts when fees are assigned.
- [ ] Industry-grade PDF fee receipts are generated upon marking fees as paid.
- [ ] Generated PDF fee receipts omit the "Padhai-Pilot" name and prominently display the Teacher's name / Institute branding and details.
- [ ] Students can view and download their fee receipts from the student web and mobile interfaces.

### Batch Promotion
- [ ] Teachers can execute batch promotion to the next class/grade directly from the batch management interface.
- [ ] The batch's class/grade updates in-place without losing existing student enrollments or payment history.

### Verification
- [ ] Automated integration/unit tests pass, verifying batch update, fee state transitions (pending to paid), receipt generation logic, and in-place promotion workflows without using mock/sample data in production endpoints.


## 2026-10-31T07:04:56Z
Implement PDF attachment and upload capabilities for Assignments & Academic Evaluations across backend API (`apps/api/src/assessment`), Teacher Web (`apps/teacher`), Student Web (`apps/student`), and Mobile (`apps/mobile`), integrating media storage with https://media.dhyey.cc/docs and supporting white-labeled, consistently styled PDFs.

Working directory: A:\padhai-pilot
Integrity mode: development

## Requirements

### R1. PDF Attachments and Uploads for Assignments & Academic Evaluations
Enable teachers to attach PDF question papers and reference documents when creating or editing assignments and academic evaluations, and enable students to upload PDF responses for assignments across web and mobile applications.

### R2. Media Storage Integration
Store and host all uploaded assignment and evaluation PDF files via the https://media.dhyey.cc/docs API endpoint, reading any necessary configuration or API keys from environment settings.

### R3. Consistent White-Labeled PDF Formatting
Ensure all generated and rendered PDFs follow consistent, industry-grade styling, strictly white-labeled without any "Padhai-Pilot" platform branding, prominently displaying teacher and institute details. PDFs must strictly use only the three permitted fonts: Playfair Display, Raleway, and Inter.

### R4. Cross-Platform Standards & API Resilience
Implement interfaces across Teacher Web (`apps/teacher`), Student Web (`apps/student`), and Mobile (`apps/mobile`). Mobile implementation must strictly use React Native CLI (no Expo), TypeScript strict mode, and Paper-Desk theme tokens. Backend endpoints (`apps/api/src/assessment`) must fail closed with HTTP 503 on database unavailability, with zero mock data in production endpoints.

## Acceptance Criteria

### PDF Attachment & Submission
- [ ] Teachers can upload and attach PDF question papers and reference documents to assignments and evaluations on Teacher Web and Mobile.
- [ ] Students can upload and submit assignment responses as PDF files on Student Web and Mobile.
- [ ] Uploaded PDFs are stored and hosted via the https://media.dhyey.cc/docs API endpoint using environment-configured settings.

### White-Labeling & Typography
- [ ] Generated and displayed PDFs strictly use only the three designated fonts: Playfair Display, Raleway, and Inter.
- [ ] No "Padhai-Pilot" branding appears on generated PDFs; teacher and institute details are prominently displayed.

### Platform Standards & API Resilience
- [ ] Mobile features run on React Native CLI without Expo, adhering to TypeScript strict mode and Paper-Desk theme tokens.
- [ ] Backend assessment endpoints return HTTP 503 if the database is unavailable and return no mock data in production.

### Verification
- [ ] Existing workspace test suites, linting, and build checks in `A:\padhai-pilot` pass, with automated tests verifying PDF upload, attachment association, and fail-closed API behavior.
