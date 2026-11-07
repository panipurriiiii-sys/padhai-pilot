'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, PauseCircle, PlayCircle, FlaskConical } from 'lucide-react';
import type { FeatureKey } from '@padhai-pilot/shared';
import { adminApi, type InstituteStatus, type InstituteSummary } from '../lib/api';
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
  fmtDate,
  useLoad,
  useToast,
} from './ui';

const TRANSITIONS: { to: InstituteStatus; label: string; icon: React.ElementType; danger?: boolean }[] = [
  { to: 'ACTIVE', label: 'Activate', icon: PlayCircle },
  { to: 'TRIAL', label: 'Set to trial', icon: FlaskConical },
  { to: 'SUSPENDED', label: 'Suspend', icon: PauseCircle, danger: true },
  { to: 'ARCHIVED', label: 'Archive', icon: Archive, danger: true },
];

export function InstituteDetail({ id }: { id: string }) {
  const toast = useToast();
  const inst = useLoad(() => adminApi.getInstitute(id), [id]);
  const feats = useLoad(() => adminApi.getEffectiveFeatures(id), [id]);
  const audit = useLoad(() => adminApi.getAuditLogs(200), []);

  const [transition, setTransition] = useState<InstituteStatus | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [plan, setPlan] = useState<string | null>(null);
  const [limits, setLimits] = useState<{ s: string; t: string; domain: string; wl: boolean; ded: boolean } | null>(null);
  const [override, setOverride] = useState<{ key: FeatureKey; enabled: boolean } | null>(null);

  const i = inst.data;
  const refreshAll = () => {
    inst.reload();
    feats.reload();
    audit.reload();
  };

  const run = async (fn: () => Promise<unknown>, ok: string, done: () => void) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      toast(ok);
      done();
      refreshAll();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (inst.error) {
    return (
      <>
        <Link href="/institutes" className="btn-secondary mb-4"><ArrowLeft className="w-3.5 h-3.5" /> Institutes</Link>
        <ErrorState error={inst.error} onRetry={inst.reload} />
      </>
    );
  }
  if (!i) return <LoadingBlock />;

  const openLimits = (x: InstituteSummary) =>
    setLimits({
      s: x.maxStudentsLimit ? String(x.maxStudentsLimit) : '',
      t: x.maxTeachersLimit ? String(x.maxTeachersLimit) : '',
      domain: x.customDomain ?? '',
      wl: x.isWhiteLabel,
      ded: x.isDedicatedDb,
    });

  const closeAll = () => {
    setTransition(null);
    setPlan(null);
    setLimits(null);
    setOverride(null);
    setReason('');
    setErr(null);
  };

  const evaluated = feats.data ? Object.values(feats.data.evaluatedFeatures) : [];
  const mine = (audit.data ?? []).filter((a) => a.targetId === id);

  return (
    <>
      <Link href="/institutes" className="btn-secondary mb-4"><ArrowLeft className="w-3.5 h-3.5" /> Institutes</Link>
      <PageHeader
        title={i.name}
        subtitle={`${i.subdomain}${i.customDomain ? ` / ${i.customDomain}` : ''}`}
        actions={<StatusBadge value={i.status} />}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="paper-card p-4 xl:col-span-2 space-y-4">
          <h2 className="font-display font-bold text-lg">Details</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ['Plan', i.plan],
              ['Owner', `${i.ownerName || '-'} (${i.ownerEmail || '-'})`],
              ['Phone', i.ownerPhone || '-'],
              ['Students', `${i.studentCount}${i.maxStudentsLimit ? ` / ${i.maxStudentsLimit}` : ' (no cap)'}`],
              ['Teachers', `${i.teacherCount}${i.maxTeachersLimit ? ` / ${i.maxTeachersLimit}` : ' (no cap)'}`],
              ['White label', i.isWhiteLabel ? 'Yes' : 'No'],
              ['Dedicated database', i.isDedicatedDb ? 'Yes' : 'No'],
              ['Created', fmtDate(i.createdAt)],
              ['Updated', fmtDate(i.updatedAt)],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-ink-muted font-primary">{k}</dt>
                <dd className="font-data break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border-paper">
            <button type="button" className="btn-subtle" onClick={() => setPlan(i.plan)}>Change plan</button>
            <button type="button" className="btn-subtle" onClick={() => openLimits(i)}>Edit limits & domain</button>
          </div>
        </section>

        <section className="paper-card p-4 space-y-3">
          <h2 className="font-display font-bold text-lg">Lifecycle</h2>
          <p className="text-xs text-ink-muted font-primary">
            Suspended and archived institutes cannot sign in. Every change is recorded in the audit log with your reason.
          </p>
          <div className="flex flex-col gap-2">
            {TRANSITIONS.filter((t) => t.to !== i.status).map((t) => (
              <button key={t.to} type="button" className={t.danger ? 'btn-danger' : 'btn-secondary'} onClick={() => setTransition(t.to)}>
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="paper-card p-4 mt-4">
        <h2 className="font-display font-bold text-lg mb-1">Effective features</h2>
        <p className="text-xs text-ink-muted font-primary mb-3">Resolved from global flags, plan entitlements and this institute&apos;s overrides.</p>
        {feats.error ? (
          <ErrorState error={feats.error} onRetry={feats.reload} />
        ) : feats.loading && !feats.data ? (
          <LoadingBlock rows={2} />
        ) : (
          <DataList
            rows={evaluated}
            rowKey={(f) => f.featureKey}
            cols={[
              { header: 'Feature', primary: true, cell: (f) => <span className="font-bold">{f.featureKey}</span> },
              { header: 'Available', cell: (f) => <StatusBadge value={f.isAvailable ? 'ACTIVE' : 'SUSPENDED'} label={f.isAvailable ? 'Yes' : 'No'} /> },
              { header: 'Status', cell: (f) => f.status },
              { header: 'Reason', cell: (f) => f.reason ?? '-' },
              {
                header: 'Override',
                cell: (f) => (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverride({ key: f.featureKey, enabled: !f.isAvailable });
                    }}
                  >
                    {f.isAvailable ? 'Disable here' : 'Enable here'}
                  </button>
                ),
              },
            ]}
          />
        )}
      </section>

      <section className="paper-card p-4 mt-4">
        <h2 className="font-display font-bold text-lg mb-3">Audit trail for this institute</h2>
        {audit.error ? (
          <ErrorState error={audit.error} onRetry={audit.reload} />
        ) : (
          <DataList
            rows={mine}
            rowKey={(a) => a.id}
            empty="No audit entries for this institute in the latest 200 events."
            cols={[
              { header: 'When', primary: true, cell: (a) => fmtDate(a.timestamp) },
              { header: 'Action', cell: (a) => a.action },
              { header: 'Actor', cell: (a) => a.actorEmail },
              { header: 'Details', cell: (a) => a.details },
              { header: 'Result', cell: (a) => <StatusBadge value={a.status} /> },
            ]}
          />
        )}
      </section>

      {/* lifecycle */}
      <Dialog
        open={!!transition}
        title={`${TRANSITIONS.find((t) => t.to === transition)?.label ?? ''}: ${i.name}`}
        onClose={() => !busy && closeAll()}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeAll} disabled={busy}>Cancel</button>
            <button
              type="button"
              className={transition === 'SUSPENDED' || transition === 'ARCHIVED' ? 'btn-danger' : 'btn-primary'}
              disabled={busy || reason.trim().length < 3}
              onClick={() => transition && run(() => adminApi.updateInstituteStatus(id, transition, reason.trim()), `Status set to ${transition}.`, closeAll)}
            >
              {busy && <Spin />} Confirm
            </button>
          </>
        }
      >
        {err && <div className="notice is-danger" role="alert">{err}</div>}
        <Field label="Reason (recorded in the audit log)">
          <textarea className="input-paper w-full" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Dialog>

      {/* plan */}
      <Dialog
        open={plan !== null}
        title="Change plan"
        onClose={() => !busy && closeAll()}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeAll} disabled={busy}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || plan === i.plan}
              onClick={() => plan && run(() => adminApi.updateInstitutePlan(id, plan as (typeof PLANS)[number], reason.trim() || undefined), `Plan changed to ${plan}.`, closeAll)}
            >
              {busy && <Spin />} Save plan
            </button>
          </>
        }
      >
        {err && <div className="notice is-danger" role="alert">{err}</div>}
        <Field label="Plan">
          <select className="select-paper w-full" value={plan ?? ''} onChange={(e) => setPlan(e.target.value)}>
            {PLANS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Reason (optional)"><input className="input-paper w-full" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Dialog>

      {/* limits */}
      <Dialog
        open={!!limits}
        title="Limits & domain"
        onClose={() => !busy && closeAll()}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeAll} disabled={busy}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() =>
                limits &&
                run(
                  () =>
                    adminApi.updateInstituteConfig(id, {
                      maxStudentsLimit: limits.s ? Number(limits.s) : undefined,
                      maxTeachersLimit: limits.t ? Number(limits.t) : undefined,
                      customDomain: limits.domain || undefined,
                      isWhiteLabel: limits.wl,
                      isDedicatedDb: limits.ded,
                    }),
                  'Limits updated.',
                  closeAll,
                )
              }
            >
              {busy && <Spin />} Save
            </button>
          </>
        }
      >
        {err && <div className="notice is-danger" role="alert">{err}</div>}
        {limits && (
          <>
            <Field label="Max students" hint="Empty keeps the current value."><input type="number" min={1} className="input-paper w-full" value={limits.s} onChange={(e) => setLimits({ ...limits, s: e.target.value })} /></Field>
            <Field label="Max teachers" hint="Empty keeps the current value."><input type="number" min={1} className="input-paper w-full" value={limits.t} onChange={(e) => setLimits({ ...limits, t: e.target.value })} /></Field>
            <Field label="Custom domain"><input className="input-paper w-full" value={limits.domain} onChange={(e) => setLimits({ ...limits, domain: e.target.value })} /></Field>
            <label className="flex items-center gap-3 min-h-11 text-sm"><input type="checkbox" checked={limits.wl} onChange={(e) => setLimits({ ...limits, wl: e.target.checked })} /> White-label branding</label>
            <label className="flex items-center gap-3 min-h-11 text-sm"><input type="checkbox" checked={limits.ded} onChange={(e) => setLimits({ ...limits, ded: e.target.checked })} /> Dedicated database</label>
          </>
        )}
      </Dialog>

      {/* per-institute feature override */}
      <Dialog
        open={!!override}
        title={`${override?.enabled ? 'Enable' : 'Disable'} ${override?.key ?? ''} for ${i.name}`}
        onClose={() => !busy && closeAll()}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeAll} disabled={busy}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || reason.trim().length < 3}
              onClick={() => override && run(() => adminApi.updateInstituteFeature({ instituteId: id, featureKey: override.key, isEnabled: override.enabled, reason: reason.trim() }), 'Override saved.', closeAll)}
            >
              {busy && <Spin />} Save override
            </button>
          </>
        }
      >
        {err && <div className="notice is-danger" role="alert">{err}</div>}
        <Field label="Reason (audit log)"><textarea className="input-paper w-full" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Dialog>
    </>
  );
}
