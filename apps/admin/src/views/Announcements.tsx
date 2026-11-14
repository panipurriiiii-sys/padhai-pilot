'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { adminApi, type PlatformAnnouncementItem } from '../lib/api';
import { DataList, Dialog, ErrorState, Field, LoadingBlock, PageHeader, Spin, StatusBadge, errMsg, fmtDate, useLoad, useToast } from '../components/ui';

const EMPTY = { title: '', message: '', severity: 'info' as 'info' | 'warning' | 'critical', targetAudience: 'ALL' as 'ALL' | 'TEACHERS' | 'STUDENTS', expiresAt: '' };

export default function Announcements() {
  const toast = useToast();
  const { data, error, loading, reload } = useLoad(() => adminApi.getAnnouncements());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await adminApi.createAnnouncement({
        title: form.title.trim(),
        message: form.message.trim(),
        severity: form.severity,
        targetAudience: form.targetAudience,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      toast('Announcement published.');
      setOpen(false);
      setForm(EMPTY);
      reload();
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Platform-wide notices shown to teachers and students."
        actions={<button type="button" className="btn-primary" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5" /> New announcement</button>}
      />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingBlock />
      ) : (
        <DataList<PlatformAnnouncementItem>
          rows={data ?? []}
          rowKey={(a) => a.id}
          empty="No announcements yet."
          cols={[
            { header: 'Title', primary: true, cell: (a) => <span className="font-bold font-primary">{a.title}</span> },
            {
              header: 'Status',
              cell: (a) => {
                const isExpired = Boolean(a.expiresAt && new Date(a.expiresAt).getTime() < Date.now());
                return isExpired ? (
                  <StatusBadge value="ARCHIVED" label="Expired" />
                ) : (
                  <StatusBadge value="ACTIVE" label="Live" />
                );
              },
            },
            { header: 'Severity', cell: (a) => <StatusBadge value={a.severity} /> },
            { header: 'Audience', cell: (a) => a.targetAudience },
            { header: 'Message', cell: (a) => a.message, className: 'max-w-md' },
            { header: 'Posted', cell: (a) => fmtDate(a.createdAt) },
            {
              header: 'Expires',
              cell: (a) => {
                const isExpired = Boolean(a.expiresAt && new Date(a.expiresAt).getTime() < Date.now());
                return a.expiresAt ? (
                  <span className={isExpired ? 'text-ink-muted line-through' : undefined}>
                    {fmtDate(a.expiresAt)}
                  </span>
                ) : (
                  'Never'
                );
              },
            },
          ]}
        />
      )}
      <Dialog
        open={open}
        title="New announcement"
        onClose={() => !busy && setOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="announce-form" className="btn-primary" disabled={busy}>{busy && <Spin />} Publish</button>
          </>
        }
      >
        <form id="announce-form" onSubmit={submit} className="space-y-3">
          {err && <div className="notice is-danger" role="alert">{err}</div>}
          <Field label="Title"><input className="input-paper w-full" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Message"><textarea className="input-paper w-full" rows={4} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Severity">
              <select className="select-paper w-full" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as typeof form.severity })}>
                <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
              </select>
            </Field>
            <Field label="Audience">
              <select className="select-paper w-full" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value as typeof form.targetAudience })}>
                <option value="ALL">Everyone</option><option value="TEACHERS">Teachers</option><option value="STUDENTS">Students</option>
              </select>
            </Field>
          </div>
          <Field label="Expires (optional)"><input type="datetime-local" className="input-paper w-full" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></Field>
        </form>
      </Dialog>
    </>
  );
}

