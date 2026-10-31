# Dispatch for e2e_test_writer_1

**Identity**: e2e_test_writer_1 (teamwork_test_writer)
**Working Directory**: A:\padhai-pilot\.agents\teamwork\e2e_test_writer_1
**Mandatory Reading**:
- A:\padhai-pilot\.agents\teamwork\ORIGINAL_REQUEST.md
- A:\padhai-pilot\PROJECT.md

## Exclusive File Ownership
- `A:\padhai-pilot\TEST_INFRA.md`
- `A:\padhai-pilot\TEST_READY.md`
- `A:\padhai-pilot\tests/e2e/*` (or dedicated test files under `apps/api/test/e2e-*`)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mandate & Scope
Build the comprehensive opaque-box test suite for Padhai-Pilot according to the Dual Track requirements:
1. Create `TEST_INFRA.md` at project root `A:\padhai-pilot\TEST_INFRA.md` following the template and methodology:
   - Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing
   - Opaque-box requirement-driven testing targeting API/HTTP endpoints and user flows
2. Implement automated test suites covering all 4 Tiers:
   - Tier 1: Feature Coverage (>=5 test cases per feature across R1-R6: Enrollment Codes, Timetable CRUD, Broadcasts, Branding/Letterhead, Fees & Leaves, Fail-closed resilience)
   - Tier 2: Boundary & Corner Cases (>=5 test cases per feature: max limits, empty inputs, expired codes, invalid dates, unauthorized roles, DB disconnected 503)
   - Tier 3: Cross-Feature Combinations (pairwise interactions: e.g. student enrolled via perpetual code viewing batch timetable; student submitting leave in active batch; fee reminder triggered on enrolled student)
   - Tier 4: Real-World Application Scenarios (>=5 multi-step application scenarios)
3. Ensure the test runner can be executed reliably via an npm command or script.
4. When the test runner and suites are complete, generate `A:\padhai-pilot\TEST_READY.md` with:
   - Test runner command
   - Coverage summary table by Tier
   - Feature checklist
5. Write your complete handoff report to `A:\padhai-pilot\.agents\teamwork\e2e_test_writer_1\handoff.md` and notify with `send_message`.
