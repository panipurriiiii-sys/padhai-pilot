'use client';

import * as React from 'react';
import '../styles/pp.css';

export interface TabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  /** accessible name if the label is an icon */
  ariaLabel?: string;
}

export interface TabsProps<T extends string = string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** accessible name of the tab list, e.g. "Date range" */
  label: string;
  className?: string;
  /** id prefix to link panels via aria-controls */
  idPrefix?: string;
}

/**
 * Segmented tabs / range selector with a sliding indicator.
 * The indicator is a measured CSS transform (transform + width only) so it costs no JS animation library.
 * Keyboard: Left/Right/Home/End move and activate, per the WAI-ARIA tabs pattern (automatic activation).
 */
export function Tabs<T extends string = string>({ items, value, onChange, label, className, idPrefix = 'pp-tab' }: TabsProps<T>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [pill, setPill] = React.useState<{ x: number; w: number } | null>(null);

  const measure = React.useCallback(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && active) setPill({ x: active.offsetLeft, w: active.offsetWidth });
  }, []);

  React.useLayoutEffect(() => {
    measure();
  }, [measure, value, items.length]);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  const onKey = (e: React.KeyboardEvent) => {
    const i = items.findIndex((t) => t.id === value);
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    onChange(items[next].id);
    requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus());
  };

  return (
    <div ref={listRef} role="tablist" aria-label={label} className={['pp-tabs', className].filter(Boolean).join(' ')} onKeyDown={onKey}>
      {pill && <span className="pp-tab-pill" aria-hidden="true" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />}
      {items.map((t) => (
        <button
          key={t.id}
          role="tab"
          id={`${idPrefix}-${t.id}`}
          type="button"
          className="pp-tab"
          aria-selected={t.id === value}
          aria-label={t.ariaLabel}
          tabIndex={t.id === value ? 0 : -1}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
