import React, { useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { EmptyPaper } from './Paper';

/**
 * Small react-native-svg charts in the paper-desk look (colours from the shared chart tokens).
 * Every chart treats null / non-finite values as "no data": a point is skipped, and when nothing is plottable the
 * chart shows an empty state instead of inventing numbers.
 */
export interface ChartDatum {
  label: string;
  value: number | null | undefined;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const shortLabel = (s: string, n = 7) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const useWidth = () => {
  const [w, setW] = useState(0);
  return { w, onLayout: (e: LayoutChangeEvent) => setW(Math.floor(e.nativeEvent.layout.width)) };
};

interface BaseProps {
  data: ChartDatum[];
  /** Upper bound of the y axis. Defaults to 100 (percentages). */
  max?: number;
  height?: number;
  emptyMessage?: string;
  color?: string;
  /** Format shown above bars / next to points. */
  format?: (v: number) => string;
}

const defaultFormat = (v: number) => `${Math.round(v)}%`;

export const BarChart: React.FC<BaseProps> = ({ data, max = 100, height = 160, emptyMessage = 'No data yet.', color, format = defaultFormat }) => {
  const { colors, typography } = useTheme();
  const { w, onLayout } = useWidth();
  const plottable = data.filter((d) => isNum(d.value));
  if (plottable.length === 0) return <EmptyPaper message={emptyMessage} />;
  const fill = color ?? colors.charts.categorical[0];
  const padB = 22;
  const padT = 16;
  const chartH = height - padB - padT;
  const slot = w > 0 ? w / data.length : 0;
  const barW = Math.max(6, Math.min(34, slot * 0.58));
  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {w > 0 ? (
        <Svg width={w} height={height} accessibilityLabel="Bar chart">
          <Line x1={0} x2={w} y1={padT + chartH} y2={padT + chartH} stroke={colors.charts.axis} strokeWidth={1} />
          <Line x1={0} x2={w} y1={padT} y2={padT} stroke={colors.charts.grid} strokeWidth={1} strokeDasharray="3 4" />
          {data.map((d, i) => {
            const cx = slot * i + slot / 2;
            const label = (
              <SvgText key={`l${i}`} x={cx} y={height - 6} fontSize={9.5} fontFamily={typography.fonts.data} fill={colors.charts.axisLabel} textAnchor="middle">
                {shortLabel(d.label, slot < 44 ? 5 : 9)}
              </SvgText>
            );
            if (!isNum(d.value)) return label;
            const h = (clamp(d.value, 0, max) / max) * chartH;
            return (
              <React.Fragment key={i}>
                <Rect x={cx - barW / 2} y={padT + chartH - h} width={barW} height={Math.max(h, 1)} rx={4} fill={fill} />
                <SvgText x={cx} y={padT + chartH - h - 4} fontSize={9.5} fontWeight="600" fontFamily={typography.fonts.data} fill={colors.textSecondary} textAnchor="middle">
                  {format(d.value)}
                </SvgText>
                {label}
              </React.Fragment>
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
};

export interface LineSeries extends Omit<BaseProps, 'data'> {
  data: ChartDatum[];
  /** Optional second series drawn dashed (e.g. class average). */
  compare?: ChartDatum[];
  compareLabel?: string;
}

export const LineChart: React.FC<LineSeries> = ({ data, compare, compareLabel, max = 100, height = 160, emptyMessage = 'No data yet.', color }) => {
  const { colors, typography } = useTheme();
  const { w, onLayout } = useWidth();
  const plottable = data.filter((d) => isNum(d.value));
  if (plottable.length === 0) return <EmptyPaper message={emptyMessage} />;
  const stroke = color ?? colors.charts.categorical[0];
  const padB = 22;
  const padT = 10;
  const padX = 14;
  const chartH = height - padB - padT;
  const step = data.length > 1 ? (w - padX * 2) / (data.length - 1) : 0;
  const xAt = (i: number) => (data.length > 1 ? padX + step * i : w / 2);
  const yAt = (v: number) => padT + chartH - (clamp(v, 0, max) / max) * chartH;
  const pts = (series: ChartDatum[]) =>
    series.map((d, i) => (isNum(d.value) ? `${xAt(i)},${yAt(d.value)}` : null)).filter((p): p is string => p !== null).join(' ');
  const hasCompare = !!compare && compare.some((d) => isNum(d.value));
  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {w > 0 ? (
        <Svg width={w} height={height} accessibilityLabel="Line chart">
          <Line x1={0} x2={w} y1={padT + chartH} y2={padT + chartH} stroke={colors.charts.axis} strokeWidth={1} />
          <Line x1={0} x2={w} y1={padT} y2={padT} stroke={colors.charts.grid} strokeWidth={1} strokeDasharray="3 4" />
          {hasCompare ? (
            <Polyline points={pts(compare as ChartDatum[])} fill="none" stroke={colors.charts.categorical[2]} strokeWidth={2} strokeDasharray="5 4" />
          ) : null}
          <Polyline points={pts(data)} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
          {data.map((d, i) =>
            isNum(d.value) ? <Circle key={i} cx={xAt(i)} cy={yAt(d.value)} r={3.5} fill={colors.surface} stroke={stroke} strokeWidth={2} /> : null,
          )}
          {data.map((d, i) =>
            data.length <= 8 || i % Math.ceil(data.length / 6) === 0 ? (
              <SvgText key={`x${i}`} x={xAt(i)} y={height - 6} fontSize={9.5} fontFamily={typography.fonts.data} fill={colors.charts.axisLabel} textAnchor="middle">
                {shortLabel(d.label, 7)}
              </SvgText>
            ) : null,
          )}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      {hasCompare ? (
        <Text style={{ fontFamily: typography.fonts.data, fontSize: 10.5, color: colors.textMuted, marginTop: 4 }}>
          {`Solid: you · Dashed: ${compareLabel ?? 'comparison'}`}
        </Text>
      ) : null}
    </View>
  );
};

/** Horizontal progress rows: label, filled track and value. Good for subjects, syllabus, submissions. */
export const HBarList: React.FC<{
  data: ChartDatum[];
  max?: number;
  emptyMessage?: string;
  format?: (v: number) => string;
  caption?: (d: ChartDatum, i: number) => string | undefined;
}> = ({ data, max = 100, emptyMessage = 'No data yet.', format = defaultFormat, caption }) => {
  const { colors, typography } = useTheme();
  if (data.length === 0) return <EmptyPaper message={emptyMessage} />;
  return (
    <View style={{ gap: 12 }}>
      {data.map((d, i) => {
        const has = isNum(d.value);
        const pct = has ? clamp((d.value as number) / max, 0, 1) : 0;
        return (
          <View key={`${d.label}-${i}`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: typography.fonts.ui, fontSize: 12.5, fontWeight: '600', color: colors.textPrimary }}>
                {d.label}
              </Text>
              <Text style={{ fontFamily: typography.fonts.data, fontSize: 12, fontWeight: '600', color: has ? colors.textSecondary : colors.textFaint }}>
                {has ? format(d.value as number) : 'No data'}
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
              <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: colors.charts.categorical[i % colors.charts.categorical.length] }} />
            </View>
            {caption?.(d, i) ? (
              <Text style={{ fontFamily: typography.fonts.data, fontSize: 10.5, color: colors.textMuted, marginTop: 3 }}>{caption(d, i)}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

/** Stacked single bar with legend for part-of-whole data (grade distribution, homework status). */
export const StackedBar: React.FC<{
  parts: Array<{ label: string; value: number; color?: string }>;
  emptyMessage?: string;
}> = ({ parts, emptyMessage = 'No data yet.' }) => {
  const { colors, typography } = useTheme();
  const total = parts.reduce((s, p) => s + (isNum(p.value) ? p.value : 0), 0);
  if (total <= 0) return <EmptyPaper message={emptyMessage} />;
  return (
    <View>
      <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: colors.surfaceElevated }}>
        {parts.map((p, i) =>
          p.value > 0 ? (
            <View key={p.label} style={{ flex: p.value, backgroundColor: p.color ?? colors.charts.categorical[i % colors.charts.categorical.length] }} />
          ) : null,
        )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
        {parts.map((p, i) => (
          <View key={p.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: p.color ?? colors.charts.categorical[i % colors.charts.categorical.length] }} />
            <Text style={{ fontFamily: typography.fonts.data, fontSize: 11, color: colors.textSecondary }}>{`${p.label} ${p.value}`}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
