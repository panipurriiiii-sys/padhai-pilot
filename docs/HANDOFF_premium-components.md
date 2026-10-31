# Handoff: branch `premium-components` (Global Premium Component, SVG and Animation Ecosystem)

Status: PARTIAL. Foundations (SVG library, motion tokens, web components, SVG chart layer) are done and tested.
Teacher Portal has charts wired to real data. Student, Admin, Public Web, mobile and the three mandated docs are NOT done.
Merge order: `design-system-sync` first, then this branch.

## 1. Done and verified

| Area | Where | Verification actually run |
|---|---|---|
| Canonical SVG library, 36 original assets (brand, onboarding, education, dashboard, documents, empty-states, status) | `packages/assets/svg/**` | `cd packages/assets && node --test test/svg.test.mjs` -> 39/39 pass |
| SVG pipeline: svgo optimise, palette-only colours, forbids text/fonts/images/external refs/style, size and node budgets, registry codegen, `--check` mode | `packages/assets/scripts/{lib,build,gallery}.mjs` | `npm run build --workspace=@padhai-pilot/assets` (36 assets, ~31 KB total) |
| Palette copied from Teacher tokens; test fails if a hex disappears from `apps/teacher/src/app/globals.css` | `packages/assets/src/palette.ts` | same test run |
| Web adapter (`Illustration`, CSS vars `--pp-*` with Teacher fallbacks, dark scope, reduced-motion CSS) | `packages/assets/src/web.tsx`, `assets.css` | used by teacher build + dev render |
| React Native adapter (react-native-svg, Animated, reduce-motion aware) from the SAME generated registry | `packages/assets/src/native.tsx` | NOT run: no jest/Metro/device check (see section 2) |
| Motion tokens (pure TS, shared web/native) | `packages/ui/src/motion/tokens.ts` | `cd packages/ui && node --test test/core.test.mjs` -> 7/7 pass |
| Web components on `motion/react` (LazyMotion + `MotionConfig reducedMotion="user"`): MotionProvider, Reveal/Stagger, AnimatedNumber, Button, Tabs (sliding indicator, arrow keys), Dialog/ConfirmDialog (focus trap, Esc), Toast, Skeleton, ProgressBar, StatusBadge, EmptyState, ErrorState, SuccessMark, BrandLockup, Tilt3D (CSS 3D, no WebGL) | `packages/ui/src/components/*`, `styles/pp.css` | `npx tsc -p packages/ui/tsconfig.json` clean |
| SVG chart layer (Bar, Line/area, HBar, Donut, ChartCard with loading/error/empty states, tooltips, roving-tabindex keyboard points, text summary, "View as table") + pure core + mappers from API payloads to chart contracts | `packages/ui/src/charts/*` | unit tests above (fixtures only in tests) |
| Teacher Portal wiring: dashboard (attendance trend + batch attendance), Reports (trend, submission funnel, batch bars), Attendance (trend + live register donut, below the register), Assignments (submission rate per assignment), Tests (avg score), Lesson plans (syllabus coverage), shared EmptyState illustrations, `CountUp` now delegates to `AnimatedNumber`, MotionProvider+ToastProvider at the page root | `apps/teacher/src/components/charts/*`, edited views, `apps/teacher/src/app/page.tsx` | `npm run build --workspace=@padhai-pilot/teacher` OK; `npx tsc --noEmit -p apps/teacher/tsconfig.json` clean |
| Charts are lazy (`next/dynamic`, ssr:false) and use only data already fetched by the page: zero extra API calls | `apps/teacher/src/components/charts/index.tsx` | by code inspection |
| Builds with new workspace deps + `transpilePackages` | `apps/{web,admin,student,teacher}/{package.json,next.config.ts}` | `npm run build --workspace=@padhai-pilot/{web,admin,student}` compiled successfully |

