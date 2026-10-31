# Original User Request

## Initial Request — 2026-10-31T06:47:27Z

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

## Follow-up — 2026-10-31T07:22:28Z

Add agents who will work on mobile, web, and backend everywhere to implement and deliver production-ready features in Padhai-Pilot: Enrollment Code generation without day limits, manual batch-wise Weekly Teaching Timetable CRUD, New Academic Broadcasts, Tuition Branding & Letterhead with logo upload, and Student Fees & Balance Alerts with a new Student Leaves section.
