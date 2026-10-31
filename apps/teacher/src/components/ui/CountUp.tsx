'use client';

import React from 'react';
import { AnimatedNumber } from '@padhai-pilot/ui';

interface CountUpProps {
  to: number;
  /** kept for API compatibility; the shared AnimatedNumber always tweens from 0 / the previous value */
  from?: number;
  duration?: number; // In seconds
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * Teacher Portal metric counter. Now a thin wrapper over the shared `AnimatedNumber`
 * (@padhai-pilot/ui): no per-frame React state, respects prefers-reduced-motion, starts in view.
 */
export function CountUp({ to, duration = 0.8, decimals = 0, className = '', prefix = '', suffix = '' }: CountUpProps) {
  return (
    <AnimatedNumber
      value={to}
      duration={duration}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      className={`font-mono ${className}`}
      locale="en-US"
    />
  );
}
