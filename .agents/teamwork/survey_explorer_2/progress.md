# Progress: Web Portals Technical Survey

Last visited: 2026-10-31T07:36:00Z

## Status
- Complete: Comprehensive technical survey of `apps/teacher` and `apps/student` finished.
- Final report written to `A:\padhai-pilot\.agents\teamwork\survey_explorer_2\handoff.md`.
- Ready to message parent orchestrator.

## Steps Checklist
- [x] Workspace & Briefing initialization
- [x] Read foundational requirements (`ORIGINAL_REQUEST.md`, `rules.txt`, `PROJECT_SPEC.md`)
- [x] Survey Teacher Web Portal (`apps/teacher`)
  - [x] Batch list, batch creation, batch details views (`BatchesView.tsx`)
  - [x] Batch editing (name, subject, schedule) — *Missing in UI & API client*
  - [x] Shareable batch code / invite link UI & clipboard copy — *Missing in BatchesView*
  - [x] Batch fee configuration UI (defining/editing fee amounts) — *Missing in BatchesView & API client*
  - [x] Student roster table & fee tracking (payment statuses) — *Roster table missing fee statuses*
  - [x] Manual payment verification workflow — *Missing in BatchesView & StudentFeeAlertView*
  - [x] In-place batch promotion UI — *Missing in BatchesView & API client*
- [x] Survey Student Web Portal (`apps/student`)
  - [x] Fee records and dues display (`StudentPortal` FEES tab)
  - [x] In-app notifications drawer for fee assignment/update alerts (`InAppNotification` drawer exists, lacks fee trigger wiring)
  - [x] Viewing and downloading white-labeled PDF fee receipts — *Currently hardcoded to external mock json, lacks client-side receipt generator or API download*
- [x] Web architecture, routing, design tokens, and state management
  - [x] Next.js 16.4.3 App Router (`src/app/layout.tsx`, `src/app/page.tsx`)
  - [x] API client (`lib/api.ts`) custom fetch with Bearer token authentication
  - [x] Design tokens: Tailwind CSS v4 + `@padhai-pilot/shared/theme.css` ("Paper-Desk" tokens)
  - [x] Test suites: Zero tests in `apps/teacher` and `apps/student` (no runner or scripts configured)
- [x] Gap analysis against R1, R2, R3, R4, R5
- [x] Write `handoff.md` and report to orchestrator
