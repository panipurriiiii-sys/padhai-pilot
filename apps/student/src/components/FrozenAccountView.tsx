'use client';

import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, LogOut, Lock, HelpCircle } from 'lucide-react';

interface FrozenAccountViewProps {
  instituteName?: string;
  freezeMessage?: string;
  onRefresh: () => Promise<void>;
  onSignOut: () => void;
}

export function FrozenAccountView({
  instituteName = 'Your Tuition Center',
  freezeMessage,
  onRefresh,
  onSignOut,
}: FrozenAccountViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white border border-[var(--border-paper)] rounded-2xl shadow-xl p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

        {/* Lock / Freeze Icon Badge */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shadow-inner mb-6">
          <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-4 border border-amber-200">
          <Lock className="w-3 h-3" />
          <span>Account Frozen • Premium Required</span>
        </div>

        {/* Title & Description */}
        <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] mb-3">
          Tuition Subscription Inactive
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto mb-6">
          {freezeMessage || (
            <>
              Your tuition center <strong className="text-stone-900">{instituteName}</strong> is currently on the free Starter plan. Student portal access is frozen until your tuition center upgrades to a Premium plan.
            </>
          )}
        </p>

        {/* Steps Card */}
        <div className="bg-[var(--bg-paper-warm,#F9F8F6)] border border-stone-200/80 rounded-xl p-4 sm:p-5 text-left mb-8">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>How to unfreeze your account</span>
          </div>
          <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              Inform your <strong>tuition teacher or owner</strong> about this message.
            </li>
            <li>
              Ask them to open their <strong>Teacher Portal</strong> and upgrade from Starter to <strong>Growth</strong> or <strong>Pro</strong>.
            </li>
            <li>
              Once upgraded, click the <strong>Refresh</strong> button below to restore instant access to all your tests, materials, and notes.
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto min-w-[200px] py-3 px-5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Checking Status...' : 'Check Status & Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full sm:w-auto py-3 px-5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
