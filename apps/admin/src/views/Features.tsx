'use client';

import React, { useMemo, useState } from 'react';
import { OctagonAlert, RotateCcw, Building2, SlidersHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import type { FeatureDefinition, FeatureKey } from '@padhai-pilot/shared';
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

  // Institute / Class overrides state
  const institutes = useLoad(() => adminApi.getInstitutes());
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const effectiveFeats = useLoad(
    () => (selectedInstId ? adminApi.getEffectiveFeatures(selectedInstId) : Promise.resolve(null)),
    [selectedInstId],
  );
  const [instOverride, setInstOverride] = useState<{ key: FeatureKey; enabled: boolean; name: string } | null>(null);
  const [instReason, setInstReason] = useState('');
  const [instBusy, setInstBusy] = useState(false);
  const [instErr, setInstErr] = useState<string | null>(null);

  const selectedInst = useMemo(
    () => (institutes.data ?? []).find((i) => i.id === selectedInstId),
    [institutes.data, selectedInstId],
  );

  const regMap = useMemo(
    () => new Map((registry.data ?? []).map((r) => [r.key, r])),
    [registry.data],
  );

  const evaluated = useMemo(
    () => (effectiveFeats.data ? Object.values(effectiveFeats.data.evaluatedFeatures) : []),
    [effectiveFeats.data],
  );

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

  const closeInstOverride = () => {
    setInstOverride(null);
    setInstReason('');
    setInstErr(null);
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
      if (selectedInstId) effectiveFeats.reload();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmInstOverride = async () => {
    if (!instOverride || !selectedInstId) return;
    setInstBusy(true);
    setInstErr(null);
    try {
      const finalReason =
        instReason.trim() ||
        (instOverride.enabled
          ? `Enabled for ${selectedInst?.name || 'institute'} by Super Admin override`
          : `Disabled for ${selectedInst?.name || 'institute'} by Super Admin override`);

      await adminApi.updateInstituteFeature({
        instituteId: selectedInstId,
        featureKey: instOverride.key,
        isEnabled: instOverride.enabled,
        reason: finalReason,
      });

      toast(`Feature "${instOverride.name}" updated for ${selectedInst?.name || 'institute'}.`);
      closeInstOverride();
      effectiveFeats.reload();
      audit.reload();
    } catch (e) {
      setInstErr(errMsg(e));
    } finally {
      setInstBusy(false);
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

      {/* Institute / Class Specific Overrides */}
      <section className="paper-card p-5 mt-8 border border-paper-line bg-paper-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent-brass" />
              Institute & Class Feature Overrides
            </h2>
            <p className="text-xs text-ink-muted font-primary">
              Override feature access for a specific institute or class. Super Admin overrides take immediate precedence over plan defaults.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <select
              className="select-paper w-full font-primary text-sm"
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              aria-label="Select institute to override features"
            >
              <option value="">-- Select an Institute / Class --</option>
              {(institutes.data ?? []).map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.code}) — {inst.plan}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedInstId ? (
          <div className="p-6 text-center text-sm text-ink-muted bg-paper-subtle rounded-xl border border-dashed border-paper-line">
            Select an institute or coaching class from the dropdown above to view and toggle its specific features.
          </div>
        ) : effectiveFeats.error ? (
          <ErrorState error={effectiveFeats.error} onRetry={effectiveFeats.reload} />
        ) : effectiveFeats.loading && !effectiveFeats.data ? (
          <LoadingBlock rows={3} />
        ) : (
          <div>
            {selectedInst && (
              <div className="flex flex-wrap items-center gap-3 p-3 mb-4 bg-paper-subtle rounded-xl border border-paper-line text-xs font-primary">
                <div>
                  <span className="text-ink-muted">Institute:</span> <strong>{selectedInst.name}</strong>
                </div>
                <div>
                  <span className="text-ink-muted">Subdomain:</span> <code className="font-data">{selectedInst.subdomain}</code>
                </div>
                <div>
                  <span className="text-ink-muted">Plan:</span> <StatusBadge value={selectedInst.plan} />
                </div>
                <div>
                  <span className="text-ink-muted">Status:</span> <StatusBadge value={selectedInst.status} />
                </div>
              </div>
            )}

            <DataList
              rows={evaluated}
              rowKey={(f) => f.featureKey}
              cols={[
                {
                  header: 'Feature',
                  primary: true,
                  cell: (f) => {
                    const def = regMap.get(f.featureKey);
                    return (
                      <span>
                        <span className="font-bold font-primary">{def?.name || f.featureKey}</span>
                        <span className="block text-[11px] text-ink-muted font-data">{f.featureKey}</span>
                      </span>
                    );
                  },
                },
                {
                  header: 'Effective State',
                  cell: (f) => (
                    <StatusBadge
                      value={f.isAvailable ? 'ACTIVE' : f.status === 'INSTITUTE_DISABLED' ? 'SUSPENDED' : 'PLAN_RESTRICTED'}
                      label={f.isAvailable ? 'Active' : f.status === 'INSTITUTE_DISABLED' ? 'Disabled by Admin' : 'Plan Restricted'}
                    />
                  ),
                },
                {
                  header: 'Status & Reason',
                  cell: (f) => (
                    <span className="text-xs font-primary text-ink-muted">
                      {f.reason ?? f.status}
                    </span>
                  ),
                },
                {
                  header: 'Action',
                  cell: (f) => {
                    const def = regMap.get(f.featureKey);
                    const name = def?.name || f.featureKey;
                    return (
                      <button
                        type="button"
                        className={f.isAvailable ? 'btn-danger !text-xs !py-1' : 'btn-primary !text-xs !py-1'}
                        onClick={() =>
                          setInstOverride({
                            key: f.featureKey,
                            enabled: !f.isAvailable,
                            name,
                          })
                        }
                      >
                        {f.isAvailable ? 'Turn Off for this Class' : 'Turn On for this Class'}
                      </button>
                    );
                  },
                },
              ]}
            />
          </div>
        )}
      </section>

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

      {/* Institute Feature Override Modal */}
      <Dialog
        open={!!instOverride}
        title={`${instOverride?.enabled ? 'Enable' : 'Disable'} ${instOverride?.name ?? ''} for ${selectedInst?.name ?? 'Institute'}`}
        onClose={() => !instBusy && closeInstOverride()}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={instBusy} onClick={closeInstOverride}>Cancel</button>
            <button
              type="button"
              className={instOverride?.enabled ? 'btn-primary' : 'btn-danger'}
              disabled={instBusy}
              onClick={confirmInstOverride}
            >
              {instBusy && <Spin />} {instOverride?.enabled ? 'Confirm Enable' : 'Confirm Disable'}
            </button>
          </>
        }
      >
        <div className="text-xs text-ink-muted mb-3 font-primary">
          {instOverride?.enabled
            ? `This will override plan limits and force-enable "${instOverride.name}" specifically for ${selectedInst?.name}.`
            : `This will immediately block and disable "${instOverride?.name}" for ${selectedInst?.name}, revoking access for all teachers and students in this institute.`}
        </div>
        {instErr && <div className="notice is-danger" role="alert">{instErr}</div>}
        <Field label="Reason (audit log)" hint="Optional — defaults to an automatic audit entry if left blank.">
          <textarea
            className="input-paper w-full font-primary text-sm"
            rows={3}
            placeholder="e.g. Disabled by Super Admin request"
            value={instReason}
            onChange={(e) => setInstReason(e.target.value)}
          />
        </Field>
      </Dialog>
    </>
  );
}

