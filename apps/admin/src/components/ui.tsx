'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw, X, XCircle } from 'lucide-react';
import { ApiError } from '../lib/api';

/* ---------- data loading ---------- */

export function errMsg(e: unknown, fallback = 'Something went wrong.'): string {
  return e instanceof Error ? e.message : fallback;
}

export function useLoad<T>(fn: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    const id = ++seq.current;
    setLoading(true);
    fn()
      .then((d) => {
        if (id === seq.current) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => {
        if (id === seq.current) setError(e instanceof Error ? e : new Error('Request failed'));
      })
      .finally(() => {
        if (id === seq.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { data, error, loading, reload: run, setData };
}

/* ---------- toasts ---------- */

type ToastKind = 'success' | 'error' | 'info';
const ToastCtx = createContext<(text: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string; kind: ToastKind }[]>([]);
  const push = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, text, kind }]);
    setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        className="fixed z-[60] left-4 right-4 bottom-20 md:bottom-4 md:left-auto md:right-4 md:w-96 flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`notice pointer-events-auto shadow-lg ${
              t.kind === 'success' ? 'is-success' : t.kind === 'error' ? 'is-danger' : 'is-info'
            }`}
          >
            {t.kind === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : t.kind === 'error' ? <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="min-w-0 break-words flex-1">{t.text}</span>
            <button
              type="button"
              aria-label="Dismiss"
              className="shrink-0 -m-2 p-2"
              onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- small building blocks ---------- */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="font-display font-bold text-2xl text-ink-primary break-words">{title}</h1>
        {subtitle && <p className="font-primary text-sm text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const status = error instanceof ApiError ? error.status : 0;
  return (
    <div className="notice is-danger" role="alert">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-bold">{status === 403 ? 'Not permitted' : 'Could not load this section'}</p>
        <p className="break-words">{error.message}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

export function LoadingBlock({
  rows = 3,
  message = 'Loading platform records...',
}: {
  rows?: number;
  message?: string;
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label={message}>
      <div className="flex items-center gap-2.5 text-xs text-ink-muted font-medium mb-1">
        <Spin className="w-4 h-4 text-brand-primary" />
        <span>{message}</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full flex items-center justify-between px-5">
            <div className="space-y-2 w-1/3">
              <div className="h-3.5 bg-ink-primary/10 rounded w-3/4" />
              <div className="h-2.5 bg-ink-muted/10 rounded w-1/2" />
            </div>
            <div className="h-6 w-16 bg-ink-primary/10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty-state py-10 text-center text-sm text-ink-muted font-primary">{children}</div>;
}

export function Spin({ className = 'w-3.5 h-3.5' }: { className?: string } = {}) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

const BADGE: Record<string, string> = {
  ACTIVE: 'is-success',
  SUCCESS: 'is-success',
  TRIAL: 'is-info',
  info: 'is-info',
  SUSPENDED: 'is-warning',
  WARNING: 'is-warning',
  warning: 'is-warning',
  ARCHIVED: 'is-neutral',
  FAILURE: 'is-danger',
  critical: 'is-danger',
  EMERGENCY_KILLED: 'is-danger',
};
export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return <span className={`badge-status ${BADGE[value] ?? 'is-neutral'}`}>{label ?? value}</span>;
}

export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '-');
export const fmtDay = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : '-');

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-ink-primary font-primary mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-ink-muted mt-1">{hint}</span>}
    </label>
  );
}

/* ---------- dialog ---------- */

export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="dialog-scrim !items-end sm:!items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="dialog-panel !max-h-[92dvh] !max-w-[calc(100vw-1.5rem)] sm:!max-w-lg flex flex-col"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-border-paper">
          <h2 className="font-display font-bold text-lg text-ink-primary break-words min-w-0">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="tap shrink-0 rounded-lg hover:bg-paper-warm">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-border-paper flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- responsive table: table on md+, labelled cards below ---------- */

export interface Col<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Shown as the card title on mobile (first column by default) */
  primary?: boolean;
  className?: string;
}

export function DataList<T>({
  rows,
  cols,
  rowKey,
  onRowClick,
  empty = 'Nothing to show.',
}: {
  rows: T[];
  cols: Col<T>[];
  rowKey: (r: T) => string;
  onRowClick?: (r: T) => void;
  empty?: string;
}) {
  if (rows.length === 0) return <Empty>{empty}</Empty>;
  const primary = cols.find((c) => c.primary) ?? cols[0];
  const rest = cols.filter((c) => c !== primary);
  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={onRowClick ? 'cursor-pointer' : ''}>
                {cols.map((c) => (
                  <td key={c.header} className={c.className}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="lg:hidden space-y-3">
        {rows.map((r) => (
          <li
            key={rowKey(r)}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            className={`paper-card p-4 space-y-2 ${onRowClick ? 'cursor-pointer' : ''}`}
          >
            <div className="font-bold text-sm text-ink-primary break-words">{primary.cell(r)}</div>
            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5 text-xs">
              {rest.map((c) => (
                <React.Fragment key={c.header}>
                  <dt className="text-ink-muted font-primary">{c.header}</dt>
                  <dd className="min-w-0 break-words font-data text-ink-primary">{c.cell(r)}</dd>
                </React.Fragment>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Pager({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-4 text-xs font-primary text-ink-muted">
      <span>{total} result{total === 1 ? '' : 's'}</span>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="font-data">
          {page} / {pages}
        </span>
        <button type="button" className="btn-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
