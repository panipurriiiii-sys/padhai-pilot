'use client';

import React, { useState } from 'react';
import { Megaphone, Plus, Calendar, AlertCircle, X, CheckCircle } from 'lucide-react';
import type { BatchSummary, AnnouncementItem } from '@padhai-pilot/shared';

interface AnnouncementsViewProps {
  batches: BatchSummary[];
  announcements: AnnouncementItem[];
  onCreateAnnouncement: (data: {
    batchId?: string;
    title: string;
    content: string;
    priority?: 'NORMAL' | 'URGENT';
  }) => Promise<void>;
}

export function AnnouncementsView({
  batches,
  announcements,
  onCreateAnnouncement,
}: AnnouncementsViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [batchId, setBatchId] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    try {
      await onCreateAnnouncement({
        title,
        content,
        batchId: batchId || undefined,
        priority,
      });
      setShowCreateModal(false);
      setTitle('');
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-paper">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-stone-900">
            Broadcasts & Class Announcements
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-['Raleway']">
            Publish official updates, test schedules, and urgent academic notices to enrolled batches.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-electric hover:bg-[#3395FF] text-white text-xs font-semibold tracking-wide transition shadow-[0_2px_12px_rgba(22,119,255,0.35)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post Announcement</span>
        </button>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-12 rounded-xl bg-white border border-border-paper text-center text-xs text-stone-500">
            No announcements broadcasted yet.
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-5 rounded-xl bg-white border border-border-paper space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      ann.priority === 'URGENT'
                        ? 'bg-status-danger/15 text-status-danger border border-status-danger/30'
                        : 'bg-surface-subtle text-stone-500 border border-border-paper'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-xs font-semibold text-electric">
                    {ann.batchName || 'All Batches'}
                  </span>
                </div>

                <span className="text-xs text-stone-500 font-['Inter']">
                  {new Date(ann.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h3 className="font-['Raleway'] font-bold text-base text-stone-900 leading-snug">
                {ann.title}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="pt-2 border-t border-border-paper text-[11px] text-stone-700">
                Author: <span className="font-medium text-stone-900">{ann.authorName}</span> ({ann.authorRole})
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-border-paper p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-['Playfair_Display'] text-xl font-bold text-stone-900 mb-1">
              New Academic Broadcast
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              Send an instant broadcast notice to your students.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-500 font-medium mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Change: Sunday Doubt Clearing Class"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Audience Target</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                  >
                    <option value="" className="bg-white">
                      All Enrolled Batches
                    </option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-500 font-medium mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'NORMAL' | 'URGENT')}
                    className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                  >
                    <option value="NORMAL" className="bg-white">
                      Normal Notice
                    </option>
                    <option value="URGENT" className="bg-white">
                      Urgent Alert
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-500 font-medium mb-1">Content / Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed notice information..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-stone-500 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-electric hover:bg-[#3395FF] text-white font-semibold shadow-[0_2px_12px_rgba(22,119,255,0.35)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
