'use client';

import * as React from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { duration, easing } from '../motion/tokens';

export interface AnimatedNumberProps {
  /** The real metric. The component never invents a value. */
  value: number;
  /** decimal places */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** seconds; defaults to the emphasized token */
  duration?: number;
  className?: string;
  /** locale for grouping; default en-IN (lakh grouping suits fees/salary figures) */
  locale?: string;
}

/**
 * Metric transition. Writes straight to the DOM node (no React state in the animation loop),
 * starts when scrolled into view, tweens from the previous value on updates, and renders the final
 * value immediately under reduced motion. Server render outputs the final value (no hydration flash,
 * correct for crawlers / no-JS).
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration: d = duration.emphasized,
  className,
  locale = 'en-IN',
}: AnimatedNumberProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const previous = React.useRef<number | null>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduced = useReducedMotion();
  const format = React.useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    [locale, decimals],
  );

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const write = (v: number) => {
      node.textContent = `${prefix}${format.format(v)}${suffix}`;
    };
    if (reduced || !inView) {
      if (reduced) write(value);
      previous.current = value;
      return;
    }
    const from = previous.current ?? 0;
    previous.current = value;
    const controls = animate(from, value, {
      duration: d,
      ease: [...easing.decelerate] as [number, number, number, number],
      onUpdate: write,
    });
    return () => controls.stop();
  }, [value, inView, reduced, d, format, prefix, suffix]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}
      {format.format(value)}
      {suffix}
    </span>
  );
}
