'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Plus, Copy, Check, Ban, Share2, RefreshCw, Link2, Pencil } from 'lucide-react';
import type { BatchSummary, EnrollmentCode } from '@padhai-pilot/shared';
import { teacherApi } from '../lib/api';
import { LoadError } from './LoadError';

interface Props {
  batches: BatchSummary[];
}

const STATUS_STYLE: Record<EnrollmentCode['status'], string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  EXPIRED: 'bg-amber-50 text-amber-800 border-amber-200',
  REVOKED: 'bg-rose-50 text-rose-800 border-rose-200',
  EXHAUSTED: 'bg-stone-100 text-stone-700 border-stone-200',
};

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Enrolment codes: no default expiry; teacher can edit uses, set or clear an expiry date, revoke, share. */
export function InvitationsView({ batches }: Props) {
  const [codes, setCodes] = useState<EnrollmentCode[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [create, setCreate] = useState({ open: false, batchId: batches[0]?.id ?? '', maxUses: 100, label: '', expiresAt: '' });
  const [edit, setEdit] = useState<{ code: EnrollmentCode; maxUses: number; label: string; expiresAt: string } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setCodes(await teacherApi.listEnrollmentCodes());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load enrolment codes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (text: string, error = false) => {
    setNotice({ text, error });
    setTimeout(() => setNotice(null), 4000);
  };

  const run = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try {
      await fn();
      await load();
      flash(ok);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Action failed', true);
    } finally {
      setBusy(null);
    }
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      flash('Copy is not available in this browser. Select the text and copy it manually.', true);
    }
  };

  const share = async (c: EnrollmentCode) => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Join my batch', text: c.shareText, url: c.shareLink });
        return;
      } catch {
        /* user cancelled: fall through to copy */
      }
    }
    await copy(c.shareText, c.id + ':text');
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await run(
      'create',
      () =>
        teacherApi.createEnrollmentCode({
          batchId: create.batchId || undefined,
          maxUses: Number(create.maxUses),
          label: create.label.trim() || undefined,
          expiresAt: create.expiresAt ? new Date(create.expiresAt + 'T23:59:59').toISOString() : null,
        }),
      'Enrolment code created.',
    );
    setCreate((c) => ({ ...c, open: false, label: '', expiresAt: '' }));
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    await run(
      edit.code.id,
      () =>
        teacherApi.updateEnrollmentCode(edit.code.id, {
          maxUses: Number(edit.maxUses),
          label: edit.label.trim() || null,
          expiresAt: edit.expiresAt ? new Date(edit.expiresAt + 'T23:59:59').toISOString() : null,
        }),
      'Code updated.',
    );
    setEdit(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-paper)]">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--ink-primary)] flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[var(--brand-electric)]" /> Student Enrolment Codes
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Codes never expire unless you set a date. Share the link or message; students join their batch with one tap.
          </p>
        </div>
        <button type="button" className="btn-primary text-xs font-['Raleway'] font-bold px-4 py-2.5 flex items-center gap-2 self-start" onClick={() => setCreate((c) => ({ ...c, open: true }))}>
          <Plus className="w-4 h-4" /> New code
        </button>
      </div>

      {notice && (
        <div role="status" className={`p-3 rounded-lg border text-xs ${notice.error ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {notice.text}
        </div>
      )}

      {loadError ? (
        <LoadError message={loadError} onRetry={load} />
      ) : isLoading ? (
        <div className="paper-card p-12 text-center text-xs text-[var(--ink-muted)]">Loading codes...</div>
      ) : codes.length === 0 ? (
        <div className="paper-card p-12 text-center space-y-2">
          <p className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">No enrolment codes yet</p>
          <p className="text-xs text-[var(--ink-muted)]">Create a code for a batch and share it with students.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {codes.map((c) => (
            <li key={c.id} className="paper-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-data text-xl font-bold tracking-wider text-[var(--ink-primary)]">{c.code}</div>
                  <div className="text-xs text-[var(--ink-muted)]">{c.batchName ?? 'Whole institute'}{c.label ? ` - ${c.label}` : ''}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[c.status]}`}>{c.status}</span>
              </div>
              <div className="text-xs text-[var(--ink-secondary)] grid grid-cols-2 gap-2">
                <span>Used {c.usedCount} of {c.maxUses} ({c.remainingUses} left)</span>
                <span>{c.expiresAt ? `Expires ${new Date(c.expiresAt).toLocaleDateString()}` : 'No expiry'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => copy(c.code, c.id + ':code')}>
                  {copied === c.id + ':code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy code
                </button>
                <button type="button" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => copy(c.shareLink, c.id + ':link')}>
                  {copied === c.id + ':link' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />} Copy link
                </button>
                <button type="button" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => share(c)}>
                  {copied === c.id + ':text' ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />} Share message
                </button>
                <button type="button" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => setEdit({ code: c, maxUses: c.maxUses, label: c.label ?? '', expiresAt: toDateInput(c.expiresAt) })}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                {c.status === 'REVOKED' ? (
                  <button type="button" disabled={busy === c.id} className="btn-secondary text-xs px-3 py-1.5" onClick={() => run(c.id, () => teacherApi.reactivateEnrollmentCode(c.id), 'Code reactivated.')}>Reactivate</button>
                ) : (
                  <button type="button" disabled={busy === c.id} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center gap-1.5" onClick={() => { if (window.confirm(`Revoke ${c.code}? Students can no longer join with it.`)) run(c.id, () => teacherApi.revokeEnrollmentCode(c.id), 'Code revoked.'); }}>
                    <Ban className="w-3.5 h-3.5" /> Revoke
                  </button>
                )}
                <button type="button" disabled={busy === c.id} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-paper)] hover:bg-[var(--bg-paper-warm)] flex items-center gap-1.5" onClick={() => { if (window.confirm('Replace this code with a new one? The old code stops working.')) run(c.id, () => teacherApi.regenerateEnrollmentCode(c.id), 'New code generated.'); }}>
                  <RefreshCw className="w-3.5 h-3.5" /> New code string
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {create.open && (
        <Modal title="New enrolment code" onClose={() => setCreate((c) => ({ ...c, open: false }))}>
          <form onSubmit={submitCreate} className="space-y-4">
            <Field label="Batch">
              <select className="input-paper w-full" value={create.batchId} onChange={(e) => setCreate({ ...create, batchId: e.target.value })} required>
                {batches.length === 0 && <option value="">No batches yet</option>}
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Maximum students">
              <input type="number" min={1} max={10000} className="input-paper w-full" value={create.maxUses} onChange={(e) => setCreate({ ...create, maxUses: Number(e.target.value) })} />
            </Field>
            <Field label="Label (optional)">
              <input className="input-paper w-full" value={create.label} onChange={(e) => setCreate({ ...create, label: e.target.value })} />
            </Field>
            <Field label="Expires on (optional - leave empty for no expiry)">
              <input type="date" className="input-paper w-full" value={create.expiresAt} onChange={(e) => setCreate({ ...create, expiresAt: e.target.value })} />
            </Field>
            <button className="btn-primary w-full py-2.5 text-xs font-bold" disabled={busy === 'create'}>Create code</button>
          </form>
        </Modal>
      )}

      {edit && (
        <Modal title={`Edit ${edit.code.code}`} onClose={() => setEdit(null)}>
          <form onSubmit={submitEdit} className="space-y-4">
            <Field label={`Maximum students (at least ${edit.code.usedCount} already joined)`}>
              <input type="number" min={Math.max(1, edit.code.usedCount)} max={10000} className="input-paper w-full" value={edit.maxUses} onChange={(e) => setEdit({ ...edit, maxUses: Number(e.target.value) })} />
            </Field>
            <Field label="Label">
              <input className="input-paper w-full" value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })} />
            </Field>
            <Field label="Expiry date">
              <div className="flex gap-2">
                <input type="date" className="input-paper flex-1" value={edit.expiresAt} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value })} />
                <button type="button" className="btn-secondary text-xs px-3" onClick={() => setEdit({ ...edit, expiresAt: '' })}>No expiry</button>
              </div>
            </Field>
            <button className="btn-primary w-full py-2.5 text-xs font-bold" disabled={busy === edit.code.id}>Save changes</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold font-['Raleway'] text-[var(--ink-secondary)]">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="paper-card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-['Playfair_Display'] text-lg font-bold text-[var(--ink-primary)]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[var(--ink-muted)] text-lg leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export { Field };
