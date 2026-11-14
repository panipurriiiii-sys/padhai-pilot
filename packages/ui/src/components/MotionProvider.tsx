'use client';

import * as React from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';
import { duration, easing } from '../motion/tokens';
import '../styles/pp.css';

/**
 * Animation features, loaded after first paint.
 *
 * `features={domAnimation}` with a static import put the whole feature bundle in the entry chunk,
 * which is the opposite of what LazyMotion is for: it was ~85 KB (24 KB gzipped) of JavaScript the
 * browser had to download and parse before the first screen, on every portal. As a loader function
 * Motion fetches it in its own chunk once the page is interactive, and components render unanimated
 * until it lands.
 */
const loadDomAnimation = () => import('motion/react').then((m) => m.domAnimation);

/**
 * App-level motion provider. Mount ONCE near the root of a portal.
 *  - LazyMotion with a loader: animation features are code-split out of the entry bundle.
 *  - MotionConfig reducedMotion="user": follows the OS setting - Motion stops transform and layout
 *    animations (slides, scales) and keeps opacity/colour changes (https://motion.dev/docs/react-accessibility).
 *  - Default transition = the `standard` motion token.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadDomAnimation} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: duration.standard, ease: [...easing.standard] as [number, number, number, number] }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
