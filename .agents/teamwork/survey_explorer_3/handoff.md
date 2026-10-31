# Technical Survey & Architecture Report: Mobile Application & Monorepo Test Infrastructure

- **Role**: Survey Explorer 3 (Mobile & Test Infra Researcher)
- **Author**: Survey Explorer 3
- **Date**: 2026-10-31T07:50:00Z
- **Target Workspaces**: `apps/mobile`, Root Monorepo, `apps/api`, `apps/teacher`, `apps/student`
- **Scope**: Batches & Student Rosters Enhancements (R1–R5)

---

## 1. Observation

### 1.1 Mobile Architecture & Non-Negotiable Constraints
- **Bare React Native CLI Confirmed**:
  - `apps/mobile/package.json` line 17: `"react-native": "0.88.1"`, lines 26–28: `"@react-native-community/cli": "20.2.0"`, `"@react-native-community/cli-platform-android": "20.2.0"`.
  - Zero traces of Expo (`expo`, `@expo/*`, `eas`) anywhere in dependencies or scripts.
  - Native Android project structure exists under `apps/mobile/android/` with `gradlew`, `app/build.gradle`, and `AndroidManifest.xml`.
- **TypeScript Strict Mode**:
  - `apps/mobile/tsconfig.json`: Extends `@react-native/typescript-config/tsconfig.json`, compiles cleanly with `tsc --noEmit` returning exit code 0.
- **State Architecture**:
  - Global client state: Zustand stores in `apps/mobile/src/store/useAuthStore.ts` and `apps/mobile/src/store/useNavigationStore.ts`.
  - Server state & caching: TanStack Query (`@tanstack/react-query: ^5.105.0`) in `App.tsx` (3-minute `staleTime`, query cache clearing on user sign-out to prevent cross-account cache leakage).
  - Navigation: Lightweight, zero-native-dependency Zustand-driven tab and sub-view navigation system in `apps/mobile/src/navigation/RootNavigator.tsx` and `useNavigationStore.ts`. No `@react-navigation/*` packages installed.
- **Design System & Tokens**:
  - 1:1 parity with Web **AK Paper-Desk** design system (`apps/mobile/src/theme/tokens.ts`):
    - Light: Background `#F8F7F4`, surface `#FFFFFF`, surfaceSubtle `#FAF8F5`, primary `#1677FF`, border `#E3DFD9`.
    - Dark: Background `#050608`, surface `#0A0D12`, surfaceSubtle `#10151D`, primary `#1677FF`, border `rgba(255,255,255,0.08)`.
    - Verified by `apps/mobile/__tests__/ThemeParity.test.ts` against authoritative `@padhai-pilot/shared/dist/theme/tokens.json`.
  - Typography: Strict 3-font policy:
    - `Playfair Display`: Headings/branding
    - `Raleway`: Primary UI, buttons, tabs
    - `Inter`: Tabular numbers, metrics, currency
    - Actual `.ttf` files verified in `apps/mobile/android/app/src/main/assets/fonts/` (`PlayfairDisplay.ttf`, `Raleway.ttf`, `Inter.ttf`, plus `_bold.ttf`).
- **Motion & Reanimated**:
  - `react-native-reanimated` is **NOT installed** in `apps/mobile/package.json`.
  - Animations currently use React Native's legacy built-in `Animated` (e.g. `Skeleton.tsx` line 19: `useRef(new Animated.Value(0.3)).current`).
  - To fulfill user_global rule #18 ("Use Reanimated for animations") and rule #17 ("Maintain 60 FPS animations at all times"), Reanimated must be formally introduced or evaluated against bare CLI build stability.
- **One-Hand Usability & Ergonomics**:
  - `BottomTabBar.tsx` features 5 thumb-reachable tabs at the bottom of the viewport with safe area insets handled via `react-native-safe-area-context` (`useSafeAreaInsets()`).
  - `tokens.ts` exposes standard `hitSlop` values (`small: 8, medium: 12, large: 16`) to guarantee minimum 44x44 pt touch targets.
- **Resilience & Storage**:
  - `apps/mobile/src/services/storage/secureStorage.ts` provides a multi-tier fallback architecture: hardware Keychain/Keystore -> EncryptedStorage -> in-memory fallback adapter (`detectNativeAdapter()`), preventing crashes in simulators or headless test runs.
  - `apps/mobile/src/services/api/client.ts`: 20-second request timeout (`REQUEST_TIMEOUT_MS = 20000`) designed specifically to tolerate Vercel serverless cold starts.
  - `apps/mobile/src/components/common/QueryBoundary.tsx`: Uniform handler for loading (pulsing skeleton cards), error with manual retry button (`ErrorState.tsx`), and empty states (`EmptyPaper`).

