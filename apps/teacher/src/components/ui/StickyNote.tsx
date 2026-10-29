'use client';

import React from 'react';
import { PushPin, PushPinColor } from './PushPin';

export type StickyColor = 'yellow' | 'mint' | 'pink' | 'blue' | 'beige';

interface StickyNoteProps {
  color?: StickyColor;
  pinColor?: PushPinColor;
  rotation?: number;
  hasPin?: boolean;
  hasTape?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  badge?: string;
}

const COLOR_STYLES: Record<
  StickyColor,
  {
    bg: string;
    border: string;
    text: string;
    accent: string;
    subtext: string;
  }
> = {
  yellow: {
    bg: 'bg-[#FFF3C4]', // AK Exact Post-It Yellow
    border: 'border-[#F6E09E]',
    text: 'text-[#5C3D00]',
    accent: 'text-[#7D5300]',
    subtext: 'text-[#8A6314]',
  },
  mint: {
    bg: 'bg-[#DAF5E4]', // AK Exact Mint Green
    border: 'border-[#B2E6C4]',
    text: 'text-[#0E4A28]',
    accent: 'text-[#126336]',
    subtext: 'text-[#197A44]',
  },
  pink: {
    bg: 'bg-[#FDE2E4]', // AK Exact Blush Pink
    border: 'border-[#F8BCC2]',
    text: 'text-[#6D1B28]',
    accent: 'text-[#8E2435]',
    subtext: 'text-[#A83246]',
  },
  blue: {
    bg: 'bg-[#E1EDFF]', // AK Exact Tech Blue
    border: 'border-[#BBD4FC]',
    text: 'text-[#0A3D78]',
    accent: 'text-[#0D519F]',
    subtext: 'text-[#1665C0]',
  },
  beige: {
    bg: 'bg-[#F2E8DC]', // AK Exact Vintage Memo Beige
    border: 'border-[#DECDBD]',
    text: 'text-[#4A3728]',
    accent: 'text-[#634B38]',
    subtext: 'text-[#7A5F48]',
  },
};

export function StickyNote({
  color = 'yellow',
  pinColor = 'blue',
  rotation = 0,
  hasPin = true,
  hasTape = false,
  title,
  className = '',
  children,
  footer,
  badge,
}: StickyNoteProps) {
  const styles = COLOR_STYLES[color] || COLOR_STYLES.yellow;

  return (
    <div
      className={`relative group transition-all duration-300 ease-out hover:-translate-y-1.5 hover:rotate-0 hover:z-20 ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Top 3D Push Pin */}
      {hasPin && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 transition-transform duration-200 group-hover:scale-110">
          <PushPin color={pinColor} size={28} />
        </div>
      )}

      {/* Alternative: Translucent Scotch Tape Strip */}
      {hasTape && !hasPin && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 tape-strip rotate-[-1deg] z-30 pointer-events-none rounded-[1px]" />
      )}

      {/* Sticky Note Body with AK Curved Paper Shadow */}
      <div
        className={`relative p-5 rounded-sm border ${styles.bg} ${styles.border} ${styles.text} sticky-shadow transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(60,52,40,0.08),0_14px_28px_-6px_rgba(60,52,40,0.16)]`}
      >
        {/* Curled Paper Corner Illusion */}
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 overflow-hidden pointer-events-none">
          <div className="absolute -bottom-3 -right-3 w-5 h-5 bg-black/10 rounded-full blur-[1px]" />
        </div>

        {/* Note Header */}
        {(title || badge) && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/10">
            {title && (
              <h4 className="font-['Raleway'] font-bold text-xs uppercase tracking-wider truncate">
                {title}
              </h4>
            )}
            {badge && (
              <span className="font-['Inter'] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/10 shrink-0">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Note Content */}
        <div className="font-['Raleway'] text-xs leading-relaxed space-y-1.5">
          {children}
        </div>

        {/* Optional Note Footer */}
        {footer && (
          <div className="mt-3 pt-2 border-t border-black/10 font-['Inter'] text-[11px] opacity-85">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
