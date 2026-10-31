import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from './Card';
import { Icon, IconName } from './Icon';

/** `.ak-desk-surface`: warm desk with two glow blobs and a 40px drafting grid. Plain canvas in dark mode. */
export const DeskBackground: React.FC = () => {
  const { colors, isDark } = useTheme();
  if (isDark) return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="blobA" cx="15%" cy="0%" rx="60%" ry="50%" fx="15%" fy="0%">
            <Stop offset="0" stopColor="#F4E6CA" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#F4E6CA" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobB" cx="90%" cy="10%" rx="50%" ry="40%" fx="90%" fy="10%">
            <Stop offset="0" stopColor="#FEDEC4" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#FEDEC4" stopOpacity="0" />
          </RadialGradient>
          <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Path d="M40 0H0V40" fill="none" stroke="#D0CDCA" strokeOpacity="0.25" strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#blobA)" />
        <Rect width="100%" height="100%" fill="url(#blobB)" />
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
    </View>
  );
};

export type Tone = 'blue' | 'amber' | 'teal' | 'emerald' | 'rose';

const TONES: Record<Tone, { bg: string; border: string; fg: string }> = {
  blue: { bg: '#EFF6FF', border: '#DBEAFE', fg: '#1677FF' },
  amber: { bg: '#FFFBEB', border: '#FDE68A', fg: '#B45309' },
  teal: { bg: '#F0FDFA', border: '#CCFBF1', fg: '#0F766E' },
  emerald: { bg: '#ECFDF5', border: '#D1FAE5', fg: '#047857' },
  rose: { bg: '#FFF1F2', border: '#FECDD3', fg: '#BE123C' },
};

/** Rounded icon tile used in KPI cards and menu rows (32px, tinted, bordered). */
export const IconChip: React.FC<{ icon: IconName; tone?: Tone; size?: number }> = ({ icon, tone = 'blue', size = 32 }) => {
  const { isDark } = useTheme();
  const t = TONES[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? `${t.fg}1F` : t.bg,
        borderColor: isDark ? `${t.fg}40` : t.border,
      }}
    >
      <Icon name={icon} size={Math.round(size / 2)} color={t.fg} />
    </View>
  );
};

interface KpiCardProps {
  label: string;
  value: string;
  caption?: string;
  icon: IconName;
  tone?: Tone;
  onPress?: () => void;
}

/** `.kpi-card`: uppercase label + icon chip, big Inter number, small caption. */
export const KpiCard: React.FC<KpiCardProps> = ({ label, value, caption, icon, tone = 'blue', onPress }) => {
  const { colors, typography } = useTheme();
  return (
    <Card onPress={onPress} style={{ flexGrow: 1, flexBasis: '45%', padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <Text
          numberOfLines={2}
          style={{ flex: 1, fontFamily: typography.fonts.ui, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textMuted }}
        >
          {label}
        </Text>
        <IconChip icon={icon} tone={tone} />
      </View>
      <Text style={{ fontFamily: typography.fonts.data, fontSize: 28, fontWeight: '800', color: colors.textPrimary }}>{value}</Text>
      {caption ? (
        <Text style={{ fontFamily: typography.fonts.ui, fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: 2 }}>{caption}</Text>
      ) : null}
    </Card>
  );
};

/** Section heading: blue icon + bold Raleway title, optional right-hand text link ("Full Timetable →"). */
export const SectionHeader: React.FC<{ title: string; icon?: IconName; action?: string; onAction?: () => void }> = ({
  title,
  icon,
  action,
  onAction,
}) => {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        {icon ? <Icon name={icon} size={16} color={colors.primary} /> : null}
        <Text style={{ fontFamily: typography.fonts.ui, fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, fontWeight: '700', color: colors.primary }}>{action}</Text>
          <Icon name="arrow-right" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
};

/** `.recessed-surface` time block: electric Inter start time over a muted "to …". */
export const TimeBlock: React.FC<{ start: string; end?: string }> = ({ start, end }) => {
  const { colors, typography } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        minWidth: 72,
      }}
    >
      <Text style={{ fontFamily: typography.fonts.data, fontSize: 12, fontWeight: '800', color: colors.primary }}>{start}</Text>
      {end ? <Text style={{ fontFamily: typography.fonts.data, fontSize: 10, color: colors.textMuted }}>{`to ${end}`}</Text> : null}
    </View>
  );
};

export type StampKind = 'P' | 'A' | 'L' | 'E';
const STAMPS: Record<StampKind, { bg: string; border: string; fg: string; label: string }> = {
  P: { bg: '#DAF5E4', border: '#10B981', fg: '#0E4A28', label: 'Present' },
  A: { bg: '#FDE2E4', border: '#F43F5E', fg: '#6D1B28', label: 'Absent' },
  L: { bg: '#FEF3C7', border: '#F59E0B', fg: '#78350F', label: 'Late' },
  E: { bg: '#E1EDFF', border: '#3B82F6', fg: '#0A3D78', label: 'Excused' },
};

/** Attendance rubber stamp (.stamp-p/a/l/e-active): pressed-in coloured when active, quiet outline otherwise. */
export const Stamp: React.FC<{ kind: StampKind; active: boolean; onPress: () => void }> = ({ kind, active, onPress }) => {
  const { colors, typography } = useTheme();
  const s = STAMPS[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={4}
      style={{
        minWidth: 44,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? s.bg : 'transparent',
        borderColor: active ? s.border : colors.border,
        transform: [{ scale: active ? 0.96 : 1 }],
      }}
    >
      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 13, fontWeight: active ? '800' : '600', color: active ? s.fg : colors.textMuted }}>{kind}</Text>
    </Pressable>
  );
};

/** Empty state exactly like the portal: a centred muted paper card. */
export const EmptyPaper: React.FC<{ title?: string; message: string }> = ({ title, message }) => {
  const { colors, typography } = useTheme();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
      {title ? <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>{title}</Text> : null}
      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>{message}</Text>
    </Card>
  );
};
