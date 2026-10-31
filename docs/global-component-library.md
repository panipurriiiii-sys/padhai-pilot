# Global Premium Component & Animation Library

> Package: `@padhai-pilot/ui` & `@padhai-pilot/assets`  
> Identity: **Paper-Desk Luxury** (Warm Parchment / Deep Charcoal / Electric Royal Blue / Terracotta & Emerald Accents)  
> Typography: **Strictly 3 Families** — Playfair Display (Display/Editorial), Raleway (UI Interface & Body), Inter (Tabular Numbers & Data)

---

## 1. Executive Overview & Luxury Principles

PadhaiPilot's UI ecosystem is designed to deliver a calm, academic, and tactile luxury experience. Luxury is achieved not through frivolous ornamentation or heavy WebGL effects, but through:

- **Impeccable Spacing & Rhythm**: Paper margins, crisp hairline borders, and subtle physical drop shadows.
- **Micro-Interactions at 60 FPS**: Event-driven spring presses, deceleration entrances, and sliding pill indicators.
- **Zero Cumulative Layout Shift (CLS = 0)**: Every asynchronous container (charts, metric tickers, cards) reserves its layout dimensions before data arrives.
- **Honest States**: Metrics and charts never invent dummy numbers. Four distinct states (`loading`, `error`, `empty`, `ready`) guide users with bespoke canonical SVG illustrations.
- **Full Dark Mode Parity**: Warm parchment paper in light mode flips seamlessly to deep charcoal card surfaces with high-contrast pastel accents and glow effects.

---

## 2. Package Architecture

```
packages/
├── assets/                          # Canonical SVG Asset Engine
│   ├── svg/                         # 36 original, hand-crafted SVGs
│   │   ├── brand/                   # Logo marks (color, mono)
│   │   ├── dashboard/               # Analytics, attendance, fees, notifications, reports, salary
│   │   ├── documents/               # Document generation, PDF preview
│   │   ├── education/               # Books, classroom, exam-results, homework, progress, student, teacher, timetable
│   │   ├── empty-states/            # Attendance, documents, inbox, notifications, roster, search
│   │   ├── onboarding/              # Step wizards, institute, students, welcome
│   │   └── status/                  # Error, loading-plane, spinner, success, upload, warning
│   ├── scripts/                     # SVGO optimizer, token validator, gallery generator
│   └── src/
│       ├── palette.ts               # Master color token mapping to Teacher Portal CSS vars
│       ├── web.tsx                  # Web adapter (<Illustration />)
│       └── native.tsx               # React Native adapter (react-native-svg)
└── ui/                              # Premium Component & Motion Ecosystem
    ├── src/
    │   ├── motion/
    │   │   └── tokens.ts            # Shared timing, easing, springs, stagger tokens
    │   ├── components/
    │   │   ├── Tilt3D.tsx           # CSS 3D perspective tilt with mouse follow
    │   │   ├── Reveal.tsx           # Decelerated entrance transitions & stagger lists
    │   │   ├── AnimatedNumber.tsx   # Zero-re-render tabular ticker (Intl en-IN)
    │   │   ├── Button.tsx           # Snappy press spring feedback & stateful loading
    │   │   ├── Tabs.tsx             # WAI-ARIA segmented tab bar with sliding pill
    │   │   ├── Dialog.tsx           # Accessible modal & destructive ConfirmDialog
    │   │   ├── Feedback.tsx         # Skeleton, StatusBadge, EmptyState, ErrorState, BrandLockup
    │   │   ├── Toast.tsx            # Animated notification toasts
    │   │   └── MotionProvider.tsx   # LazyMotion & reduced-motion configuration
    │   ├── charts/
    │   │   ├── core.ts              # Pure math: scales, ticks, paths, tabular text fallbacks
    │   │   ├── Charts.tsx           # SVG Bar, Line, HBar, Donut with roving tabindex & tooltips
    │   │   ├── ChartCard.tsx        # Container with reserved height & EmptyState artwork
    │   │   └── mappers.ts           # Type-safe payload adapters
    │   └── styles/
    │       └── pp.css               # Design tokens, surfaces, typography, dark mode
    └── test/
        └── core.test.mjs            # Unit tests for chart math and motion tokens
```

---

## 3. Design Tokens & Typography

