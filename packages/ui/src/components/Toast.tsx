'use client';

import * as React from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Illustration } from '@padhai-pilot/assets/web';
import { distance, duration, spring } from '../motion/tokens';
import '../styles/pp.css';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

const ToastContext = React.createContext<{ push: (t: Omit<ToastItem, 'id'>, ms?: number) => void } | null>(null);

/** Toast host. success/error use the canonical animated check/cross assets (draw animation). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);
  const push = React.useCallback((t: Omit<ToastItem, 'id'>, ms = 4200) => {
    const id = ++counter.current;
    setItems((cur) => [...cur.slice(-3), { ...t, id }]);
    window.setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), ms);
  }, []);
  const value = React.useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pp-toaster" role="region" aria-label="Notifications">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <m.div
              key={t.id}
              layout="position"
              className="pp-card pp-toast"
              role={t.kind === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: distance.sheet / 2 }}
              animate={{ opacity: 1, y: 0, transition: spring.gentle }}
              exit={{ opacity: 0, x: 24, transition: { duration: duration.fast } }}
            >
              <Illustration
                name={t.kind === 'success' ? 'status/success' : t.kind === 'error' ? 'status/error' : 'status/warning'}
                size={28}
                animate="draw"
              />
              <div>
                <strong>{t.title}</strong>
                {t.message && <span>{t.message}</span>}
              </div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return {
    success: (title: string, message?: string) => ctx.push({ kind: 'success', title, message }),
    error: (title: string, message?: string) => ctx.push({ kind: 'error', title, message }, 6500),
    warning: (title: string, message?: string) => ctx.push({ kind: 'warning', title, message }),
  };
}
