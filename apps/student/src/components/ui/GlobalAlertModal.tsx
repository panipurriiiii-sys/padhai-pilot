'use client';

import * as React from 'react';
import { useAlertStore, AlertType } from '../../store/useAlertStore';
import { LuxuryIcon, LuxuryTone } from '@padhai-pilot/ui';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, Info, X } from 'lucide-react';

const TYPE_CONFIG: Record<AlertType, { tone: LuxuryTone; icon: React.ReactNode; defaultTitle: string }> = {
  success: { tone: 'emerald', icon: <CheckCircle2 className="w-5 h-5" />, defaultTitle: 'Success' },
  error: { tone: 'ruby', icon: <AlertTriangle className="w-5 h-5" />, defaultTitle: 'Attention Required' },
  warning: { tone: 'gold', icon: <AlertCircle className="w-5 h-5" />, defaultTitle: 'Notice' },
  confirm: { tone: 'sapphire', icon: <HelpCircle className="w-5 h-5" />, defaultTitle: 'Confirm Action' },
  info: { tone: 'emerald', icon: <Info className="w-5 h-5" />, defaultTitle: 'Information' },
};

export function GlobalAlertModal() {
  const { activeAlert, closeAlert } = useAlertStore();

  React.useEffect(() => {
    if (!activeAlert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const cb = activeAlert.onCancel;
        closeAlert();
        cb?.();
      } else if (e.key === 'Enter') {
        const cb = activeAlert.onConfirm;
        closeAlert();
        cb?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeAlert, closeAlert]);

  if (!activeAlert) return null;

  const cfg = TYPE_CONFIG[activeAlert.type] || TYPE_CONFIG.info;
  const isConfirm = activeAlert.type === 'confirm' || Boolean(activeAlert.cancelText);

  const handleConfirm = () => {
    const cb = activeAlert.onConfirm;
    closeAlert();
    cb?.();
  };

  const handleCancel = () => {
    const cb = activeAlert.onCancel;
    closeAlert();
    cb?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
    >
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={isConfirm ? undefined : handleCancel} />

      {/* Luxury Modal Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-2xl z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Close cross button */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Elevated Luxury Icon Badge */}
        <div className="mb-4">
          <LuxuryIcon tone={cfg.tone} size="lg" variant="glow">
            {cfg.icon}
          </LuxuryIcon>
        </div>

        {/* Playfair Display Title */}
        <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2 tracking-tight">
          {activeAlert.title || cfg.defaultTitle}
        </h3>

        {/* Inter Body Text */}
        {Boolean(activeAlert.message) && (
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300 font-sans mb-6 max-w-sm">
            {activeAlert.message}
          </p>
        )}

        {/* Buttons Row */}
        <div className="w-full flex items-center gap-3 mt-2">
          {isConfirm && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {activeAlert.cancelText || 'Cancel'}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-[0.98] ${
              activeAlert.isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-emerald-700/20'
            }`}
          >
            {activeAlert.confirmText || (isConfirm ? 'Confirm' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
}
