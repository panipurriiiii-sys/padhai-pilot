'use client';

import React, { useState, useMemo } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  BookOpen,
  IndianRupee,
  Calendar,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import type { InAppNotification, NotificationCategory } from '@padhai-pilot/shared';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onNavigate?: (url: string) => void;
  isSubscribedToPush?: boolean;
  onEnablePush?: () => Promise<boolean>;
  isPushRegistering?: boolean;
}

const CATEGORIES: Array<{ key: NotificationCategory; label: string; icon: any }> = [
  { key: 'ALL', label: 'All', icon: Bell },
  { key: 'ACADEMICS', label: 'Academics', icon: BookOpen },
  { key: 'FEES', label: 'Fees', icon: IndianRupee },
  { key: 'NOTICES', label: 'Notices', icon: Radio },
  { key: 'LEAVES', label: 'Leaves', icon: Calendar },
];

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  isSubscribedToPush,
  onEnablePush,
  isPushRegistering,
}: NotificationDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (selectedCategory === 'ALL') return notifications;
    return notifications.filter((n) => {
      const cat = n.category || inferCategory(n.type);
      return cat === selectedCategory;
    });
  }, [notifications, selectedCategory]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  if (!isOpen) return null;

  const handleMarkAll = async () => {
    setIsMarkingAll(true);
    try {
      await onMarkAllRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleItemClick = async (notif: InAppNotification, targetUrl?: string) => {
    if (!notif.isRead) {
      await onMarkRead(notif.id);
    }
    const url = targetUrl || notif.link;
    if (url && onNavigate) {
      onNavigate(url);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--paper,#18181b)] border-l border-[var(--border-paper,#27272a)] text-[var(--ink-primary,#f4f4f5)] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--border-paper,#27272a)] flex items-center justify-between bg-[var(--desk,#09090b)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-electric,#3b82f6)]/15 text-[var(--brand-electric,#3b82f6)] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm tracking-wide text-white">Notifications</h2>
                <p className="text-[11px] font-primary text-[var(--ink-muted,#a1a1aa)]">
                  {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
                className="p-1.5 rounded-lg text-[var(--ink-muted,#a1a1aa)] hover:text-white hover:bg-white/5 transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={isMarkingAll}
                  className="px-2.5 py-1 text-[11px] font-primary font-medium text-[var(--brand-electric,#3b82f6)] hover:bg-[var(--brand-electric,#3b82f6)]/10 rounded-md transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--ink-muted,#a1a1aa)] hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Out-App Push Permission Banner */}
          {!isSubscribedToPush && onEnablePush && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-200">Out-App Alerts</p>
                  <p className="text-[10px] text-blue-300/80">Get push notifications even when this tab is closed</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onEnablePush}
                disabled={isPushRegistering}
                className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold tracking-wide transition-all shrink-0"
              >
                {isPushRegistering ? 'Enabling...' : 'Enable'}
              </button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="px-4 py-2.5 border-b border-[var(--border-paper,#27272a)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1 rounded-full text-xs font-primary whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[var(--brand-electric,#3b82f6)] text-white font-semibold shadow-sm'
                      : 'bg-white/5 text-[var(--ink-muted,#a1a1aa)] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[var(--ink-faint,#71717a)] mb-3">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[var(--ink-muted,#a1a1aa)]">No notifications in {selectedCategory.toLowerCase()}</p>
                <p className="text-[11px] text-[var(--ink-faint,#71717a)] mt-0.5">You are completely up to date.</p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const category = n.category || inferCategory(n.type);
                const badgeColor = getCategoryColor(category);
                return (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      n.isRead
                        ? 'bg-[var(--desk,#09090b)]/50 border-[var(--border-paper,#27272a)] text-[var(--ink-muted,#a1a1aa)]'
                        : 'bg-[var(--paper-warm,#1f1f23)] border-[var(--brand-electric,#3b82f6)]/40 text-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${badgeColor}`}>
                          {category}
                        </span>
                        {n.priority === 'URGENT' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> URGENT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[var(--ink-faint,#71717a)]">
                          {formatTimestamp(n.createdAt)}
                        </span>
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => onMarkRead(n.id)}
                            title="Mark as read"
                            className="p-1 hover:text-white text-[var(--brand-electric,#3b82f6)]"
                          >
                            <span className="w-2 h-2 rounded-full bg-[var(--brand-electric,#3b82f6)] inline-block" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className={`text-xs font-bold mt-1.5 ${n.isRead ? 'text-zinc-300' : 'text-white'}`}>
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-[var(--ink-muted,#a1a1aa)] mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    {/* Action Buttons */}
                    {n.actionButtons && n.actionButtons.length > 0 ? (
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-2 flex-wrap">
                        {n.actionButtons.map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => handleItemClick(n, btn.actionUrl)}
                            className="px-2.5 py-1 rounded-md bg-[var(--brand-electric,#3b82f6)] hover:bg-blue-600 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                          >
                            <span>{btn.title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    ) : n.link ? (
                      <div className="mt-2 pt-1.5 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleItemClick(n, n.link)}
                          className="text-[10px] font-bold text-[var(--brand-electric,#3b82f6)] hover:underline flex items-center gap-1"
                        >
                          <span>Open in App</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function inferCategory(type: string): NotificationCategory {
  const upper = type.toUpperCase();
  if (upper.includes('ATTENDANCE')) return 'ATTENDANCE';
  if (upper.includes('RESULT') || upper.includes('QUIZ') || upper.includes('TEST') || upper.includes('HOMEWORK')) return 'ACADEMICS';
  if (upper.includes('FEE') || upper.includes('PAYMENT') || upper.includes('SALARY')) return 'FEES';
  if (upper.includes('LEAVE')) return 'LEAVES';
  if (upper.includes('ANNOUNCEMENT') || upper.includes('BROADCAST')) return 'NOTICES';
  return 'GENERAL';
}

function getCategoryColor(category: NotificationCategory): string {
  switch (category) {
    case 'ACADEMICS':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    case 'FEES':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    case 'ATTENDANCE':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    case 'LEAVES':
      return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
    case 'NOTICES':
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
    default:
      return 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30';
  }
}

function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

