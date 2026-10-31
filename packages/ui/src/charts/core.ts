/**
 * Chart data contract + pure geometry helpers.
 * No React, no DOM: imported by the web SVG charts (`@padhai-pilot/ui/charts`) and by the
 * react-native-svg charts in apps/mobile, so both platforms render the same model.
 *
 * Rules: charts only receive data that came from a real API response. `null` means "no data for
 * this point" and is drawn as a gap, never as zero. Fixtures live in tests only.
 */

export type ChartTone = 'brand' | 'success' | 'warning' | 'danger' | 'deep' | 'muted';

export interface ChartPoint {
  /** category / time label shown on the x axis (already formatted, e.g. "Mar 3", "Unit Test 2") */
  x: string;
  /** value; null = no data */
  y: number | null;
  /** optional extra tooltip line, e.g. "18 of 22 present" */
  note?: string;
}

export interface ChartSeries {
  id: string;
  label: string;
  tone?: ChartTone;
  points: ChartPoint[];
}

export interface CartesianData {
  series: ChartSeries[];
  /** unit suffix for values, e.g. "%", " marks" */
  unit?: string;
  /** fixed axis bounds; otherwise derived from the data */
  yMin?: number;
  yMax?: number;
  /** optional horizontal reference line (e.g. 75% attendance requirement) */
  reference?: { value: number; label: string };
}

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  tone: ChartTone;
}

/** Tone -> concrete colour. Web uses the CSS variable (themeable); native uses the hex. */
export const toneHex: Record<ChartTone, string> = {
  brand: '#1677FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
  deep: '#0A3D78',
  muted: '#78716C',
};
const toneVar: Record<ChartTone, string> = {
  brand: 'var(--pp-chart-1, #1677FF)',
  success: 'var(--pp-chart-2, #10B981)',
  warning: 'var(--pp-chart-3, #F59E0B)',
  danger: 'var(--pp-chart-4, #F43F5E)',
  deep: 'var(--pp-chart-5, #0A3D78)',
  muted: 'var(--pp-chart-6, #78716C)',
};
export const toneCss = (t: ChartTone): string => toneVar[t];
const order: ChartTone[] = ['brand', 'success', 'warning', 'danger', 'deep', 'muted'];
export const toneAt = (i: number): ChartTone => order[i % order.length];

/** "Nice" axis ticks covering [min, max]. */
export function niceTicks(min: number, max: number, target = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    max = min + 1;
  }
  const span = max - min;
  const raw = span / Math.max(1, target - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 && mag >= 10 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

export function linear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}

export interface Extent {
  min: number;
  max: number;
  ticks: number[];
}

/** Value extent for the y axis. Bars/areas always include 0; lines may start above 0 when yMin is given. */
export function extent(data: CartesianData, includeZero: boolean): Extent {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of data.series) for (const p of s.points) if (p.y != null) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); }
  if (data.reference) { lo = Math.min(lo, data.reference.value); hi = Math.max(hi, data.reference.value); }
  if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
  if (includeZero) lo = Math.min(lo, 0);
  const min = data.yMin ?? lo;
  const max = data.yMax ?? hi;
  const ticks = niceTicks(min, max, 5);
  return { min: data.yMin ?? ticks[0], max: data.yMax ?? ticks[ticks.length - 1], ticks: data.yMax != null || data.yMin != null ? ticks.filter((t) => t >= (data.yMin ?? -Infinity) && t <= (data.yMax ?? Infinity)) : ticks };
}

/** Split a series into contiguous runs so null values render as gaps. */
export function runs(points: ChartPoint[]): Array<Array<{ i: number; y: number }>> {
  const out: Array<Array<{ i: number; y: number }>> = [];
  let cur: Array<{ i: number; y: number }> = [];
  points.forEach((p, i) => {
    if (p.y == null) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push({ i, y: p.y });
  });
  if (cur.length) out.push(cur);
  return out;
}

export const linePath = (pts: Array<[number, number]>): string => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

export const areaPath = (pts: Array<[number, number]>, baseY: number): string =>
  pts.length ? `${linePath(pts)}L${pts[pts.length - 1][0].toFixed(1)} ${baseY.toFixed(1)}L${pts[0][0].toFixed(1)} ${baseY.toFixed(1)}Z` : '';

/** Donut arc as a stroked path along the ring centre-line (angles in turns 0..1, starting at 12 o'clock). */
export function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const a0 = from * 2 * Math.PI - Math.PI / 2;
  const a1 = Math.min(to, from + 0.99999) * 2 * Math.PI - Math.PI / 2;
  const large = to - from > 0.5 ? 1 : 0;
  const p = (a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  return `M${p(a0)}A${r} ${r} 0 ${large} 1 ${p(a1)}`;
}

export function formatValue(v: number, unit = ''): string {
  const rounded = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${rounded.toLocaleString('en-IN')}${unit}`;
}

/** Plain-language summary used as the accessible name / text alternative of a chart. */
export function describeCartesian(data: CartesianData, noun = 'values'): string {
  const parts = data.series.map((s) => {
    const vals = s.points.filter((p) => p.y != null) as Array<ChartPoint & { y: number }>;
    if (!vals.length) return `${s.label}: no data`;
    const first = vals[0];
    const last = vals[vals.length - 1];
    const hi = vals.reduce((a, b) => (b.y > a.y ? b : a));
    const lo = vals.reduce((a, b) => (b.y < a.y ? b : a));
    const avg = vals.reduce((a, b) => a + b.y, 0) / vals.length;
    return `${s.label}: ${vals.length} ${noun}, from ${formatValue(first.y, data.unit)} (${first.x}) to ${formatValue(last.y, data.unit)} (${last.x}), highest ${formatValue(hi.y, data.unit)} (${hi.x}), lowest ${formatValue(lo.y, data.unit)} (${lo.x}), average ${formatValue(avg, data.unit)}.`;
  });
  return parts.join(' ');
}

export function describeDonut(slices: DonutSlice[], unit = ''): string {
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (!total) return 'No data.';
  return slices.map((s) => `${s.label} ${formatValue(s.value, unit)} (${Math.round((s.value / total) * 100)}%)`).join(', ') + '.';
}

/** True when the chart has at least one real value to draw. */
export const hasData = (data: CartesianData): boolean => data.series.some((s) => s.points.some((p) => p.y != null));