---

### 1.2 Teacher Mobile Experience Analysis (`apps/mobile/src/features/teacher`)
- **Existing Screen**: `TeacherClassesScreen.tsx`:
  - Features `BatchPicker` dropdown and a segmented control toggling between `Students` and `Invite codes`.
  - In `Students` view: Renders `s.fullName`, `s.rollNumber`, `s.email`, and `s.attendanceRate` badge.
  - In `Invite codes` view: Renders active/expired code cards with `usedCount`, `maxUses`, and `Revoke` button.
- **Batch Editing**:
  - **MISSING**: No UI exists to edit batch details (name, subject, room, schedule).
  - **MISSING in API Client**: `teacherService.ts` only has `getBatches()` and `getRoster(batchId)`. There is no `updateBatch()` or `editBatch()` method.
  - **MISSING on Backend**: `apps/api/src/teacher/teacher.controller.ts` has `@Get('batches')`, `@Get('batches/:batchId/students')`, `@Post('batches')`, but **no `PUT /teacher/batches/:batchId` or `PATCH /teacher/batches/:batchId` endpoint**.
- **Batch Code Quick-Copy & Standard Sharing**:
  - **MISSING**: In `TeacherClassesScreen.tsx` lines 97–118, the invitation code is rendered as static text `<Subtitle>{c.code}</Subtitle>`.
  - There is no "Copy Code" button, no clipboard interaction, and no "Share" button.
  - Dependency note: React Native core does **not** include `Clipboard` (deprecated and removed in modern RN); `@react-native-clipboard/clipboard` is not installed.
  - React Native core does provide `Share.share({ message, title, url })` in `'react-native'`, but it is not imported or used anywhere in `apps/mobile`.
- **Batch Fee Configuration & Student Payment Verification**:
  - **MISSING**: Neither `TeacherClassesScreen.tsx` nor `TeacherMoreScreen.tsx` allows a teacher to set or update fee amounts for a batch.
  - **MISSING in Roster**: `StudentRosterItem` in `apps/mobile` only displays attendance; student fee statuses (`PENDING`, `PAID`, `OVERDUE`) are completely absent from the mobile roster view.
  - **MISSING Workflow**: There is no button, modal, or action allowing a teacher to mark an individual student's fee as received/paid.
  - **Explicit Code Block**: `teacherService.ts` line 62 explicitly states:
    > *"Owner-only operations (faculty roster, payroll generation, leave approval, fees) are intentionally not exposed on mobile."*
    And `apps/mobile/__tests__/MobileWorkflows.test.ts` lines 81–86 actually contains an active test asserting that `getFees` is NOT exposed on `teacherService`!
- **In-Place Batch Promotion UI**:
  - **MISSING**: No UI, modal, or confirmation dialog exists anywhere in mobile for promoting a batch to the next class or grade level.
  - **MISSING in API**: Backend and mobile service lack batch promotion endpoints.

---

### 1.3 Student Mobile Experience Analysis (`apps/mobile/src/features/student`)
- **Existing Screen**: `FeesScreen.tsx`:
  - Renders aggregated KPI cards (`Total`, `Paid`, `Balance due`) and a list of fee records with `r.title`, `r.amount`, `r.paidAmount`, `r.status` badge, and `dueDate`/`paidDate`.
- **Fee Receipt Viewing & Downloading**:
  - **MISSING**: There is no "View Receipt" or "Download Receipt" action in `FeesScreen.tsx`. Fee cards are completely non-interactive.
  - In `StudentMoreScreen.tsx` line 157, `Documents` section has a button `openUrl(d.downloadUrl)` which delegates to `Linking.openURL(url)`. This launches an external browser, which fails if the endpoint requires an authenticated session header (`Authorization: Bearer <token>`).
  - No PDF renderer (`react-native-pdf`) or client-side PDF generator (`jspdf`) exists in `apps/mobile`.
- **Student Fee Alerts**:
  - In `StudentMoreScreen.tsx`, the `Notifications` view displays alerts from `/assessment/student/notifications` (`useNotificationsData()`).
  - However, there is no real-time push notification service (Firebase Cloud Messaging / APNs) configured in `apps/mobile`. In-app notifications only refresh on screen focus/pull-to-refresh.

---

