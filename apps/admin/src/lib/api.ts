import type {
  FeatureKey,
  FeatureDefinition,
  InstituteEffectiveFeatures,
  FeatureAuditLogItem,
  SubscriptionPlan,
  FeatureStatus,
  UserSession,
  PublishedTheme,
  PlatformThemeConfig,
  PlatformAdminAnalyticsSummary,
} from '@padhai-pilot/shared';

export interface InstituteSummary {
  id: string;
  name: string;
  subdomain: string;
  plan: SubscriptionPlan;
  status: InstituteStatus;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  customDomain?: string;
  isWhiteLabel: boolean;
  isDedicatedDb: boolean;
  studentCount: number;
  teacherCount: number;
  createdAt: string;
  updatedAt: string;
  themePrimaryColor?: string;
  logoUrl?: string;
  maxStudentsLimit?: number;
  maxTeachersLimit?: number;
  isTrialActive?: boolean;
  trialEndsAt?: string | null;
  trialDaysLeft?: number;
}

export interface PlatformHealth {
  status: 'ok' | 'degraded' | 'down';
  api: boolean;
  database: boolean;
  redis: boolean;
  uptimeSeconds: number;
  environment: string;
  tenantsTotal: number;
  activeStudents: number;
  activeTeachers: number;
}

export interface PlatformAuditItem {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

export interface PlatformAnnouncementItem {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  targetAudience: 'ALL' | 'TEACHERS' | 'STUDENTS';
  createdAt: string;
  expiresAt?: string;
}

export interface ThemeHistoryItem {
  revision: number;
  revisionId: string;
  checksum: string;
  publishedAt: string;
  publishedByEmail: string;
  reason?: string;
}

export interface AdminThemeOverview {
  published: PublishedTheme;
  history: ThemeHistoryItem[];
}

function getCleanApiBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://padhai-pilot.vercel.app/api' : 'http://localhost:3001/api');
  let clean = envUrl.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api')) {
    clean += '/api';
  }
  return clean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type InstituteStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'ARCHIVED';

export interface FeatureFlagState {
  key: FeatureKey;
  isGloballyEnabled: boolean;
  isEmergencyDisabled: boolean;
  disabledReason?: string | null;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface PlanEntitlementRow {
  plan: SubscriptionPlan;
  featureKey: FeatureKey;
  isIncluded: boolean;
  quotaLimit: number | null;
}

export interface FeatureControlState {
  flags: FeatureFlagState[];
  planEntitlements: PlanEntitlementRow[];
}

export interface InstituteConfigInput {
  customDomain?: string;
  isWhiteLabel?: boolean;
  isDedicatedDb?: boolean;
  themePrimaryColor?: string;
  maxStudentsLimit?: number;
  maxTeachersLimit?: number;
  isTrialActive?: boolean;
  trialEndsAt?: string | null;
  trialDaysLeft?: number;
}

class AdminApiClient {
  private getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') localStorage.setItem('admin_token', token);
  }

  getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  }

  async login(email: string, pass: string): Promise<{ user: any; token: string }> {
    let res: Response;
    try {
      res = await fetch(`${getCleanApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
    } catch {
      throw new Error('Cannot reach the server. Check your connection and try again.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Platform Super Admin login failed.');
    }
    const data = await res.json();
    if (data.user?.role !== 'SUPER_ADMIN') {
      throw new Error('Access denied: this console is for Platform Super Admins only.');
    }
    this.setToken(data.token);
    if (typeof window !== 'undefined') localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data;
  }

  getCurrentUser(): any | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /** Authenticated request. Failures throw ApiError so callers render an error state, never sample data. */
  private async send<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${getCleanApiBaseUrl()}${path}`, {
        method,
        headers: this.getHeaders(),
        cache: 'no-store',
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const raw = (err as { message?: string | string[] }).message;
      const message = Array.isArray(raw) ? raw.join(', ') : raw || `Request failed (${res.status})`;
      if (res.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('pp:unauthorized'));
      }
      throw new ApiError(message, res.status);
    }
    const json = await res.json();
    return ((json as { data?: T }).data ?? json) as T;
  }

  /** Platform health derived only from what GET /admin/stats actually reports. */
  async getHealth(): Promise<PlatformHealth> {
    const stats = await this.send<{
      tenants?: { total?: number };
      users?: { totalStudents?: number; totalTeachers?: number };
      infrastructure?: { databaseStatus?: string; redisStatus?: string; uptimeSeconds?: number; environment?: string };
    }>('GET', '/admin/stats');
    const db = stats.infrastructure?.databaseStatus === 'CONNECTED';
    const redis = stats.infrastructure?.redisStatus === 'ACTIVE';
    return {
      status: db ? 'ok' : 'degraded',
      api: true,
      database: db,
      redis,
      uptimeSeconds: stats.infrastructure?.uptimeSeconds ?? 0,
      environment: stats.infrastructure?.environment ?? 'unknown',
      tenantsTotal: stats.tenants?.total ?? 0,
      activeStudents: stats.users?.totalStudents ?? 0,
      activeTeachers: stats.users?.totalTeachers ?? 0,
    };
  }

  getAdminAnalytics() {
    return this.send<PlatformAdminAnalyticsSummary>('GET', '/analytics/admin');
  }

  // Institutes
  getInstitutes() {
    return this.send<InstituteSummary[]>('GET', '/admin/institutes');
  }
  getInstitute(id: string) {
    return this.send<InstituteSummary>('GET', `/admin/institutes/${encodeURIComponent(id)}`);
  }
  createInstitute(data: {
    name: string;
    subdomain: string;
    plan: SubscriptionPlan;
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string;
    customDomain?: string;
  }) {
    return this.send<InstituteSummary>('POST', '/admin/institutes', data);
  }
  updateInstituteStatus(id: string, status: InstituteStatus, reason: string) {
    return this.send<InstituteSummary>('PUT', `/admin/institutes/${encodeURIComponent(id)}/status`, { status, reason });
  }
  updateInstitutePlan(id: string, plan: SubscriptionPlan, reason?: string) {
    return this.send<InstituteSummary>('PUT', `/admin/institutes/${encodeURIComponent(id)}/plan`, { plan, reason });
  }
  updateInstituteConfig(id: string, config: InstituteConfigInput) {
    return this.send<InstituteSummary>('PUT', `/admin/institutes/${encodeURIComponent(id)}/config`, config);
  }

  // Features
  getFeatureRegistry() {
    return this.send<FeatureDefinition[]>('GET', '/features/registry');
  }
  getFeatureControlState() {
    return this.send<FeatureControlState>('GET', '/features/state');
  }
  getEffectiveFeatures(instituteId: string) {
    return this.send<InstituteEffectiveFeatures>('GET', `/features/institute/${encodeURIComponent(instituteId)}`);
  }
  getFeatureAuditLogs(params: { featureKey?: string; instituteId?: string; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.featureKey) q.set('featureKey', params.featureKey);
    if (params.instituteId) q.set('instituteId', params.instituteId);
    q.set('limit', String(params.limit ?? 100));
    return this.send<FeatureAuditLogItem[]>('GET', `/features/audit-logs?${q}`);
  }
  setGlobalFlag(featureKey: FeatureKey, isGloballyEnabled: boolean, reason?: string) {
    return this.send<unknown>('POST', '/features/global', { featureKey, isGloballyEnabled, reason });
  }
  emergencyKill(featureKey: FeatureKey, reason: string, confirmCode: string) {
    return this.send<unknown>('POST', '/features/emergency-kill', { featureKey, reason, confirmCode });
  }
  emergencyRestore(featureKey: FeatureKey, reason: string) {
    return this.send<unknown>('POST', '/features/emergency-restore', { featureKey, reason });
  }
  updatePlanEntitlement(dto: {
    plan: SubscriptionPlan;
    featureKey: FeatureKey;
    isIncluded: boolean;
    quotaLimit?: number | null;
    reason?: string;
  }) {
    return this.send<unknown>('POST', '/features/plan-entitlements', dto);
  }
  updateInstituteFeature(dto: {
    instituteId: string;
    featureKey: FeatureKey;
    isEnabled: boolean;
    customQuota?: number | null;
    reason?: string;
  }) {
    return this.send<unknown>('POST', '/features/institute-config', dto);
  }

  // Audit & announcements
  getAuditLogs(limit = 200) {
    return this.send<PlatformAuditItem[]>('GET', `/admin/audit-logs?limit=${limit}`);
  }
  getAnnouncements() {
    return this.send<PlatformAnnouncementItem[]>('GET', '/admin/announcements');
  }
  createAnnouncement(data: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    targetAudience?: 'ALL' | 'TEACHERS' | 'STUDENTS';
    expiresAt?: string;
  }) {
    return this.send<PlatformAnnouncementItem>('POST', '/admin/announcements', data);
  }

  // Theme
  getAdminThemeOverview() {
    return this.send<AdminThemeOverview>('GET', '/admin/theme');
  }
  validateThemeConfig(config: PlatformThemeConfig) {
    return this.send<ThemeValidation>('POST', '/admin/theme/validate', { config });
  }
  publishTheme(config: PlatformThemeConfig, reason?: string) {
    return this.send<{ unchanged?: boolean; theme?: { revision: number } }>('POST', '/admin/theme/publish', { config, reason });
  }
  restoreTheme(revision: number, reason?: string) {
    return this.send<{ theme?: { revision: number } }>('POST', `/admin/theme/restore/${revision}`, { reason });
  }

  // Study Library (admin view: platform-level materials, any approval status)
  getLibraryMaterials(params: { page?: number; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return this.send<{
      items: LibraryMaterialAdminItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('GET', `/study-library/admin/all${query ? `?${query}` : ''}`);
  }

  approveLibraryMaterial(id: string) {
    return this.send<LibraryMaterialAdminItem>('PUT', `/study-library/${encodeURIComponent(id)}/approve`);
  }

  deleteLibraryMaterial(id: string) {
    return this.send<{ success: boolean }>('DELETE', `/study-library/${encodeURIComponent(id)}`);
  }
}

export const adminApi = new AdminApiClient();

export interface LibraryMaterialAdminItem {
  id: string;
  title: string;
  description?: string;
  board: string;
  classLevel?: string;
  subject?: string;
  contentType: string;
  fileUrl?: string;
  externalUrl?: string;
  yearOrEdition?: string;
  tags: string[];
  isApproved: boolean;
  viewCount: number;
  instituteId?: string;
  createdAt: string;
  uploader?: { id: string; fullName: string; email: string };
}

/** Shape returned by POST /admin/theme/validate (authoritative shared validator plus a preview diff). */
export interface ThemeValidation {
  ok: boolean;
  errors: string[];
  warnings: string[];
  changes: string[];
  contrast: { scheme: string; label: string; ratio: number; required: number; passed: boolean; level: string }[];
}
