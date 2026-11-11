import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleProp, ViewStyle, Easing } from 'react-native';
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
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadius ?? radii.sm,
          backgroundColor: colors.borderSubtle,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: colors.border,
          opacity,
        }}
      />
    </View>
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
          gap: 14,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Skeleton width={36} height={36} borderRadius={radii.full} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="35%" height={11} />
        </View>
        <Skeleton width={56} height={22} borderRadius={radii.full} />
      </View>
      <Skeleton width="90%" height={18} />
      <Skeleton width="65%" height={13} />
      <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSubtle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width={90} height={12} />
        <Skeleton width={72} height={30} borderRadius={radii.md} />
      </View>
    </View>
  );
};

/** Repeated list row skeleton */
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
          <Skeleton width={42} height={42} borderRadius={radii.full} />
          <View style={{ flex: 1, gap: 7 }}>
            <Skeleton width="68%" height={15} />
            <Skeleton width="42%" height={11} />
          </View>
          <Skeleton width={22} height={22} borderRadius={radii.full} />
        </View>
      ))}
    </View>
  );
};

/** 2x2 KPI grid skeleton */
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
            gap: 10,
          }}
        >
          <Skeleton width={30} height={30} borderRadius={radii.sm} />
          <Skeleton width="52%" height={11} />
          <Skeleton width="75%" height={22} />
        </View>
      ))}
    </View>
  );
};
