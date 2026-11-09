'use client';

import * as React from 'react';
import { Skeleton } from './Feedback';

/**
 * Enterprise Dashboard Skeleton.
 * Replaces full-screen blocking spinners with layout-stable placeholder cards (CLS = 0).
 */
export function DashboardSkeleton({ cards = 4, className = '' }: { cards?: number; className?: string }) {
  return (
    <div className={`space-y-6 w-full animate-fade-in ${className}`} role="status" aria-busy="true" aria-label="Loading dashboard">
      {/* Top Welcome / Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--pp-surface)] border border-[var(--pp-border)] shadow-xs">
        <div className="space-y-2">
          <Skeleton width={180} height={24} radius={6} />
          <Skeleton width={260} height={14} radius={4} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton width={110} height={36} radius={8} />
          <Skeleton width={90} height={36} radius={8} />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(cards, 4)} gap-4`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[var(--pp-surface)] border border-[var(--pp-border)] shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton width={90} height={12} radius={4} />
              <Skeleton width={28} height={28} radius={8} />
            </div>
            <Skeleton width={120} height={28} radius={6} />
            <Skeleton width="75%" height={10} radius={4} />
          </div>
        ))}
      </div>

      {/* Analytics & Content Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--pp-surface)] border border-[var(--pp-border)] shadow-xs space-y-4 min-h-[300px]">
          <div className="flex items-center justify-between">
            <Skeleton width={160} height={20} radius={6} />
            <Skeleton width={80} height={14} radius={4} />
          </div>
          <Skeleton width="100%" height={220} radius={12} />
        </div>
        <div className="p-6 rounded-2xl bg-[var(--pp-surface)] border border-[var(--pp-border)] shadow-xs space-y-4 min-h-[300px]">
          <Skeleton width={140} height={20} radius={6} />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--pp-border)] last:border-none">
                <div className="space-y-1.5">
                  <Skeleton width={120} height={14} radius={4} />
                  <Skeleton width={80} height={10} radius={3} />
                </div>
                <Skeleton width={45} height={18} radius={9999} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Enterprise Table Skeleton.
 * Emulates data tables with pulsing rows, headers, and badge indicators.
 */
export function TableSkeleton({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`p-4 rounded-2xl bg-[var(--pp-surface)] border border-[var(--pp-border)] shadow-xs space-y-3 ${className}`} role="status" aria-busy="true">
      {/* Table Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--pp-border)]">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} width={`${Math.floor(80 / cols)}%`} height={14} radius={4} />
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center justify-between py-3 border-b border-[var(--pp-border)] last:border-none">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              width={c === 0 ? '25%' : c === cols - 1 ? '15%' : `${Math.floor(50 / cols)}%`}
              height={16}
              radius={c === cols - 1 ? 9999 : 4}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Enterprise Card Grid Skeleton.
 */
export function CardGridSkeleton({ count = 6, cols = 3, className = '' }: { count?: number; cols?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-4 ${className}`} role="status" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-[var(--pp-surface)] border border-[var(--pp-border)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton width="45%" height={12} radius={9999} />
            <Skeleton width="25%" height={12} radius={4} />
          </div>
          <Skeleton width="85%" height={20} radius={6} />
          <Skeleton width="100%" height={12} radius={4} />
          <Skeleton width="65%" height={12} radius={4} />
          <div className="pt-2 flex items-center justify-between">
            <Skeleton width="35%" height={14} radius={4} />
            <Skeleton width={80} height={30} radius={8} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Enterprise Network Resilience Banner (Offline/Online Sync).
 * Similar to Google Docs / Microsoft 365 offline notification ribbon.
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [justReconnected, setJustReconnected] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !justReconnected) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`fixed top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 transition-all duration-300 ${
        isOnline
          ? 'bg-emerald-500/95 text-white border border-emerald-400'
          : 'bg-amber-600/95 text-white border border-amber-500 animate-pulse'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
      {isOnline
        ? 'Connection restored. System is synchronized.'
        : 'You are offline. Showing cached academic vault data.'}
    </div>
  );
}

