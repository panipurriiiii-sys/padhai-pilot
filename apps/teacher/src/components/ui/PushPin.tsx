'use client';

import React from 'react';

export type PushPinColor = 'blue' | 'red' | 'yellow' | 'green' | 'purple';

interface PushPinProps {
  color?: PushPinColor;
  className?: string;
  size?: number;
}

const PIN_COLORS: Record<PushPinColor, { head: string; highlight: string; shadow: string }> = {
  blue: {
    head: '#2563EB',
    highlight: '#93C5FD',
    shadow: '#1E3A8A',
  },
  red: {
    head: '#DC2626',
    highlight: '#FCA5A5',
    shadow: '#7F1D1D',
  },
  yellow: {
    head: '#EAB308',
    highlight: '#FEF08A',
    shadow: '#713F12',
  },
  green: {
    head: '#16A34A',
    highlight: '#86EFAC',
    shadow: '#14532D',
  },
  purple: {
    head: '#7C3AED',
    highlight: '#C4B5FD',
    shadow: '#4C1D95',
  },
};

export function PushPin({ color = 'blue', className = '', size = 26 }: PushPinProps) {
  const c = PIN_COLORS[color] || PIN_COLORS.blue;
  const filterId = `pin-shadow-${color}-${size}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.22)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient
            id={`${filterId}-head`}
            cx="35%"
            cy="35%"
            r="65%"
            fx="30%"
            fy="30%"
          >
            <stop offset="0%" stopColor={c.highlight} />
            <stop offset="45%" stopColor={c.head} />
            <stop offset="100%" stopColor={c.shadow} />
          </radialGradient>
          <linearGradient id={`${filterId}-needle`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Pin metallic needle / tip shadow */}
        <path
          d="M16 16L18 29L16 27L14 29L16 16Z"
          fill={`url(#${filterId}-needle)`}
          opacity="0.85"
        />

        {/* Pin base collar */}
        <ellipse
          cx="16"
          cy="18"
          rx="5.5"
          ry="2.5"
          fill={c.shadow}
          opacity="0.75"
        />

        {/* Pin 3D Spherical Head */}
        <circle
          cx="16"
          cy="13"
          r="9"
          fill={`url(#${filterId}-head)`}
        />

        {/* Specular White Glint on top left of head */}
        <circle
          cx="13.5"
          cy="10.5"
          r="2.5"
          fill="#FFFFFF"
          opacity="0.85"
        />
        <circle
          cx="12.5"
          cy="9.5"
          r="1"
          fill="#FFFFFF"
          opacity="0.95"
        />
      </svg>
    </div>
  );
}
