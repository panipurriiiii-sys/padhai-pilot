# BRIEFING — 2026-10-31T07:22:00Z

## Mission
Orchestrate end-to-end implementation and automated verification of PDF attachment and upload capabilities for Assignments & Academic Evaluations across backend API (`apps/api/src/assessment`), Teacher Web (`apps/teacher`), Student Web (`apps/student`), and Mobile (`apps/mobile`), integrating media storage with https://media.dhyey.cc/docs and supporting white-labeled, consistently styled PDFs.

## 🔒 My Identity
- Archetype: orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: A:\padhai-pilot\.agents\teamwork\orchestrator
- Original parent: Sentinel / Parent agent
- Original parent conversation ID: 1bdd00a9-8984-46cc-af4c-cf41fda12d14

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: A:\padhai-pilot\.agents\teamwork\orchestrator\PROJECT.md
1. **Decompose**: Decompose the project into 3-7 modular milestones based on architectural and boundary criteria, plus an E2E testing track.
2. **Dispatch & Execute**: Direct/Delegate per Project Pattern (Survey -> Assess -> Decompose -> Delegate to Sub-orchestrators for milestones and E2E testing track).
3. **On failure**: Retry -> Replace -> Skip -> Redistribute -> Redesign -> Escalate
4. **Succession**: At 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Survey phase (3 parallel Explorers / Spec Miner) [in-progress]
  2. Project decomposition and E2E test infra [pending]
  3. Milestone execution [pending]
  4. Final milestone E2E test verification [pending]
- **Current phase**: 0 (Survey)
- **Current focus**: Map full scope across Backend Assessment & Media Storage, Web Portals (Teacher/Student), and Mobile App (RN CLI) / Testing Infra via 3 parallel survey explorers.

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- Use file-editing tools ONLY for metadata/state files (.md) in your .agents/teamwork/ folder.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.
- Always include ORIGINAL_REQUEST.md path in every dispatch.
- React Native CLI only, strictly no Expo, TypeScript strict, Zustand, TanStack Query, Paper-Desk tokens.
- Fail closed on DB down (HTTP 503).
- Zero mock data in production endpoints.
- Uploaded PDFs stored and hosted via https://media.dhyey.cc/docs API endpoint using environment-configured settings.
- Generated & rendered PDFs strictly white-labeled without "Padhai-Pilot" branding, displaying teacher and institute details.
- Permitted fonts strictly: Playfair Display, Raleway, and Inter.

## Current Parent
- Conversation ID: 1bdd00a9-8984-46cc-af4c-cf41fda12d14
- Updated: 2026-10-31T07:11:00Z

## Key Decisions Made
- Initialized Project pattern for PDF Attachment and Upload capabilities across Assessment API, Teacher Web, Student Web, Mobile, and Media Storage integration.
- Launched Phase 0 (Survey) with 3 parallel Explorers / Spec Miners:
  1. Spec Miner / Backend Explorer: Media storage endpoint (https://media.dhyey.cc/docs), Assessment API (`apps/api/src/assessment`), DB schema/Prisma, fail-closed 503 resilience, and PDF generation / white-labeling / font requirements.
  2. Web Portals Explorer: Teacher Web (`apps/teacher`) and Student Web (`apps/student`) assignment and academic evaluation workflows, PDF upload/attachment UI & API hooks.
  3. Mobile App & Test Infra Explorer: Mobile (`apps/mobile`) React Native CLI PDF pick/upload/viewing, Paper-Desk tokens, strict TS, and workspace testing/build suite.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| spec_miner_backend | teamwork_spec_miner | Media Storage API, Assessment API, DB Schema & PDF Specs | in-progress | 0ca01443-f444-4305-8057-55a968d1edc5 |
| explorer_web | teamwork_explorer | Teacher Web & Student Web PDF workflows & UI | in-progress | b307f2ce-0b64-4ca5-9eac-60c5249c6095 |
| explorer_mobile | teamwork_explorer | Mobile RN CLI PDF workflows, Paper-Desk tokens, Test Infra | in-progress | 134f4652-ee9b-4623-8cb8-aed3f91a782b |

## Succession Status
- Succession required: no
- Spawn count: 3 / 16
- Pending subagents: 0ca01443-f444-4305-8057-55a968d1edc5, b307f2ce-0b64-4ca5-9eac-60c5249c6095, 134f4652-ee9b-4623-8cb8-aed3f91a782b
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: f021762d-9b6a-4821-91cc-342a879355fc/task-40
- Safety timer: f021762d-9b6a-4821-91cc-342a879355fc/task-42
- On succession: kill all timers before spawning successor
- On context truncation: handle timers as step 4 of the State Recovery section of your prompt says

## Artifact Index
- A:\padhai-pilot\.agents\teamwork\ORIGINAL_REQUEST.md — Authoritative user requirements
- A:\padhai-pilot\.agents\teamwork\orchestrator\DISPATCH.md — Dispatch log
- A:\padhai-pilot\.agents\teamwork\orchestrator\BRIEFING.md — Persistent working memory
- A:\padhai-pilot\.agents\teamwork\orchestrator\progress.md — Liveness & status tracking
