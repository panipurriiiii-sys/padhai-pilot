import * as React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { registry, type AssetName } from './generated/registry';
import { DRAW_MS, resolveAttrs } from './core';
import type { PaletteOverride } from './palette';
import type { AssetAnimation, AssetNode } from './types';

/* Same canonical tree as the web adapter, mapped onto react-native-svg primitives. */
const TAGS: Record<string, React.ComponentType<any>> = {
  g: G, path: Path, circle: Circle, ellipse: Ellipse, rect: Rect, line: Line,
  polyline: Polyline, polygon: Polygon, defs: Defs, clipPath: ClipPath,
};
const AnimatedTags: Record<string, React.ComponentType<any>> = {
  path: Animated.createAnimatedComponent(Path),
  circle: Animated.createAnimatedComponent(Circle),
  line: Animated.createAnimatedComponent(Line),
  polyline: Animated.createAnimatedComponent(Polyline),
};

export interface IllustrationProps {
  name: AssetName;
  /** Rendered width in dp (height follows the canonical aspect ratio). Defaults to native asset width. */
  size?: number;
  /** Accessible label. When omitted the artwork is hidden from screen readers. */
  label?: string;
  animate?: AssetAnimation;
  /** Palette override (e.g. from the app theme); defaults to the Teacher Portal light palette. */
  palette?: PaletteOverride;
  style?: StyleProp<ViewStyle>;
}

function useReduceMotion(): boolean {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => alive && setReduce(!!v)).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setReduce(v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

function renderNode(
  node: AssetNode,
  key: number,
  palette: PaletteOverride | undefined,
  progress: Animated.Value | null,
  total: number,
): React.ReactNode {
  const attrs: Record<string, any> = resolveAttrs(node.a, 'native', palette);
  const kids = node.c?.map((c, i) => renderNode(c, i, palette, progress, total));
  if (node.anim === 'draw' && progress && node.len && AnimatedTags[node.t]) {
    const Comp = AnimatedTags[node.t];
    const start = node.delay ?? 0;
    const offset = progress.interpolate({
      inputRange: [start, start + DRAW_MS],
      outputRange: [node.len, 0],
      extrapolate: 'clamp',
    });
    return <Comp key={key} {...attrs} strokeDasharray={[node.len, node.len]} strokeDashoffset={offset} />;
  }
  const Comp = TAGS[node.t];
  return (
    <Comp key={key} {...attrs}>
      {kids}
    </Comp>
  );
}

function maxDelay(nodes: AssetNode[]): number {
  return nodes.reduce((m, n) => Math.max(m, n.anim === 'draw' ? (n.delay ?? 0) : 0, n.c ? maxDelay(n.c) : 0), 0);
}

/**
 * Native renderer for the canonical SVG library. Animations use the built-in Animated API:
 *  - `draw`: JS-driven strokeDashoffset (react-native-svg props cannot use the native driver)
 *  - `spin` / `pop` / `float`: native-driver transforms on a wrapper view
 * All animation is skipped when the OS "reduce motion" setting is on (spin keeps a slow rotation).
 */
export function Illustration({ name, size, label, animate = 'none', palette, style }: IllustrationProps) {
  const def = registry[name];
  const reduce = useReduceMotion();
  const width = size ?? def.w;
  const height = (width * def.h) / def.w;
  const progress = React.useRef(new Animated.Value(0)).current;
  const wrap = React.useRef(new Animated.Value(0)).current;
  const drawing = animate === 'draw' && !reduce;
  const total = React.useMemo(() => maxDelay(def.tree) + DRAW_MS, [def]);

  React.useEffect(() => {
    if (drawing) {
      progress.setValue(0);
      const anim = Animated.timing(progress, { toValue: total, duration: total, easing: Easing.out(Easing.cubic), useNativeDriver: false });
      anim.start();
      return () => anim.stop();
    }
    return undefined;
  }, [drawing, progress, total]);

  React.useEffect(() => {
    wrap.setValue(0);
    if (animate === 'spin') {
      const loop = Animated.loop(Animated.timing(wrap, { toValue: 1, duration: reduce ? 2400 : 900, easing: Easing.linear, useNativeDriver: true }));
      loop.start();
      return () => loop.stop();
    }
    if (animate === 'float' && !reduce) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(wrap, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(wrap, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    if (animate === 'pop') {
      const anim = Animated.timing(wrap, { toValue: 1, duration: reduce ? 200 : 420, easing: reduce ? Easing.linear : Easing.out(Easing.back(1.6)), useNativeDriver: true });
      anim.start();
      return () => anim.stop();
    }
    return undefined;
  }, [animate, reduce, wrap]);

  const transform: Animated.WithAnimatedObject<any>[] = [];
  let opacity: Animated.AnimatedInterpolation<number> | undefined;
  if (animate === 'spin') transform.push({ rotate: wrap.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) });
  if (animate === 'float' && !reduce) transform.push({ translateY: wrap.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) });
  if (animate === 'pop') {
    opacity = wrap.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    if (!reduce) transform.push({ scale: wrap.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) });
  }

  const svgProps = resolveAttrs(def.root, 'native', palette) as Record<string, any>;
  return (
    <Animated.View
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      style={[styles.box, { width, height }, { transform, opacity }, style]}
    >
      <Svg width={width} height={height} viewBox={def.viewBox} {...svgProps}>
        {def.tree.map((n, i) => renderNode(n, i, palette, drawing ? progress : null, total))}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ box: { alignSelf: 'center' } });

export type { AssetName, AssetAnimation, PaletteOverride };
export { registry };
