'use client';

import React from 'react';
import { Clock, MapPin, Calendar, BookOpen } from 'lucide-react';
import type { TimetableSlot } from '@padhai-pilot/shared';

interface TimetableViewProps {
  slots: TimetableSlot[];
}

export function TimetableView({ slots }: TimetableViewProps) {
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

  const currentDayIndex = new Date().getDay(); // 0 is Sunday
  const currentDayName = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ][currentDayIndex];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-paper">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-stone-900">
            Weekly Teaching Timetable
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-['Raleway']">
            Master calendar of scheduled lecture hours, assigned lecture halls, and academic sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-subtle border border-border-paper text-stone-700">
          <Calendar className="w-3.5 h-3.5 text-electric" />
          <span>Today: {currentDayName}</span>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map((day) => {
          const isToday = day === currentDayName;
          const daySlots = slots.filter((s) => s.dayOfWeek === day);

          return (
            <div
              key={day}
              className={`rounded-xl border overflow-hidden transition flex flex-col ${
                isToday
                  ? 'paper-card-selected'
                  : 'paper-card'
              }`}
            >
              <div
                className={`p-3.5 border-b flex items-center justify-between ${
                  isToday ? 'bg-blue-50/70 border-blue-200' : 'bg-[var(--bg-paper-warm)] border-[var(--border-paper)]'
                }`}
              >
                <span className="font-['Raleway'] font-bold text-xs uppercase tracking-wider text-[var(--ink-primary)]">
                  {day}
                </span>
                {isToday && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--brand-electric)] text-white font-['Inter']">
                    Today
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-3 flex-1">
                {daySlots.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--ink-faint)] italic font-['Raleway']">
                    No lecture sessions
                  </div>
                ) : (
                  daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-lg bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-['Inter'] font-mono text-[11px] font-bold text-[var(--brand-electric)]">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="text-[10px] text-[var(--ink-muted)] flex items-center gap-1 font-['Raleway']">
                          <MapPin className="w-3 h-3 text-[var(--brand-electric)]" />
                          {slot.room}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[var(--ink-primary)] leading-tight line-clamp-1 font-['Raleway']">
                        {slot.batchName}
                      </h4>
                      <p className="text-[11px] text-[var(--ink-muted)] font-['Raleway']">{slot.subject}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