Screens actually viewed rendered (built-in browser, Next dev on :3010 + API with `DATABASE_URL=` empty, `/api/health` = `fallback-active`, token from `/api/auth/demo-teacher`):
- Teacher Portal Overview/Dashboard only (attendance-by-week line chart and attendance-by-batch bars rendered with the demo in-memory data). Looked at it at one viewport size, with a reveal animation mid-flight in the first screenshot.
- SVG gallery contact sheet (`node packages/assets/scripts/gallery.mjs out.html`) for all 36 assets in light mode; style is consistent. Dark mode of assets NOT viewed.

NOT viewed: Reports, Attendance, Assignments, Tests, Lesson plans views after edits (they compile and type-check); empty states in any portal; Student, Admin, Web, any dialog/toast/tabs component in a real screen; reduced-motion behaviour (implemented in CSS and via MotionConfig, never toggled/inspected); keyboard walk-through of charts; mobile at any viewport.

## 2. Unfinished (be honest in review)

1. Completed: `docs/global-component-library.md` (full catalog, tokens, motion specs, license compliance, zero-CLS architecture). Remaining docs: `docs/global-animation-system.md`, `docs/shared-svg-assets.md`, PROJECT_SPEC.md and feature-matrix updates.
2. Student Portal: only deps/config added. Mappers for student charts (attendance by month, results trend, subject averages, assignment status, fees paid/due) were designed but the append to `packages/ui/src/charts/mappers.ts` did NOT land; re-create them. Student state shapes: `attendanceData.records[]`, `results: StudentAssessmentResult[]` (has `percentage`, `obtainedMarks`, `maxMarks`, `resultStatus`), `assignments: AssignmentItem[]` (status PENDING/SUBMITTED/LATE/GRADED/RESUBMIT), `feesData {totalFees, paidAmount, balanceDue}`, `studyTasks`. Insert points in `apps/student/src/app/page.tsx` tabs ATTENDANCE (~L1530), RESULTS (~L1786), ASSIGNMENTS (~L1630), FEES (~L1849), PLANNER (~L2013).
3. Admin and Public Web: no screen changes (web landing page redesign with hero, pricing, how-it-works, 3D tilt composition not started; web page is still the old dark Geist-era page). The owner's portfolio reference (aditya-kashid-portfolioo.vercel.app) was NOT studied; nothing recorded.
4. Mobile: `react-native-svg` ^15.15 added to `apps/mobile/package.json` (the brief said it was already installed; it was not in this worktree). Native adapter written but untested: no `jest` render test, no `npx react-native bundle` check, no Metro `watchFolders` config for the workspace packages (`apps/mobile/metro.config.js` currently has none, so importing `@padhai-pilot/assets/native` will likely fail to resolve until added). No native charts, no native components. Mobile tsc/jest were not re-run on this branch. Android build not attempted; no emulator/device available.
5. Teacher: Faculty salary/leave, fees, diary charts not added (need confirmed backend data); date-range filters not built because the existing `/teacher/reports` has no range parameter. Bulk marks entry intentionally has no chart/animation. No component outside `charts/` uses Dialog/Toast/Tabs/Button yet (components exist, are type-checked, are not exercised in a rendered screen).
6. Backend analytics endpoints (branch `backend-core`) were not consulted; charts use existing `/teacher/reports`, assignments, tests, lesson plans only.
7. Lint (`next lint`/eslint) not run. `npm run typecheck`/shared build not re-run. API vitest not run (API untouched).
8. 3D: decision recorded, not built out: CSS-3D `Tilt3D` only. three.js/R3F/Rive not adopted (weight; no .riv assets can be authored here). No WebGL anywhere.
9. Wordmark: SVG text/fonts are forbidden in the library, so the wordmark is live Playfair text (`BrandLockup`), not an SVG asset.

## 3. Licence table (all verified by opening the licence pages on 2026-10-31)

