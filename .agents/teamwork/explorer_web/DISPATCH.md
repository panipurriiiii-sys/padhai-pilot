## 2026-10-31T07:18:05Z
From: Project Orchestrator (Conversation ID: f021762d-9b6a-4821-91cc-342a879355fc)
To: Survey Explorer 2 (Role: Web Portals Researcher)

You are Survey Explorer 2 (Role: Web Portals Researcher).
Your working directory is: A:\padhai-pilot\.agents\teamwork\explorer_web
Your parent is: Project Orchestrator (Conversation ID: f021762d-9b6a-4821-91cc-342a879355fc)

MANDATORY FIRST STEP: Read A:\padhai-pilot\.agents\teamwork\ORIGINAL_REQUEST.md completely.
Also reference: rules.txt, PROJECT_SPEC.md if present.

YOUR MISSION:
Perform a comprehensive technical survey of Teacher Web (`apps/teacher`) and Student Web (`apps/student`) for PDF attachment and upload capabilities for Assignments & Academic Evaluations:

1. Teacher Web (`apps/teacher`):
   - Locate and inspect assignment creation, editing, and details pages/components (`apps/teacher/src/...`).
   - Locate and inspect academic evaluation creation, editing, and details pages/components.
   - Investigate how teachers currently create/edit assignments & evaluations and where PDF attachment capabilities (question papers and reference documents) need to be integrated.
   - Check file upload handling, drag-and-drop or file input components, and how files are uploaded to media storage or through API endpoints.
   - Check how attached PDFs are displayed/rendered or linked for preview/download.
2. Student Web (`apps/student`):
   - Locate and inspect student assignment view and submission pages/components (`apps/student/src/...`).
   - Locate and inspect student academic evaluation view pages/components.
   - Investigate how students view attached question papers and reference documents.
   - Investigate how students upload and submit assignment responses as PDF files (submission workflow, file validation, submission status).
3. Consistent White-Labeled PDF Formatting & Typography:
   - Check font configurations across web apps: verify support for Playfair Display, Raleway, and Inter fonts.
   - Check branding and white-labeling: ensure no "Padhai-Pilot" branding appears on rendered/displayed PDFs and that teacher/institute details are prominently displayed.
4. Client Data & API Integration:
   - Identify existing API client libraries, hooks, TanStack Query hooks, form libraries, and state management in both web apps.
   - Identify existing tests (Jest, Playwright, Cypress, Vitest) in `apps/teacher` and `apps/student`.

SCOPE BOUNDARIES:
- Read-only investigation. DO NOT write or edit source code files.
- Deliver your findings in your working directory.

OUTPUT REQUIREMENTS:
- Regularly update `A:\padhai-pilot\.agents\teamwork\explorer_web\progress.md` with timestamps and current steps.
- Write your comprehensive findings to `A:\padhai-pilot\.agents\teamwork\explorer_web\handoff.md` following the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
- Send a completion message via `send_message` to parent (Conversation ID: f021762d-9b6a-4821-91cc-342a879355fc) with your summary and handoff path.

## 2026-10-31T07:38:33Z
From: Project Orchestrator (Conversation ID: f021762d-9b6a-4821-91cc-342a879355fc)
To: Survey Explorer 2 (Role: Web Portals Researcher)

**Context**: Survey Phase - Teacher & Student Web Portals
**Content**: Status check on your investigation of `apps/teacher` and `apps/student` assignment & evaluation workflows, PDF upload/attachment UI, and font styling.
**Action**: Please update progress.md with your latest findings and notify if you encounter any blockers or when your handoff report is ready.
