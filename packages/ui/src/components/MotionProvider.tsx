'use client';

import * as React from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { duration, easing } from '../motion/tokens';
import '../styles/pp.css';

/**
 * App-level motion provider. Mount ONCE near the root of a portal.
 *  - LazyMotion + domAnimation: ~5 KB initial, animation features are code-split.
 *  - MotionConfig reducedMotion="user": follows the OS setting - Motion stops transform and layout
 *    animations (slides, scales) and keeps opacity/colour changes (https://motion.dev/docs/react-accessibility).
 *  - Default transition = the `standard` motion token.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: duration.standard, ease: [...easing.standard] as [number, number, number, number] }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