### The 3 Permitted Typefaces
| Typeface | Class / Variable | Intended Application |
|---|---|---|
| **Playfair Display** | `.pp-display`, `--pp-font-display` | Editorial headlines, modal titles, brand wordmark, card headers. |
| **Raleway** | `.pp-btn`, `.pp-tab`, `--pp-font-ui` | Primary interface controls, navigation, labels, toast copy, tooltips. |
| **Inter** | `.pp-data`, `--pp-font-data` | Metric counters (`tabular-nums`), chart labels, data tables, badges. |

### Color Palette (Teacher Portal Identity)
- **Desk Surface**: `#F8F7F4` (Light parchment) / `#050608` (Deep charcoal paper).
- **Paper Sheet / Card**: `#FFFFFF` (Light) / `#0A0D12` (Dark) with 1px border `#E3DFD9` (Dark: `rgba(255,255,255,0.09)`).
- **Brand Electric**: `#1677FF` with hover `#0A6FE8` (Dark: `#3395FF`).
- **Sticky Note Pastels**:
  - Blue: `#E1EDFF` / border `#BBD4FC` / text `#0A3D78`
  - Yellow: `#FFF3C4` / border `#F6E09E` / text `#5C3D00`
  - Pink: `#FDE2E4` / border `#F8BCC2` / text `#6D1B28`
  - Mint: `#DAF5E4` / border `#B2E6C4` / text `#0E4A28`
  - Beige: `#F2E8DC` / border `#DECDBD` / text `#4A3728`
- **Semantic Accents**: Success `#10B981`, Danger `#F43F5E`, Warning `#F59E0B`.

---

## 4. Component Catalog

### 4.1 Tilt3D
Selective 3D depth without WebGL overhead. Leverages CSS `perspective: 1100px` and `preserve-3d`. Throttled with `requestAnimationFrame` on pointer move. Automatically flattens for touch devices and `prefers-reduced-motion`.

```tsx
import { Tilt3D } from '@padhai-pilot/ui';

<Tilt3D max={7} className="hero-card">
  <div style={{ transform: 'translateZ(20px)' }}>Elevated Content</div>
</Tilt3D>
```
- **Props**: `max?: number` (default 7°), standard HTML div attributes.
- **Safety**: Zero frame loops when idle; disabled on touch devices.

---

### 4.2 Reveal & Stagger
Entrances that guide the eye without causing visual fatigue.
- `Reveal`: Single container fade-and-slide up (14px) using deceleration easing (`cubic-bezier(0.22, 1, 0.36, 1)`).
- `Stagger` & `StaggerItem`: Sequenced container reveals. Stagger delay is capped at `stagger.maxItems = 10` (40ms step) so long lists never delay usability.

```tsx
import { Reveal, Stagger, StaggerItem } from '@padhai-pilot/ui';

<Reveal on="view" delay={0.1}>
  <h2>Section Title</h2>
</Reveal>

<Stagger step={0.04}>
  {items.map((it) => (
    <StaggerItem key={it.id}>
      <Card item={it} />
    </StaggerItem>
  ))}
</Stagger>
```

---

### 4.3 AnimatedNumber
High-performance tabular number counter. Tweens from previous to current value using Motion's `animate()`.
- **Direct DOM Writes**: Zero React re-renders during the 60 FPS animation loop.
- **SSR-Safe**: Server renders the final formatted value; zero hydration flash.
- **Locale-Aware**: Defaults to `en-IN` (lakh/crore formatting for fees and student statistics).
- **Tabular Font**: Forced `font-variant-numeric: tabular-nums` to prevent layout jitter.

```tsx
import { AnimatedNumber } from '@padhai-pilot/ui';

<AnimatedNumber value={94.5} decimals={1} suffix="%" />
<AnimatedNumber value={125000} prefix="₹" />
```

---

### 4.4 Button
Primary interactive element mirroring Teacher Portal luxury classes.
- **Variants**: `'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger'`
- **Sizes**: `'sm' | 'md' | 'lg'`
- **Tap Feedback**: `whileTap={{ scale: 0.97 }}` driven by `spring.snappy`.
- **Loading State**: Accessible inline spinner, sets `aria-busy="true"`, disables duplicate clicks while keeping the label readable for screen readers.

```tsx
import { Button } from '@padhai-pilot/ui';

<Button variant="primary" loading={isSaving} onClick={handleSave}>
  Save Changes
</Button>
```

