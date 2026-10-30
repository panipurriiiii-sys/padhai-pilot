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
  Plus,
  Globe,
  Database,
  Radio,
  Layers,
  Sparkles,
  Server,
  Zap,
  LogOut,
  Mail,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import type {
  FeatureKey,
  FeatureDefinition,
  SubscriptionPlan,
} from '@padhai-pilot/shared';
import {
  adminApi,
  InstituteSummary,
  PlatformHealth,
  PlatformAuditItem,
  PlatformAnnouncementItem,
} from '../lib/api';

export default function AdminPlatformOwnerDashboard() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authEmail, setAuthEmail] = useState('super@padhaipilot.com');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'tenants' | 'features' | 'plans' | 'whitelabel' | 'audit' | 'system'
  >('tenants');

  // Platform Data
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [institutes, setInstitutes] = useState<InstituteSummary[]>([]);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditItem[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals & Overlays
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newInst, setNewInst] = useState({
    name: '',
    subdomain: '',
    plan: 'GROWTH' as SubscriptionPlan,
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    customDomain: '',
  });

  // Emergency Kill Switch Modal
  const [selectedFeature, setSelectedFeature] = useState<FeatureDefinition | null>(null);
  const [killReason, setKillReason] = useState('');
  const [killConfirmCode, setKillConfirmCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Announcement Form Modal
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnounce, setNewAnnounce] = useState({
    title: '',
    message: '',
    severity: 'info' as 'info' | 'warning' | 'critical',
    targetAudience: 'ALL' as 'ALL' | 'TEACHERS' | 'STUDENTS',
  });

  // Check login on mount
  useEffect(() => {
    const existing = adminApi.getCurrentUser();
    if (existing && existing.role === 'SUPER_ADMIN') {
      setCurrentUser(existing);
    }
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [h, insts, feats, logs, anns] = await Promise.all([
        adminApi.getHealth(),
        adminApi.getInstitutes(),
        adminApi.getFeatureRegistry().catch(() => []),
        adminApi.getAuditLogs().catch(() => []),
        adminApi.getAnnouncements().catch(() => []),
      ]);
      setHealth(h);
      setInstitutes(insts);
      setFeatures(feats);
      setAuditLogs(logs);
      setAnnouncements(anns);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAll();
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const res = await adminApi.login(authEmail, authPassword);
      setCurrentUser(res.user);
      setStatusMsg({ text: `Authenticated as Platform Super Admin (${res.user.email})`, type: 'success' });
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    adminApi.clearToken();
    setCurrentUser(null);
  };

  const handleOnboardTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInst.name || !newInst.subdomain || !newInst.ownerEmail) {
      setStatusMsg({ text: 'Please fill in institute name, subdomain, and owner email.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await adminApi.createInstitute(newInst);
      setStatusMsg({ text: `Tuition Institute "${newInst.name}" onboarded successfully!`, type: 'success' });
      setShowOnboardModal(false);
      setNewInst({
        name: '',
        subdomain: '',
        plan: 'GROWTH',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        customDomain: '',
      });
      loadAll();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to onboard institute.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (inst: InstituteSummary) => {
    const nextStatus = inst.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminApi.updateInstituteStatus(
        inst.id,
        nextStatus,
        `Status set to ${nextStatus} by Platform Owner`,
      );
      setStatusMsg({ text: `Institute "${inst.name}" is now ${nextStatus}.`, type: 'success' });
      loadAll();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to update status', type: 'error' });
    }
  };

  const handleUpdatePlan = async (instituteId: string, plan: SubscriptionPlan) => {
    try {
      await adminApi.updateInstitutePlan(instituteId, plan, 'Manual plan change by Platform Owner');
      setStatusMsg({ text: `Subscription plan updated to ${plan}`, type: 'success' });
      loadAll();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to update plan', type: 'error' });
    }
  };

  const confirmKillSwitch = async () => {
    if (!selectedFeature) return;
    setIsSubmitting(true);
    const nextState = !selectedFeature.defaultGloballyEnabled;
    try {
      await adminApi.toggleGlobalKillSwitch(
        selectedFeature.key,
        nextState,
        killReason.trim() || 'Platform Owner manual override',
        killConfirmCode,
      );
      setStatusMsg({
        text: `Updated ${selectedFeature.name} globally to ${nextState ? 'ENABLED' : 'DISABLED'}`,
        type: 'success',
      });
      setSelectedFeature(null);
      setKillConfirmCode('');
      setKillReason('');
      loadAll();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to toggle kill switch', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounce.title || !newAnnounce.message) return;
    setIsSubmitting(true);
    try {
      await adminApi.createAnnouncement(newAnnounce);
      setStatusMsg({ text: 'Broadcast announcement successfully published!', type: 'success' });
      setShowAnnounceModal(false);
      setNewAnnounce({
        title: '',
        message: '',
        severity: 'info',
        targetAudience: 'ALL',
      });
      loadAll();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to post announcement', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Security Gate (Login screen when unauthenticated)
  // --------------------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#07090E] text-[#E2E8F0] flex flex-col justify-center items-center px-4 font-sans select-none relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full bg-[#0D111A] border border-[#1E2536] rounded-2xl p-8 shadow-2xl relative z-10">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center font-['Playfair_Display'] font-black text-2xl text-white shadow-lg shadow-blue-500/20 mb-3">
              P
            </div>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold tracking-tight text-white">
              PadhaiPilot Platform Control
            </h1>
            <p className="text-xs font-['Raleway'] text-[#94A3B8] mt-1">
              Exclusive Console for the Platform Owner & Internal SREs
            </p>
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/40 border border-red-800/60 text-red-400 text-[11px] font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              Public Registration Prohibited
            </div>
          </div>

          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-['Raleway'] font-semibold text-[#94A3B8] mb-1.5">
                Platform Super Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#131826] border border-[#1E2536] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="super@padhaipilot.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-['Raleway'] font-semibold text-[#94A3B8] mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#131826] border border-[#1E2536] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-['Raleway'] font-bold tracking-wide transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Root Credentials...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Authenticate into Platform HQ
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill button */}
          <div className="mt-6 pt-5 border-t border-[#1E2536] text-center">
            <button
              onClick={() => {
                setAuthEmail('super@padhaipilot.com');
                setAuthPassword('password123');
              }}
              className="text-[11px] text-[#64748B] hover:text-blue-400 transition-colors inline-flex items-center gap-1 font-mono"
            >
              <span>Use standard root credential: super@padhaipilot.com</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered lists
  const filteredInstitutes = institutes.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.customDomain && i.customDomain.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.module.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#07090E] text-[#E2E8F0] flex flex-col font-sans select-none">
      {/* Top Root Command Bar */}
      <header className="h-16 border-b border-[#1E2536] bg-[#0D111A] px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center font-['Playfair_Display'] font-black text-white text-lg shadow-sm">
            P
          </div>
          <div>
            <div className="font-['Playfair_Display'] font-bold text-sm tracking-tight text-white flex items-center gap-2">
              PadhaiPilot Platform Owner
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                ROOT CONTROL PLANE
              </span>
            </div>
            <div className="text-[11px] font-['Raleway'] text-[#64748B]">
              Logged in as: <span className="text-white font-mono">{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Live Gauges & Controls */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131826] border border-[#1E2536]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#94A3B8]">API:</span>
            <span className="text-emerald-400 font-semibold font-mono">99.98% OK</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131826] border border-[#1E2536]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[#94A3B8]">PostgreSQL:</span>
            <span className="text-emerald-400 font-semibold font-mono">Connected (4ms)</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131826] border border-[#1E2536]">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[#94A3B8]">Tenants:</span>
            <span className="text-blue-400 font-semibold font-mono">{institutes.length}</span>
          </div>

          <button
            onClick={loadAll}
            disabled={isLoading}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1E2536] transition-colors border border-transparent hover:border-[#2D3748]"
            title="Refresh All State"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 transition-colors text-xs font-['Raleway'] font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Status Toast Alert */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border shadow-lg ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-red-950/40 border-red-800 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-xs opacity-70 hover:opacity-100 ml-4 font-mono underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Selection Bar & Universal Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#1E2536] pb-4">
          <div className="flex items-center gap-1.5 bg-[#0D111A] p-1.5 rounded-2xl border border-[#1E2536] overflow-x-auto">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-3.5 py-2 text-xs font-['Raleway'] font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'tenants'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#131826]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Institutes & Tenants ({institutes.length})
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`px-3.5 py-2 text-xs font-['Raleway'] font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'features'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#131826]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Kill Switches ({features.length})
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3.5 py-2 text-xs font-['Raleway'] font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'plans'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#131826]'
              }`}
            >
              <Layers className="w-4 h-4" />
              Plans & Entitlements
            </button>

            <button
              onClick={() => setActiveTab('whitelabel')}
              className={`px-3.5 py-2 text-xs font-['Raleway'] font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'whitelabel'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#131826]'
              }`}
            >
              <Globe className="w-4 h-4" />
              White-Label & Domains
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 text-xs font-['Raleway'] font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#131826]'
              }`}
            >
              <History className="w-4 h-4" />
              Platform Audit ({auditLogs.length})
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`px-3.5 py-2 text-xs font-['Raleway'] font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'system'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#131826]'
              }`}
            >
              <Activity className="w-4 h-4" />
              System Status
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search institutes, features, subdomains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D111A] border border-[#1E2536] rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>

        {/* ================================================================== */}
        {/* TAB 1: INSTITUTES & TENANT MANAGEMENT */}
        {/* ================================================================== */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-white">
                  Registered Tuition Institutes
                </h2>
                <p className="text-xs font-['Raleway'] text-[#94A3B8] mt-0.5">
                  Manage all onboarded tuition classes, subscription plans, quotas, and account status.
                </p>
              </div>

              <button
                onClick={() => setShowOnboardModal(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-['Raleway'] font-bold tracking-wide transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Onboard New Institute
              </button>
            </div>

            {/* Tenants Grid/List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInstitutes.map((inst) => {
                const isSuspended = inst.status === 'SUSPENDED';
                return (
                  <div
                    key={inst.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isSuspended
                        ? 'bg-[#150F14] border-red-900/50'
                        : 'bg-[#0D111A] border-[#1E2536] hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-['Playfair_Display'] font-bold text-base text-white">
                            {inst.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${
                              inst.status === 'ACTIVE'
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                : 'bg-red-950/60 text-red-400 border-red-800'
                            }`}
                          >
                            {inst.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#64748B] mt-0.5">
                          {inst.subdomain}.padhaipilot.com
                          {inst.customDomain && (
                            <span className="text-blue-400 ml-2">({inst.customDomain})</span>
                          )}
                        </p>
                      </div>

                      <select
                        value={inst.plan}
                        onChange={(e) => handleUpdatePlan(inst.id, e.target.value as SubscriptionPlan)}
                        className="bg-[#131826] border border-[#1E2536] rounded-lg px-2.5 py-1 text-xs font-['Raleway'] font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="STARTER">STARTER</option>
                        <option value="GROWTH">GROWTH</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </div>

                    {/* Institute Metadata Badges */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#1E2536] text-xs font-['Inter'] text-[#94A3B8]">
                      <div>
                        <span className="text-[10px] uppercase font-['Raleway'] font-bold text-[#64748B] block">
                          Students
                        </span>
                        <span className="text-sm font-bold text-white">{inst.studentCount}</span>
                        <span className="text-[10px] text-[#64748B]"> / {inst.maxStudentsLimit || 500}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-['Raleway'] font-bold text-[#64748B] block">
                          Faculty
                        </span>
                        <span className="text-sm font-bold text-white">{inst.teacherCount}</span>
                        <span className="text-[10px] text-[#64748B]"> / {inst.maxTeachersLimit || 25}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-['Raleway'] font-bold text-[#64748B] block">
                          White Label
                        </span>
                        <span className={`text-xs font-bold ${inst.isWhiteLabel ? 'text-emerald-400' : 'text-[#64748B]'}`}>
                          {inst.isWhiteLabel ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="mt-3 flex items-center justify-between text-xs font-['Raleway']">
                      <div className="text-[11px] text-[#64748B]">
                        Owner: <span className="text-white">{inst.ownerName}</span> ({inst.ownerEmail})
                      </div>
                      <button
                        onClick={() => handleToggleStatus(inst)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          isSuspended
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80'
                        }`}
                      >
                        {isSuspended ? 'Activate Tenant' : 'Suspend Tenant'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: GLOBAL FEATURE FLAGS & EMERGENCY KILL SWITCHES */}
        {/* ================================================================== */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-['Playfair_Display'] text-xl font-bold text-white">
                Platform-Wide Feature Flags & Emergency Switches
              </h2>
              <p className="text-xs font-['Raleway'] text-[#94A3B8] mt-0.5">
                Immediate global circuit-breakers. Disabling any feature here instantly cascades across all institutes within 500ms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeatures.map((feat) => {
                const isEnabled = feat.defaultGloballyEnabled;
                return (
                  <div
                    key={feat.key}
                    className={`p-4 rounded-2xl border transition-all ${
                      isEnabled
                        ? 'bg-[#0D111A] border-[#1E2536]'
                        : 'bg-red-950/30 border-red-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-['Playfair_Display'] font-bold text-sm text-white">
                            {feat.name}
                          </h3>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#161B2B] text-[#94A3B8] border border-[#1E2536]">
                            {feat.module}
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-1 font-['Raleway']">{feat.description}</p>
                        <div className="text-[11px] font-mono text-[#64748B] mt-2">
                          Key: {feat.key} | Impact: {feat.securityImpact}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedFeature(feat);
                          setKillReason('');
                          setKillConfirmCode('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-['Raleway'] font-bold shrink-0 transition-colors flex items-center gap-1.5 ${
                          isEnabled
                            ? 'bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Kill Switch
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Restore
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

        {/* ================================================================== */}
        {/* TAB 3: PLANS & ENTITLEMENTS */}
        {/* ================================================================== */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-['Playfair_Display'] text-xl font-bold text-white">
                Subscription Tiers & Quota Architecture
              </h2>
              <p className="text-xs font-['Raleway'] text-[#94A3B8] mt-0.5">
                Centralized tier matrix enforced across all tenant API requests.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  tier: 'STARTER',
                  price: '₹1,999 / mo',
                  desc: 'Small tuition coaching centres up to 100 students.',
                  students: '100 Max',
                  faculty: '5 Max',
                  storage: '10 GB Media Vault',
                  whiteLabel: 'PadhaiPilot Branding',
                  cbt: 'Basic CBT Tests',
                  dedicatedDb: 'Shared Multi-Tenant DB',
                },
                {
                  tier: 'GROWTH',
                  price: '₹4,999 / mo',
                  desc: 'Growing tuition centres & multiple batch setups.',
                  students: '500 Max',
                  faculty: '25 Max',
                  storage: '50 GB Media Vault',
                  whiteLabel: 'Subdomain + Custom Header',
                  cbt: 'Bulk Marks & CBT Engine',
                  dedicatedDb: 'Shared Multi-Tenant DB',
                  highlight: true,
                },
                {
                  tier: 'PRO',
                  price: '₹9,999 / mo',
                  desc: 'Large coaching academies with full custom branding.',
                  students: '2,500 Max',
                  faculty: '100 Max',
                  storage: '250 GB Media Vault',
                  whiteLabel: 'Full Custom Domain & Logo',
                  cbt: 'AI-Scored CBT + Bulk Attendance',
                  dedicatedDb: 'Isolated Schema + Read Replica',
                },
                {
                  tier: 'ENTERPRISE',
                  price: 'Custom / Dedicated',
                  desc: 'State-wide education networks & university prep franchises.',
                  students: 'Unlimited',
                  faculty: 'Unlimited',
                  storage: '1 TB Dedicated Media Vault',
                  whiteLabel: '100% White-Label + Dedicated App',
                  cbt: 'Custom Anti-Cheating & Proctored Tests',
                  dedicatedDb: 'Dedicated PostgreSQL Instance',
                },
              ].map((plan, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    plan.highlight
                      ? 'bg-[#0E1628] border-blue-500 shadow-xl shadow-blue-500/10'
                      : 'bg-[#0D111A] border-[#1E2536]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-['Playfair_Display'] font-black text-lg text-white">
                        {plan.tier}
                      </span>
                      {plan.highlight && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-base font-bold text-blue-400 mb-2">{plan.price}</div>
                    <p className="text-xs font-['Raleway'] text-[#94A3B8] mb-4">{plan.desc}</p>

                    <div className="space-y-2 border-t border-[#1E2536] pt-3 text-xs font-['Inter'] text-[#CBD5E1]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Capacity:</span>
                        <span className="font-bold">{plan.students}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Teachers:</span>
                        <span className="font-bold">{plan.faculty}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Storage:</span>
                        <span className="font-bold">{plan.storage}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Branding:</span>
                        <span className="font-bold">{plan.whiteLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Database:</span>
                        <span className="font-bold">{plan.dedicatedDb}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: WHITE-LABEL & CUSTOM DOMAINS */}
        {/* ================================================================== */}
        {activeTab === 'whitelabel' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-['Playfair_Display'] text-xl font-bold text-white">
                White-Label & Dedicated Routing
              </h2>
              <p className="text-xs font-['Raleway'] text-[#94A3B8] mt-0.5">
                Tuition institute custom domain mappings, SSL certifications, and dedicated deployment settings.
              </p>
            </div>

            <div className="bg-[#0D111A] border border-[#1E2536] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-['Inter']">
                <thead className="bg-[#131826] text-[#94A3B8] font-['Raleway'] font-bold uppercase tracking-wider text-[11px] border-b border-[#1E2536]">
                  <tr>
                    <th className="py-3 px-4">Institute</th>
                    <th className="py-3 px-4">Subdomain</th>
                    <th className="py-3 px-4">Custom FQDN</th>
                    <th className="py-3 px-4">SSL & Route Status</th>
                    <th className="py-3 px-4">Dedicated DB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2536] text-[#CBD5E1]">
                  {institutes.map((inst) => (
                    <tr key={inst.id} className="hover:bg-[#131826]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{inst.name}</td>
                      <td className="py-3.5 px-4 font-mono text-[#94A3B8]">{inst.subdomain}.padhaipilot.com</td>
                      <td className="py-3.5 px-4 font-mono text-blue-400">
                        {inst.customDomain || <span className="text-[#64748B] italic">None configured</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Routed (Edge TLS)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            inst.isDedicatedDb ? 'text-emerald-400' : 'text-[#64748B]'
                          }`}
                        >
                          {inst.isDedicatedDb ? 'Dedicated Instance' : 'Shared Multi-Tenant'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: PLATFORM AUDIT TRAIL */}
        {/* ================================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-['Playfair_Display'] text-xl font-bold text-white">
                Platform Security & Operations Audit Trail
              </h2>
              <p className="text-xs font-['Raleway'] text-[#94A3B8] mt-0.5">
                Immutable chronological log of all super-admin modifications, plan upgrades, and emergency switches.
              </p>
            </div>

            <div className="bg-[#0D111A] border border-[#1E2536] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-['Inter']">
                <thead className="bg-[#131826] text-[#94A3B8] font-['Raleway'] font-bold uppercase tracking-wider text-[11px] border-b border-[#1E2536]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2536] text-[#CBD5E1]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#131826]/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#64748B] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">{log.actorEmail}</td>
                      <td className="py-3 px-4 font-bold text-blue-400">{log.action}</td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8]">{log.targetId || '-'}</td>
                      <td className="py-3 px-4 text-xs font-['Raleway'] max-w-xs truncate">{log.details}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 6: SYSTEM HEALTH & GLOBAL ANNOUNCEMENTS */}
        {/* ================================================================== */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-white">
                  System Health & Platform Announcements
                </h2>
                <p className="text-xs font-['Raleway'] text-[#94A3B8] mt-0.5">
                  Real-time infrastructure performance and global system-wide maintenance alerts.
                </p>
              </div>

              <button
                onClick={() => setShowAnnounceModal(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-['Raleway'] font-bold tracking-wide transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 shrink-0"
              >
                <Radio className="w-4 h-4" />
                Post Global Announcement
              </button>
            </div>

            {/* Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#0D111A] border border-[#1E2536]">
                <span className="text-[10px] uppercase font-['Raleway'] font-bold text-[#64748B] block mb-1">
                  Total Active Students
                </span>
                <span className="font-['Inter'] text-2xl font-bold text-white">{health?.activeStudents || 1457}</span>
                <p className="text-[10px] text-emerald-400 mt-1">Across all registered tenants</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D111A] border border-[#1E2536]">
                <span className="text-[10px] uppercase font-['Raleway'] font-bold text-[#64748B] block mb-1">
                  Active Faculty & Teachers
                </span>
                <span className="font-['Inter'] text-2xl font-bold text-white">{health?.activeTeachers || 58}</span>
                <p className="text-[10px] text-blue-400 mt-1">Conducting active sessions</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D111A] border border-[#1E2536]">
                <span className="text-[10px] uppercase font-['Raleway'] font-bold text-[#64748B] block mb-1">
                  Platform Uptime
                </span>
                <span className="font-['Inter'] text-2xl font-bold text-emerald-400">99.98%</span>
                <p className="text-[10px] text-[#64748B] mt-1 font-mono">
                  {Math.floor((health?.uptimeSeconds || 12450) / 3600)}h operational
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D111A] border border-[#1E2536]">
                <span className="text-[10px] uppercase font-['Raleway'] font-bold text-[#64748B] block mb-1">
                  Global Deployment
                </span>
                <span className="font-['Inter'] text-2xl font-bold text-white">Vercel + Nest</span>
                <p className="text-[10px] text-emerald-400 mt-1 font-mono">Asia-South1 (Mumbai)</p>
              </div>
            </div>

            {/* Announcements List */}
            <div className="bg-[#0D111A] border border-[#1E2536] rounded-2xl p-5">
              <h3 className="font-['Playfair_Display'] font-bold text-base text-white mb-3">
                Active Platform Announcements
              </h3>
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-xl bg-[#131826] border border-[#1E2536] flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Playfair_Display'] font-bold text-sm text-white">
                          {ann.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-blue-950/60 text-blue-400 border border-blue-800">
                          Audience: {ann.targetAudience}
                        </span>
                      </div>
                      <p className="text-xs font-['Raleway'] text-[#94A3B8] mt-1">{ann.message}</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] whitespace-nowrap">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* MODAL: ONBOARD NEW INSTITUTE */}
      {/* ================================================================== */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-[#1E2536] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-white mb-1">
              Onboard Tuition Institute
            </h3>
            <p className="text-xs font-['Raleway'] text-[#94A3B8] mb-5">
              Create a tenant workspace, provision database scope, and assign owner credentials.
            </p>

            <form onSubmit={handleOnboardTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Tuition Institute Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Academy Kota"
                  value={newInst.name}
                  onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                  className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                    Subdomain *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="apex"
                      value={newInst.subdomain}
                      onChange={(e) => setNewInst({ ...newInst, subdomain: e.target.value })}
                      className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={newInst.plan}
                    onChange={(e) => setNewInst({ ...newInst, plan: e.target.value as SubscriptionPlan })}
                    className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="GROWTH">GROWTH</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                    Tuition Owner Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajeshwar Singhania"
                    value={newInst.ownerName}
                    onChange={(e) => setNewInst({ ...newInst, ownerName: e.target.value })}
                    className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                    Owner Email *
                  </label>
                  <input
                    type="email"
                    placeholder="owner@apexacademy.com"
                    value={newInst.ownerEmail}
                    onChange={(e) => setNewInst({ ...newInst, ownerEmail: e.target.value })}
                    className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Custom FQDN Domain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. learn.apexacademy.edu.in"
                  value={newInst.customDomain}
                  onChange={(e) => setNewInst({ ...newInst, customDomain: e.target.value })}
                  className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2536]">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-['Raleway'] text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-['Raleway'] font-bold transition-all"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: EMERGENCY KILL SWITCH CONFIRMATION */}
      {/* ================================================================== */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-red-900/60 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-['Playfair_Display'] text-lg font-bold text-white">
                Emergency Circuit Breaker
              </h3>
            </div>

            <p className="text-xs font-['Raleway'] text-[#94A3B8] mb-4">
              You are modifying the global availability of:
              <strong className="text-white block mt-1 font-mono">{selectedFeature.name} ({selectedFeature.key})</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Reason for Emergency Action *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Memory anomaly or 3rd party outage"
                  value={killReason}
                  onChange={(e) => setKillReason(e.target.value)}
                  className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Type <span className="font-mono text-red-400 font-bold">KILL_CONFIRMED</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="KILL_CONFIRMED"
                  value={killConfirmCode}
                  onChange={(e) => setKillConfirmCode(e.target.value)}
                  className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2536]">
                <button
                  type="button"
                  onClick={() => setSelectedFeature(null)}
                  className="px-4 py-2 rounded-xl text-xs font-['Raleway'] text-[#94A3B8] hover:text-white"
                >
                  Abort
                </button>
                <button
                  type="button"
                  onClick={confirmKillSwitch}
                  disabled={isSubmitting || killConfirmCode !== 'KILL_CONFIRMED'}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-['Raleway'] font-bold transition-all"
                >
                  {isSubmitting ? 'Executing Override...' : 'Execute Circuit Breaker'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: POST PLATFORM ANNOUNCEMENT */}
      {/* ================================================================== */}
      {showAnnounceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-[#1E2536] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-white mb-1">
              Publish Broadcast Announcement
            </h3>
            <p className="text-xs font-['Raleway'] text-[#94A3B8] mb-5">
              Broadcast high-priority notifications to all tuition portals and mobile apps.
            </p>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Platform Maintenance Notice"
                  value={newAnnounce.title}
                  onChange={(e) => setNewAnnounce({ ...newAnnounce, title: e.target.value })}
                  className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed message regarding changes or maintenance..."
                  value={newAnnounce.message}
                  onChange={(e) => setNewAnnounce({ ...newAnnounce, message: e.target.value })}
                  className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                    Severity Level
                  </label>
                  <select
                    value={newAnnounce.severity}
                    onChange={(e) => setNewAnnounce({ ...newAnnounce, severity: e.target.value as any })}
                    className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                    Target Audience
                  </label>
                  <select
                    value={newAnnounce.targetAudience}
                    onChange={(e) => setNewAnnounce({ ...newAnnounce, targetAudience: e.target.value as any })}
                    className="w-full bg-[#131826] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  >
                    <option value="ALL">All Users</option>
                    <option value="TEACHERS">Tuition Owners & Teachers Only</option>
                    <option value="STUDENTS">Students Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2536]">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-['Raleway'] text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-['Raleway'] font-bold transition-all"
                >
                  {isSubmitting ? 'Broadcasting...' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