| Item | Used how | Licence | Verdict |
|---|---|---|---|
| `motion` (motion.dev) 14.9.0 | npm dependency of `@padhai-pilot/ui` (`motion/react`, `motion/react-m`) | MIT, (c) 2024 Motion B.V. | adopted |
| `lucide-react` / Lucide icons | already used by apps | ISC (+ MIT for Feather-derived icons) | adopted (existing) |
| `react-native-svg` | mobile + assets native adapter | MIT | adopted |
| `svgo` 4.x | dev-time SVG optimiser | MIT | adopted (dev) |
| shadcn/ui | pattern reference only, no source copied | MIT (c) 2023 shadcn | reference |
| React Bits | pattern inspiration only, NO source copied | "MIT + Commons Clause": commercial use OK, but may not sell/sublicense/redistribute components "alone, bundled, or ported" | not used; original code written instead |
| Aceternity UI | inspiration only, NO source copied | proprietary per-item author licence (ui.aceternity.com/licence): commercial end-product use allowed, no redistribution as source files; free/paid split not stated | not used |
| 21st.dev community components | inspiration only, NO source copied | each author's licence; site terms forbid republishing marketplace content/demos without link-back | not used |
| All 36 SVGs, `Illustration`, charts, components, motion tokens | in this repo | original work for PadhaiPilot; Teacher Portal colours only | original |

## 4. Files that will conflict with `design-system-sync` (merge it FIRST)

- `apps/teacher/src/app/page.tsx` (import + wrapper + two props), `apps/teacher/src/components/{DashboardView,ReportsView,AttendanceView,AssignmentsView,TestsView,LessonPlansView}.tsx`, `apps/teacher/src/components/ui/CountUp.tsx`
- `apps/{web,admin,student,teacher}/package.json` and `next.config.ts` (added `@padhai-pilot/ui`, `@padhai-pilot/assets`, `transpilePackages`)
- `apps/mobile/package.json` (adds `react-native-svg`; the other branch may add it too: keep one entry)
- root `package.json` (workspaces) and `package-lock.json` (regenerate with `npm install --ignore-scripts` after merge, do not hand-edit)
- No edits were made to `packages/shared/src/theme|tokens`, `globals.css`, `layout.tsx`, `apps/mobile/src/theme`.
- Note: some Teacher view files have mixed CRLF/LF line endings; scripted edits may silently miss, use the Edit tool.

## 5. Prioritised remaining steps

1. Merge `design-system-sync`; `npm install --ignore-scripts`; rebuild `packages/shared`; rerun the verification commands in section 1.
2. View the teacher Reports/Attendance/Assignments/Tests/Lesson-plans screens in a browser (demo teacher via `/api/auth/demo-teacher` against an API started with `DATABASE_URL=`); test reduced-motion (DevTools emulation) and keyboard on charts.
3. Re-add student mappers + `apps/student/src/components/charts/` and wire the five sections; replace student empty states with `EmptyState`.
4. Mobile: add Metro `watchFolders`/`nodeModulesPaths` for `packages/*`, verify `npx react-native bundle --platform android`, add jest render test for `@padhai-pilot/assets/native`, then native charts using `packages/ui/src/charts/core.ts` + react-native-svg, and EmptyState/Skeleton/Success usage in Teacher/Student screens. Keep built-in `Animated` (no Reanimated) unless an Android build proves a need.
5. Web landing page rebuild (paper-desk identity, `Reveal`, `Tilt3D` hero, pricing driven by a data array, no invented testimonials/usage numbers). Admin: dialogs/ConfirmDialog, StatusBadge, tabs, usage/plan charts from real admin endpoints.
6. Write the three docs + PROJECT_SPEC + feature-matrix notes + component catalogue; record the portfolio-reference notes in `global-component-library.md`.
7. Replace remaining local button/dialog/toast patterns in Teacher views with `@padhai-pilot/ui` wrappers where behaviour matches; run eslint and the API vitest suite.
8. Wire the backend-core analytics endpoints once published (date-range filters = one debounced request per change).
