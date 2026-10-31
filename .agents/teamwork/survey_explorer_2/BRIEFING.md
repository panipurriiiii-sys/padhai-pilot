# BRIEFING — 2026-10-31T07:35:00Z

## Mission
Comprehensive technical survey of Teacher Web portal (`apps/teacher`) and Student Web portal (`apps/student`) for Batches & Student Rosters enhancements (R1-R5).

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Web Portals Researcher (Survey Explorer 2)
- Working directory: A:\padhai-pilot\.agents\teamwork\survey_explorer_2
- Original parent: c4064c99-f34e-4f27-b6c2-ee4992d96a10
- Milestone: M1 - Technical Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Write only to A:\padhai-pilot\.agents\teamwork\survey_explorer_2
- Follow Handoff Protocol for handoff.md
- Maintain liveness via progress.md

## Current Parent
- Conversation ID: c4064c99-f34e-4f27-b6c2-ee4992d96a10
- Updated: 2026-10-31T07:13:37Z

## Investigation State
- **Explored paths**:
  - `apps/teacher/package.json`, `apps/teacher/src/app/*`, `apps/teacher/src/components/*` (`BatchesView.tsx`, `StudentFeeAlertView.tsx`, `InvitationsView.tsx`, `Sidebar.tsx`, `TuitionBrandingView.tsx`)
  - `apps/teacher/src/lib/api.ts`, `apps/teacher/src/lib/pdfGenerator.ts`
  - `apps/student/package.json`, `apps/student/src/app/*`, `apps/student/src/lib/api.ts`
  - `packages/shared/src/types/index.ts`, `packages/shared/src/types/tuition.ts`, `packages/shared/dist/theme/theme.css`
  - `docs/teacher-portal-feature-matrix.md`, `docs/student-portal-feature-matrix.md`
  - `apps/api/prisma/schema.prisma` (`Batch`, `Enrollment`, `StudentFeeRecord`, `StudentFeeReminder`)
- **Key findings**:
  1. Next.js 16.4.3 App Router used across both portals with single-page client component architecture.
  2. Teacher Web `BatchesView.tsx` currently only creates batches and lists student rosters; completely lacks batch editing, shareable code/links, batch fee setup, fee status columns, manual payment verification, and batch promotion.
  3. Student Web `apps/student/src/app/page.tsx` hardcodes mock json URL for receipt PDF downloads, lacks `jspdf` dependency, and notifications drawer needs wiring for fee alerts.
  4. Teacher Web `pdfGenerator.ts` only generates assessment marks sheets, has default hardcoded `PadhaiPilot Tuition Institute` (violating white-label requirement), and has no fee receipt generator.
  5. Shared theme tokens (`@padhai-pilot/shared/theme.css`) define strict "Paper-Desk" design system with Raleway, Playfair Display, and Inter fonts.
  6. Neither web portal has any test runner or test suite configured in `package.json`.
- **Unexplored areas**: None for web portals survey.

## Key Decisions Made
- Fully documented all implementation and UI gaps for R1 through R5.
- Formulated exact component and API client additions needed for Batches, Roster Fee Tracking, Payment Verification, White-Labeled Receipts, and In-Place Promotion.

## Artifact Index
- `A:\padhai-pilot\.agents\teamwork\survey_explorer_2\DISPATCH.md` — Inbound instructions record
- `A:\padhai-pilot\.agents\teamwork\survey_explorer_2\BRIEFING.md` — Persistent working memory
- `A:\padhai-pilot\.agents\teamwork\survey_explorer_2\progress.md` — Liveness heartbeat and milestone tracker
- `A:\padhai-pilot\.agents\teamwork\survey_explorer_2\handoff.md` — Final survey analysis report
