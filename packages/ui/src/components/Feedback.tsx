'use client';

import * as React from 'react';
import * as m from 'motion/react-m';
import { Illustration, type AssetName } from '@padhai-pilot/assets/web';
import { duration, easing } from '../motion/tokens';
import '../styles/pp.css';

/** Placeholder block for loading content. CSS shimmer; static under reduced motion. */
export function Skeleton({ width = '100%', height = 14, radius, className, style }: { width?: number | string; height?: number | string; radius?: number | string; className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden="true" className={['pp-skeleton', className].filter(Boolean).join(' ')} style={{ width, height, borderRadius: radius, ...style }} />;
}

/** Loading region: announces busy state to assistive tech while skeletons are visible. */
export function LoadingRegion({ label = 'Loading', children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="pp-sr-only">{label}</span>
      {children}
    </div>
  );
}

export function Spinner({ size = 28, label }: { size?: number; label?: string }) {
  return <Illustration name="status/spinner" size={size} animate="spin" label={label} />;
}

/** Determinate progress. Animates scaleX (GPU only). The value must be a real, computed ratio. */
export function ProgressBar({ value, label, tone = 'brand' }: { value: number; label: string; tone?: 'brand' | 'success' | 'warning' | 'danger' }) {
  const v = Math.max(0, Math.min(1, value));
  const colour = { brand: 'var(--pp-brand)', success: 'var(--pp-success)', warning: 'var(--pp-warning)', danger: 'var(--pp-danger)' }[tone];
  return (
    <div className="pp-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}>
      <m.span
        style={{ background: colour }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: v }}
        transition={{ duration: duration.emphasized, ease: [...easing.decelerate] as [number, number, number, number] }}
      />
    </div>
  );
}

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

/** Status badge. `live` adds the ping ring (use only for genuinely live states, e.g. "Active"). */
export function StatusBadge({ tone = 'neutral', live = false, children }: { tone?: BadgeTone; live?: boolean; children: React.ReactNode }) {
  const colour = { brand: 'var(--pp-brand)', success: 'var(--pp-success)', warning: 'var(--pp-warning)', danger: 'var(--pp-danger)', neutral: 'var(--pp-ink-soft)' }[tone];
  return (
    <span className={`pp-badge pp-badge-${tone}`}>
      <span className={`pp-dot${live ? ' pp-dot-live' : ''}`} style={{ color: colour }} aria-hidden="true" />
      {children}
    </span>
  );
}

/** Empty state: canonical illustration + specific copy + optional next action. */
export function EmptyState({
  art,
  title,
  description,
  actions,
  artSize = 168,
  className,
}: {
  art: AssetName;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  artSize?: number;
  className?: string;
}) {
  return (
    <div className={['pp-empty', className].filter(Boolean).join(' ')}>
      <Illustration name={art} size={artSize} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actions && <div className="pp-empty-actions">{actions}</div>}
    </div>
  );
}

/** Error state with retry; same visual family as EmptyState. */
export function ErrorState({ title = 'Could not load this', description, onRetry, retryLabel = 'Try again' }: { title?: string; description?: React.ReactNode; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div className="pp-empty" role="alert">
      <Illustration name="status/error" size={64} animate="draw" />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {onRetry && (
        <div className="pp-empty-actions">
          <button type="button" className="pp-btn pp-btn-secondary" onClick={onRetry}>
            {retryLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/** Animated success confirmation (check ring draws in; pop for reduced motion). */
export function SuccessMark({ size = 72, label = 'Done' }: { size?: number; label?: string }) {
  return <Illustration name="status/success" size={size} animate="draw" label={label} />;
}

/** PadhaiPilot mark + live wordmark text in Playfair Display (SVG text / embedded fonts are not allowed in the asset library). */
export function BrandLockup({ size = 32, tagline, className }: { size?: number; tagline?: string; className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.3 }}>
      <Illustration name="brand/logo-mark" size={size} label="PadhaiPilot" />
      <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span className="pp-display" style={{ fontWeight: 700, fontSize: size * 0.62, letterSpacing: '-0.01em' }}>
          PadhaiPilot
        </span>
        {tagline && (
          <span className="pp-data" style={{ fontSize: Math.max(9, size * 0.28), color: 'var(--pp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
