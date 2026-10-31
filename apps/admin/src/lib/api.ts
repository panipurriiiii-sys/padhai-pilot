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
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
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

class AdminApiClient {
  private getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Auth & Token management
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  }

  async login(email: string, pass: string): Promise<{ user: any; token: string }> {
    const res = await fetch(`${getCleanApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Platform Super Admin login failed.');
    }

    const data = await res.json();
    if (data.user?.role !== 'SUPER_ADMIN') {
      throw new Error('Access denied: Account lacks Platform Super Admin credentials.');
    }

    this.setToken(data.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_user', JSON.stringify(data.user));
    }
    return data;
  }

  getCurrentUser(): any | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return null;
  }

  /** Authenticated GET. Failures throw ApiError: callers render an error state, never sample data. */
  private async get<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${getCleanApiBaseUrl()}${path}`, { headers: this.getHeaders(), cache: 'no-store' });
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
    const body = await res.json();
    return ((body as { data?: T }).data ?? body) as T;
  }

  /** Platform health derived only from what GET /admin/stats actually reports. */
  async getHealth(): Promise<PlatformHealth> {
    const stats = await this.get<{
      tenants?: { total?: number };
      users?: { totalStudents?: number; totalTeachers?: number };
      infrastructure?: { databaseStatus?: string; redisStatus?: string; uptimeSeconds?: number; environment?: string };
    }>('/admin/stats');
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

  async getAdminAnalytics(): Promise<PlatformAdminAnalyticsSummary> {
    return this.get<PlatformAdminAnalyticsSummary>('/analytics/admin');
  }

  // --------------------------------------------------------------------------
  // Institutes / Tenants
  // --------------------------------------------------------------------------

  async getInstitutes(): Promise<InstituteSummary[]> {
    return this.get<InstituteSummary[]>('/admin/institutes');
  }

  async createInstitute(data: {
    name: string;
    subdomain: string;
    plan: SubscriptionPlan;
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string;
    customDomain?: string;
  }): Promise<{ success: boolean; data: InstituteSummary; message: string }> {
    const res = await fetch(`${getCleanApiBaseUrl()}/admin/institutes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to onboard institute');
    }
    return res.json();
  }

  async updateInstituteStatus(
    instituteId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL',
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${getCleanApiBaseUrl()}/admin/institutes/${instituteId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update institute status');
    }
    return res.json();
  }

  async updateInstitutePlan(
    instituteId: string,
    plan: SubscriptionPlan,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${getCleanApiBaseUrl()}/admin/institutes/${instituteId}/plan`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ plan, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update plan');
    }
    return res.json();
  }

  async updateInstituteConfig(
    instituteId: string,
    config: {
      customDomain?: string;
      isWhiteLabel?: boolean;
      isDedicatedDb?: boolean;
      themePrimaryColor?: string;
      maxStudentsLimit?: number;
      maxTeachersLimit?: number;
    },
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${getCleanApiBaseUrl()}/admin/institutes/${instituteId}/config`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update tenant configuration');
    }
    return res.json();
  }

  // --------------------------------------------------------------------------
  // Feature Flags & Emergency Kill Switches
  // --------------------------------------------------------------------------

  async getFeatureRegistry(): Promise<FeatureDefinition[]> {
    return this.get<FeatureDefinition[]>('/features/registry');
  }

  async getEffectiveFeatures(instituteId: string): Promise<InstituteEffectiveFeatures> {
    const res = await fetch(`${getCleanApiBaseUrl()}/features/institute/${instituteId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load effective features');
    const body = await res.json();
    return body.data || body;
  }

  async toggleGlobalKillSwitch(
    featureKey: FeatureKey,
    enabled: boolean,
    reason: string,
    confirmCode?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!enabled) {
      const res = await fetch(`${getCleanApiBaseUrl()}/features/emergency-kill`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          featureKey,
          reason,
          confirmCode: confirmCode || 'KILL_CONFIRMED',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to activate emergency kill switch');
      }
      return res.json();
    } else {
      const res = await fetch(`${getCleanApiBaseUrl()}/features/emergency-restore`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ featureKey, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to restore feature');
      }
      return res.json();
    }
  }

  // --------------------------------------------------------------------------
  // Audit Logs
  // --------------------------------------------------------------------------

  async getAuditLogs(): Promise<PlatformAuditItem[]> {
    return this.get<PlatformAuditItem[]>('/admin/audit-logs');
  }

  // --------------------------------------------------------------------------
  // Platform Announcements
  // --------------------------------------------------------------------------

  async getAnnouncements(): Promise<PlatformAnnouncementItem[]> {
    return this.get<PlatformAnnouncementItem[]>('/admin/announcements');
  }

  async createAnnouncement(data: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    targetAudience?: 'ALL' | 'TEACHERS' | 'STUDENTS';
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${getCleanApiBaseUrl()}/admin/announcements`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to post announcement');
    }
    return res.json();
  }

  // --------------------------------------------------------------------------
  // Platform Theme Settings (Consumes /api/theme and /api/admin/theme)
  // --------------------------------------------------------------------------

  async getPublicTheme(): Promise<PublishedTheme> {
    const res = await fetch(`${getCleanApiBaseUrl()}/theme`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) throw new ApiError('Could not load the published theme.', res.status);
    return (await res.json()) as PublishedTheme;
  }

  async getAdminThemeOverview(): Promise<AdminThemeOverview> {
    return this.get<AdminThemeOverview>('/admin/theme');
  }

  async validateThemeConfig(config: PlatformThemeConfig): Promise<{ valid: boolean; errors?: string[]; warnings?: string[] }> {
    try {
      const res = await fetch(`${getCleanApiBaseUrl()}/admin/theme/validate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        const body = await res.json();
        return body.data || body;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Theme validation failed');
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error('Theme validation failed');
    }
  }

  async publishTheme(config: PlatformThemeConfig, reason?: string): Promise<{ success: boolean; data: any; message: string }> {
    const res = await fetch(`${getCleanApiBaseUrl()}/admin/theme/publish`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ config, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to publish theme revision');
    }
    return res.json();
  }

  async restoreTheme(revision: number, reason?: string): Promise<{ success: boolean; data: any; message: string }> {
    const res = await fetch(`${getCleanApiBaseUrl()}/admin/theme/restore/${revision}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to restore revision ${revision}`);
    }
    return res.json();
  }
}

export const adminApi = new AdminApiClient();
