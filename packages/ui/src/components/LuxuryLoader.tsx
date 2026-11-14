'use client';

import * as React from 'react';
import '../styles/pp.css';

export interface LuxuryLoaderProps {
  /** Main brand heading */
  title?: string;
  /** Section / portal category eyebrow */
  subtitle?: string;
  /** Fluid status hint describing the current synchronization state */
  statusMessage?: string;
  /** Whether to render as a full-screen backdrop or an inline card/section */
  fullScreen?: boolean;
  /** Scale variant */
  size?: 'sm' | 'md' | 'lg';
  /** Extra classnames */
  className?: string;
}

export function LuxuryLoader({
  title = 'PadhaiPilot',
  subtitle = 'Academic Workspace',
  statusMessage = 'Synchronizing verified records...',
  fullScreen = true,
  size = 'md',
  className = '',
}: LuxuryLoaderProps) {
  const containerClasses = fullScreen
    ? `min-h-screen bg-[var(--bg-desk)] flex flex-col items-center justify-center relative overflow-hidden select-none p-6 ${className}`
    : `py-16 px-6 flex flex-col items-center justify-center relative overflow-hidden select-none w-full ${className}`;

  const iconSizes = {
    sm: { orbit: 'w-20 h-20', tile: 'w-12 h-12', mark: 24 },
    md: { orbit: 'w-28 h-28', tile: 'w-16 h-16', mark: 32 },
    lg: { orbit: 'w-36 h-36', tile: 'w-20 h-20', mark: 40 },
  }[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`${title} is loading: ${statusMessage}`}
      className={containerClasses}
    >
      {/* Ambient background glow & desk texture */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(22,119,255,0.11)_0%,rgba(217,119,6,0.05)_45%,transparent_70%)] blur-3xl pp-loader-glow" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--border-paper)_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
        {/* Animated Brand Insignia Stage */}
        <div className="relative mb-6 pp-loader-float flex items-center justify-center">
          {/* Outer Orbital Ring with Glowing Celestial Satellite */}
          <div
            className={`${iconSizes.orbit} rounded-full border border-dashed border-[var(--brand-electric)]/35 pp-loader-orbit-outer flex items-center justify-center relative`}
          >
            <span
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--brand-electric)] shadow-[0_0_12px_var(--brand-electric)] ring-4 ring-blue-500/10"
              aria-hidden="true"
            />
          </div>

          {/* Inner Counter-Rotating Golden Aura Ring */}
          <div
            className="absolute w-20 h-20 rounded-full border border-[var(--brand-gold,#D97706)]/25 pp-loader-orbit-inner"
            aria-hidden="true"
          />

          {/* Center Floating Emblem Tile */}
          <div
            className={`absolute ${iconSizes.tile} rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] shadow-xl shadow-black/5 flex items-center justify-center overflow-hidden backdrop-blur-md`}
          >
            {/* Shimmer light sweep */}
            <div className="absolute inset-0 pointer-events-none pp-loader-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            {/* PadhaiPilot Emblem SVG */}
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 drop-shadow-xs"
              aria-hidden="true"
            >
              <rect width="48" height="48" rx="12" fill="#1677FF" />
              <path d="M11 23.5 37 11 29 37 22 28.5Z" fill="#FFFFFF" />
              <path d="M22 28.5 37 11" stroke="#1677FF" strokeWidth="2.2" strokeLinecap="round" />
              <path d="m22 28.5 1.5 7.5 3.500-4.500Z" fill="#BBD4FC" />
            </svg>
          </div>
        </div>

        {/* Master Brand Typography */}
        <div className="space-y-1 mb-5">
          <h2 className="font-['Playfair_Display'] text-2xl lg:text-3xl font-bold tracking-tight text-[var(--ink-primary)]">
            {title}
          </h2>
          {subtitle && (
            <p className="font-['Raleway'] text-[11px] font-bold tracking-[0.22em] uppercase text-[var(--brand-electric)]">
              {subtitle}
            </p>
          )}
        </div>

        {/* Luxury Micro Progress Bar Indicator */}
        <div className="w-48 h-1 bg-[var(--border-paper)] rounded-full overflow-hidden relative shadow-inner mb-3">
          <div className="h-full w-24 bg-gradient-to-r from-transparent via-[var(--brand-electric)] to-transparent rounded-full pp-loader-beam" />
        </div>

        {/* Status Hint with Micro-Pulsing Dots */}
        <div className="flex items-center justify-center gap-2 text-xs font-['Raleway'] font-medium text-[var(--ink-secondary)]">
          <span>{statusMessage}</span>
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="w-1 h-1 rounded-full bg-[var(--brand-electric)] animate-ping" />
            <span className="w-1 h-1 rounded-full bg-[var(--brand-electric)] opacity-60" />
            <span className="w-1 h-1 rounded-full bg-[var(--brand-electric)] opacity-30" />
          </span>
        </div>
      </div>
    </div>
  );
}
