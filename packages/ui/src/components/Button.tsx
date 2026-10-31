'use client';

import * as React from 'react';
import * as m from 'motion/react-m';
import { scale, spring } from '../motion/tokens';
import '../styles/pp.css';

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** shows an inline spinner, sets aria-busy and blocks repeat clicks (the label stays for screen readers) */
  loading?: boolean;
  /** icon-only button: aria-label is then required */
  icon?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

/**
 * Primary interactive control. Visual language = Teacher Portal `.btn-primary/.btn-secondary/.btn-subtle`.
 * Motion: 0.97 press feedback (spring.snappy) and colour transitions only; no hover movement.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon = false, leading, trailing, className, children, disabled, onClick, ...rest },
  ref,
) {
  const cls = [
    'pp-btn',
    `pp-btn-${variant}`,
    size === 'sm' && 'pp-btn-sm',
    size === 'lg' && 'pp-btn-lg',
    icon && 'pp-btn-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <m.button
      ref={ref}
      className={cls}
      disabled={disabled}
      aria-busy={loading || undefined}
      whileTap={disabled || loading ? undefined : { scale: scale.press }}
      transition={spring.snappy}
      onClick={loading ? undefined : onClick}
      {...(rest as object)}
    >
      {loading ? <span className="pp-btn-spinner" aria-hidden="true" /> : leading}
      {children}
      {!loading && trailing}
    </m.button>
  );
});
