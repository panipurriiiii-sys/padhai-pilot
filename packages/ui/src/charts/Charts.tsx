'use client';

import * as React from 'react';
import * as m from 'motion/react-m';
import { chart as chartMotion, duration, easing } from '../motion/tokens';
import {
  areaPath,
  arcPath,
  describeCartesian,
  describeDonut,
  extent,
  formatValue,
  linear,
  linePath,
  runs,
  toneAt,
  toneCss,
  type CartesianData,
  type ChartTone,
  type DonutSlice,
} from './core';
import '../styles/pp.css';

const ease = [...easing.decelerate] as [number, number, number, number];

/* ------------------------------------------------------------------ helpers */
function useWidth(fallback = 560): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(fallback);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.max(220, Math.floor(el.clientWidth)));
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((e) => setW(Math.max(220, Math.floor(e[0].contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

interface Tip {
  x: number;
  y: number;
  title: string;
  rows: Array<{ label: string; value: string; tone: ChartTone; note?: string }>;
}

function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div className="pp-tooltip" style={{ left: tip.x, top: tip.y }} aria-hidden="true">
      <b>{tip.title}</b>
      {tip.rows.map((r) => (
        <div key={r.label}>
          <i style={{ background: toneCss(r.tone) }} />
          {r.label}: {r.value}
          {r.note && <div style={{ opacity: 0.75 }}>{r.note}</div>}
        </div>
      ))}
    </div>
  );
}

function Legend({ items }: { items: Array<{ label: string; tone: ChartTone }> }) {
  if (items.length < 2) return null;
  return (
    <div className="pp-legend">
      {items.map((i) => (
        <span key={i.label}>
          <i style={{ background: toneCss(i.tone) }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Text alternative: always available, keyboard reachable, screen-reader friendly. */
function DataTable({ data, caption }: { data: CartesianData; caption: string }) {
  const labels = data.series[0]?.points.map((p) => p.x) ?? [];
  return (
    <details className="pp-details">
      <summary>View as table</summary>
      <table className="pp-table-alt">
        <caption className="pp-sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">&nbsp;</th>
            {data.series.map((s) => (
              <th key={s.id} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={`${l}-${i}`}>
              <th scope="row">{l}</th>
              {data.series.map((s) => (
                <td key={s.id}>{s.points[i]?.y == null ? 'No data' : formatValue(s.points[i].y as number, data.unit)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Roving-tabindex navigation across data points (Arrow keys, Home/End). */
function useRoving(count: number) {
  const [active, setActive] = React.useState(0);
  const refs = React.useRef<Array<SVGGElement | null>>([]);
  const move = (n: number) => {
    const i = Math.max(0, Math.min(count - 1, n));
    setActive(i);
    refs.current[i]?.focus();
  };
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); move(0); }
    else if (e.key === 'End') { e.preventDefault(); move(count - 1); }
  };
  return { active, setActive, refs, onKeyDown };
}

const MARGIN = { top: 12, right: 12, bottom: 30, left: 42 };
const thin = (labels: string[], innerW: number): Set<number> => {
  const per = 54;
  const every = Math.max(1, Math.ceil((labels.length * per) / Math.max(innerW, 1)));
  return new Set(labels.map((_, i) => i).filter((i) => i % every === 0 || i === labels.length - 1));
};
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export interface CartesianChartProps {
  data: CartesianData;
  /** accessible name; also the table caption. e.g. "Monthly attendance, Batch A" */
  label: string;
  height?: number;
  /** noun used in the generated text summary */
  noun?: string;
}

/* ---------------------------------------------------------------- bar chart */
export function BarChart({ data, label, height = 230, noun = 'values' }: CartesianChartProps) {
  const [ref, width] = useWidth();
  const [tip, setTip] = React.useState<Tip | null>(null);
  const labels = data.series[0]?.points.map((p) => p.x) ?? [];
  const { active, setActive, refs, onKeyDown } = useRoving(labels.length);
  const ext = extent(data, true);
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const y = linear([ext.min, ext.max], [innerH, 0]);
  const band = innerW / Math.max(labels.length, 1);
  const groupW = Math.min(band * 0.72, 56 * data.series.length);
  const barW = groupW / data.series.length;
  const showLabel = thin(labels, innerW);

  const show = (i: number) => {
    const cx = MARGIN.left + band * i + band / 2;
    setTip({
      x: cx,
      y: MARGIN.top + Math.min(...data.series.map((s) => (s.points[i]?.y == null ? innerH : y(s.points[i].y as number)))),
      title: labels[i],
      rows: data.series
        .filter((s) => s.points[i]?.y != null)
        .map((s, si) => ({ label: s.label, value: formatValue(s.points[i].y as number, data.unit), tone: s.tone ?? toneAt(si), note: s.points[i].note })),
    });
  };

  return (
    <div>
      <div className="pp-chart" ref={ref} onPointerLeave={() => setTip(null)}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${label}. ${describeCartesian(data, noun)}`}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {ext.ticks.map((t) => (
              <g key={t}>
                <line className="pp-grid-line" x1={0} x2={innerW} y1={y(t)} y2={y(t)} />
                <text x={-8} y={y(t)} textAnchor="end" dominantBaseline="middle">
                  {formatValue(t, data.unit)}
                </text>
              </g>
            ))}
            {data.reference && (
              <g>
                <line x1={0} x2={innerW} y1={y(data.reference.value)} y2={y(data.reference.value)} stroke={toneCss('danger')} strokeDasharray="5 4" />
                <text x={innerW} y={y(data.reference.value) - 4} textAnchor="end" style={{ fill: toneCss('danger') }}>
                  {data.reference.label}
                </text>
              </g>
            )}
            {labels.map((l, i) => (
              <g
                key={`${l}-${i}`}
                data-point
                ref={(el) => { refs.current[i] = el; }}
                tabIndex={i === active ? 0 : -1}
                role="img"
                aria-label={`${l}: ${data.series.filter((s) => s.points[i]?.y != null).map((s) => `${s.label} ${formatValue(s.points[i].y as number, data.unit)}`).join(', ') || 'no data'}`}
                data-active={tip?.title === l}
                onFocus={() => { setActive(i); show(i); }}
                onBlur={() => setTip(null)}
                onPointerEnter={() => show(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <rect x={band * i} y={0} width={band} height={innerH} fill="transparent" />
                {data.series.map((s, si) => {
                  const v = s.points[i]?.y;
                  if (v == null) return null;
                  const x = band * i + (band - groupW) / 2 + barW * si + 1;
                  const h = Math.max(0, y(Math.max(ext.min, 0)) - y(v));
                  return (
                    <m.rect
                      key={s.id}
                      x={x}
                      width={Math.max(2, barW - 2)}
                      y={y(v)}
                      height={h}
                      rx={4}
                      fill={toneCss(s.tone ?? toneAt(si))}
                      style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: chartMotion.enter, ease, delay: Math.min(i, 12) * chartMotion.barStagger }}
                    />
                  );
                })}
                <rect className="pp-focus-ring" x={band * i + 2} y={-2} width={band - 4} height={innerH + 4} rx={6} />
                {showLabel.has(i) && (
                  <text x={band * i + band / 2} y={innerH + 18} textAnchor="middle">
                    {clip(l, Math.max(4, Math.floor(band / 6.2)))}
                  </text>
                )}
              </g>
            ))}
            <line className="pp-axis-line" x1={0} x2={innerW} y1={innerH} y2={innerH} />
          </g>
        </svg>
        <Tooltip tip={tip} />
      </div>
      <Legend items={data.series.map((s, i) => ({ label: s.label, tone: s.tone ?? toneAt(i) }))} />
      <DataTable data={data} caption={label} />
    </div>
  );
}

/* --------------------------------------------------------------- line chart */
export function LineChart({ data, label, height = 230, area = false, noun = 'readings' }: CartesianChartProps & { area?: boolean }) {
  const [ref, width] = useWidth();
  const [tip, setTip] = React.useState<Tip | null>(null);
  const labels = data.series[0]?.points.map((p) => p.x) ?? [];
  const { active, setActive, refs, onKeyDown } = useRoving(labels.length);
  const ext = extent(data, false);
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const y = linear([ext.min, ext.max], [innerH, 0]);
  const n = labels.length;
  const xAt = (i: number) => (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const showLabel = thin(labels, innerW);

  const show = (i: number) => {
    const ys = data.series.map((s) => s.points[i]?.y).filter((v): v is number => v != null);
    setTip({
      x: MARGIN.left + xAt(i),
      y: MARGIN.top + (ys.length ? Math.min(...ys.map(y)) : innerH),
      title: labels[i],
      rows: data.series
        .filter((s) => s.points[i]?.y != null)
        .map((s, si) => ({ label: s.label, value: formatValue(s.points[i].y as number, data.unit), tone: s.tone ?? toneAt(si), note: s.points[i].note })),
    });
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left - MARGIN.left;
    const i = Math.max(0, Math.min(n - 1, Math.round(n <= 1 ? 0 : (px / innerW) * (n - 1))));
    if (tip?.title !== labels[i]) show(i);
  };

  return (
    <div>
      <div className="pp-chart" ref={ref} onPointerLeave={() => setTip(null)}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${label}. ${describeCartesian(data, noun)}`} onPointerMove={onMove}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {ext.ticks.map((t) => (
              <g key={t}>
                <line className="pp-grid-line" x1={0} x2={innerW} y1={y(t)} y2={y(t)} />
                <text x={-8} y={y(t)} textAnchor="end" dominantBaseline="middle">
                  {formatValue(t, data.unit)}
                </text>
              </g>
            ))}
            {data.reference && (
              <g>
                <line x1={0} x2={innerW} y1={y(data.reference.value)} y2={y(data.reference.value)} stroke={toneCss('danger')} strokeDasharray="5 4" />
                <text x={innerW} y={y(data.reference.value) - 4} textAnchor="end" style={{ fill: toneCss('danger') }}>
                  {data.reference.label}
                </text>
              </g>
            )}
            {tip && <line className="pp-axis-line" x1={tip.x - MARGIN.left} x2={tip.x - MARGIN.left} y1={0} y2={innerH} />}
            {data.series.map((s, si) => {
              const tone = s.tone ?? toneAt(si);
              return runs(s.points).map((run, ri) => {
                const pts = run.map((r) => [xAt(r.i), y(r.y)] as [number, number]);
                return (
                  <g key={`${s.id}-${ri}`}>
                    {area && si === 0 && pts.length > 1 && (
                      <m.path d={areaPath(pts, y(Math.max(ext.min, 0)))} fill={toneCss(tone)} fillOpacity={0.1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.emphasized, delay: 0.25 }} />
                    )}
                    {pts.length > 1 && (
                      <m.path
                        d={linePath(pts)}
                        fill="none"
                        stroke={toneCss(tone)}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: chartMotion.enter, ease }}
                      />
                    )}
                  </g>
                );
              });
            })}
            {labels.map((l, i) => (
              <g
                key={`${l}-${i}`}
                data-point
                ref={(el) => { refs.current[i] = el; }}
                tabIndex={i === active ? 0 : -1}
                role="img"
                aria-label={`${l}: ${data.series.filter((s) => s.points[i]?.y != null).map((s) => `${s.label} ${formatValue(s.points[i].y as number, data.unit)}`).join(', ') || 'no data'}`}
                data-active={tip?.title === l}
                onFocus={() => { setActive(i); show(i); }}
                onBlur={() => setTip(null)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                {data.series.map((s, si) => {
                  const v = s.points[i]?.y;
                  if (v == null) return null;
                  return <circle key={s.id} cx={xAt(i)} cy={y(v)} r={tip?.title === l ? 5 : 3.5} fill="var(--pp-surface, #fff)" stroke={toneCss(s.tone ?? toneAt(si))} strokeWidth={2} />;
                })}
                <circle className="pp-focus-ring" cx={xAt(i)} cy={data.series[0]?.points[i]?.y == null ? innerH : y(data.series[0].points[i].y as number)} r={9} />
                {showLabel.has(i) && (
                  <text x={xAt(i)} y={innerH + 18} textAnchor={i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}>
                    {clip(l, 9)}
                  </text>
                )}
              </g>
            ))}
            <line className="pp-axis-line" x1={0} x2={innerW} y1={innerH} y2={innerH} />
          </g>
        </svg>
        <Tooltip tip={tip} />
      </div>
      <Legend items={data.series.map((s, i) => ({ label: s.label, tone: s.tone ?? toneAt(i) }))} />
      <DataTable data={data} caption={label} />
    </div>
  );
}

/* ---------------------------------------------------- horizontal bar chart */
export interface HBarRow {
  id: string;
  label: string;
  value: number;
  /** denominator for "x of y" notes, optional */
  of?: number;
  tone?: ChartTone;
  note?: string;
}

/** Ranked / funnel bars. Labels on the left, value on the right: good for batch & subject comparison. */
export function HBarChart({ rows, label, unit = '', max, height }: { rows: HBarRow[]; label: string; unit?: string; max?: number; height?: number }) {
  const [ref, width] = useWidth();
  const [tip, setTip] = React.useState<Tip | null>(null);
  const rowH = 34;
  const h = height ?? rows.length * rowH + 8;
  const labelW = Math.min(150, Math.max(70, width * 0.3));
  const valueW = 56;
  const innerW = width - labelW - valueW;
  const top = Math.max(max ?? 0, ...rows.map((r) => r.value));
  const x = linear([0, top || 1], [0, innerW]);
  const { active, setActive, refs, onKeyDown } = useRoving(rows.length);
  const summary = rows.map((r) => `${r.label} ${formatValue(r.value, unit)}`).join(', ');
  return (
    <div>
      <div className="pp-chart" ref={ref} onPointerLeave={() => setTip(null)}>
        <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="group" aria-label={`${label}. ${summary}.`}>
          {rows.map((r, i) => (
            <g
              key={r.id}
              data-point
              ref={(el) => { refs.current[i] = el; }}
              tabIndex={i === active ? 0 : -1}
              role="img"
              aria-label={`${r.label}: ${formatValue(r.value, unit)}${r.of != null ? ` of ${formatValue(r.of, unit)}` : ''}`}
              transform={`translate(0,${i * rowH + 4})`}
              onFocus={() => { setActive(i); setTip({ x: labelW + x(r.value), y: i * rowH + 4, title: r.label, rows: [{ label: 'Value', value: formatValue(r.value, unit), tone: r.tone ?? 'brand', note: r.note }] }); }}
              onBlur={() => setTip(null)}
              onPointerEnter={() => setTip({ x: labelW + x(r.value), y: i * rowH + 4, title: r.label, rows: [{ label: 'Value', value: formatValue(r.value, unit), tone: r.tone ?? 'brand', note: r.note }] })}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <rect className="pp-focus-ring" x={0} y={-2} width={width} height={rowH - 4} rx={8} />
              <text x={0} y={(rowH - 8) / 2} dominantBaseline="middle" style={{ fill: 'var(--pp-text-2)', fontSize: 11 }}>
                {clip(r.label, Math.floor(labelW / 6.4))}
              </text>
              <rect x={labelW} y={(rowH - 8) / 2 - 7} width={innerW} height={14} rx={7} fill="var(--pp-surface-sunk)" />
              <m.rect
                x={labelW}
                y={(rowH - 8) / 2 - 7}
                width={Math.max(0, x(r.value))}
                height={14}
                rx={7}
                fill={toneCss(r.tone ?? 'brand')}
                style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: chartMotion.enter, ease, delay: Math.min(i, 12) * chartMotion.barStagger }}
              />
              <text x={width} y={(rowH - 8) / 2} textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--pp-text)', fontWeight: 700, fontSize: 11 }}>
                {formatValue(r.value, unit)}
              </text>
            </g>
          ))}
        </svg>
        <Tooltip tip={tip} />
      </div>
      <details className="pp-details">
        <summary>View as table</summary>
        <table className="pp-table-alt">
          <caption className="pp-sr-only">{label}</caption>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.label}</th>
                <td>{formatValue(r.value, unit)}</td>
                {r.note && <td>{r.note}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/* -------------------------------------------------------------------- donut */
export function DonutChart({
  slices,
  label,
  centerValue,
  centerLabel,
  unit = '',
  size = 168,
}: {
  slices: DonutSlice[];
  label: string;
  centerValue?: string;
  centerLabel?: string;
  unit?: string;
  size?: number;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const r = size / 2 - 14;
  let acc = 0;
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <div className="pp-chart" style={{ width: size, height: size, flex: '0 0 auto' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}. ${describeDonut(slices, unit)}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pp-surface-sunk)" strokeWidth={16} />
          {total > 0 &&
            slices.map((s, i) => {
              const from = acc / total;
              acc += s.value;
              const to = acc / total;
              if (s.value <= 0) return null;
              return (
                <m.path
                  key={s.id}
                  d={arcPath(size / 2, size / 2, r, from, to)}
                  fill="none"
                  stroke={toneCss(s.tone)}
                  strokeWidth={16}
                  strokeLinecap="butt"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: duration.slow, ease, delay: i * 0.12 }}
                />
              );
            })}
          {centerValue && (
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 24, fontWeight: 700, fill: 'var(--pp-text)', fontFamily: 'var(--pp-font-data)' }}>
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text x="50%" y={size / 2 + 20} textAnchor="middle">
              {centerLabel}
            </text>
          )}
        </svg>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8, fontSize: 12, fontFamily: 'var(--pp-font-ui)', color: 'var(--pp-text-2)' }}>
        {slices.map((s) => (
          <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: toneCss(s.tone), display: 'inline-block' }} />
            <span>{s.label}</span>
            <b className="pp-data" style={{ marginLeft: 'auto', paddingLeft: 12, color: 'var(--pp-text)' }}>
              {formatValue(s.value, unit)}
              {total > 0 && <span style={{ fontWeight: 500, color: 'var(--pp-text-muted)' }}> · {Math.round((s.value / total) * 100)}%</span>}
            </b>
          </li>
        ))}
      </ul>
    </div>
  );
}