### 1.4 Monorepo Test Infrastructure Analysis
- **Root Scripts** (`package.json`):
  ```json
  "scripts": {
    "dev:web": "npm run dev --workspace=@padhai-pilot/web",
    "dev:admin": "npm run dev --workspace=@padhai-pilot/admin",
    "dev:teacher": "npm run dev --workspace=@padhai-pilot/teacher",
    "dev:student": "npm run dev --workspace=@padhai-pilot/student",
    "dev:api": "npm run start:dev --workspace=@padhai-pilot/api",
    "build": "npm run build:shared && npm run build --workspaces --if-present",
    "build:shared": "npm run build --workspace=@padhai-pilot/shared",
    "build:teacher": "npm run build --workspace=@padhai-pilot/teacher",
    "build:api": "npm run build --workspace=@padhai-pilot/api",
    "test": "npm test --workspace=@padhai-pilot/api",
    "typecheck": "npm run typecheck --workspace=@padhai-pilot/shared",
    "prisma:generate": "npx prisma generate --schema=apps/api/prisma/schema.prisma"
  }
  ```
  - **Critical Gap**: `npm test` at root **only runs API tests**. It completely ignores `apps/mobile` (Jest), `packages/shared` (Vitest), and web apps.
- **Mobile Test Suite** (`apps/mobile/__tests__`):
  - Runner: Jest 29 (`@react-native/jest-preset`).
  - Current status: **4 test suites, 88 tests passing** (duration: ~2.2 seconds).
  - Coverage: `App.test.tsx`, `MobileWorkflows.test.ts`, `SecureStorage.test.ts`, `ThemeParity.test.ts`.
- **API Test Suite** (`apps/api`):
  - Runner: Vitest 3.0.6 (`vitest run`).
  - Contains 15 test suites and 114 tests.
  - **Active Test Failures**:
    - `tuition.service.spec.ts` & `controller-roles.spec.ts`: Failed with syntax error due to an unresolved git merge conflict marker in `apps/api/src/tuition/tuition.service.ts` line 93 (`<<<<<<< HEAD`).
    - `auth.security.spec.ts` (1 test timeout): `requires the current password to change it`.
    - `config.service.spec.ts` (1 test timeout): `should invalidate tenant configuration in Redis on update`.
- **E2E Capabilities**:
  - Playwright, Cypress, or Detox are **NOT configured** in any workspace.
  - The only E2E file is `apps/api/test/app.e2e-spec.ts`, which is a basic Supertest scaffold testing `GET /`.
- **Database & Schema Discrepancy**:
  - `apps/api/prisma/schema.prisma` line 1163 contains an unresolved merge conflict marker:
    ```prisma
    1161:   config           Json
    1162:   action           String
    1163: >>>>>>> backend-core
    1164:   restoredFrom     Int?
    ```
    This breaks `npx prisma validate` and `prisma generate`.

---

## 2. Logic Chain

1. **Bare RN Architecture (Observation 1.1)**:
   Because `apps/mobile` depends strictly on `react-native: 0.88.1` and `@react-native-community/cli: 20.2.0` with no Expo packages, the mobile app satisfies non-negotiable principle #4 and user_global rule #1 ("Use React Native CLI only").
2. **Missing Teacher Capabilities (Observations 1.2 & Acceptance Criteria R1, R2, R4)**:
   Because `TeacherClassesScreen.tsx` lacks edit forms, clipboard/share triggers, fee assignment inputs, manual payment toggle buttons, and batch promotion dialogs, and because `teacherService.ts` actively omits fee and mutation endpoints, teachers cannot currently execute R1 (Batch Editing & Code Sharing), R2 (Batch Fee Configuration & Payment Verification), or R4 (In-Place Batch Promotion) on mobile.
3. **Clipboard vs Share API in React Native CLI (Observation 1.2 & User Rule 15)**:
   React Native has built-in `Share.share()` which works out of the box on iOS and Android without adding dependencies. However, direct "copy to clipboard" requires either adding `@react-native-clipboard/clipboard` or using a graceful native bridge fallback. Since `Share` is already native to RN core, standard sharing can be wired immediately.
4. **Receipt Viewing & White-Labeling (Observation 1.3 & Acceptance Criterion R3)**:
   `FeesScreen.tsx` displays paid and pending fee rows, but does not provide an action to view or download a receipt. Web generates PDFs via client-side `jspdf`, which is absent on mobile. Furthermore, R3 strictly mandates that generated PDF fee receipts must prominently display the Teacher's / Institute branding and **omit any "Padhai-Pilot" platform branding**. Therefore, receipts must either be delivered as a server-rendered white-labeled PDF endpoint accessible via authorized signed URLs or rendered via a shared cross-platform receipt component.
