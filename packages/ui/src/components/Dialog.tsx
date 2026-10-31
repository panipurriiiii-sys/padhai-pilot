'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { distance, duration, easing, scale } from '../motion/tokens';
import { Button } from './Button';
import '../styles/pp.css';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input:not([disabled]),select,[tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** footer actions */
  actions?: React.ReactNode;
  /** dialog | alertdialog (destructive confirmations) */
  role?: 'dialog' | 'alertdialog';
  /** block closing via overlay click / Escape (e.g. while saving) */
  dismissible?: boolean;
}

/**
 * Accessible modal: role=dialog + aria-modal, labelled/described, focus moves in and is trapped,
 * Escape / overlay click close it, focus returns to the trigger, body scroll is locked.
 * Motion: opacity + 24px/0.96 emphasized entrance (opacity-only under reduced motion via MotionConfig).
 */
export function Dialog({ open, onClose, title, description, children, actions, role = 'dialog', dismissible = true }: DialogProps) {
  const panel = React.useRef<HTMLDivElement>(null);
  const restore = React.useRef<HTMLElement | null>(null);
  const uid = React.useId();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => {
      const first = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel.current)?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      restore.current?.focus?.();
    };
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && dismissible) {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          className="pp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: duration.fast } }}
          onMouseDown={(e) => {
            if (dismissible && e.target === e.currentTarget) onClose();
          }}
        >
          <m.div
            ref={panel}
            role={role}
            aria-modal="true"
            aria-labelledby={`${uid}-t`}
            aria-describedby={description ? `${uid}-d` : undefined}
            tabIndex={-1}
            className="pp-card pp-dialog"
            onKeyDown={onKeyDown}
            initial={{ opacity: 0, y: distance.sheet, scale: scale.enter }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: duration.emphasized, ease: [...easing.decelerate] as [number, number, number, number] } }}
            exit={{ opacity: 0, y: distance.nudge * 2, transition: { duration: duration.fast, ease: [...easing.accelerate] as [number, number, number, number] } }}
          >
            <h2 id={`${uid}-t`}>{title}</h2>
            {description && <p id={`${uid}-d`}>{description}</p>}
            {children}
            {actions && <div className="pp-dialog-actions">{actions}</div>}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Destructive / irreversible confirmation built on Dialog (role=alertdialog, cancel autofocused). */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      role="alertdialog"
      dismissible={!busy}
      actions={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