---

### 4.5 Tabs
Segmented sliding pill tab bar.
- **Fluid Motion**: The active pill indicator transitions via hardware-accelerated CSS `transform: translateX()` and `width` measured via `ResizeObserver`.
- **Accessibility**: Full WAI-ARIA tab pattern with arrow key (Left/Right/Home/End) navigation.

```tsx
import { Tabs } from '@padhai-pilot/ui';

<Tabs
  label="Time range"
  value={range}
  onChange={setRange}
  items={[
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'term', label: 'Term' },
  ]}
/>
```

---

### 4.6 Dialog & ConfirmDialog
Accessible modal surfaces with portal rendering into `document.body`.
- **Focus Management**: Focus moves into modal on open, trapped inside during Tab navigation, and returned to trigger element upon closing.
- **Dismissal**: Handled via `Escape` key and backdrop click (disabled when `dismissible={false}` or `busy={true}`).
- **Scroll Lock**: Automatically locks body scroll without layout shift.
- **ConfirmDialog**: Specialized alert dialog (`role="alertdialog"`) for destructive confirmations with cancel auto-focused.

```tsx
import { Dialog, ConfirmDialog } from '@padhai-pilot/ui';

<ConfirmDialog
  open={showDelete}
  title="Delete Assignment?"
  description="This will permanently delete the assignment and all student submissions."
  confirmLabel="Delete Forever"
  danger
  busy={isDeleting}
  onConfirm={handleDelete}
  onCancel={() => setShowDelete(false)}
/>
```

---

### 4.7 ChartCard & SVG Charts
Pure SVG chart ecosystem designed for zero external dependency weight.
- **ChartCard States**:
  1. `loading`: Displays skeleton bars in the exact chart footprint.
  2. `error`: Displays `status/error` illustration with retry callback.
  3. `empty`: Displays canonical empty-state artwork (`empty-states/inbox`, `attendance`, etc.) with explanatory copy.
  4. `ready`: Renders the interactive chart.
- **Zero CLS**: Fixed default `height={220}` ensures layout remains rock-solid while data loads.
- **Accessible Data**: Includes accessible `<table className="pp-table-alt">` and roving tabindex point highlights.

```tsx
import { ChartCard } from '@padhai-pilot/ui/charts';
import { LineChart } from '@padhai-pilot/ui/charts';

<ChartCard
  title="Weekly Attendance Trend"
  subtitle="Average student attendance across all batches"
  state={isLoading ? 'loading' : data.length === 0 ? 'empty' : 'ready'}
  emptyArt="empty-states/attendance"
  emptyTitle="No attendance taken"
  emptyDescription="Mark attendance for today's batches to begin tracking trends."
>
  <LineChart data={attendanceData} tone="brand" />
</ChartCard>
```

---

### 4.8 StatusBadge & Feedback Loaders
- **StatusBadge**: Displays status indicators with tones `'brand' | 'success' | 'warning' | 'danger' | 'neutral'`. Optional `live` prop activates a pulsing ping ring (`@keyframes pp-ping`).
- **Skeleton & LoadingRegion**: Shimmer skeleton blocks for content loading. `LoadingRegion` announces busy state to assistive technology via `aria-live="polite"`.
- **BrandLockup**: Combines the canonical logo mark with live editorial `Playfair Display` text.

```tsx
import { StatusBadge, Skeleton, LoadingRegion, BrandLockup } from '@padhai-pilot/ui';

<StatusBadge tone="success" live>Live Class</StatusBadge>
<StatusBadge tone="warning">Pending Verification</StatusBadge>

<LoadingRegion label="Loading student profile">
  <Skeleton width={180} height={24} />
  <Skeleton width="100%" height={16} />
</LoadingRegion>

<BrandLockup size={32} tagline="Faculty Portal" />
```

---

## 5. Motion Token Reference (`@padhai-pilot/ui/motion`)

```ts
import { duration, durationMs, easing, spring, stagger, distance, scale } from '@padhai-pilot/ui/motion';
```

