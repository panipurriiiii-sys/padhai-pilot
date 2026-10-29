# PadhaiPilot — Platform Control Plane Architecture

## 1. Executive Purpose

The Platform Control Plane provides centralized, multi-tenant administrative capabilities for the Platform Super Admin. It governs institute onboarding, subscription plan packaging, global feature toggles, emergency incident mitigation, and operational auditing across the entire PadhaiPilot SaaS platform from one maintained codebase.

---

## 2. Platform Super Admin Capabilities

1. **Global Feature Management**:
   - Live runtime toggling of all 23 platform features.
   - Emergency kill switch for instant incident containment (requires confirmation code `CONFIRM_KILL`).
   - Audit trail tracking every toggle with actor email, timestamp, and justification reason.

2. **Subscription Packaging & Entitlements**:
   - Definition of commercial plans (`STARTER`, `GROWTH`, `PRO`, `ENTERPRISE`).
   - Mapping features and default quotas to plans.
   - Granting commercial exceptions (`customQuota`) to specific customer institutes without code modifications.

3. **Multi-Tenant State Simulation**:
   - The Super Admin can simulate any customer institute and inspect its resolved feature availability matrix.
   - Highlights the exact failure reason (`EMERGENCY_KILLED`, `GLOBALLY_DISABLED`, `PLAN_RESTRICTED`, `INSTITUTE_DISABLED`, `PERMISSION_DENIED`, or `QUOTA_EXCEEDED`).

4. **Immutable Audit Trail**:
   - Chronological feed of all platform administrative actions.
   - Diff inspection comparing previous configuration with new configuration.

---

## 3. API Endpoints

The control plane exposes secured NestJS endpoints in `apps/api/src/features/`:

| Endpoint | Method | Permission | Purpose |
| :--- | :--- | :--- | :--- |
| `/features/registry` | `GET` | Authenticated | Fetch canonical definitions of all 23 platform features |
| `/features/evaluate/:key` | `GET` | Authenticated | Evaluate a specific feature for the active context |
| `/features/institute/:id` | `GET` | Admin / Super Admin | Evaluate complete effective matrix for an institute |
| `/features/audit-logs` | `GET` | Super Admin | Query chronological administrative audit events |
| `/features/global` | `POST` | Super Admin | Enable or disable a feature platform-wide |
| `/features/emergency-kill` | `POST` | Super Admin | Trigger emergency kill switch (`CONFIRM_KILL` required) |
| `/features/emergency-restore` | `POST` | Super Admin | Restore an emergency-killed feature |
| `/features/plan-entitlements` | `POST` | Super Admin | Update plan feature inclusions and monthly quotas |
| `/features/institute-config` | `POST` | Super Admin / Inst Admin | Update institute toggle or grant custom quota |

---

## 4. Frontend Control Panel Interface

Implemented in `apps/teacher/src/components/PlatformSuperAdminFeatureView.tsx`:
- Conforms strictly to the centralized **AK Paper-Desk** design system tokens in `globals.css`.
- Sub-tabs:
  - **Feature Registry & Overrides**: Search, filter by module, global toggles, emergency kill switch modal.
  - **Institute Simulator & Precedence**: Live decision tree inspection for any customer institute.
  - **Subscription Plan Matrix**: Comparative table across `STARTER`, `GROWTH`, `PRO`, `ENTERPRISE`.
  - **Audit Trail & Change History**: Real-time event log with action pills and change reasons.

