'use client';

import * as React from 'react';
import type { AssetName } from '@padhai-pilot/assets/web';
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '../components/Feedback';
import { Reveal } from '../components/Reveal';
import '../styles/pp.css';

export type ChartState = 'loading' | 'error' | 'empty' | 'ready';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  state: ChartState;
  /** filters: range tabs, selects ... rendered top-right */
  actions?: React.ReactNode;
  onRetry?: () => void;
  errorMessage?: string;
  /** empty-state artwork + copy: say what is missing and what produces the data */
  emptyArt?: AssetName;
  emptyTitle?: string;
  emptyDescription?: string;
  /** height reserved while loading / empty to avoid layout shift */
  height?: number;
  footer?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Frame for every chart: title, filters and the four honest states.
 * Charts never render invented data: callers pass `state="empty"` when the API returned nothing
 * and `state="error"` when the request failed.
 */
export function ChartCard({
  title,
  subtitle,
  state,
  actions,
  onRetry,
  errorMessage,
  emptyArt = 'empty-states/inbox',
  emptyTitle = 'Nothing to chart yet',
  emptyDescription,
  height = 220,
  footer,
  className,
  children,
}: ChartCardProps) {
  const uid = React.useId();
  return (
    <Reveal className={['pp-card', 'pp-chart-card', className].filter(Boolean).join(' ')} role="group" aria-labelledby={`${uid}-t`}>
      <div className="pp-chart-head">
        <div>
          <h3 id={`${uid}-t`} className="pp-chart-title">
            {title}
          </h3>
          {subtitle && <p className="pp-chart-sub">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {state === 'loading' && (
        <LoadingRegion label={`Loading ${title}`}>
          <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 10, padding: '0 4px' }}>
            {[55, 78, 42, 90, 65, 70, 50].map((h, i) => (
              <Skeleton key={i} width="100%" height={`${h}%`} radius={6} />
            ))}
          </div>
        </LoadingRegion>
      )}
      {state === 'error' && (
        <div style={{ minHeight: height, display: 'grid', placeItems: 'center' }}>
          <ErrorState title="Could not load this chart" description={errorMessage} onRetry={onRetry} />
        </div>
      )}
      {state === 'empty' && (
        <div style={{ minHeight: height, display: 'grid', placeItems: 'center' }}>
          <EmptyState art={emptyArt} artSize={120} title={emptyTitle} description={emptyDescription} />
        </div>
      )}
      {state === 'ready' && children}
      {state === 'ready' && footer}
    </Reveal>
  );
}
