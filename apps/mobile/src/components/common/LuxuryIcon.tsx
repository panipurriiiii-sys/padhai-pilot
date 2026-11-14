import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Icon, IconName } from './Icon';
import { useTheme } from '../../theme/ThemeContext';

export type LuxuryIconTone = 'emerald' | 'gold' | 'sapphire' | 'ruby' | 'amethyst' | 'slate';
export type LuxuryIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LuxuryIconVariant = 'badge' | 'glass' | 'glow' | 'solid';

interface LuxuryIconProps {
  name: IconName;
  tone?: LuxuryIconTone;
  size?: LuxuryIconSize;
  variant?: LuxuryIconVariant;
  style?: ViewStyle;
}

const SIZE_CONFIG: Record<LuxuryIconSize, { box: number; icon: number; radius: number; stroke: number }> = {
  xs: { box: 26, icon: 14, radius: 7, stroke: 2 },
  sm: { box: 34, icon: 18, radius: 9, stroke: 2 },
  md: { box: 44, icon: 22, radius: 12, stroke: 2.2 },
  lg: { box: 54, icon: 28, radius: 16, stroke: 2.2 },
  xl: { box: 66, icon: 34, radius: 20, stroke: 2.4 },
};

export const LuxuryIcon: React.FC<LuxuryIconProps> = ({
  name,
  tone = 'emerald',
  size = 'md',
  variant = 'badge',
  style,
}) => {
  const { isDark } = useTheme();
  const cfg = SIZE_CONFIG[size];

  // Resolve palette based on tone and color scheme
  const getPalette = () => {
    switch (tone) {
      case 'gold':
        return isDark
          ? { bg: '#291E05', border: '#78350F', icon: '#FBBF24', glow: 'rgba(245, 158, 11, 0.25)' }
          : { bg: '#FFFBEB', border: '#FDE68A', icon: '#B45309', glow: 'rgba(217, 119, 6, 0.15)' };
      case 'sapphire':
        return isDark
          ? { bg: '#0A1C3B', border: '#1E3A8A', icon: '#60A5FA', glow: 'rgba(59, 130, 246, 0.25)' }
          : { bg: '#EFF6FF', border: '#BFDBFE', icon: '#1D4ED8', glow: 'rgba(37, 99, 235, 0.15)' };
      case 'ruby':
        return isDark
          ? { bg: '#2B0E12', border: '#7F1D1D', icon: '#F87171', glow: 'rgba(239, 68, 68, 0.25)' }
          : { bg: '#FEF2F2', border: '#FECACA', icon: '#DC2626', glow: 'rgba(220, 38, 38, 0.15)' };
      case 'amethyst':
        return isDark
          ? { bg: '#200D36', border: '#581C87', icon: '#C084FC', glow: 'rgba(168, 85, 247, 0.25)' }
          : { bg: '#FAF5FF', border: '#E9D5FF', icon: '#7E22CE', glow: 'rgba(126, 34, 206, 0.15)' };
      case 'slate':
        return isDark
          ? { bg: '#1E293B', border: '#334155', icon: '#94A3B8', glow: 'rgba(148, 163, 184, 0.15)' }
          : { bg: '#F1F5F9', border: '#CBD5E1', icon: '#475569', glow: 'rgba(100, 116, 139, 0.12)' };
      case 'emerald':
      default:
        return isDark
          ? { bg: '#05231F', border: '#065F46', icon: '#34D399', glow: 'rgba(16, 185, 129, 0.25)' }
          : { bg: '#ECFDF5', border: '#A7F3D0', icon: '#047857', glow: 'rgba(5, 150, 105, 0.15)' };
    }
  };

  const palette = getPalette();

  const containerStyle = {
    width: cfg.box,
    height: cfg.box,
    borderRadius: cfg.radius,
    backgroundColor: variant === 'glass' ? 'rgba(255, 255, 255, 0.08)' : palette.bg,
    borderColor: palette.border,
    borderWidth: 1,
    shadowColor: palette.glow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: variant === 'glow' ? 0.6 : 0.2,
    shadowRadius: variant === 'glow' ? 8 : 4,
    elevation: 2,
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      <Icon
        name={name}
        size={cfg.icon}
        color={palette.icon}
        strokeWidth={cfg.stroke}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