5. **Monorepo Test Orchestration (Observation 1.4 & Acceptance Criterion R5)**:
   Root `npm test` only triggers `apps/api`. Running CI or automated verification cannot verify cross-platform integrity unless root scripts are enhanced to run both API Vitest suites and Mobile Jest suites (`npm run test:all`), and linting/typechecking across all workspaces.
6. **Backend Service Reliability & Merge Conflict Breakage (Observation 1.4)**:
   Backend Vitest test failures in `tuition.service.spec.ts` and `prisma/schema.prisma` are caused by verbatim git conflict markers (`<<<<<<< HEAD`, `>>>>>>> backend-core`). These must be resolved before R5 end-to-end verification can succeed.

---

## 3. Caveats

1. **Hardware / Emulator Execution**:
   Testing was conducted via CLI test runners (`jest`, `vitest`, `tsc`). While Mobile Jest tests pass (88/88) and TypeScript compiles without errors, a physical device or running Android emulator session was not booted in this turn.
2. **Push Notifications Infrastructure**:
   While in-app notifications exist in the domain model and are queryable via REST, actual push delivery (APNs/FCM) requires external credentials and provisioning profiles, which are not configured in this development environment.
3. **Backend Database Mock vs Real PostgreSQL**:
   As recorded in `docs/PROJECT_AUDIT.md`, backend services currently utilize in-memory resilience fallbacks (`!this.prisma.isConnected`). Full end-to-end testing with PostgreSQL requires a non-production managed database instance.

---

## 4. Conclusion

The mobile application (`apps/mobile`) has a clean, resilient, bare React Native CLI foundation with strict TypeScript, Zustand navigation/auth, TanStack Query caching, and verified 1:1 design token parity with the Paper-Desk luxury system.

However, **there are clear, scoped functional gaps preventing the fulfillment of R1–R5**:
- **R1**: Mobile needs a batch edit modal/screen in `TeacherClassesScreen.tsx`, batch update methods in `teacherService.ts` and `TeacherController`, and one-tap Copy/Share actions utilizing `Share.share()` and clipboard fallback.
- **R2**: Mobile needs fee structure definition in batch management, student fee status chips (`PENDING` / `PAID`) in the roster view, and a manual "Mark Fee Paid" action wired to backend payment verification endpoints.
- **R3**: Mobile `FeesScreen.tsx` needs a "View / Download Receipt" action connected to white-labeled, unbranded institute receipt generation.
- **R4**: Mobile needs an in-place "Promote Batch to Next Class" confirmation flow that updates grade level while preserving enrollments and fee history.
- **R5**: The monorepo test infrastructure needs a unified root verification script (`npm run test:all`), resolution of git conflict markers in `tuition.service.ts` and `schema.prisma`, and automated tests covering batch editing, code sharing, fee transitions, receipts, and promotion.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Mobile Architecture & Test Suite**:
   ```powershell
   # In apps/mobile:
   npm --prefix apps/mobile run test
   npx --prefix apps/mobile tsc --noEmit
   ```
   *Expected*: Jest passes 4 suites (88 tests). TypeScript passes with 0 errors.

2. **Verify Theme & Font Parity**:
   Inspect `apps/mobile/__tests__/ThemeParity.test.ts` lines 49–75 and check `apps/mobile/android/app/src/main/assets/fonts/`.

3. **Verify Missing Mobile Teacher Batch Edit & Fee Actions**:
   Inspect `apps/mobile/src/features/teacher/TeacherClassesScreen.tsx`.
   *Expected*: Observe that no edit form, copy button, share button, fee configuration input, or payment verification action exists.
   Inspect `apps/mobile/src/services/api/teacherService.ts` lines 60–64 and `apps/mobile/__tests__/MobileWorkflows.test.ts` lines 81–86.

4. **Verify Missing Student Receipt Download Action**:
   Inspect `apps/mobile/src/features/student/FeesScreen.tsx` lines 52–66.
   *Expected*: Observe that receipt items have no press handler, view button, or download button.

5. **Verify Git Merge Conflict Markers in Backend & Schema**:
   Inspect `apps/api/src/tuition/tuition.service.ts` lines 93–103 and `apps/api/prisma/schema.prisma` lines 1161–1165.
   Run:
   ```powershell
   npm --prefix apps/api run test
   ```
   *Expected*: Fails on `tuition.service.ts` line 93 due to `Unexpected "<<<"`.
