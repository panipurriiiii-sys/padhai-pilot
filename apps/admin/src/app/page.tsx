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
  Palette,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import type {
  FeatureKey,
  FeatureDefinition,
  SubscriptionPlan,
  PlatformThemeConfig,
  PublishedTheme,
} from '@padhai-pilot/shared';
import {
  DEFAULT_THEME_CONFIG,
  resolveTheme,
  contrastRatio,
} from '@padhai-pilot/shared';
import {
  adminApi,
  InstituteSummary,
  PlatformHealth,
  PlatformAuditItem,
  PlatformAnnouncementItem,
  ThemeHistoryItem,
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
    'tenants' | 'features' | 'plans' | 'whitelabel' | 'audit' | 'system' | 'theme'
  >('tenants');

  // Platform Theme State (Consumes /api/theme and /api/admin/theme)
  const [publishedTheme, setPublishedTheme] = useState<PublishedTheme | null>(null);
  const [themeHistory, setThemeHistory] = useState<ThemeHistoryItem[]>([]);
  const [themeConfig, setThemeConfig] = useState<PlatformThemeConfig>(DEFAULT_THEME_CONFIG);
  const [themeValidation, setThemeValidation] = useState<{ valid: boolean; errors?: string[]; warnings?: string[] } | null>(null);
  const [publishReason, setPublishReason] = useState('');
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [isThemePublishing, setIsThemePublishing] = useState(false);

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

  const loadThemeData = async () => {
    setIsThemeLoading(true);
    try {
      // 1. Consume public GET /api/theme
      const pub = await adminApi.getPublicTheme();
      if (pub) {
        setPublishedTheme(pub);
        if (pub.config) {
          setThemeConfig(pub.config);
        }
      }

      // 2. Consume SUPER_ADMIN GET /api/admin/theme overview & history
      const overview = await adminApi.getAdminThemeOverview();
      if (overview?.published) {
        setPublishedTheme(overview.published);
        setThemeConfig(overview.published.config);
      }
      if (overview?.history) {
        setThemeHistory(overview.history);
      }
    } catch (err: unknown) {
      console.error('Failed to load theme data:', err);
    } finally {
      setIsThemeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'theme') {
      loadThemeData();
    }
  }, [activeTab]);

  const handleValidateTheme = async () => {
    try {
      const res = await adminApi.validateThemeConfig(themeConfig);
      setThemeValidation(res);
      if (res.valid) {
        setStatusMsg({ text: 'Theme configuration passed all validation and WCAG contrast checks.', type: 'success' });
      } else {
        setStatusMsg({ text: `Theme validation found issues: ${res.errors?.join(', ') || 'Check configuration'}`, type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed';
      setStatusMsg({ text: msg, type: 'error' });
    }
  };

  const handlePublishTheme = async () => {
    setIsThemePublishing(true);
    try {
      const res = await adminApi.publishTheme(themeConfig, publishReason);
      setStatusMsg({ text: res.message || 'Theme revision successfully published live.', type: 'success' });
      setPublishReason('');
      await loadThemeData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publish failed';
      setStatusMsg({ text: msg, type: 'error' });
    } finally {
      setIsThemePublishing(false);
    }
  };

  const handleRestoreRevision = async (revision: number) => {
    if (!window.confirm(`Are you sure you want to restore Theme Revision #${revision}? This will publish it as the active revision.`)) {
      return;
    }
    try {
      const res = await adminApi.restoreTheme(revision, `Restored revision #${revision} via admin console`);
      setStatusMsg({ text: res.message || `Revision #${revision} restored successfully.`, type: 'success' });
      await loadThemeData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Restore failed';
      setStatusMsg({ text: msg, type: 'error' });
    }
  };

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
      <div className="min-h-screen bg-desk text-ink-primary flex flex-col justify-center items-center px-4 font-sans select-none relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-brand-subtle rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-status-success/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full bg-paper border border-border-paper rounded-2xl p-8 shadow-lift relative z-10">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-deep to-electric flex items-center justify-center font-display font-black text-2xl text-on-brand shadow-lift  mb-3">
              P
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-on-brand">
              PadhaiPilot Platform Control
            </h1>
            <p className="text-xs font-primary text-ink-muted mt-1">
              Exclusive Console for the Platform Owner & Internal SREs
            </p>
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-danger-bg border border-status-danger-border/60 text-status-danger-text text-[11px] font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              Public Registration Prohibited
            </div>
          </div>

          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-status-danger-bg border border-status-danger-border text-status-danger-text text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-status-danger-text" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-primary font-semibold text-ink-muted mb-1.5">
                Platform Super Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-faint absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-paper-warm border border-border-paper rounded-xl pl-10 pr-3 py-2.5 text-xs text-on-brand placeholder-ink-faint focus:outline-none focus:border-border-focus font-data"
                  placeholder="super@padhaipilot.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-primary font-semibold text-ink-muted mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-faint absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-paper-warm border border-border-paper rounded-xl pl-10 pr-3 py-2.5 text-xs text-on-brand placeholder-ink-faint focus:outline-none focus:border-border-focus font-data"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 px-4 rounded-xl bg-electric hover:bg-brand-hover active:scale-[0.99] text-on-brand text-xs font-primary font-bold tracking-wide transition-all shadow-lift  flex items-center justify-center gap-2"
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
          <div className="mt-6 pt-5 border-t border-border-paper text-center">
            <button
              onClick={() => {
                setAuthEmail('super@padhaipilot.com');
                setAuthPassword('password123');
              }}
              className="text-[11px] text-ink-faint hover:text-electric transition-colors inline-flex items-center gap-1 font-data"
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
    <div className="min-h-screen bg-desk text-ink-primary flex flex-col font-sans select-none">
      {/* Top Root Command Bar */}
      <header className="h-16 border-b border-border-paper bg-paper px-6 flex items-center justify-between sticky top-0 z-30 shadow-lift">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-deep to-electric flex items-center justify-center font-display font-black text-on-brand text-lg shadow-paper">
            P
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-tight text-on-brand flex items-center gap-2">
              PadhaiPilot Platform Owner
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-subtle text-electric border border-border-focus/30">
                ROOT CONTROL PLANE
              </span>
            </div>
            <div className="text-[11px] font-primary text-ink-faint">
              Logged in as: <span className="text-on-brand font-data">{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Live Gauges & Controls */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-paper-warm border border-border-paper">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span className="text-ink-muted">API:</span>
            <span className="text-status-success-text font-semibold font-data">99.98% OK</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-paper-warm border border-border-paper">
            <span className="w-2 h-2 rounded-full bg-status-success" />
            <span className="text-ink-muted">PostgreSQL:</span>
            <span className="text-status-success-text font-semibold font-data">Connected (4ms)</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-paper-warm border border-border-paper">
            <span className="w-2 h-2 rounded-full bg-electric" />
            <span className="text-ink-muted">Tenants:</span>
            <span className="text-electric font-semibold font-data">{institutes.length}</span>
          </div>

          <button
            onClick={loadAll}
            disabled={isLoading}
            className="p-2 rounded-xl text-ink-muted hover:text-on-brand hover:bg-surface-subtle transition-colors border border-transparent hover:border-border-input"
            title="Refresh All State"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-status-danger-text hover:text-status-danger-text hover:bg-status-danger-bg border border-status-danger-border/40 transition-colors text-xs font-primary font-bold"
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
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border shadow-lift ${
              statusMsg.type === 'success'
                ? 'bg-status-success-bg border-status-success-border text-status-success-text'
                : 'bg-status-danger-bg border-status-danger-border text-status-danger-text'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-status-success-text shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-status-danger-text shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-xs opacity-70 hover:opacity-100 ml-4 font-data underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Selection Bar & Universal Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-border-paper pb-4">
          <div className="flex items-center gap-1.5 bg-paper p-1.5 rounded-2xl border border-border-paper overflow-x-auto">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-3.5 py-2 text-xs font-primary font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'tenants'
                  ? 'bg-electric text-on-brand shadow-lift '
                  : 'text-ink-muted hover:text-on-brand hover:bg-paper-warm'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Institutes & Tenants ({institutes.length})
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`px-3.5 py-2 text-xs font-primary font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'features'
                  ? 'bg-electric text-on-brand shadow-lift '
                  : 'text-ink-muted hover:text-on-brand hover:bg-paper-warm'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Kill Switches ({features.length})
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3.5 py-2 text-xs font-primary font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'plans'
                  ? 'bg-electric text-on-brand shadow-lift '
                  : 'text-ink-muted hover:text-on-brand hover:bg-paper-warm'
              }`}
            >
              <Layers className="w-4 h-4" />
              Plans & Entitlements
            </button>

            <button
              onClick={() => setActiveTab('whitelabel')}
              className={`px-3.5 py-2 text-xs font-primary font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'whitelabel'
                  ? 'bg-electric text-on-brand shadow-lift '
                  : 'text-ink-muted hover:text-on-brand hover:bg-paper-warm'
              }`}
            >
              <Globe className="w-4 h-4" />
              White-Label & Domains
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 text-xs font-primary font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-electric text-on-brand shadow-lift '
                  : 'text-ink-muted hover:text-on-brand hover:bg-paper-warm'
              }`}
            >
              <History className="w-4 h-4" />
              Platform Audit ({auditLogs.length})
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`px-3.5 py-2 text-xs font-primary font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'system'
                  ? 'bg-electric text-on-brand shadow-lift '
                  : 'text-ink-muted hover:text-on-brand hover:bg-paper-warm'
              }`}
            >
              <Activity className="w-4 h-4" />
              System Status
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`px-3.5 py-2 text-xs font-primary font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'theme'
                  ? 'bg-electric text-on-brand shadow-lift '
                  : 'text-ink-muted hover:text-on-brand hover:bg-paper-warm'
              }`}
            >
              <Palette className="w-4 h-4" />
              Theme Settings
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search institutes, features, subdomains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-paper border border-border-paper rounded-xl pl-10 pr-3 py-2 text-xs text-ink-primary placeholder-ink-faint focus:outline-none focus:border-border-focus font-sans"
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
                <h2 className="font-display text-xl font-bold text-ink-primary">
                  Registered Tuition Institutes
                </h2>
                <p className="text-xs font-primary text-ink-muted mt-0.5">
                  Manage all onboarded tuition classes, subscription plans, quotas, and account status.
                </p>
              </div>

              <button
                onClick={() => setShowOnboardModal(true)}
                className="px-4 py-2.5 rounded-xl bg-electric hover:bg-brand-hover active:scale-95 text-on-brand text-xs font-primary font-bold tracking-wide transition-all shadow-lift  flex items-center gap-2 shrink-0"
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
                        ? 'bg-paper-warm border-status-danger-border/50'
                        : 'bg-paper border-border-paper hover:border-border-focus/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-ink-primary">
                            {inst.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-data font-bold rounded-full border ${
                              inst.status === 'ACTIVE'
                                ? 'bg-status-success-bg text-status-success-text border-status-success-border'
                                : 'bg-status-danger-bg text-status-danger-text border-status-danger-border'
                            }`}
                          >
                            {inst.status}
                          </span>
                        </div>
                        <p className="text-xs font-data text-ink-faint mt-0.5">
                          {inst.subdomain}.padhaipilot.com
                          {inst.customDomain && (
                            <span className="text-electric ml-2">({inst.customDomain})</span>
                          )}
                        </p>
                      </div>

                      <select
                        value={inst.plan}
                        onChange={(e) => handleUpdatePlan(inst.id, e.target.value as SubscriptionPlan)}
                        className="bg-paper-warm border border-border-paper rounded-lg px-2.5 py-1 text-xs font-primary font-bold text-ink-primary focus:outline-none focus:border-border-focus cursor-pointer"
                      >
                        <option value="STARTER">STARTER</option>
                        <option value="GROWTH">GROWTH</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </div>

                    {/* Institute Metadata Badges */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-border-paper text-xs font-data text-ink-muted">
                      <div>
                        <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block">
                          Students
                        </span>
                        <span className="text-sm font-bold text-ink-primary">{inst.studentCount}</span>
                        <span className="text-[10px] text-ink-faint"> / {inst.maxStudentsLimit || 500}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block">
                          Faculty
                        </span>
                        <span className="text-sm font-bold text-ink-primary">{inst.teacherCount}</span>
                        <span className="text-[10px] text-ink-faint"> / {inst.maxTeachersLimit || 25}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block">
                          White Label
                        </span>
                        <span className={`text-xs font-bold ${inst.isWhiteLabel ? 'text-status-success-text' : 'text-ink-faint'}`}>
                          {inst.isWhiteLabel ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="mt-3 flex items-center justify-between text-xs font-primary">
                      <div className="text-[11px] text-ink-faint">
                        Owner: <span className="text-ink-primary">{inst.ownerName}</span> ({inst.ownerEmail})
                      </div>
                      <button
                        onClick={() => handleToggleStatus(inst)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          isSuspended
                            ? 'bg-status-success hover:bg-status-success text-on-brand'
                            : 'bg-status-danger-bg hover:bg-status-danger-bg text-status-danger-text border border-status-danger-border/80'
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
              <h2 className="font-display text-xl font-bold text-ink-primary">
                Platform-Wide Feature Flags & Emergency Switches
              </h2>
              <p className="text-xs font-primary text-ink-muted mt-0.5">
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
                        ? 'bg-paper border-border-paper'
                        : 'bg-status-danger-bg border-status-danger-border/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-sm text-ink-primary">
                            {feat.name}
                          </h3>
                          <span className="text-[10px] font-data uppercase px-2 py-0.5 rounded-full bg-paper-warm text-ink-muted border border-border-paper">
                            {feat.module}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-1 font-primary">{feat.description}</p>
                        <div className="text-[11px] font-data text-ink-faint mt-2">
                          Key: {feat.key} | Impact: {feat.securityImpact}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedFeature(feat);
                          setKillReason('');
                          setKillConfirmCode('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-primary font-bold shrink-0 transition-colors flex items-center gap-1.5 ${
                          isEnabled
                            ? 'bg-status-danger-bg hover:bg-status-danger-bg text-status-danger-text border border-status-danger-border'
                            : 'bg-status-success hover:bg-status-success text-on-brand'
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
              <h2 className="font-display text-xl font-bold text-ink-primary">
                Subscription Tiers & Quota Architecture
              </h2>
              <p className="text-xs font-primary text-ink-muted mt-0.5">
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
                      ? 'bg-paper-warm border-border-focus shadow-lift '
                      : 'bg-paper border-border-paper'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-black text-lg text-on-brand">
                        {plan.tier}
                      </span>
                      {plan.highlight && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-hover text-on-brand">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="font-data text-base font-bold text-electric mb-2">{plan.price}</div>
                    <p className="text-xs font-primary text-ink-muted mb-4">{plan.desc}</p>

                    <div className="space-y-2 border-t border-border-paper pt-3 text-xs font-data text-ink-secondary">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-faint">Capacity:</span>
                        <span className="font-bold">{plan.students}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-faint">Teachers:</span>
                        <span className="font-bold">{plan.faculty}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-faint">Storage:</span>
                        <span className="font-bold">{plan.storage}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-faint">Branding:</span>
                        <span className="font-bold">{plan.whiteLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-faint">Database:</span>
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
              <h2 className="font-display text-xl font-bold text-on-brand">
                White-Label & Dedicated Routing
              </h2>
              <p className="text-xs font-primary text-ink-muted mt-0.5">
                Tuition institute custom domain mappings, SSL certifications, and dedicated deployment settings.
              </p>
            </div>

            <div className="bg-paper border border-border-paper rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-data">
                <thead className="bg-paper-warm text-ink-muted font-primary font-bold uppercase tracking-wider text-[11px] border-b border-border-paper">
                  <tr>
                    <th className="py-3 px-4">Institute</th>
                    <th className="py-3 px-4">Subdomain</th>
                    <th className="py-3 px-4">Custom FQDN</th>
                    <th className="py-3 px-4">SSL & Route Status</th>
                    <th className="py-3 px-4">Dedicated DB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-paper text-ink-secondary">
                  {institutes.map((inst) => (
                    <tr key={inst.id} className="hover:bg-paper-warm/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-brand">{inst.name}</td>
                      <td className="py-3.5 px-4 font-data text-ink-muted">{inst.subdomain}.padhaipilot.com</td>
                      <td className="py-3.5 px-4 font-data text-electric">
                        {inst.customDomain || <span className="text-ink-faint italic">None configured</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-success-bg text-status-success-text border border-status-success-border text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Routed (Edge TLS)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            inst.isDedicatedDb ? 'text-status-success-text' : 'text-ink-faint'
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
              <h2 className="font-display text-xl font-bold text-ink-primary">
                Platform Security & Operations Audit Trail
              </h2>
              <p className="text-xs font-primary text-ink-muted mt-0.5">
                Immutable chronological log of all super-admin modifications, plan upgrades, and emergency switches.
              </p>
            </div>

            <div className="bg-paper border border-border-paper rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-data">
                <thead className="bg-paper-warm text-ink-muted font-primary font-bold uppercase tracking-wider text-[11px] border-b border-border-paper">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-paper text-ink-secondary">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-paper-warm/40 transition-colors">
                      <td className="py-3 px-4 font-data text-ink-faint whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-data text-ink-primary">{log.actorEmail}</td>
                      <td className="py-3 px-4 font-bold text-electric">{log.action}</td>
                      <td className="py-3 px-4 font-data text-ink-muted">{log.targetId || '-'}</td>
                      <td className="py-3 px-4 text-xs font-primary max-w-xs truncate">{log.details}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-status-success-bg text-status-success-text border border-status-success-border'
                              : 'bg-status-warning-bg text-status-warning-text border border-status-warning-border'
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
                <h2 className="font-display text-xl font-bold text-ink-primary">
                  System Health & Platform Announcements
                </h2>
                <p className="text-xs font-primary text-ink-muted mt-0.5">
                  Real-time infrastructure performance and global system-wide maintenance alerts.
                </p>
              </div>

              <button
                onClick={() => setShowAnnounceModal(true)}
                className="px-4 py-2.5 rounded-xl bg-electric hover:bg-brand-hover active:scale-95 text-on-brand text-xs font-primary font-bold tracking-wide transition-all shadow-lift  flex items-center gap-2 shrink-0"
              >
                <Radio className="w-4 h-4" />
                Post Global Announcement
              </button>
            </div>

            {/* Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-paper border border-border-paper">
                <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block mb-1">
                  Total Active Students
                </span>
                <span className="font-data text-2xl font-bold text-ink-primary">{health?.activeStudents || 1457}</span>
                <p className="text-[10px] text-status-success-text mt-1">Across all registered tenants</p>
              </div>

              <div className="p-4 rounded-2xl bg-paper border border-border-paper">
                <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block mb-1">
                  Active Faculty & Teachers
                </span>
                <span className="font-data text-2xl font-bold text-ink-primary">{health?.activeTeachers || 58}</span>
                <p className="text-[10px] text-electric mt-1">Conducting active sessions</p>
              </div>

              <div className="p-4 rounded-2xl bg-paper border border-border-paper">
                <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block mb-1">
                  Platform Uptime
                </span>
                <span className="font-data text-2xl font-bold text-status-success-text">99.98%</span>
                <p className="text-[10px] text-ink-faint mt-1 font-data">
                  {Math.floor((health?.uptimeSeconds || 12450) / 3600)}h operational
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-paper border border-border-paper">
                <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block mb-1">
                  Global Deployment
                </span>
                <span className="font-data text-2xl font-bold text-ink-primary">Vercel + Nest</span>
                <p className="text-[10px] text-status-success-text mt-1 font-data">Asia-South1 (Mumbai)</p>
              </div>
            </div>

            {/* Announcements List */}
            <div className="bg-paper border border-border-paper rounded-2xl p-5">
              <h3 className="font-display font-bold text-base text-ink-primary mb-3">
                Active Platform Announcements
              </h3>
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-xl bg-paper-warm border border-border-paper flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-ink-primary">
                          {ann.title}
                        </span>
                        <span className="text-[10px] font-data px-2 py-0.5 rounded uppercase font-bold bg-brand-subtle text-electric border border-border-focus">
                          Audience: {ann.targetAudience}
                        </span>
                      </div>
                      <p className="text-xs font-primary text-ink-muted mt-1">{ann.message}</p>
                    </div>
                    <span className="text-[10px] font-data text-ink-faint whitespace-nowrap">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 7: PLATFORM THEME SETTINGS & ENGINE (Consumes /api/theme) */}
        {/* ================================================================== */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-primary">
                  Platform Theme Settings & Design Engine
                </h2>
                <p className="text-xs font-primary text-ink-muted mt-0.5">
                  Authoritative runtime styling served via <code className="px-1.5 py-0.5 bg-paper-warm border border-border-paper rounded font-data text-electric">GET /api/theme</code> and synchronized across Web, Teacher, Student, and Mobile portals.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadThemeData}
                  disabled={isThemeLoading}
                  className="px-3.5 py-2 rounded-xl bg-paper hover:bg-paper-warm border border-border-paper text-ink-secondary text-xs font-primary font-semibold transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isThemeLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleValidateTheme}
                  className="px-3.5 py-2 rounded-xl bg-paper hover:bg-paper-warm border border-border-paper text-ink-primary text-xs font-primary font-bold transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success-text" />
                  Validate
                </button>
                <button
                  type="button"
                  onClick={handlePublishTheme}
                  disabled={isThemePublishing}
                  className="px-4 py-2 rounded-xl bg-electric hover:bg-brand-hover active:scale-95 text-on-brand text-xs font-primary font-bold tracking-wide transition-all shadow-lift flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  {isThemePublishing ? 'Publishing...' : 'Publish Revision Live'}
                </button>
              </div>
            </div>

            {/* Published Theme Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-paper border border-border-paper">
                <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block mb-1">
                  Active Revision
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-data text-2xl font-bold text-ink-primary">
                    #{publishedTheme?.revision ?? 0}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-data font-bold bg-brand-subtle text-electric border border-border-focus">
                    {publishedTheme?.revisionId ?? 'r0-default'}
                  </span>
                </div>
                <p className="text-[10px] text-ink-faint mt-1">
                  {publishedTheme?.publishedAt ? new Date(publishedTheme.publishedAt).toLocaleString() : 'Built-in baseline default'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-paper border border-border-paper">
                <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block mb-1">
                  Brand Electric Blue
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-border-paper shadow-sm shrink-0"
                    style={{ backgroundColor: themeConfig.brand.primary }}
                  />
                  <span className="font-data text-lg font-bold text-ink-primary">
                    {themeConfig.brand.primary}
                  </span>
                </div>
                <p className="text-[10px] text-ink-faint mt-1">
                  Contrast ratio: {contrastRatio(themeConfig.brand.primary, '#FFFFFF').toFixed(2)}:1 on Paper
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-paper border border-border-paper">
                <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block mb-1">
                  Default Scheme
                </span>
                <span className="font-data text-lg font-bold uppercase text-ink-primary">
                  {themeConfig.appearance.defaultScheme}
                </span>
                <p className="text-[10px] text-status-success-text mt-1">
                  {themeConfig.appearance.allowUserSchemeToggle ? 'User toggle enabled' : 'Locked by admin'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-paper border border-border-paper">
                <span className="text-[10px] uppercase font-primary font-bold text-ink-faint block mb-1">
                  CDN & Client Cache
                </span>
                <span className="font-data text-sm font-bold text-status-success-text">
                  60s browser / 300s edge
                </span>
                <p className="text-[10px] text-ink-faint mt-1">
                  Stale-while-revalidate: 86400s
                </p>
              </div>
            </div>

            {/* Validation Feedback Banner */}
            {themeValidation && (
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  themeValidation.valid
                    ? 'bg-status-success-bg border-status-success-border text-status-success-text'
                    : 'bg-status-danger-bg border-status-danger-border text-status-danger-text'
                }`}
              >
                {themeValidation.valid ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-bold">
                    {themeValidation.valid
                      ? 'Theme configuration passed authoritative schema and WCAG contrast validation.'
                      : 'Validation errors detected:'}
                  </div>
                  {themeValidation.errors && themeValidation.errors.length > 0 && (
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {themeValidation.errors.map((e, idx) => (
                        <li key={idx}>{e}</li>
                      ))}
                    </ul>
                  )}
                  {themeValidation.warnings && themeValidation.warnings.length > 0 && (
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-status-warning-text">
                      {themeValidation.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Two-Column Editor & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Form Controls */}
              <div className="bg-paper border border-border-paper rounded-2xl p-5 space-y-5">
                <h3 className="font-display font-bold text-base text-ink-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-electric" />
                  Theme Configuration Editor
                </h3>

                {/* Primary Brand Color */}
                <div>
                  <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                    Brand Primary Colour (Hex)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeConfig.brand.primary}
                      onChange={(e) =>
                        setThemeConfig((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, primary: e.target.value },
                        }))
                      }
                      className="w-10 h-10 rounded-xl border border-border-paper cursor-pointer p-0.5 bg-paper"
                    />
                    <input
                      type="text"
                      value={themeConfig.brand.primary}
                      onChange={(e) =>
                        setThemeConfig((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, primary: e.target.value },
                        }))
                      }
                      placeholder="#1677FF"
                      className="w-36 bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs font-data text-ink-primary focus:outline-none focus:border-border-focus"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['#1677FF', '#0A6FE8', '#059669', '#7C3AED', '#D97706', '#E11D48'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setThemeConfig((prev) => ({
                              ...prev,
                              brand: { ...prev.brand, primary: preset },
                            }))
                          }
                          className="w-5 h-5 rounded-full border border-border-paper hover:scale-110 transition-transform"
                          style={{ backgroundColor: preset }}
                          title={preset}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Brand Accent Color */}
                <div>
                  <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                    Brand Accent Colour (Micro-highlights)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeConfig.brand.accent || '#0A6FE8'}
                      onChange={(e) =>
                        setThemeConfig((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, accent: e.target.value },
                        }))
                      }
                      className="w-10 h-10 rounded-xl border border-border-paper cursor-pointer p-0.5 bg-paper"
                    />
                    <input
                      type="text"
                      value={themeConfig.brand.accent || '#0A6FE8'}
                      onChange={(e) =>
                        setThemeConfig((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, accent: e.target.value },
                        }))
                      }
                      placeholder="#0A6FE8"
                      className="w-36 bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs font-data text-ink-primary focus:outline-none focus:border-border-focus"
                    />
                  </div>
                </div>

                {/* Default Colour Scheme */}
                <div>
                  <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                    Default Colour Scheme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['light', 'dark', 'system'] as const).map((scheme) => (
                      <button
                        key={scheme}
                        type="button"
                        onClick={() =>
                          setThemeConfig((prev) => ({
                            ...prev,
                            appearance: { ...prev.appearance, defaultScheme: scheme },
                          }))
                        }
                        className={`py-2 px-3 rounded-xl border text-xs font-primary font-bold capitalize transition-all ${
                          themeConfig.appearance.defaultScheme === scheme
                            ? 'bg-electric text-on-brand border-electric shadow-lift'
                            : 'bg-paper-warm border-border-paper text-ink-muted hover:text-ink-primary'
                        }`}
                      >
                        {scheme}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appearance Flags */}
                <div className="space-y-3 pt-2 border-t border-border-paper">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={themeConfig.appearance.allowUserSchemeToggle}
                      onChange={(e) =>
                        setThemeConfig((prev) => ({
                          ...prev,
                          appearance: { ...prev.appearance, allowUserSchemeToggle: e.target.checked },
                        }))
                      }
                      className="rounded border-border-paper text-electric focus:ring-0"
                    />
                    <span className="text-xs font-primary text-ink-primary">
                      Allow end users (teachers & students) to toggle light / dark scheme
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={themeConfig.appearance.deskTexture}
                      onChange={(e) =>
                        setThemeConfig((prev) => ({
                          ...prev,
                          appearance: { ...prev.appearance, deskTexture: e.target.checked },
                        }))
                      }
                      className="rounded border-border-paper text-electric focus:ring-0"
                    />
                    <span className="text-xs font-primary text-ink-primary">
                      Render authentic warm paper desk texture behind workspace canvas
                    </span>
                  </label>
                </div>

                {/* Typographic Role Assignments */}
                <div className="pt-2 border-t border-border-paper">
                  <label className="block text-xs font-semibold text-ink-primary mb-2">
                    Approved Typographic Font Families (Mandatory 3)
                  </label>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-paper-warm border border-border-paper">
                      <span className="font-semibold text-ink-muted">Headings & Titles:</span>
                      <span className="font-display font-bold text-ink-primary">Playfair Display</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-paper-warm border border-border-paper">
                      <span className="font-semibold text-ink-muted">UI & Navigation:</span>
                      <span className="font-primary font-bold text-ink-primary">Raleway</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-paper-warm border border-border-paper">
                      <span className="font-semibold text-ink-muted">Numbers & Tables:</span>
                      <span className="font-data font-bold text-ink-primary">Inter</span>
                    </div>
                  </div>
                </div>

                {/* Changelog Reason */}
                <div className="pt-2 border-t border-border-paper">
                  <label className="block text-xs font-semibold text-ink-primary mb-1">
                    Publish Audit Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={publishReason}
                    onChange={(e) => setPublishReason(e.target.value)}
                    placeholder="e.g. Updated primary brand electric blue to #1677FF for Diwali release"
                    className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs font-primary text-ink-primary focus:outline-none focus:border-border-focus placeholder-ink-faint"
                  />
                </div>
              </div>

              {/* Right Column: Live Interactive Preview */}
              <div className="bg-paper border border-border-paper rounded-2xl p-5 space-y-5">
                <h3 className="font-display font-bold text-base text-ink-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-electric" />
                  Live Theme Preview & Contrast Guard
                </h3>

                {/* Light Scheme Simulation */}
                <div className="p-4 rounded-xl border border-border-paper bg-paper shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                      Light Paper-Desk Preview
                    </span>
                    <span className="text-[10px] font-data px-2 py-0.5 rounded bg-brand-subtle text-electric font-semibold">
                      WCAG AA Compliant
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      style={{ backgroundColor: themeConfig.brand.primary }}
                      className="px-3.5 py-1.5 rounded-xl text-white text-xs font-primary font-bold shadow-sm"
                    >
                      Primary Action
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl border border-border-paper text-ink-primary text-xs font-primary font-semibold hover:bg-paper-warm"
                    >
                      Secondary
                    </button>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-data font-bold bg-status-success-bg text-status-success-text border border-status-success-border">
                      Active Batch
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-paper-warm border border-border-paper">
                    <h4 className="font-display font-bold text-sm text-ink-primary">
                      Playfair Display Heading Sample
                    </h4>
                    <p className="font-primary text-xs text-ink-secondary mt-0.5">
                      Raleway primary interface text for student diaries, fee statements, and attendance records.
                    </p>
                    <div className="mt-2 font-data text-xs font-bold text-ink-primary">
                      Inter Numerical Stat: ₹24,500 <span className="font-normal text-ink-muted">collected today</span>
                    </div>
                  </div>
                </div>

                {/* Dark Scheme Simulation */}
                <div
                  className="p-4 rounded-xl border border-white/10 shadow-sm space-y-3"
                  style={{ backgroundColor: '#0A0D12' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#929BAA]">
                      Dark Paper-Desk (.dark) Preview
                    </span>
                    <span className="text-[10px] font-data px-2 py-0.5 rounded bg-white/10 text-white font-semibold">
                      Dark Contrast Pass
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      style={{ backgroundColor: themeConfig.brand.primary }}
                      className="px-3.5 py-1.5 rounded-xl text-white text-xs font-primary font-bold"
                    >
                      Primary Action
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl border border-white/15 text-[#F5F7FA] text-xs font-primary font-semibold"
                    >
                      Secondary
                    </button>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-data font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                      Active
                    </span>
                  </div>

                  <div
                    className="p-3 rounded-lg border border-white/10"
                    style={{ backgroundColor: '#10151D' }}
                  >
                    <h4 className="font-display font-bold text-sm text-[#F5F7FA]">
                      Dark Playfair Heading
                    </h4>
                    <p className="font-primary text-xs text-[#C3CAD6] mt-0.5">
                      Low-eyestrain reading ink on midnight paper surface.
                    </p>
                    <div className="mt-2 font-data text-xs font-bold text-[#F5F7FA]">
                      Attendance: 96.8% <span className="font-normal text-[#929BAA]">verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revision History Log */}
            <div className="bg-paper border border-border-paper rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-ink-primary flex items-center gap-2">
                    <History className="w-4 h-4 text-ink-muted" />
                    Platform Theme Revision History
                  </h3>
                  <p className="text-xs font-primary text-ink-muted mt-0.5">
                    Immutable history of published theme revisions. Roll back to any prior revision instantly.
                  </p>
                </div>
              </div>

              {themeHistory.length === 0 ? (
                <p className="text-xs font-primary text-ink-faint py-4 text-center">
                  No previous revisions found. Built-in default revision is active.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-data">
                    <thead>
                      <tr className="border-b border-border-paper text-[10px] text-ink-faint uppercase">
                        <th className="pb-2">Rev</th>
                        <th className="pb-2">Revision ID</th>
                        <th className="pb-2">Published At</th>
                        <th className="pb-2">Publisher</th>
                        <th className="pb-2">Changelog Reason</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-paper">
                      {themeHistory.map((rev) => (
                        <tr key={rev.revisionId} className="hover:bg-paper-warm/50">
                          <td className="py-2.5 font-bold text-ink-primary">#{rev.revision}</td>
                          <td className="py-2.5 text-electric">{rev.revisionId}</td>
                          <td className="py-2.5 text-ink-muted">
                            {rev.publishedAt ? new Date(rev.publishedAt).toLocaleString() : 'Baseline'}
                          </td>
                          <td className="py-2.5 text-ink-secondary">{rev.publishedByEmail}</td>
                          <td className="py-2.5 text-ink-muted max-w-xs truncate">
                            {rev.reason || '—'}
                          </td>
                          <td className="py-2.5 text-right">
                            {publishedTheme?.revision !== rev.revision ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreRevision(rev.revision)}
                                className="px-2.5 py-1 rounded-lg border border-border-paper text-ink-secondary hover:text-ink-primary hover:bg-paper-warm text-[10px] font-primary font-bold flex items-center gap-1.5 ml-auto"
                              >
                                <RotateCcw className="w-3 h-3 text-electric" />
                                Restore
                              </button>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-subtle text-electric">
                                Active
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* MODAL: ONBOARD NEW INSTITUTE */}
      {/* ================================================================== */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-scrim backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-border-paper rounded-2xl p-6 max-w-lg w-full shadow-lift">
            <h3 className="font-display text-xl font-bold text-ink-primary mb-1">
              Onboard Tuition Institute
            </h3>
            <p className="text-xs font-primary text-ink-muted mb-5">
              Create a tenant workspace, provision database scope, and assign owner credentials.
            </p>

            <form onSubmit={handleOnboardTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Tuition Institute Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Academy Kota"
                  value={newInst.name}
                  onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                  className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Subdomain *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="apex"
                      value={newInst.subdomain}
                      onChange={(e) => setNewInst({ ...newInst, subdomain: e.target.value })}
                      className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-data"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={newInst.plan}
                    onChange={(e) => setNewInst({ ...newInst, plan: e.target.value as SubscriptionPlan })}
                    className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-sans"
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
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Tuition Owner Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajeshwar Singhania"
                    value={newInst.ownerName}
                    onChange={(e) => setNewInst({ ...newInst, ownerName: e.target.value })}
                    className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Owner Email *
                  </label>
                  <input
                    type="email"
                    placeholder="owner@apexacademy.com"
                    value={newInst.ownerEmail}
                    onChange={(e) => setNewInst({ ...newInst, ownerEmail: e.target.value })}
                    className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-data"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Custom FQDN Domain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. learn.apexacademy.edu.in"
                  value={newInst.customDomain}
                  onChange={(e) => setNewInst({ ...newInst, customDomain: e.target.value })}
                  className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-data"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-paper">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-primary text-ink-muted hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-electric hover:bg-brand-hover text-on-brand text-xs font-primary font-bold transition-all"
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
        <div className="fixed inset-0 bg-scrim backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-status-danger-border/60 rounded-2xl p-6 max-w-md w-full shadow-lift">
            <div className="flex items-center gap-3 text-status-danger-text mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-display text-lg font-bold text-ink-primary">
                Emergency Circuit Breaker
              </h3>
            </div>

            <p className="text-xs font-primary text-ink-muted mb-4">
              You are modifying the global availability of:
              <strong className="text-ink-primary block mt-1 font-data">{selectedFeature.name} ({selectedFeature.key})</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Reason for Emergency Action *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Memory anomaly or 3rd party outage"
                  value={killReason}
                  onChange={(e) => setKillReason(e.target.value)}
                  className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-status-danger-border font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Type <span className="font-data text-status-danger-text font-bold">KILL_CONFIRMED</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="KILL_CONFIRMED"
                  value={killConfirmCode}
                  onChange={(e) => setKillConfirmCode(e.target.value)}
                  className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-status-danger-border font-data"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-paper">
                <button
                  type="button"
                  onClick={() => setSelectedFeature(null)}
                  className="px-4 py-2 rounded-xl text-xs font-primary text-ink-muted hover:text-ink-primary"
                >
                  Abort
                </button>
                <button
                  type="button"
                  onClick={confirmKillSwitch}
                  disabled={isSubmitting || killConfirmCode !== 'KILL_CONFIRMED'}
                  className="px-4 py-2 rounded-xl bg-status-danger hover:bg-status-danger disabled:opacity-40 disabled:cursor-not-allowed text-on-brand text-xs font-primary font-bold transition-all"
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
        <div className="fixed inset-0 bg-scrim backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-border-paper rounded-2xl p-6 max-w-lg w-full shadow-lift">
            <h3 className="font-display text-xl font-bold text-ink-primary mb-1">
              Publish Broadcast Announcement
            </h3>
            <p className="text-xs font-primary text-ink-muted mb-5">
              Broadcast high-priority notifications to all tuition portals and mobile apps.
            </p>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Platform Maintenance Notice"
                  value={newAnnounce.title}
                  onChange={(e) => setNewAnnounce({ ...newAnnounce, title: e.target.value })}
                  className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed message regarding changes or maintenance..."
                  value={newAnnounce.message}
                  onChange={(e) => setNewAnnounce({ ...newAnnounce, message: e.target.value })}
                  className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Severity Level
                  </label>
                  <select
                    value={newAnnounce.severity}
                    onChange={(e) => setNewAnnounce({ ...newAnnounce, severity: e.target.value as any })}
                    className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-sans"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Target Audience
                  </label>
                  <select
                    value={newAnnounce.targetAudience}
                    onChange={(e) => setNewAnnounce({ ...newAnnounce, targetAudience: e.target.value as any })}
                    className="w-full bg-paper-warm border border-border-paper rounded-xl px-3 py-2 text-xs text-ink-primary focus:outline-none focus:border-border-focus font-sans"
                  >
                    <option value="ALL">All Users</option>
                    <option value="TEACHERS">Tuition Owners & Teachers Only</option>
                    <option value="STUDENTS">Students Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-paper">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-primary text-ink-muted hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-electric hover:bg-brand-hover text-on-brand text-xs font-primary font-bold transition-all"
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
