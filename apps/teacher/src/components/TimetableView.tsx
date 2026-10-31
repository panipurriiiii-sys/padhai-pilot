'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import type { BatchSummary, TimetableSlotItem, TimetableConflictError, WeekDay } from '@padhai-pilot/shared';
import { teacherApi, ApiError } from '../lib/api';
import { LoadError } from './LoadError';
import { Modal, Field } from './InvitationsView';

const DAYS: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const label = (d: string) => d.charAt(0) + d.slice(1).toLowerCase();

interface FormState {
  id?: string;
  batchId: string;
  subject: string;
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  room: string;
  notes: string;
}

/** Weekly teaching timetable per batch: create, edit and delete slots. Overlaps are rejected by the server (409). */
export function TimetableView({ batches }: { batches: BatchSummary[] }) {
  const [slots, setSlots] = useState<TimetableSlotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [batchFilter, setBatchFilter] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<TimetableConflictError['conflicts']>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setSlots(await teacherApi.listTimetable(batchFilter || undefined));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load the timetable.');
    } finally {
      setIsLoading(false);
    }
  }, [batchFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const m = new Map<WeekDay, TimetableSlotItem[]>();
    for (const d of DAYS) m.set(d, []);
    for (const s of slots) m.get(s.dayOfWeek)?.push(s);
    for (const list of m.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [slots]);

  const openNew = () => {
    setFormError(null);
    setConflicts([]);
    const b = batches.find((x) => x.id === batchFilter) ?? batches[0];
    setForm({ batchId: b?.id ?? '', subject: b?.subject ?? '', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', room: b?.room ?? '', notes: '' });
  };

  const openEdit = (s: TimetableSlotItem) => {
    setFormError(null);
    setConflicts([]);
    setForm({ id: s.id, batchId: s.batchId, subject: s.subject, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, room: s.room ?? '', notes: s.notes ?? '' });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (form.endTime <= form.startTime) {
      setFormError('End time must be after the start time.');
      return;
    }
    setBusy(true);
    setFormError(null);
    setConflicts([]);
    const payload = { subject: form.subject.trim(), dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime, room: form.room.trim() || undefined, notes: form.notes.trim() || undefined };
    try {
      if (form.id) await teacherApi.updateTimetableSlot(form.id, payload);
      else await teacherApi.createTimetableSlot(form.batchId, payload);
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the slot.');
      if (err instanceof ApiError && err.status === 409) {
        // Re-ask the server for details is unnecessary: the message already names the clash.
        setConflicts([]);
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: TimetableSlotItem) => {
    if (!window.confirm(`Delete ${s.subject} on ${label(s.dayOfWeek)} ${s.startTime}-${s.endTime}?`)) return;
    try {
      await teacherApi.deleteTimetableSlot(s.id);
      await load();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not delete the slot.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-paper)]">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--ink-primary)] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--brand-electric)]" /> Weekly Timetable
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">Slots you add here are what students see for their batch.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select aria-label="Filter by batch" className="input-paper text-xs" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
            <option value="">All batches</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button type="button" className="btn-primary text-xs font-bold px-4 py-2.5 flex items-center gap-2" onClick={openNew} disabled={batches.length === 0}>
            <Plus className="w-4 h-4" /> Add slot
          </button>
        </div>
      </div>

      {loadError ? (
        <LoadError message={loadError} onRetry={load} />
      ) : isLoading ? (
        <div className="paper-card p-12 text-center text-xs text-[var(--ink-muted)]">Loading timetable...</div>
      ) : slots.length === 0 ? (
        <div className="paper-card p-12 text-center space-y-2">
          <p className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">No classes scheduled</p>
          <p className="text-xs text-[var(--ink-muted)]">{batches.length === 0 ? 'Create a batch first, then add its weekly slots.' : 'Add the first slot to build the weekly timetable.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DAYS.filter((d) => (byDay.get(d)?.length ?? 0) > 0).map((d) => (
            <section key={d} className="paper-card p-4 space-y-3" aria-label={label(d)}>
              <h2 className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">{label(d)}</h2>
              <ul className="space-y-2">
                {byDay.get(d)!.map((s) => (
                  <li key={s.id} className="p-3 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper-warm)] flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-data text-xs font-bold text-[var(--brand-electric)]">{s.startTime} - {s.endTime}</div>
                      <div className="font-['Raleway'] font-bold text-sm text-[var(--ink-primary)] truncate">{s.subject}</div>
                      <div className="text-[11px] text-[var(--ink-muted)] truncate">{s.batchName}{s.room ? ` - ${s.room}` : ''}</div>
                      {s.notes && <div className="text-[11px] text-[var(--ink-secondary)] mt-0.5">{s.notes}</div>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" aria-label={`Edit ${s.subject}`} className="p-1.5 rounded-lg hover:bg-[var(--bg-paper)]" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label={`Delete ${s.subject}`} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-700" onClick={() => remove(s)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Edit slot' : 'Add slot'} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-3">
            {!form.id && (
              <Field label="Batch">
                <select className="input-paper w-full" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} required>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Subject"><input className="input-paper w-full" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></Field>
            <Field label="Day">
              <select className="input-paper w-full" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value as WeekDay })}>
                {DAYS.map((d) => <option key={d} value={d}>{label(d)}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts"><input type="time" className="input-paper w-full" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></Field>
              <Field label="Ends"><input type="time" className="input-paper w-full" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></Field>
            </div>
            <Field label="Room"><input className="input-paper w-full" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
            <Field label="Notes"><input className="input-paper w-full" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            {formError && <p role="alert" className="text-xs text-rose-700">{formError}</p>}
            <button className="btn-primary w-full py-2.5 text-xs font-bold" disabled={busy}>{busy ? 'Saving...' : 'Save slot'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
