'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, UploadCloud, XCircle } from 'lucide-react';
import { DEFAULT_THEME_CONFIG, contrastRatio, type PlatformThemeConfig } from '@padhai-pilot/shared';
import { adminApi, type ThemeHistoryItem, type ThemeValidation } from '../lib/api';
import { DataList, Dialog, ErrorState, Field, LoadingBlock, PageHeader, Spin, StatusBadge, errMsg, fmtDate, useLoad, useToast } from '../components/ui';


const HEX = /^#[0-9a-fA-F]{6}$/;

export default function Theme() {
  const toast = useToast();
  const overview = useLoad(() => adminApi.getAdminThemeOverview());
  const [cfg, setCfg] = useState<PlatformThemeConfig>(DEFAULT_THEME_CONFIG);
  const [validation, setValidation] = useState<ThemeValidation | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'validate' | 'publish' | 'restore' | null>(null);
  const [restore, setRestore] = useState<ThemeHistoryItem | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (overview.data?.published?.config) setCfg(overview.data.published.config);
  }, [overview.data]);

  const patch = (fn: (c: PlatformThemeConfig) => PlatformThemeConfig) => {
    setCfg(fn);
    setValidation(null);
  };
  const primaryOk = HEX.test(cfg.brand.primary);
  const ratio = primaryOk ? contrastRatio(cfg.brand.primary, '#FFFFFF') : 0;

  const isDirty = React.useMemo(() => {
    if (!overview.data?.published?.config) return false;
    return JSON.stringify(cfg) !== JSON.stringify(overview.data.published.config);
  }, [cfg, overview.data]);

  const validate = async () => {
    setBusy('validate');
    try {
      const v = await adminApi.validateThemeConfig(cfg);
      setValidation(v);
      toast(v.ok ? 'Theme passed validation.' : 'Validation found problems.', v.ok ? 'success' : 'error');
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    setBusy('publish');
    try {
      const v = await adminApi.validateThemeConfig(cfg);
      setValidation(v);
      if (!v.ok) {
        toast('Fix validation errors before publishing.', 'error');
        return;
      }
      const r = await adminApi.publishTheme(cfg, reason.trim() || undefined);
      toast(r.unchanged ? 'Identical to the live theme; nothing changed.' : `Revision ${r.theme?.revision ?? ''} is live.`, r.unchanged ? 'info' : 'success');
      setReason('');
      overview.reload();
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const doRestore = async () => {
    if (!restore) return;
    setBusy('restore');
    setErr(null);
    try {
      const r = await adminApi.restoreTheme(restore.revision, reason.trim() || `Restored revision ${restore.revision}`);
      toast(`Revision ${restore.revision} restored as ${r.theme?.revision ?? 'new revision'}.`);
      setRestore(null);
      setReason('');
      overview.reload();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const pub = overview.data?.published;
  return (
    <>
      <PageHeader
        title="Theme"
        subtitle="Platform theme served to the web, teacher, student and mobile apps. Changes are validated, versioned and reversible."
        actions={
          <>
            {isDirty && (
              <span className="badge-status is-warning text-xs">
                ● Draft (Unpublished Changes)
              </span>
            )}
            <button type="button" className="btn-secondary" disabled={!!busy || !primaryOk} onClick={validate}>{busy === 'validate' && <Spin />} Validate</button>
            <button type="button" className="btn-primary" disabled={!!busy || !primaryOk} onClick={publish}>{busy === 'publish' ? <Spin /> : <UploadCloud className="w-3.5 h-3.5" />} Publish</button>
          </>
        }
      />
      {overview.error ? (
        <ErrorState error={overview.error} onRetry={overview.reload} />
      ) : !overview.data ? (
        <LoadingBlock message="Connecting to theme configuration engine..." />
      ) : (
        <>
          <p className="text-xs font-primary text-ink-muted mb-4">
            Live revision <span className="font-data font-bold text-ink-primary">#{pub?.revision ?? 0}</span> ({pub?.revisionId}), published {pub?.publishedAt ? fmtDate(pub.publishedAt) : 'as built-in default'}.
          </p>

          {validation && (
            <div className={`notice mb-4 ${validation.ok ? 'is-success' : 'is-danger'}`} role="status">
              {validation.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div className="min-w-0 break-words">
                <p className="font-bold">{validation.ok ? 'Valid theme' : 'Theme is not valid'}</p>
                {validation.errors?.map((e) => <p key={e}>{e}</p>)}
                {validation.warnings?.map((w) => <p key={w}>Warning: {w}</p>)}
                {validation.contrast?.filter((c) => !c.passed).map((c) => (
                  <p key={`${c.scheme}${c.label}`}>Contrast {c.scheme}: {c.label} is {c.ratio}:1 (needs {c.required}:1)</p>
                ))}
                {validation.ok && (
                  <p className="mt-1">
                    {validation.changes?.length ? `Changes vs the built-in default: ${validation.changes.join('; ')}` : 'Identical to the built-in default.'}
                    {` Contrast checks passed: ${validation.contrast?.filter((c) => c.passed).length ?? 0}/${validation.contrast?.length ?? 0}.`}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <section className="paper-card p-4 space-y-4">
              <h2 className="font-display font-bold text-lg">Editor</h2>
              <Field label="Primary colour" hint={primaryOk ? `Contrast on white: ${ratio.toFixed(2)}:1` : 'Use a 6-digit hex such as #1677FF'}>
                <div className="flex items-center gap-2">
                  <input type="color" aria-label="Pick primary colour" className="w-11 h-11 rounded-lg border border-border-paper bg-paper p-0.5 shrink-0" value={primaryOk ? cfg.brand.primary : '#000000'} onChange={(e) => patch((c) => ({ ...c, brand: { ...c.brand, primary: e.target.value } }))} />
                  <input className="input-paper w-full font-data" value={cfg.brand.primary} onChange={(e) => patch((c) => ({ ...c, brand: { ...c.brand, primary: e.target.value } }))} aria-invalid={!primaryOk} />
                </div>
              </Field>
              <Field label="Accent colour (optional)">
                <input className="input-paper w-full font-data" placeholder="#0A6FE8" value={cfg.brand.accent ?? ''} onChange={(e) => patch((c) => ({ ...c, brand: { ...c.brand, accent: e.target.value || undefined } }))} />
              </Field>
              <div>
                <span className="block text-xs font-bold font-primary mb-1">Default scheme</span>
                <div className="tab-list w-full" role="tablist">
                  {(['light', 'dark', 'system'] as const).map((s) => (
                    <button key={s} type="button" role="tab" aria-selected={cfg.appearance.defaultScheme === s} className="tab flex-1 min-h-11 capitalize" onClick={() => patch((c) => ({ ...c, appearance: { ...c.appearance, defaultScheme: s } }))}>{s}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 min-h-11 text-sm"><input type="checkbox" checked={cfg.appearance.allowUserSchemeToggle} onChange={(e) => patch((c) => ({ ...c, appearance: { ...c.appearance, allowUserSchemeToggle: e.target.checked } }))} /> Let users switch light / dark</label>
              <label className="flex items-center gap-3 min-h-11 text-sm"><input type="checkbox" checked={cfg.appearance.deskTexture} onChange={(e) => patch((c) => ({ ...c, appearance: { ...c.appearance, deskTexture: e.target.checked } }))} /> Paper-desk texture behind pages</label>
              <p className="text-xs text-ink-muted font-primary">Fonts are fixed to the approved set: Playfair Display (headings), Raleway (interface), Inter (numbers).</p>
              <Field label="Audit reason (optional)"><input className="input-paper w-full" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            </section>

            <section className="paper-card p-4 space-y-4">
              <h2 className="font-display font-bold text-lg">Preview</h2>
              <div className="rounded-xl border border-border-paper p-4 space-y-3 bg-paper-warm">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="rounded-xl px-4 min-h-11 text-sm font-primary font-bold text-white" style={{ backgroundColor: primaryOk ? cfg.brand.primary : undefined }}>Primary action</button>
                  <button type="button" className="btn-secondary">Secondary</button>
                  <span className="badge-status is-success">Active</span>
                </div>
                <h3 className="font-display font-bold text-lg">Playfair Display heading</h3>
                <p className="font-primary text-sm text-ink-secondary">Raleway interface text for diaries, fees and attendance.</p>
                <p className="font-data text-sm font-bold">Inter numbers: 1,24,500 collected</p>
              </div>
              <p className="text-xs text-ink-muted font-primary">Preview approximates the primary colour only. The server validates the full theme including dark-scheme contrast.</p>
            </section>
          </div>

          <section className="mt-6">
            <h2 className="font-display font-bold text-lg mb-3">Revision history</h2>
            <DataList<ThemeHistoryItem>
              rows={overview.data.history}
              rowKey={(h) => h.revisionId}
              empty="No published revisions yet; the built-in default is live."
              cols={[
                { header: 'Revision', primary: true, cell: (h) => <span className="font-bold">#{h.revision}</span> },
                { header: 'Published', cell: (h) => fmtDate(h.publishedAt) },
                { header: 'By', cell: (h) => h.publishedByEmail },
                { header: 'Reason', cell: (h) => h.reason ?? '-' },
                { header: 'State', cell: (h) => (h.revision === pub?.revision ? <StatusBadge value="ACTIVE" label="Live" /> : <StatusBadge value="ARCHIVED" label="Past" />) },
                { header: 'Action', cell: (h) => h.revision === pub?.revision ? null : <button type="button" className="btn-secondary" onClick={() => { setErr(null); setRestore(h); }}><RotateCcw className="w-3.5 h-3.5" /> Restore</button> },
              ]}
            />
          </section>
        </>
      )}

      <Dialog
        open={!!restore}
        title={`Restore revision #${restore?.revision ?? ''}`}
        onClose={() => busy !== 'restore' && setRestore(null)}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={busy === 'restore'} onClick={() => setRestore(null)}>Cancel</button>
            <button type="button" className="btn-primary" disabled={busy === 'restore'} onClick={doRestore}>{busy === 'restore' && <Spin />} Restore and publish</button>
          </>
        }
      >
        {err && <div className="notice is-danger" role="alert">{err}</div>}
        <p className="text-sm font-primary">This publishes the old configuration as a new live revision. History is kept.</p>
        <Field label="Reason (optional)"><input className="input-paper w-full" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Dialog>
    </>
  );
}

