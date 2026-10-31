'use client';

import React, { useState } from 'react';
import { Pencil, ArrowUpRight, FileText } from 'lucide-react';
import type { BatchSummary, PromoteBatchResult } from '@padhai-pilot/shared';
import { teacherApi } from '../lib/api';
import { Modal, Field } from './InvitationsView';

/** Edit and promote controls for the selected batch. Calls onChanged() so the page reloads batches and roster. */
export function BatchActions({ batch, batches, onChanged }: { batch: BatchSummary; batches: BatchSummary[]; onChanged: () => void }) {
  const [mode, setMode] = useState<'edit' | 'promote' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromoteBatchResult | null>(null);

  const [form, setForm] = useState({ name: batch.name, code: batch.code, subject: batch.subject, gradeLevel: batch.gradeLevel, room: batch.room ?? '' });
  const [target, setTarget] = useState<'existing' | 'new'>('new');
  const [targetBatchId, setTargetBatchId] = useState('');
  const [newBatch, setNewBatch] = useState({ name: '', code: '', subject: batch.subject, gradeLevel: '' });
  const [archiveSource, setArchiveSource] = useState(false);

  const open = (m: 'edit' | 'promote') => {
    setForm({ name: batch.name, code: batch.code, subject: batch.subject, gradeLevel: batch.gradeLevel, room: batch.room ?? '' });
    setError(null);
    setResult(null);
    setMode(m);
  };
  const close = () => setMode(null);

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await teacherApi.updateBatch(batch.id, { name: form.name.trim(), code: form.code.trim(), subject: form.subject.trim(), gradeLevel: form.gradeLevel.trim(), room: form.room.trim() || null });
      onChanged();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the batch.');
    } finally {
      setBusy(false);
    }
  };

  const promote = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await teacherApi.promoteBatch(
        batch.id,
        target === 'existing'
          ? { targetBatchId, archiveSource }
          : { newBatch: { name: newBatch.name.trim(), code: newBatch.code.trim() || undefined, subject: newBatch.subject.trim(), gradeLevel: newBatch.gradeLevel.trim() || undefined }, archiveSource },
      );
      setResult(res);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not promote the batch.');
    } finally {
      setBusy(false);
    }
  };

  const others = batches.filter((b) => b.id !== batch.id);

  return (
    <>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5" onClick={() => open('edit')}>
          <Pencil className="w-3.5 h-3.5" /> Edit batch
        </button>
        <button type="button" className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5" onClick={() => teacherApi.openAttendanceReport({ batchId: batch.id }).catch((e) => alert(e instanceof Error ? e.message : 'Could not generate the report.'))}>
          <FileText className="w-3.5 h-3.5" /> Attendance report PDF
        </button>
        <button type="button" className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5" onClick={() => open('promote')}>
          <ArrowUpRight className="w-3.5 h-3.5" /> Promote to next class
        </button>
      </div>

      {mode === 'edit' && (
        <Modal title={`Edit ${batch.name}`} onClose={close}>
          <form onSubmit={saveEdit} className="space-y-3">
            <Field label="Batch name"><input className="input-paper w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Code"><input className="input-paper w-full" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Field>
            <Field label="Subject"><input className="input-paper w-full" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></Field>
            <Field label="Class / grade"><input className="input-paper w-full" value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} /></Field>
            <Field label="Room"><input className="input-paper w-full" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
            {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
            <button className="btn-primary w-full py-2.5 text-xs font-bold" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
          </form>
        </Modal>
      )}

      {mode === 'promote' && (
        <Modal title={`Promote ${batch.name}`} onClose={close}>
          {result ? (
            <div className="space-y-3 text-sm" role="status">
              <p className="text-[var(--ink-primary)]">
                {result.alreadyPromoted
                  ? 'This batch was already promoted. Nothing was moved this time.'
                  : `${result.movedCount} student${result.movedCount === 1 ? '' : 's'} moved to ${result.targetBatchName}.`}
              </p>
              {result.skippedCount > 0 && <p className="text-xs text-[var(--ink-muted)]">{result.skippedCount} skipped (already in the target batch).</p>}
              <p className="text-xs text-[var(--ink-muted)]">Attendance, marks and fee history stay with the old batch.{result.sourceArchived ? ' The old batch is archived.' : ''}</p>
              <button type="button" className="btn-primary w-full py-2.5 text-xs font-bold" onClick={close}>Done</button>
            </div>
          ) : (
            <form onSubmit={promote} className="space-y-3">
              <p className="text-xs text-[var(--ink-muted)]">Moves every active student to the next batch. History stays with the old batch, and repeating this is safe.</p>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5"><input type="radio" checked={target === 'new'} onChange={() => setTarget('new')} /> Create the next batch</label>
                <label className="flex items-center gap-1.5"><input type="radio" checked={target === 'existing'} onChange={() => setTarget('existing')} /> Use an existing batch</label>
              </div>
              {target === 'existing' ? (
                <Field label="Target batch">
                  <select className="input-paper w-full" value={targetBatchId} onChange={(e) => setTargetBatchId(e.target.value)} required>
                    <option value="">Select a batch</option>
                    {others.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
              ) : (
                <>
                  <Field label="New batch name"><input className="input-paper w-full" value={newBatch.name} onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })} required /></Field>
                  <Field label="Subject"><input className="input-paper w-full" value={newBatch.subject} onChange={(e) => setNewBatch({ ...newBatch, subject: e.target.value })} required /></Field>
                  <Field label="Class / grade"><input className="input-paper w-full" value={newBatch.gradeLevel} onChange={(e) => setNewBatch({ ...newBatch, gradeLevel: e.target.value })} /></Field>
                  <Field label="Code (optional)"><input className="input-paper w-full" value={newBatch.code} onChange={(e) => setNewBatch({ ...newBatch, code: e.target.value })} /></Field>
                </>
              )}
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={archiveSource} onChange={(e) => setArchiveSource(e.target.checked)} /> Archive the old batch afterwards</label>
              {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
              <button className="btn-primary w-full py-2.5 text-xs font-bold" disabled={busy}>{busy ? 'Promoting...' : 'Promote students'}</button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
