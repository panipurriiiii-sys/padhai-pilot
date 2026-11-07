'use client';

import React, { useMemo, useState } from 'react';
import { OctagonAlert, RotateCcw } from 'lucide-react';
import type { FeatureDefinition } from '@padhai-pilot/shared';
import { adminApi, type FeatureFlagState } from '../lib/api';
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
} from '../components/ui';

type Action = { kind: 'toggle' | 'kill' | 'restore'; feature: FeatureDefinition; enable?: boolean };

export default function Features() {
  const toast = useToast();
  const registry = useLoad(() => adminApi.getFeatureRegistry());
  const state = useLoad(() => adminApi.getFeatureControlState());
  const [filter, setFilter] = useState('');
  const audit = useLoad(() => adminApi.getFeatureAuditLogs({ featureKey: filter || undefined, limit: 50 }), [filter]);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const flags = useMemo(() => new Map((state.data?.flags ?? []).map((f) => [f.key, f])), [state.data]);
  const stateOf = (k: string): 'ON' | 'OFF' | 'KILLED' => {
    const f: FeatureFlagState | undefined = flags.get(k as FeatureFlagState['key']);
    if (f?.isEmergencyDisabled) return 'KILLED';
    if (f && !f.isGloballyEnabled) return 'OFF';
    return 'ON';
  };

  const close = () => {
    setAction(null);
    setReason('');
    setCode('');
    setErr(null);
  };

  const confirm = async () => {
    if (!action) return;
    setBusy(true);
    setErr(null);
    try {
      const k = action.feature.key;
      if (action.kind === 'kill') await adminApi.emergencyKill(k, reason.trim(), code.trim());
      else if (action.kind === 'restore') await adminApi.emergencyRestore(k, reason.trim());
      else await adminApi.setGlobalFlag(k, !!action.enable, reason.trim() || undefined);
      toast(`${action.feature.name}: done.`);
      close();
      state.reload();
      audit.reload();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const error = registry.error ?? state.error;
  const title = action
    ? action.kind === 'kill'
      ? `Emergency kill: ${action.feature.name}`
      : action.kind === 'restore'
        ? `Restore: ${action.feature.name}`
        : `${action.enable ? 'Enable' : 'Disable'} globally: ${action.feature.name}`
    : '';
  const needsReason = action?.kind !== 'toggle';
  const canConfirm = !busy && (!needsReason || reason.trim().length >= 3) && (action?.kind !== 'kill' || code.trim() === 'CONFIRM_KILL');

  return (
    <>
      <PageHeader title="Feature flags" subtitle="Platform-wide switches. A kill switch disables a feature for every institute immediately; every change is audited." />
      {error ? (
        <ErrorState error={error} onRetry={() => { registry.reload(); state.reload(); }} />
      ) : !registry.data || !state.data ? (
        <LoadingBlock />
      ) : (
        <DataList<FeatureDefinition>
          rows={registry.data}
          rowKey={(f) => f.key}
          cols={[
            { header: 'Feature', primary: true, cell: (f) => <span><span className="font-bold font-primary">{f.name}</span><span className="block text-[11px] text-ink-muted font-data">{f.key}</span></span> },
            { header: 'Module', cell: (f) => f.module },
            { header: 'Impact', cell: (f) => f.securityImpact },
            {
              header: 'Global state',
              cell: (f) => {
                const s = stateOf(f.key);
                return <StatusBadge value={s === 'ON' ? 'ACTIVE' : s === 'OFF' ? 'SUSPENDED' : 'EMERGENCY_KILLED'} label={s === 'ON' ? 'Enabled' : s === 'OFF' ? 'Disabled' : 'Killed'} />;
              },
            },
            {
              header: 'Actions',
              cell: (f) => {
                const s = stateOf(f.key);
                return (
                  <div className="flex flex-wrap gap-2">
                    {s === 'KILLED' ? (
                      <button type="button" className="btn-secondary" onClick={() => setAction({ kind: 'restore', feature: f })}><RotateCcw className="w-3.5 h-3.5" /> Restore</button>
                    ) : (
                      <>
                        <button type="button" className="btn-secondary" onClick={() => setAction({ kind: 'toggle', feature: f, enable: s === 'OFF' })}>{s === 'OFF' ? 'Enable' : 'Disable'}</button>
                        {f.isKillSwitchable && (
                          <button type="button" className="btn-danger" onClick={() => setAction({ kind: 'kill', feature: f })}><OctagonAlert className="w-3.5 h-3.5" /> Kill</button>
                        )}
                      </>
                    )}
                  </div>
                );
              },
            },
          ]}
        />
      )}

      <section className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="font-display font-bold text-lg">Feature change history</h2>
          <select className="select-paper" aria-label="Filter history by feature" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All features</option>
            {(registry.data ?? []).map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
          </select>
        </div>
        {audit.error ? (
          <ErrorState error={audit.error} onRetry={audit.reload} />
        ) : audit.loading && !audit.data ? (
          <LoadingBlock rows={2} />
        ) : (
          <DataList
            rows={audit.data ?? []}
            rowKey={(a) => a.id}
            empty="No feature changes recorded yet."
            cols={[
              { header: 'When', primary: true, cell: (a) => fmtDate(a.createdAt) },
              { header: 'Feature', cell: (a) => a.featureKey },
              { header: 'Action', cell: (a) => a.action },
              { header: 'Scope', cell: (a) => a.scope },
              { header: 'By', cell: (a) => a.actorEmail },
              { header: 'Reason', cell: (a) => a.reason ?? '-' },
            ]}
          />
        )}
      </section>

      <Dialog
        open={!!action}
        title={title}
        onClose={() => !busy && close()}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={busy} onClick={close}>Cancel</button>
            <button type="button" className={action?.kind === 'kill' ? 'btn-danger' : 'btn-primary'} disabled={!canConfirm} onClick={confirm}>{busy && <Spin />} Confirm</button>
          </>
        }
      >
        {action?.kind === 'kill' && (
          <div className="notice is-danger"><OctagonAlert className="w-4 h-4 shrink-0 mt-0.5" /> This disables the feature for every institute on the platform right away.</div>
        )}
        {err && <div className="notice is-danger" role="alert">{err}</div>}
        <Field label={needsReason ? 'Reason (audit log)' : 'Reason (optional)'}>
          <textarea className="input-paper w-full" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {action?.kind === 'kill' && (
          <Field label="Type CONFIRM_KILL to proceed"><input className="input-paper w-full font-data" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" /></Field>
        )}
      </Dialog>
    </>
  );
}

