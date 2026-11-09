import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}) => {
  const { colors, radii } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadius ?? radii.sm,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

/** High-level Card Skeleton for luxury Paper-Desk aesthetic */
export const CardSkeleton: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const { colors, radii } = useTheme();
  return (
    <View
      style={[
        {
          padding: 16,
          borderRadius: radii.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 12,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton width={80} height={18} borderRadius={radii.full} />
        <Skeleton width={60} height={14} />
      </View>
      <Skeleton width="85%" height={20} />
      <Skeleton width="60%" height={14} />
      <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width={100} height={14} />
        <Skeleton width={70} height={28} borderRadius={radii.sm} />
      </View>
    </View>
  );
};

/** Repeated list row skeleton for flatlists */
export const ListRowSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const { colors, radii } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 12,
          }}
        >
          <Skeleton width={40} height={40} borderRadius={radii.full} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="45%" height={12} />
          </View>
          <Skeleton width={24} height={24} borderRadius={radii.full} />
        </View>
      ))}
    </View>
  );
};

/** 2x2 or 4-grid KPI Metrics Skeleton */
export const MetricsGridSkeleton: React.FC = () => {
  const { colors, radii } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            minWidth: '45%',
            padding: 14,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 8,
          }}
        >
          <Skeleton width={28} height={28} borderRadius={radii.sm} />
          <Skeleton width="50%" height={12} />
          <Skeleton width="80%" height={22} />
        </View>
      ))}
    </View>
  );
};


