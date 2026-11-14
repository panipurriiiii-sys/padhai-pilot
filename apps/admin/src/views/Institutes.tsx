'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import type { SubscriptionPlan } from '@padhai-pilot/shared';
import { adminApi, type InstituteSummary } from '../lib/api';
import { PLANS } from '../lib/constants';
import {
  DataList,
  Dialog,
  ErrorState,
  Field,
  LoadingBlock,
  PageHeader,
  Spin,
  StatusBadge,
  errMsg,
  fmtDay,
  useLoad,
  useToast,
} from '../components/ui';

const EMPTY = { name: '', subdomain: '', plan: 'GROWTH' as SubscriptionPlan, ownerName: '', ownerEmail: '', ownerPhone: '', customDomain: '' };

export default function Institutes() {
  const router = useRouter();
  const toast = useToast();
  const { data, error, loading, reload } = useLoad(() => adminApi.getInstitutes());
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [plan, setPlan] = useState('ALL');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter(
      (i) =>
        (status === 'ALL' || i.status === status) &&
        (plan === 'ALL' || i.plan === plan) &&
        (!needle || [i.name, i.subdomain, i.ownerEmail, i.ownerName].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [data, q, status, plan]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const body = { ...form, ownerPhone: form.ownerPhone || undefined, customDomain: form.customDomain || undefined };
      const created = await adminApi.createInstitute(body);
      toast(`Institute "${created.name}" onboarded.`);
      setCreating(false);
      setForm(EMPTY);
      reload();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <PageHeader
        title="Institutes"
        subtitle="Every tuition institute on the platform. Open one to manage its lifecycle, plan and limits."
        actions={
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            <Plus className="w-3.5 h-3.5" /> Onboard institute
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input className="input-paper w-full !pl-9" placeholder="Search name, subdomain, owner" aria-label="Search institutes" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select-paper" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          {['ACTIVE', 'TRIAL', 'SUSPENDED', 'ARCHIVED'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="select-paper" aria-label="Filter by plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="ALL">All plans</option>
          {PLANS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingBlock />
      ) : (
        <DataList<InstituteSummary>
          rows={rows}
          rowKey={(i) => i.id}
          onRowClick={(i) => router.push(`/institutes/${i.id}`)}
          empty={data?.length ? 'No institute matches these filters.' : 'No institutes onboarded yet.'}
          cols={[
            { header: 'Institute', primary: true, cell: (i) => <span className="font-bold font-primary">{i.name}</span> },
            { header: 'Subdomain', cell: (i) => i.subdomain },
            {
              header: 'Status',
              cell: (i) =>
                i.status === 'TRIAL' && i.isTrialActive === false ? (
                  <StatusBadge value="WARNING" label="Trial Expired" />
                ) : (
                  <StatusBadge value={i.status} />
                ),
            },
            { header: 'Plan', cell: (i) => i.plan },
            {
              header: 'Students',
              cell: (i) => (
                <span>
                  {i.studentCount}
                  {Boolean(i.maxStudentsLimit && i.studentCount > i.maxStudentsLimit) && (
                    <span className="badge-status is-danger ml-1.5 text-[10px]">Over</span>
                  )}
                </span>
              ),
            },
            { header: 'Teachers', cell: (i) => i.teacherCount },
            { header: 'Owner', cell: (i) => i.ownerEmail || '-' },
            { header: 'Created', cell: (i) => fmtDay(i.createdAt) },
          ]}
        />
      )}

      <Dialog
        open={creating}
        title="Onboard institute"
        onClose={() => !busy && setCreating(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCreating(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="onboard-form" className="btn-primary" disabled={busy}>
              {busy && <Spin />} Create institute
            </button>
          </>
        }
      >
        <form id="onboard-form" onSubmit={submit} className="space-y-3">
          {formError && <div className="notice is-danger" role="alert">{formError}</div>}
          <Field label="Institute name"><input className="input-paper w-full" required value={form.name} onChange={set('name')} /></Field>
          <Field label="Subdomain" hint="2-41 lowercase letters, digits or hyphens."><input className="input-paper w-full" required value={form.subdomain} onChange={set('subdomain')} /></Field>
          <Field label="Plan">
            <select className="select-paper w-full" value={form.plan} onChange={set('plan')}>
              {PLANS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Owner name"><input className="input-paper w-full" required value={form.ownerName} onChange={set('ownerName')} /></Field>
          <Field label="Owner email"><input type="email" className="input-paper w-full" required value={form.ownerEmail} onChange={set('ownerEmail')} /></Field>
          <Field label="Owner phone (optional)"><input className="input-paper w-full" value={form.ownerPhone} onChange={set('ownerPhone')} /></Field>
          <Field label="Custom domain (optional)"><input className="input-paper w-full" value={form.customDomain} onChange={set('customDomain')} /></Field>
        </form>
      </Dialog>
    </>
  );
}

