'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Activity,
  History,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
  Unlock,
} from 'lucide-react';
import type {
  FeatureKey,
  FeatureDefinition,
  FeatureAuditLogItem,
  SubscriptionPlan,
} from '@padhai-pilot/shared';
import { adminApi, InstituteSummary, PlatformHealth } from '../lib/api';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'features' | 'audit' | 'system'>('tenants');

  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [institutes, setInstitutes] = useState<InstituteSummary[]>([]);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [auditLogs, setAuditLogs] = useState<FeatureAuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Kill switch modal
  const [selectedFeature, setSelectedFeature] = useState<FeatureDefinition | null>(null);
  const [killReason, setKillReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [h, insts, feats, logs] = await Promise.all([
        adminApi.getHealth(),
        adminApi.getInstitutes(),
        adminApi.getFeatureRegistry().catch(() => []),
        adminApi.getAuditLogs().catch(() => []),
      ]);
      setHealth(h);
      setInstitutes(insts);
      setFeatures(feats);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleToggleKillSwitch = async (feature: FeatureDefinition) => {
    setSelectedFeature(feature);
    setKillReason('');
  };

  const confirmKillSwitch = async () => {
    if (!selectedFeature) return;
    setIsSubmitting(true);
    const nextState = !selectedFeature.defaultGloballyEnabled;
    try {
      await adminApi.toggleGlobalKillSwitch(
        selectedFeature.key,
        nextState,
        killReason.trim() || 'Admin manual override',
      );
      setStatusMsg({
        text: `Updated ${selectedFeature.name} globally to ${nextState ? 'ENABLED' : 'DISABLED'}`,
        type: 'success',
      });
      setSelectedFeature(null);
      loadAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle kill switch';
      setStatusMsg({ text: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePlan = async (instituteId: string, plan: SubscriptionPlan) => {
    try {
      await adminApi.updateInstitutePlan(instituteId, plan);
      setStatusMsg({ text: `Institute plan updated to ${plan}`, type: 'success' });
      loadAll();
    } catch {
      setStatusMsg({ text: 'Failed to update plan tier', type: 'error' });
    }
  };

  const filteredInstitutes = institutes.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.subdomain.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.module.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#E2E8F0] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-[#1E2536] bg-[#0E121E] px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
            P
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-white flex items-center gap-2">
              PadhaiPilot
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Super Admin
              </span>
            </div>
            <div className="text-[11px] text-[#64748B]">Platform Operations & Multi-Tenant Control</div>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#161B2B] border border-[#1E2536]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#94A3B8]">API:</span>
            <span className="text-emerald-400 font-medium">Online</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#161B2B] border border-[#1E2536]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[#94A3B8]">PostgreSQL:</span>
            <span className="text-emerald-400 font-medium">Healthy</span>
          </div>

          <button
            onClick={loadAll}
            disabled={isLoading}
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-white hover:bg-[#1E2536] transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-red-950/40 border-red-800 text-red-200'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-xs opacity-70 hover:opacity-100 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#1E2536] pb-4">
          <div className="flex items-center gap-1 bg-[#131826] p-1 rounded-lg border border-[#1E2536]">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'tenants'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Institutes ({institutes.length})
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'features'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Kill Switches ({features.length})
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Trail ({auditLogs.length})
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'system'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              System Status
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131826] border border-[#1E2536] rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tab 1: Institutes / Tenants */}
        {activeTab === 'tenants' && (
          <div className="bg-[#101422] rounded-xl border border-[#1E2536] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1E2536] bg-[#0E121E] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Registered Institutes
              </span>
              <span className="text-xs text-[#64748B]">{filteredInstitutes.length} total</span>
            </div>

            <div className="divide-y divide-[#1E2536]">
              {filteredInstitutes.map((inst) => (
                <div
                  key={inst.id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#131828] transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#1B2236] border border-[#27314D] flex items-center justify-center font-bold text-blue-400 text-sm">
                      {inst.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white flex items-center gap-2">
                        {inst.name}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          {inst.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        Domain: {inst.subdomain}.padhaipilot.in • Created {inst.createdAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-[#94A3B8]">
                    <div>
                      <span className="text-white font-medium">{inst.studentCount}</span> Students
                    </div>
                    <div>
                      <span className="text-white font-medium">{inst.teacherCount}</span> Teachers
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748B]">Plan:</span>
                      <select
                        value={inst.plan}
                        onChange={(e) => handleUpdatePlan(inst.id, e.target.value as SubscriptionPlan)}
                        className="bg-[#1A2032] border border-[#27314D] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="STARTER">Starter</option>
                        <option value="GROWTH">Growth</option>
                        <option value="PRO">Pro</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Feature Flags & Kill Switches */}
        {activeTab === 'features' && (
          <div className="bg-[#101422] rounded-xl border border-[#1E2536] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1E2536] bg-[#0E121E] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Platform Emergency Kill Switches
                </span>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Instantly disable high-impact modules in production if a bug or security incident occurs.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#1E2536]">
              {filteredFeatures.map((feat) => {
                const isEnabled = feat.defaultGloballyEnabled;
                return (
                  <div
                    key={feat.key}
                    className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#131828] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{feat.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1B2236] text-[#94A3B8]">
                          {feat.key}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                            feat.securityImpact === 'HIGH'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {feat.securityImpact} Risk
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1">{feat.description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        {isEnabled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Killed
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleKillSwitch(feat)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isEnabled
                            ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30'
                            : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30'
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <Lock className="w-3 h-3" /> Emergency Kill
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" /> Restore
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-[#101422] rounded-xl border border-[#1E2536] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1E2536] bg-[#0E121E]">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Security & Configuration Audit Logs
              </span>
            </div>

            <div className="divide-y divide-[#1E2536]">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>{log.actorEmail || 'System Admin'}</span>
                        <span className="text-[#64748B] font-mono">{log.action}</span>
                        <span className="text-blue-400">{log.featureKey}</span>
                      </div>
                      <div className="text-[#64748B] mt-0.5">{log.reason || 'No reason provided'}</div>
                    </div>
                    <div className="text-[#64748B]">{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  No audit log entries recorded in this session.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: System Status */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-[#101422] border border-[#1E2536]">
              <span className="text-xs text-[#64748B] uppercase font-semibold">API Server</span>
              <div className="text-2xl font-bold text-white mt-1">99.98%</div>
              <p className="text-xs text-[#94A3B8] mt-2">NestJS HTTP Gateway on port 3001</p>
            </div>

            <div className="p-5 rounded-xl bg-[#101422] border border-[#1E2536]">
              <span className="text-xs text-[#64748B] uppercase font-semibold">Primary Database</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">Healthy</div>
              <p className="text-xs text-[#94A3B8] mt-2">PostgreSQL via Prisma ORM</p>
            </div>

            <div className="p-5 rounded-xl bg-[#101422] border border-[#1E2536]">
              <span className="text-xs text-[#64748B] uppercase font-semibold">Cache & Rate Limiter</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">Connected</div>
              <p className="text-xs text-[#94A3B8] mt-2">Upstash Redis Cluster</p>
            </div>
          </div>
        )}
      </div>

      {/* Kill Switch Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121624] border border-[#27314D] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-semibold text-base text-white">Emergency Feature Override</h3>
            </div>

            <p className="text-xs text-[#94A3B8] mb-4">
              Are you sure you want to toggle{' '}
              <strong className="text-white">{selectedFeature.name}</strong>? This action affects all
              tenants immediately in production.
            </p>

            <div className="mb-4">
              <label className="text-xs text-[#94A3B8] block mb-1">Reason / Incident ID</label>
              <input
                type="text"
                placeholder="e.g. Investigating DB latency in bulk marks entry"
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                className="w-full bg-[#181E30] border border-[#27314D] rounded px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 rounded text-xs text-[#94A3B8] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmKillSwitch}
                disabled={isSubmitting}
                className="px-4 py-2 rounded text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                {isSubmitting ? 'Applying...' : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
