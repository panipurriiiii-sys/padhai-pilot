'use client';

import * as React from 'react';
import * as m from 'motion/react-m';
import type { Variants } from 'motion/react';
import { distance, duration, easing, stagger } from '../motion/tokens';

const ease = [...easing.decelerate] as [number, number, number, number];

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** seconds */
  delay?: number;
  /** y offset in px; removed automatically when the OS asks for reduced motion */
  y?: number;
  /** animate when scrolled into view (default) or immediately on mount */
  on?: 'view' | 'mount';
  as?: 'div' | 'section' | 'li' | 'article';
}

/**
 * Section / page entrance. Fades + slides up 14px once. Use for page sections and cards, not for
 * rows of attendance or marks tables.
 */
export function Reveal({ delay = 0, y = distance.reveal, on = 'view', as = 'div', children, ...rest }: RevealProps) {
  const Tag = m[as] as typeof m.div;
  const initial = { opacity: 0, y };
  const target = { opacity: 1, y: 0, transition: { duration: duration.emphasized, ease, delay } };
  return (
    <Tag
      initial={initial}
      {...(on === 'view'
        ? { whileInView: target, viewport: { once: true, margin: '-8% 0px' } }
        : { animate: target })}
      {...(rest as object)}
    >
      {children}
    </Tag>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: stagger.list, delayChildren: 0.02 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: distance.nudge * 2 },
  show: { opacity: 1, y: 0, transition: { duration: duration.standard, ease } },
};

/** Staggered group: children wrapped in <StaggerItem>. Stagger is capped by tokens so long lists stay fast. */
export function Stagger({
  children,
  className,
  step = stagger.list,
  as = 'div',
  on = 'view',
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
  as?: 'div' | 'ul' | 'ol';
  on?: 'view' | 'mount';
}) {
  const Tag = m[as] as typeof m.div;
  const variants: Variants = { ...container, show: { transition: { staggerChildren: step, delayChildren: 0.02 } } };
  return (
    <Tag
      className={className}
      variants={variants}
      initial="hidden"
      {...(on === 'view' ? { whileInView: 'show', viewport: { once: true, margin: '-8% 0px' } } : { animate: 'show' })}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li';
}) {
  const Tag = m[as] as typeof m.div;
  return (
    <Tag className={className} variants={item}>
      {children}
    </Tag>
  );
}
