'use client';

import React, { useMemo, useState } from 'react';
import type { FeatureDefinition, FeatureKey, SubscriptionPlan } from '@padhai-pilot/shared';
import { adminApi } from '../lib/api';
import { PLANS } from '../lib/constants';
import { DataList, Dialog, ErrorState, Field, LoadingBlock, PageHeader, Spin, errMsg, useLoad, useToast } from '../components/ui';

interface Cell {
  included: boolean;
  quota: number | null;
  custom: boolean;
}

export default function Plans() {
  const toast = useToast();
  const registry = useLoad(() => adminApi.getFeatureRegistry());
  const state = useLoad(() => adminApi.getFeatureControlState());
  const [edit, setEdit] = useState<{ feature: FeatureDefinition; plan: SubscriptionPlan } | null>(null);
  const [included, setIncluded] = useState(true);
  const [quota, setQuota] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cell = useMemo(() => {
    const stored = new Map((state.data?.planEntitlements ?? []).map((r) => [`${r.plan}:${r.featureKey}`, r]));
    return (f: FeatureDefinition, plan: SubscriptionPlan): Cell => {
      const row = stored.get(`${plan}:${f.key}`);
      if (row) return { included: row.isIncluded, quota: row.quotaLimit, custom: true };
      const d = f.defaultQuotaByPlan?.[plan];
      return { included: d !== 0, quota: d === undefined ? null : d, custom: false };
    };
  }, [state.data]);

  const open = (feature: FeatureDefinition, plan: SubscriptionPlan) => {
    const c = cell(feature, plan);
    setEdit({ feature, plan });
    setIncluded(c.included);
    setQuota(c.quota === null ? '' : String(c.quota));
    setReason('');
    setErr(null);
  };

  const save = async () => {
    if (!edit) return;
    setBusy(true);
    setErr(null);
    try {
      await adminApi.updatePlanEntitlement({
        plan: edit.plan,
        featureKey: edit.feature.key as FeatureKey,
        isIncluded: included,
        quotaLimit: quota === '' ? null : Number(quota),
        reason: reason.trim() || undefined,
      });
      toast(`${edit.plan} / ${edit.feature.key} updated.`);
      setEdit(null);
      state.reload();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const render = (f: FeatureDefinition, plan: SubscriptionPlan) => {
    const c = cell(f, plan);
    return (
      <button type="button" className="btn-secondary !w-full justify-between" onClick={(e) => { e.stopPropagation(); open(f, plan); }} aria-label={`Edit ${plan} ${f.key}`}>
        <span>{c.included ? (c.quota === null ? 'Unlimited' : `Quota ${c.quota}`) : 'Excluded'}</span>
        {c.custom && <span className="badge-status is-info">custom</span>}
      </button>
    );
  };

  const error = registry.error ?? state.error;
  return (
    <>
      <PageHeader title="Plans & entitlements" subtitle="Which features each subscription plan includes and their quotas. Values marked custom are stored overrides; others are registry defaults." />
      {error ? (
        <ErrorState error={error} onRetry={() => { registry.reload(); state.reload(); }} />
      ) : !registry.data || !state.data ? (
        <LoadingBlock />
      ) : (
        <DataList
          rows={registry.data}
          rowKey={(f) => f.key}
          cols={[
            { header: 'Feature', primary: true, cell: (f) => <span><span className="font-bold font-primary">{f.name}</span><span className="block text-[11px] text-ink-muted font-data">{f.key}</span></span> },
            ...PLANS.map((p) => ({ header: p, cell: (f: FeatureDefinition) => render(f, p) })),
          ]}
        />
      )}

      <Dialog
        open={!!edit}
        title={edit ? `${edit.plan}: ${edit.feature.name}` : ''}
        onClose={() => !busy && setEdit(null)}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => setEdit(null)}>Cancel</button>
            <button type="button" className="btn-primary" disabled={busy} onClick={save}>{busy && <Spin />} Save entitlement</button>
          </>
        }
      >
        {err && <div className="notice is-danger" role="alert">{err}</div>}
        <label className="flex items-center gap-3 min-h-11 text-sm"><input type="checkbox" checked={included} onChange={(e) => setIncluded(e.target.checked)} /> Included in this plan</label>
        <Field label="Quota limit" hint="Leave empty for unlimited."><input type="number" min={0} className="input-paper w-full" value={quota} onChange={(e) => setQuota(e.target.value)} disabled={!included} /></Field>
        <Field label="Reason (optional, audit log)"><input className="input-paper w-full" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Dialog>
    </>
  );
}

