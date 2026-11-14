'use client';

import * as React from 'react';

export type LuxuryTone = 'emerald' | 'gold' | 'sapphire' | 'ruby' | 'amethyst' | 'slate';
export type LuxurySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LuxuryVariant = 'badge' | 'glass' | 'glow' | 'solid';

export interface LuxuryIconProps {
  children: React.ReactNode;
  tone?: LuxuryTone;
  size?: LuxurySize;
  variant?: LuxuryVariant;
  className?: string;
  title?: string;
}

const TONE_CLASSES: Record<LuxuryTone, { bg: string; border: string; text: string; glow: string }> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200/80 dark:border-emerald-800/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    glow: 'shadow-emerald-500/10 dark:shadow-emerald-950/40',
  },
  gold: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200/80 dark:border-amber-800/60',
    text: 'text-amber-700 dark:text-amber-300',
    glow: 'shadow-amber-500/10 dark:shadow-amber-950/40',
  },
  sapphire: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200/80 dark:border-blue-800/60',
    text: 'text-blue-700 dark:text-blue-300',
    glow: 'shadow-blue-500/10 dark:shadow-blue-950/40',
  },
  ruby: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200/80 dark:border-rose-800/60',
    text: 'text-rose-700 dark:text-rose-300',
    glow: 'shadow-rose-500/10 dark:shadow-rose-950/40',
  },
  amethyst: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200/80 dark:border-purple-800/60',
    text: 'text-purple-700 dark:text-purple-300',
    glow: 'shadow-purple-500/10 dark:shadow-purple-950/40',
  },
  slate: {
    bg: 'bg-stone-100 dark:bg-stone-800/50',
    border: 'border-stone-200 dark:border-stone-700',
    text: 'text-stone-600 dark:text-stone-300',
    glow: 'shadow-stone-500/5 dark:shadow-black/20',
  },
};

const SIZE_CLASSES: Record<LuxurySize, { box: string; iconSize: string; radius: string }> = {
  xs: { box: 'w-6 h-6', iconSize: '[&>svg]:w-3.5 [&>svg]:h-3.5', radius: 'rounded-md' },
  sm: { box: 'w-8 h-8', iconSize: '[&>svg]:w-4 [&>svg]:h-4', radius: 'rounded-lg' },
  md: { box: 'w-10 h-10', iconSize: '[&>svg]:w-5 [&>svg]:h-5', radius: 'rounded-xl' },
  lg: { box: 'w-12 h-12', iconSize: '[&>svg]:w-6 [&>svg]:h-6', radius: 'rounded-2xl' },
  xl: { box: 'w-16 h-16', iconSize: '[&>svg]:w-8 [&>svg]:h-8', radius: 'rounded-3xl' },
};

/**
 * Elevated Luxury Icon Container for PadhaiPilot Web Portals.
 * Transforms plain wireframe SVG icons into bespoke, illuminated design tokens.
 */
export function LuxuryIcon({
  children,
  tone = 'emerald',
  size = 'md',
  variant = 'badge',
  className = '',
  title,
}: LuxuryIconProps) {
  const t = TONE_CLASSES[tone];
  const s = SIZE_CLASSES[size];

  const variantStyles =
    variant === 'glow'
      ? `shadow-lg ${t.glow}`
      : variant === 'glass'
      ? 'backdrop-blur-sm bg-white/40 dark:bg-stone-900/40 shadow-sm'
      : 'shadow-xs';

  return (
    <div
      title={title}
      className={`inline-flex items-center justify-center border transition-all duration-200 shrink-0 select-none ${s.box} ${s.radius} ${t.bg} ${t.border} ${t.text} ${s.iconSize} ${variantStyles} ${className}`}
    >
      {children}
    </div>
  );
}
