'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Sliders,
  History,
  Search,
  Filter,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Building2,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Clock,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react';
import type {
  FeatureKey,
  FeatureDefinition,
  InstituteEffectiveFeatures,
  FeatureAuditLogItem,
  SubscriptionPlan,
  FeatureStatus,
} from '@padhai-pilot/shared';
import { teacherApi } from '../lib/api';

export function PlatformSuperAdminFeatureView() {
  const [activeSubTab, setActiveSubTab] = useState<
    'features' | 'simulator' | 'plans' | 'audit'
  >('features');

  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [effectiveFeatures, setEffectiveFeatures] = useState<InstituteEffectiveFeatures | null>(null);
  const [auditLogs, setAuditLogs] = useState<FeatureAuditLogItem[]>([]);
  const [selectedInstituteId, setSelectedInstituteId] = useState('inst_apex_academy');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('GROWTH');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Emergency Kill Modal state
  const [killModalFeature, setKillModalFeature] = useState<FeatureDefinition | null>(null);
  const [killReason, setKillReason] = useState('');
  const [killConfirmCode, setKillConfirmCode] = useState('');
  const [isKilling, setIsKilling] = useState(false);

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reg, eff, logs] = await Promise.all([
        teacherApi.getFeatureRegistry(),
        teacherApi.getInstituteEffectiveFeatures(selectedInstituteId),
        teacherApi.getFeatureAuditLogs(),
      ]);
      setFeatures(reg);
      setEffectiveFeatures(eff);
      setAuditLogs(logs);
      if (eff?.plan) setSelectedPlan(eff.plan);
    } catch (err) {
      console.error('Failed to load feature management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedInstituteId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Toggle Global Feature
  const handleToggleGlobal = async (feature: FeatureDefinition, currentState: boolean) => {
    const newState = !currentState;
    try {
      await teacherApi.updateGlobalFeature({
        featureKey: feature.key,
        isGloballyEnabled: newState,
        reason: `Super Admin toggle: set to ${newState ? 'ENABLED' : 'DISABLED'}`,
      });

      setFeatures((prev) =>
        prev.map((f) => (f.key === feature.key ? { ...f, defaultGloballyEnabled: newState } : f)),
      );

      showToast(`Feature "${feature.name}" is now globally ${newState ? 'enabled' : 'disabled'}.`);
      // Reload audit logs
      const updatedLogs = await teacherApi.getFeatureAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle global feature state', 'error');
    }
  };

  // Execute Emergency Kill Switch
  const handleExecuteKillSwitch = async () => {
    if (!killModalFeature) return;
    if (killConfirmCode !== 'CONFIRM_KILL') {
      showToast('You must type CONFIRM_KILL exactly to activate emergency kill switch.', 'error');
      return;
    }

    setIsKilling(true);
    try {
      await teacherApi.emergencyKillFeature({
        featureKey: killModalFeature.key,
        reason: killReason.trim() || 'Immediate platform protection triggered',
        confirmCode: killConfirmCode,
      });

      showToast(`EMERGENCY KILL SWITCH ACTIVATED for "${killModalFeature.name}".`, 'error');
      setKillModalFeature(null);
      setKillReason('');
      setKillConfirmCode('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to execute emergency kill switch', 'error');
    } finally {
      setIsKilling(false);
    }
  };

  // Emergency Restore
  const handleEmergencyRestore = async (feature: FeatureDefinition) => {
    try {
      await teacherApi.emergencyRestoreFeature({
        featureKey: feature.key,
        reason: 'Super Admin cleared emergency incident. Resumed normal operation.',
      });

      showToast(`Feature "${feature.name}" has been restored to normal operation.`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to restore feature', 'error');
    }
  };

  // Filtered features
  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchModule = selectedModule === 'ALL' || f.module === selectedModule;

      return matchSearch && matchModule;
    });
  }, [features, searchQuery, selectedModule]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-['Raleway'] font-bold flex items-center gap-2 shadow-md transition-all ${
            toastMsg.type === 'error'
              ? 'bg-rose-100 border border-rose-300 text-rose-900'
              : 'bg-emerald-100 border border-emerald-300 text-emerald-900'
          }`}
        >
          {toastMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-700" /> : <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-paper)]">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold mb-1.5 flex items-center gap-2">
            <span className="badge-urgent flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Platform Super Admin Control Plane
            </span>
            <span className="text-[var(--ink-faint)]">•</span>
            <span className="text-[var(--ink-muted)] font-mono text-[11px]">
              Multi-Tenant Entitlement Engine v2.4
            </span>
          </div>
          <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[var(--ink-primary)] tracking-tight">
            Global Feature Management & Entitlements
          </h1>
          <p className="text-xs md:text-sm text-[var(--ink-secondary)] mt-1 font-['Raleway']">
            Centralized runtime feature flags, subscription plan packaging, emergency kill switches, and institutional audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="btn-secondary"
            title="Reload registry and effective states"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Engine</span>
          </button>
        </div>
      </div>

      {/* Top Metric KPI Rail */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] font-['Raleway']">
              Registered Features
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--brand-electric)]">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="font-['Inter'] text-2xl md:text-3xl font-extrabold text-[var(--ink-primary)]">
            {features.length}
          </div>
          <span className="text-[11px] text-[var(--ink-muted)] mt-1 block font-['Raleway'] font-medium">
            Authoritative typed catalog
          </span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] font-['Raleway']">
              Globally Active
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-['Inter'] text-2xl md:text-3xl font-extrabold text-stone-900">
            {features.filter((f) => f.defaultGloballyEnabled).length}
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block font-['Raleway'] font-semibold">
            All systems operational
          </span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] font-['Raleway']">
              Kill Switches Active
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="font-['Inter'] text-2xl md:text-3xl font-extrabold text-stone-900">
            0
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block font-['Raleway'] font-medium">
            Zero emergency outages
          </span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] font-['Raleway']">
              Active Institute
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-['Raleway'] text-base font-extrabold text-[var(--ink-primary)] truncate">
            {effectiveFeatures?.instituteName || 'Institutional Tenant'}
          </div>
          <span className="badge-code mt-1 inline-block">
            Plan: {effectiveFeatures?.plan || 'GROWTH'}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border-paper)] pb-2 overflow-x-auto">
        {[
          { id: 'features', label: 'Feature Registry & Overrides', icon: Sliders },
          { id: 'simulator', label: 'Institute Simulator & Precedence', icon: Layers },
          { id: 'plans', label: 'Subscription Plan Matrix', icon: Zap },
          { id: 'audit', label: 'Audit Trail & Change History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-['Raleway'] transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-[var(--ink-primary)] font-bold shadow-sm border border-[var(--border-paper)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface-subtle)]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--brand-electric)]' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FEATURES REGISTRY & OVERRIDES */}
      {activeSubTab === 'features' && (
        <div className="space-y-6">
          {/* Search & Module Filters */}
          <div className="paper-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search feature by key, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-paper w-full pl-9"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-4 h-4 text-[var(--ink-muted)] shrink-0" />
              {(
                ['ALL', 'ACADEMIC_OPS', 'ASSESSMENT', 'COMMUNICATIONS', 'FINANCE', 'SYSTEM_BRANDING'] as const
              ).map((mod) => (
                <button
                  key={mod}
                  onClick={() => setSelectedModule(mod)}
                  className={`px-3 py-1 rounded-lg text-xs font-['Raleway'] transition-all whitespace-nowrap cursor-pointer ${
                    selectedModule === mod
                      ? 'bg-[var(--brand-electric)] text-white font-bold shadow-sm'
                      : 'recessed-surface text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {mod === 'ALL' ? 'All Modules' : mod.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Feature List Table */}
          <div className="paper-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-paper)] bg-[var(--bg-paper-warm)] text-[var(--ink-secondary)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5">Feature Name & Registry Key</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4 text-center">Security Impact</th>
                    <th className="py-3 px-4 text-center">Permitted Scopes</th>
                    <th className="py-3 px-4 text-center">Global Availability</th>
                    <th className="py-3 px-5 text-right">Emergency Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-paper)] font-['Raleway']">
                  {filteredFeatures.map((feat) => {
                    const isGloballyOn = feat.defaultGloballyEnabled;

                    return (
                      <tr key={feat.key} className="hover:bg-amber-50/20 transition group">
                        {/* Title & Key */}
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-[var(--ink-primary)]">
                                {feat.name}
                              </h4>
                              {feat.dependencies && feat.dependencies.length > 0 && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  requires: {feat.dependencies.join(', ')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="badge-code font-mono">
                                {feat.key}
                              </span>
                              <p className="text-[11px] text-[var(--ink-muted)] line-clamp-1">
                                {feat.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Module */}
                        <td className="py-4 px-4">
                          <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                            {feat.module}
                          </span>
                        </td>

                        {/* Security Impact */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`font-['Inter'] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              feat.securityImpact === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : feat.securityImpact === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : feat.securityImpact === 'MEDIUM'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {feat.securityImpact}
                          </span>
                        </td>

                        {/* Applicable Scopes */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {feat.applicableScopes.map((sc) => (
                              <span
                                key={sc}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200"
                              >
                                {sc}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Global Toggle Switch */}
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleGlobal(feat, isGloballyOn)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isGloballyOn ? 'bg-[var(--brand-electric)]' : 'bg-stone-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isGloballyOn ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Emergency Kill Controls */}
                        <td className="py-4 px-5 text-right">
                          {feat.isKillSwitchable ? (
                            <button
                              onClick={() => setKillModalFeature(feat)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 transition-all flex items-center gap-1 ml-auto cursor-pointer"
                              title="Trigger immediate Emergency Kill Switch"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              <span>Emergency Kill</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-400 font-medium italic">
                              Immutable Base
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSTITUTE SIMULATOR & PRECEDENCE ENGINE */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6">
          <div className="paper-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-paper)] pb-4">
              <div>
                <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
                  Deterministic Feature Precedence Evaluator
                </h3>
                <p className="text-xs text-[var(--ink-secondary)] font-['Raleway']">
                  Simulate live resolution order: Platform Flags → Plan Entitlements → Institute Overrides → RBAC Permissions → Quotas.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-['Raleway'] text-stone-700">Simulate Institute:</span>
                <select
                  value={selectedInstituteId}
                  onChange={(e) => setSelectedInstituteId(e.target.value)}
                  className="select-paper text-xs"
                >
                  <option value="inst_apex_academy">Apex IIT & Medical Academy (GROWTH)</option>
                  <option value="inst_kota_elite">Elite Kota Repeaters (PRO)</option>
                  <option value="inst_starter_classes">Basic Tuition Centre (STARTER)</option>
                  <option value="inst_global_schools">Global Heritage Foundation (ENTERPRISE)</option>
                </select>
              </div>
            </div>

            {/* Matrix of Effective Feature States */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {features.map((feat) => {
                const effective = effectiveFeatures?.evaluatedFeatures?.[feat.key];
                const status = effective?.status || 'ACTIVE';
                const isAvailable = effective?.isAvailable ?? true;

                return (
                  <div
                    key={feat.key}
                    className={`p-4 rounded-xl border transition-all ${
                      status === 'ACTIVE'
                        ? 'bg-white border-emerald-200 shadow-sm'
                        : status === 'PLAN_RESTRICTED'
                        ? 'bg-amber-50/50 border-amber-300'
                        : status === 'EMERGENCY_KILLED'
                        ? 'bg-rose-50 border-rose-300'
                        : 'bg-stone-50 border-stone-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-[var(--ink-primary)]">
                        {feat.name}
                      </span>
                      <span
                        className={`text-[9px] font-['Inter'] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'PLAN_RESTRICTED'
                            ? 'bg-amber-100 text-amber-800'
                            : status === 'EMERGENCY_KILLED'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="font-mono text-[10px] text-[var(--brand-electric)] mb-2">
                      {feat.key}
                    </p>

                    <div className="text-[11px] text-[var(--ink-secondary)] font-['Raleway'] space-y-1">
                      {effective?.reason ? (
                        <p className="italic text-stone-600">
                          {effective.reason}
                        </p>
                      ) : (
                        <p className="text-emerald-700 font-semibold">
                          ✓ Permitted by platform, {effectiveFeatures?.plan} plan, and institute policy.
                        </p>
                      )}

                      {effective?.quota && (
                        <div className="pt-2 border-t border-black/5 text-[10px] font-['Inter'] text-stone-500 flex justify-between">
                          <span>Usage: {effective.quota.used} used</span>
                          <span>Limit: {effective.quota.limit ?? 'Unlimited'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION PLAN MATRIX */}
      {activeSubTab === 'plans' && (
        <div className="paper-card overflow-hidden">
          <div className="p-5 border-b border-[var(--border-paper)] bg-[var(--bg-paper-warm)]">
            <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
              Subscription Plan Entitlements & Packaging
            </h3>
            <p className="text-xs text-[var(--ink-secondary)] font-['Raleway']">
              Commercial packaging tiers. Features excluded from a plan cannot be enabled by an institute without a contract upgrade.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-paper)] bg-stone-50 text-[var(--ink-secondary)] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5">Feature / Capability</th>
                  <th className="py-3 px-4 text-center">STARTER</th>
                  <th className="py-3 px-4 text-center">GROWTH</th>
                  <th className="py-3 px-4 text-center">PRO</th>
                  <th className="py-3 px-4 text-center">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-paper)] font-['Raleway']">
                {features.map((feat) => {
                  const starter = feat.defaultQuotaByPlan?.STARTER;
                  const growth = feat.defaultQuotaByPlan?.GROWTH;
                  const pro = feat.defaultQuotaByPlan?.PRO;
                  const ent = feat.defaultQuotaByPlan?.ENTERPRISE;

                  return (
                    <tr key={feat.key} className="hover:bg-amber-50/20 transition">
                      <td className="py-3 px-5">
                        <span className="font-bold text-xs text-[var(--ink-primary)]">{feat.name}</span>
                        <span className="block font-mono text-[10px] text-[var(--brand-electric)]">{feat.key}</span>
                      </td>

                      {/* STARTER */}
                      <td className="py-3 px-4 text-center font-['Inter'] font-semibold">
                        {starter === 0 ? (
                          <span className="text-stone-300">✕</span>
                        ) : (
                          <span className="text-emerald-700">✓ {starter ? `(${starter})` : ''}</span>
                        )}
                      </td>

                      {/* GROWTH */}
                      <td className="py-3 px-4 text-center font-['Inter'] font-semibold">
                        {growth === 0 ? (
                          <span className="text-stone-300">✕</span>
                        ) : (
                          <span className="text-emerald-700">✓ {growth ? `(${growth})` : ''}</span>
                        )}
                      </td>

                      {/* PRO */}
                      <td className="py-3 px-4 text-center font-['Inter'] font-semibold">
                        {pro === 0 ? (
                          <span className="text-stone-300">✕</span>
                        ) : (
                          <span className="text-emerald-700">✓ {pro ? `(${pro})` : 'Unlimited'}</span>
                        )}
                      </td>

                      {/* ENTERPRISE */}
                      <td className="py-3 px-4 text-center font-['Inter'] font-semibold">
                        <span className="text-emerald-700">✓ Unlimited</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL & LOGS */}
      {activeSubTab === 'audit' && (
        <div className="paper-card overflow-hidden">
          <div className="p-5 border-b border-[var(--border-paper)] bg-[var(--bg-paper-warm)] flex items-center justify-between">
            <div>
              <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
                Authoritative Feature Audit Trail
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] font-['Raleway']">
                Immutable record of administrative flag toggles, emergency kill events, quota updates, and institute overrides.
              </p>
            </div>
            <span className="badge-code font-['Inter']">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-paper)] bg-stone-50 text-[var(--ink-secondary)] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5 w-40">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Feature Key</th>
                  <th className="py-3 px-4">Scope & Target</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-5">Reason / Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-paper)] font-['Raleway']">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No administrative audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/20 transition">
                      <td className="py-3 px-5 font-['Inter'] text-[11px] text-stone-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-['Inter'] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            log.action === 'EMERGENCY_KILL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : log.action === 'GLOBAL_TOGGLE'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[var(--brand-electric)]">
                        {log.featureKey}
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        <span className="font-bold">{log.scope}</span>
                        {log.targetInstituteId && (
                          <span className="block text-[10px] font-mono text-stone-400">
                            {log.targetInstituteId}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-medium text-stone-800">
                        {log.actorEmail}
                      </td>

                      <td className="py-3 px-5 text-stone-600 italic">
                        {log.reason || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMERGENCY KILL SWITCH CONFIRMATION MODAL */}
      {killModalFeature && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-rose-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Playfair_Display'] font-bold text-lg text-rose-900">
                  Execute Emergency Kill Switch
                </h3>
                <p className="font-mono text-xs text-rose-700">
                  Target: {killModalFeature.name} ({killModalFeature.key})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-['Raleway'] text-rose-900 space-y-1.5">
              <p className="font-bold">CRITICAL PLATFORM IMPACT:</p>
              <p>• This action immediately disables <strong>{killModalFeature.name}</strong> for ALL customer institutes, regardless of tier or contract.</p>
              <p>• API requests targeting this feature will instantly fail-closed with 403 Forbidden.</p>
              <p>• No customer records or durable data will be corrupted or deleted.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 font-['Raleway']">
                Incident Justification / Audit Reason (Required) *
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Critical upstream gateway outage; security advisory CVE-2026-X mitigative isolation."
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                className="input-paper w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-800 mb-1 font-['Raleway']">
                Type <span className="font-mono bg-rose-100 px-1 rounded border border-rose-300">CONFIRM_KILL</span> to execute:
              </label>
              <input
                type="text"
                placeholder="CONFIRM_KILL"
                value={killConfirmCode}
                onChange={(e) => setKillConfirmCode(e.target.value)}
                className="input-paper w-full font-mono font-bold text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setKillModalFeature(null);
                  setKillReason('');
                  setKillConfirmCode('');
                }}
                className="btn-secondary"
              >
                Abort
              </button>
              <button
                type="button"
                disabled={killConfirmCode !== 'CONFIRM_KILL' || isKilling}
                onClick={handleExecuteKillSwitch}
                className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-['Raleway'] font-bold text-xs shadow-md disabled:opacity-40 cursor-pointer"
              >
                {isKilling ? 'Killing Feature...' : 'Execute Emergency Kill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

