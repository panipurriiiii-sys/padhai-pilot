import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { paperShadow } from '../../theme/shadows';
import { Card } from './Card';
import { Icon, IconName } from './Icon';

/** Clean, tranquil canvas. No dirty yellow blobs or graph grid. */
export const DeskBackground: React.FC = memo(() => {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
  );
});

DeskBackground.displayName = 'DeskBackground';

export type Tone = 'blue' | 'amber' | 'teal' | 'emerald' | 'rose';

const TONES: Record<Tone, { bg: string; border: string; fg: string }> = {
  blue: { bg: '#EFF6FF', border: '#DBEAFE', fg: '#1677FF' },
  amber: { bg: '#FFFBEB', border: '#FEF3C7', fg: '#D97706' },
  teal: { bg: '#F0FDFA', border: '#CCFBF1', fg: '#0D9488' },
  emerald: { bg: '#ECFDF5', border: '#D1FAE5', fg: '#059669' },
  rose: { bg: '#FFF1F2', border: '#FFE4E6', fg: '#E11D48' },
};

/** Rounded icon tile used in KPI cards and menu rows. */
export const IconChip: React.FC<{ icon: IconName; tone?: Tone; size?: number }> = memo(({ icon, tone = 'blue', size = 32 }) => {
  const { isDark } = useTheme();
  const t = TONES[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.35),
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
});

IconChip.displayName = 'IconChip';

export interface QuickActionItem {
  icon: IconName;
  label: string;
  tone?: Tone;
  onPress: () => void;
}

/** Luxury 4-item thumb action bar inspired by Apple / Linear */
export const QuickActionsBar: React.FC<{ items: QuickActionItem[] }> = memo(({ items }) => {
  const { colors, typography, isDark } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 6,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        ...paperShadow(isDark),
      }}
    >
      {items.map((item, idx) => (
        <Pressable
          key={idx}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
        >
          <IconChip icon={item.icon} tone={item.tone ?? 'blue'} size={38} />
          <Text
            numberOfLines={1}
            style={{
              marginTop: 6,
              fontFamily: typography.fonts.ui,
              fontSize: 11,
              fontWeight: '600',
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

QuickActionsBar.displayName = 'QuickActionsBar';

interface KpiCardProps {
  label: string;
  value: string;
  caption?: string;
  icon: IconName;
  tone?: Tone;
  onPress?: () => void;
}

/** Luxury KPI metric card with clean typography and icon chip. */
export const KpiCard: React.FC<KpiCardProps> = memo(({ label, value, caption, icon, tone = 'blue', onPress }) => {
  const { colors, typography } = useTheme();
  return (
    <Card onPress={onPress} style={{ flexGrow: 1, flexBasis: '45%', padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 6 }}>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: typography.fonts.ui,
            fontSize: 10.5,
            fontWeight: '700',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: colors.textMuted,
          }}
        >
          {label}
        </Text>
        <IconChip icon={icon} tone={tone} size={28} />
      </View>
      <Text style={{ fontFamily: typography.fonts.data, fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>
        {value}
      </Text>
      {caption ? (
        <Text numberOfLines={1} style={{ fontFamily: typography.fonts.ui, fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: 4 }}>
          {caption}
        </Text>
      ) : null}
    </Card>
  );
});

KpiCard.displayName = 'KpiCard';

/** Section heading: icon + bold title, optional right-hand text link. */
export const SectionHeader: React.FC<{ title: string; icon?: IconName; action?: string; onAction?: () => void }> = memo(({
  title,
  icon,
  action,
  onAction,
}) => {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        {icon ? (
          <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={13} color={colors.primary} />
          </View>
        ) : null}
        <Text style={{ fontFamily: typography.fonts.ui, fontSize: 15, fontWeight: '700', letterSpacing: -0.2, color: colors.textPrimary }}>
          {title}
        </Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, fontWeight: '700', color: colors.primary }}>{action}</Text>
          <Icon name="arrow-right" size={13} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
});

SectionHeader.displayName = 'SectionHeader';

/** Recessed time block */
export const TimeBlock: React.FC<{ start: string; end?: string }> = memo(({ start, end }) => {
  const { colors, typography } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.borderSubtle,
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
});

TimeBlock.displayName = 'TimeBlock';

export type StampKind = 'P' | 'A' | 'L' | 'E';
const STAMPS: Record<StampKind, { bg: string; border: string; fg: string; label: string }> = {
  P: { bg: '#DAF5E4', border: '#10B981', fg: '#0E4A28', label: 'Present' },
  A: { bg: '#FDE2E4', border: '#F43F5E', fg: '#6D1B28', label: 'Absent' },
  L: { bg: '#FEF3C7', border: '#F59E0B', fg: '#78350F', label: 'Late' },
  E: { bg: '#E1EDFF', border: '#3B82F6', fg: '#0A3D78', label: 'Excused' },
};

/** Attendance rubber stamp */
export const Stamp: React.FC<{ kind: StampKind; active: boolean; onPress: () => void }> = memo(({ kind, active, onPress }) => {
  const { colors, typography } = useTheme();
  const base = STAMPS[kind];
  const s =
    kind === 'P' ? { ...base, bg: colors.stickyMintBg, fg: colors.stickyMintText }
    : kind === 'A' ? { ...base, bg: colors.stickyPinkBg, fg: colors.stickyPinkText }
    : kind === 'L' ? { ...base, bg: colors.stickyYellowBg, fg: colors.stickyYellowText }
    : { ...base, bg: colors.stickyBlueBg, fg: colors.stickyBlueText };
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
});

Stamp.displayName = 'Stamp';

/** Empty state: clean, modern centered message with icon. */
export const EmptyPaper: React.FC<{ title?: string; message: string; icon?: IconName }> = memo(({ title, message, icon = 'inbox' }) => {
  const { colors, typography } = useTheme();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon name={icon} size={20} color={colors.textMuted} />
      </View>
      {title ? <Text style={{ fontFamily: typography.fonts.ui, fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>{title}</Text> : null}
      <Text style={{ fontFamily: typography.fonts.ui, fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>{message}</Text>
    </Card>
  );
});

EmptyPaper.displayName = 'EmptyPaper';