| Token | Web Value | React Native Value | Usage |
|---|---|---|---|
| `duration.instant` | `0.08s` | `80ms` | Micro-toggles, color changes |
| `duration.fast` | `0.15s` | `150ms` | Hover feedback, tooltips |
| `duration.standard` | `0.24s` | `240ms` | Button taps, tabs, card transitions |
| `duration.emphasized`| `0.42s` | `420ms` | Page reveals, modal open/close |
| `duration.slow` | `0.70s` | `700ms` | Chart line draw-in, path animation |
| `easing.decelerate` | `[0.22, 1, 0.36, 1]` | Cubic bezier | Entrances & reveals |
| `easing.accelerate` | `[0.4, 0, 1, 1]` | Cubic bezier | Exits & dismissals |
| `spring.snappy` | `{ stiffness: 420, damping: 34 }` | Button tap, indicator slides |
| `spring.gentle` | `{ stiffness: 220, damping: 26 }` | Cards, drawer expansion |
| `scale.press` | `0.97` | Button active state |
| `distance.reveal` | `14px` | Standard vertical reveal offset |

### Motion Restrictions (Anti-Patterns)
Animations are strictly forbidden on:
- Fast attendance register checkbox rows (prevents delay during rapid roll-call).
- Bulk marks-entry cells (prevents keyboard navigation latency).
- Tables exceeding 30 rows (a single subtle first-render fade is permitted).

---

## 6. Canonical SVG Asset Library (`@padhai-pilot/assets`)

36 original handcrafted SVGs designed specifically for PadhaiPilot. Every asset adheres to the SVGO pipeline rules:
1. Palette-constrained: Only uses authorized Teacher Portal color hexes.
2. Lightweight: Under 1.5 KB per asset (~31 KB total for all 36 assets).
3. Clean: 0 `<text>` nodes, 0 `<style>` tags, 0 embedded bitmaps, 0 external URLs.

### Asset Manifest (36 Assets)
1. **Brand**: `brand/logo-mark`, `brand/logo-mark-mono`
2. **Dashboard**: `dashboard/analytics`, `dashboard/attendance`, `dashboard/fees-payments`, `dashboard/notifications`, `dashboard/reports`, `dashboard/salary-leave`
3. **Documents**: `documents/document-generation`, `documents/pdf-preview`
4. **Education**: `education/books`, `education/classroom`, `education/exam-results`, `education/homework`, `education/progress`, `education/student`, `education/teacher`, `education/timetable`
5. **Empty-States**: `empty-states/attendance`, `empty-states/documents`, `empty-states/inbox`, `empty-states/notifications`, `empty-states/roster`, `empty-states/search`
6. **Onboarding**: `onboarding/get-started`, `onboarding/step-attendance`, `onboarding/step-institute`, `onboarding/step-results`, `onboarding/step-students`, `onboarding/welcome`
7. **Status**: `status/error`, `status/loading-plane`, `status/spinner`, `status/success`, `status/upload`, `status/warning`

### Usage: Web & React Native
```tsx
// Web
import { Illustration } from '@padhai-pilot/assets/web';
<Illustration name="education/exam-results" size={140} animate="pop" />

// React Native
import { Illustration } from '@padhai-pilot/assets/native';
<Illustration name="education/exam-results" size={140} />
```

---

## 7. License Compliance & Clean-Room Verification

| Dependency / Component | Used As | License | Status |
|---|---|---|---|
| `motion` (motion.dev) `14.9.0` | Core motion engine | MIT (c) 2024 Motion B.V. | Verified & Adopted |
| `react-native-svg` | Mobile vector rendering | MIT | Verified & Adopted |
| `svgo` 4.x | Dev-time asset pipeline | MIT | Verified (Dev only) |
| `lucide-react` | General iconography | ISC / MIT | Verified & Adopted |
| Canonical 36 SVGs | Visual illustrations | Original clean-room work | 100% Original IP |
| All UI Components | React components in `@padhai-pilot/ui` | Original clean-room work | 100% Original IP |
| React Bits / Aceternity | Visual design inspiration | No code copied; clean-room implementation | Reference Only |

---

## 8. Build & Verification Commands

To verify all components, tests, and builds:

```bash
# 1. Run SVG library tests (39/39 passing)
cd packages/assets && node --test test/svg.test.mjs

# 2. Run UI motion & chart tests (7/7 passing)
cd packages/ui && node --test test/core.test.mjs

# 3. Build SVG assets workspace
npm run build --workspace=@padhai-pilot/assets

# 4. Build UI component workspace (TypeScript strict verification)
npm run build --workspace=@padhai-pilot/ui
```
