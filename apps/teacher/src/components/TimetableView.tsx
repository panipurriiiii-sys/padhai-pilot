'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Pencil, Trash2, Image as ImageIcon, Upload, Eye, X, Check, Calendar } from 'lucide-react';
import type { BatchSummary, TimetableSlotItem, TimetableConflictError, WeekDay } from '@padhai-pilot/shared';
import { teacherApi, ApiError } from '../lib/api';
import { LoadError } from './LoadError';
import { Modal, Field } from './InvitationsView';
import { uploadMediaFile, MAX_MEDIA_SIZE_BYTES, formatBytes } from '../lib/mediaUpload';

const DAYS: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const label = (d: string) => d.charAt(0) + d.slice(1).toLowerCase();

interface FormState {
  id?: string;
  batchId: string;
  subject: string;
  dayOfWeek: WeekDay;
  selectedDays?: WeekDay[];
  startTime: string;
  endTime: string;
  room: string;
  notes: string;
}

/** Weekly teaching timetable per batch: create, edit and delete slots. Overlaps are rejected by the server (409). */
export function TimetableView({ batches }: { batches: BatchSummary[] }) {
  const [activeTab, setActiveTab] = useState<'SLOTS' | 'PHOTO'>('SLOTS');
  const [slots, setSlots] = useState<TimetableSlotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [batchFilter, setBatchFilter] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [_conflicts, setConflicts] = useState<TimetableConflictError['conflicts']>([]);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  // Timetable photo upload state
  const [photoBatchId, setPhotoBatchId] = useState(batches[0]?.id ?? '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  const selectedPhotoBatch = batches.find((b) => b.id === photoBatchId);
  const batchScheduleImg = useMemo(() => {
    if (!selectedPhotoBatch?.schedule) return null;
    const s = selectedPhotoBatch.schedule.trim();
    if (s.startsWith('TIMETABLE_IMAGE:')) return s.replace('TIMETABLE_IMAGE:', '').trim();
    if (/^https?:\/\//i.test(s)) return s;
    return null;
  }, [selectedPhotoBatch]);

  const flash = (text: string, error = false) => {
    setNotice({ text, error });
    setTimeout(() => setNotice(null), 5000);
  };

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
    setForm({
      batchId: b?.id ?? '',
      subject: b?.subject ?? '',
      dayOfWeek: 'MONDAY',
      selectedDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      startTime: '09:00',
      endTime: '10:00',
      room: b?.room ?? '',
      notes: '',
    });
  };

  const openEdit = (s: TimetableSlotItem) => {
    setFormError(null);
    setConflicts([]);
    setForm({
      id: s.id,
      batchId: s.batchId,
      subject: s.subject,
      dayOfWeek: s.dayOfWeek,
      selectedDays: [s.dayOfWeek],
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room ?? '',
      notes: s.notes ?? '',
    });
  };

  const toggleDaySelection = (d: WeekDay) => {
    if (!form) return;
    const current = form.selectedDays ?? [form.dayOfWeek];
    const exists = current.includes(d);
    let updated: WeekDay[];
    if (exists) {
      if (current.length === 1) return; // Keep at least one day
      updated = current.filter((x) => x !== d);
    } else {
      updated = [...current, d];
    }
    setForm({ ...form, selectedDays: updated, dayOfWeek: updated[0] || 'MONDAY' });
  };

  const setPresetDays = (preset: 'WEEKDAYS' | 'MON_SAT' | 'ALL') => {
    if (!form) return;
    let days: WeekDay[];
    if (preset === 'WEEKDAYS') days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    else if (preset === 'MON_SAT') days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    else days = [...DAYS];
    setForm({ ...form, selectedDays: days, dayOfWeek: days[0] || 'MONDAY' });
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

    try {
      if (form.id) {
        // Single slot edit
        await teacherApi.updateTimetableSlot(form.id, {
          subject: form.subject.trim(),
          dayOfWeek: form.dayOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
      } else {
        // Easy Mode: Create slots for all selected days simultaneously
        const daysToCreate = form.selectedDays && form.selectedDays.length > 0 ? form.selectedDays : [form.dayOfWeek];
        const results = await Promise.allSettled(
          daysToCreate.map((d) =>
            teacherApi.createTimetableSlot(form.batchId, {
              subject: form.subject.trim(),
              dayOfWeek: d,
              startTime: form.startTime,
              endTime: form.endTime,
              room: form.room.trim() || undefined,
              notes: form.notes.trim() || undefined,
            }),
          ),
        );

        const rejected = results.filter((r) => r.status === 'rejected');
        if (rejected.length > 0 && rejected.length === daysToCreate.length) {
          const firstErr = (rejected[0] as PromiseRejectedResult).reason;
          throw firstErr;
        } else if (rejected.length > 0) {
          flash(`Created ${daysToCreate.length - rejected.length} slots. ${rejected.length} day(s) had schedule clashes.`, true);
        }
      }
      setForm(null);
      await load();
      flash('Timetable saved successfully.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the slot.');
      if (err instanceof ApiError && err.status === 409) {
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
      flash('Slot removed.');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not delete the slot.');
    }
  };

  // Upload timetable image using Dhyey media client
  const handleUploadPhoto = async (file: File | undefined) => {
    if (!file || !photoBatchId) return;
    setPhotoError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      setPhotoError(`Image size must be under ${formatBytes(MAX_MEDIA_SIZE_BYTES)}.`);
      return;
    }
    setPhotoUploading(true);
    try {
      const res = await uploadMediaFile(file);
      await teacherApi.updateBatch(photoBatchId, { schedule: `TIMETABLE_IMAGE:${res.url}` });
      if (selectedPhotoBatch) {
        selectedPhotoBatch.schedule = `TIMETABLE_IMAGE:${res.url}`;
      }
      flash('Timetable image uploaded and saved for batch!');
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed. Check connection.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoBatchId || !window.confirm('Remove timetable image for this batch?')) return;
    setPhotoUploading(true);
    try {
      await teacherApi.updateBatch(photoBatchId, { schedule: null });
      if (selectedPhotoBatch) {
        selectedPhotoBatch.schedule = null;
      }
      flash('Timetable image removed.');
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not remove timetable image.');
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div role="status" className={`p-3 rounded-lg border text-xs ${notice.error ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {notice.text}
        </div>
      )}

      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-paper)]">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--ink-primary)] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--brand-electric)]" /> Weekly Timetable
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Build structured day slots or directly upload a timetable image. Students see this instantly on their portal and app.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[var(--bg-paper-warm)] rounded-xl border border-[var(--border-paper)]">
            <button
              type="button"
              onClick={() => setActiveTab('SLOTS')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'SLOTS' ? 'bg-[var(--brand-electric)] text-white shadow-sm' : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Structured Slots
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PHOTO')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'PHOTO' ? 'bg-[var(--brand-electric)] text-white shadow-sm' : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Upload Photo
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'PHOTO' ? (
        /* TIMETABLE PHOTO / IMAGE UPLOAD MODE */
        <div className="space-y-6 animate-in fade-in">
          <div className="paper-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-paper)]">
              <div>
                <h3 className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[var(--brand-electric)]" /> Upload Batch Timetable Image
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  If you already have a printed or handwritten timetable sheet, snap a photo and attach it directly to the batch.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--ink-secondary)]">Batch:</span>
                <select
                  aria-label="Select batch for photo timetable"
                  className="input-paper text-xs"
                  value={photoBatchId}
                  onChange={(e) => setPhotoBatchId(e.target.value)}
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {photoError && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">{photoError}</div>}

            {batchScheduleImg ? (
              <div className="space-y-4">
                <div className="relative group rounded-2xl overflow-hidden border border-[var(--border-paper)] bg-[var(--bg-paper-warm)] max-w-xl mx-auto p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={batchScheduleImg}
                    alt="Timetable sheet"
                    className="w-full max-h-96 object-contain rounded-xl shadow-sm cursor-pointer"
                    onClick={() => setPreviewModalUrl(batchScheduleImg)}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(batchScheduleImg)}
                      className="px-3 py-1.5 rounded-lg bg-white/90 text-stone-900 font-bold text-xs flex items-center gap-1 shadow"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Full
                    </button>
                    <label className="px-3 py-1.5 rounded-lg bg-[var(--brand-electric)] text-white font-bold text-xs flex items-center gap-1 shadow cursor-pointer">
                      <Upload className="w-3.5 h-3.5" /> Replace
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadPhoto(e.target.files?.[0])} disabled={photoUploading} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow"
                      disabled={photoUploading}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(batchScheduleImg)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Fullscreen Preview
                  </button>
                  <label className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Replace Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadPhoto(e.target.files?.[0])} disabled={photoUploading} />
                  </label>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[var(--border-paper)] rounded-2xl p-8 text-center space-y-3 bg-[var(--bg-paper-warm)]">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[var(--brand-electric)] flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)]">
                    Upload Timetable Image for {selectedPhotoBatch?.name || 'Batch'}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)] mt-1">
                    PNG, JPG, WebP up to 20MB. Powered by Media CDN.
                  </p>
                </div>
                <label className="btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-2 cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4" />
                  {photoUploading ? 'Uploading to CDN...' : 'Choose Timetable Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={photoUploading}
                    onChange={(e) => handleUploadPhoto(e.target.files?.[0])}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STRUCTURED SLOT VIEW (SLOTS) */
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 items-center justify-between pb-2">
            <div className="flex gap-2 items-center">
              <select aria-label="Filter by batch" className="input-paper text-xs" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                <option value="">All batches</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button type="button" className="btn-primary text-xs font-bold px-4 py-2.5 flex items-center gap-2" onClick={openNew} disabled={batches.length === 0}>
              <Plus className="w-4 h-4" /> Add Slot (Easy Multi-Day)
            </button>
          </div>

          {loadError ? (
            <LoadError message={loadError} onRetry={load} />
          ) : isLoading ? (
            <div className="paper-card p-12 text-center text-xs text-[var(--ink-muted)]">Loading timetable...</div>
          ) : slots.length === 0 ? (
            <div className="paper-card p-12 text-center space-y-2">
              <p className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">No classes scheduled</p>
              <p className="text-xs text-[var(--ink-muted)]">
                {batches.length === 0 ? 'Create a batch first, then add its weekly slots.' : 'Add your first slot or upload a timetable photo.'}
              </p>
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
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewModalUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-2 bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-stone-700 shadow"
              onClick={() => setPreviewModalUrl(null)}
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewModalUrl} alt="Timetable preview" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Add / Edit Slot Modal with Easy Multi-Day Selection */}
      {form && (
        <Modal title={form.id ? 'Edit slot' : 'Add Weekly Slot (Easy Multi-Day)'} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            {!form.id && (
              <Field label="Batch">
                <select className="input-paper w-full" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} required>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            )}

            <Field label="Subject">
              <input className="input-paper w-full" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="e.g. Mathematics" />
            </Field>

            {/* Easy Mode Multi-Day Selection for New Slot */}
            {!form.id ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)]">
                    Repeat on Days (Easy Mode)
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button type="button" onClick={() => setPresetDays('WEEKDAYS')} className="text-[var(--brand-electric)] hover:underline font-bold">Mon-Fri</button>
                    <span className="text-[var(--ink-muted)]">•</span>
                    <button type="button" onClick={() => setPresetDays('MON_SAT')} className="text-[var(--brand-electric)] hover:underline font-bold">Mon-Sat</button>
                    <span className="text-[var(--ink-muted)]">•</span>
                    <button type="button" onClick={() => setPresetDays('ALL')} className="text-[var(--brand-electric)] hover:underline font-bold">All 7 Days</button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DAYS.map((d) => {
                    const selected = form.selectedDays?.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDaySelection(d)}
                        className={`py-2 px-1 text-xs rounded-xl font-bold border transition text-center ${
                          selected
                            ? 'bg-[var(--brand-electric)] text-white border-[var(--brand-electric)] shadow-sm'
                            : 'bg-[var(--bg-paper-warm)] text-[var(--ink-secondary)] border-[var(--border-paper)] hover:bg-[var(--bg-paper)]'
                        }`}
                      >
                        {d.slice(0, 3)}
                        {selected && <Check className="w-3 h-3 mx-auto mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[var(--ink-muted)]">
                  Creates this time slot across {form.selectedDays?.length || 1} day(s) simultaneously.
                </p>
              </div>
            ) : (
              <Field label="Day">
                <select className="input-paper w-full" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value as WeekDay })}>
                  {DAYS.map((d) => <option key={d} value={d}>{label(d)}</option>)}
                </select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts">
                <input type="time" className="input-paper w-full" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
              </Field>
              <Field label="Ends">
                <input type="time" className="input-paper w-full" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
              </Field>
            </div>

            <Field label="Room / Hall (Optional)">
              <input className="input-paper w-full" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. Hall 2" />
            </Field>

            <Field label="Lecture Notes (Optional)">
              <input className="input-paper w-full" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Doubt discussion" />
            </Field>

            {formError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{formError}</p>}

            <button className="btn-primary w-full py-2.5 text-xs font-bold" disabled={busy}>
              {busy ? 'Saving Slots...' : form.id ? 'Save Changes' : `Add Slot (${form.selectedDays?.length || 1} day${(form.selectedDays?.length || 1) > 1 ? 's' : ''})`}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
