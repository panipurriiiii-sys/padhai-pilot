'use client';

import React, { useState } from 'react';
import { Database, RefreshCw, Server, Users, GraduationCap, Building2, Activity, IndianRupee, TrendingUp, CreditCard } from 'lucide-react';
import { adminApi } from '../lib/api';
import { ErrorState, LoadingBlock, PageHeader, StatusBadge, useLoad } from '../components/ui';

function Kpi({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="kpi-card">
      <div className="flex items-center gap-2 text-ink-muted text-xs font-primary font-bold">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="font-data font-bold text-2xl text-ink-primary mt-2">{value}</div>
      {hint && <div className="text-[11px] text-ink-muted font-primary mt-1">{hint}</div>}
    </div>
  );
}

function fmtUptime(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function Overview() {
  const health = useLoad(() => adminApi.getHealth());
  const analytics = useLoad(() => adminApi.getAdminAnalytics());
  const institutes = useLoad(() => adminApi.getInstitutes());
  const revenue = useLoad(() => adminApi.getRevenueSummary());

  const reload = () => {
    health.reload();
    analytics.reload();
    institutes.reload();
    revenue.reload();
  };

  const byStatus = (institutes.data ?? []).reduce<Record<string, number>>((a, i) => {
    a[i.status] = (a[i.status] ?? 0) + 1;
    return a;
  }, {});
  const plans = Object.entries(analytics.data?.institutesByPlan ?? {});
  const maxPlan = Math.max(1, ...plans.map(([, n]) => n));

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Live usage and health, read from the platform API."
        actions={
          <button type="button" className="btn-secondary" onClick={reload}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />

      <section aria-label="Health" className="mb-6">
        <h2 className="font-display font-bold text-lg mb-3">Platform health</h2>
        {health.error ? (
          <ErrorState error={health.error} onRetry={health.reload} />
        ) : health.loading && !health.data ? (
          <LoadingBlock rows={1} />
        ) : health.data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Kpi icon={Server} label="API" value={<StatusBadge value={health.data.api ? 'ACTIVE' : 'FAILURE'} label={health.data.api ? 'Online' : 'Down'} />} hint={`Uptime ${fmtUptime(health.data.uptimeSeconds)}`} />
            <Kpi icon={Database} label="Database" value={<StatusBadge value={health.data.database ? 'ACTIVE' : 'FAILURE'} label={health.data.database ? 'Connected' : 'Unreachable'} />} />
            <Kpi icon={Activity} label="Cache (Redis)" value={<StatusBadge value={health.data.redis ? 'ACTIVE' : 'ARCHIVED'} label={health.data.redis ? 'Active' : 'Not configured'} />} hint="In-process fallback when not configured" />
            <Kpi icon={Server} label="Environment" value={<span className="text-lg">{health.data.environment}</span>} />
          </div>
        ) : null}
      </section>

      <section aria-label="Usage" className="mb-6">
        <h2 className="font-display font-bold text-lg mb-3">Usage</h2>
        {analytics.error ? (
          <ErrorState error={analytics.error} onRetry={analytics.reload} />
        ) : analytics.loading && !analytics.data ? (
          <LoadingBlock rows={2} />
        ) : analytics.data ? (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <Kpi icon={Building2} label="Institutes" value={analytics.data.totalInstitutes} hint={`${analytics.data.activeInstitutes} active`} />
              <Kpi icon={GraduationCap} label="Students" value={analytics.data.totalStudents} />
              <Kpi icon={Users} label="Teachers" value={analytics.data.totalTeachers} />
              <Kpi icon={Activity} label="Logins, 24h" value={analytics.data.recentActivityCounts.activeLoginsLast24h} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
              <div className="paper-card p-4">
                <h3 className="font-primary font-bold text-sm mb-3">Recent activity</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-ink-muted">Assessments created</dt><dd className="font-data font-bold">{analytics.data.recentActivityCounts.assessmentsCreated}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-muted">Attendance records</dt><dd className="font-data font-bold">{analytics.data.recentActivityCounts.attendanceRecorded}</dd></div>
                </dl>
              </div>
              <div className="paper-card p-4">
                <h3 className="font-primary font-bold text-sm mb-3">Institutes by plan</h3>
                {plans.length === 0 ? (
                  <p className="text-sm text-ink-muted">No institutes yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {plans.map(([plan, n]) => (
                      <li key={plan} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-2 text-xs">
                        <span className="font-primary font-bold truncate">{plan}</span>
                        <span className="h-2 rounded-full bg-chip overflow-hidden">
                          <span className="block h-full bg-electric rounded-full" style={{ width: `${(n / maxPlan) * 100}%` }} />
                        </span>
                        <span className="font-data text-right">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section aria-label="Revenue" className="mb-6">
        <h2 className="font-display font-bold text-lg mb-3">Platform revenue (all institutes)</h2>
        {revenue.error ? (
          <ErrorState error={revenue.error} onRetry={revenue.reload} />
        ) : revenue.loading && !revenue.data ? (
          <LoadingBlock rows={1} />
        ) : revenue.data ? (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
              <Kpi icon={IndianRupee} label="Total collected" value={inr(revenue.data.totalCollected)} />
              <Kpi icon={TrendingUp} label="Total outstanding" value={inr(revenue.data.totalDue)} />
              <Kpi icon={Activity} label="Overdue" value={inr(revenue.data.totalOverdue)} />
              <Kpi icon={CreditCard} label="Online (Razorpay)" value={inr(revenue.data.byMode['RAZORPAY'] ?? 0)} hint="Collected via Razorpay" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Object.keys(revenue.data.byMode).length > 0 && (
                <div className="paper-card p-4">
                  <h3 className="font-primary font-bold text-sm mb-3">Collections by payment mode</h3>
                  <ul className="space-y-1.5">
                    {Object.entries(revenue.data.byMode).sort(([, a], [, b]) => b - a).map(([mode, amount]) => (
                      <li key={mode} className="flex justify-between items-center text-sm gap-3">
                        <span className="font-primary text-ink-secondary">{mode.replace(/_/g, ' ')}</span>
                        <span className="font-data font-bold text-ink-primary">{inr(amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {revenue.data.monthlyTrend.length > 0 && (
                <div className="paper-card p-4">
                  <h3 className="font-primary font-bold text-sm mb-3">Monthly trend (last {Math.min(6, revenue.data.monthlyTrend.length)} months)</h3>
                  {(() => {
                    const trend = revenue.data!.monthlyTrend.slice(-6);
                    const max = Math.max(1, ...trend.map((t) => t.amount));
                    return (
                      <ul className="space-y-1.5">
                        {trend.map(({ month, amount }) => (
                          <li key={month} className="grid grid-cols-[5rem_1fr_5rem] items-center gap-2 text-xs">
                            <span className="font-data text-ink-muted">{month}</span>
                            <span className="h-2 rounded-full bg-chip overflow-hidden">
                              <span className="block h-full bg-electric rounded-full" style={{ width: `${(amount / max) * 100}%` }} />
                            </span>
                            <span className="font-data text-right font-bold text-ink-primary">{inr(amount)}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              )}
            </div>
          </>
        ) : null}
      </section>

      <section aria-label="Lifecycle">
        <h2 className="font-display font-bold text-lg mb-3">Institute lifecycle</h2>
        {institutes.error ? (
          <ErrorState error={institutes.error} onRetry={institutes.reload} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {['ACTIVE', 'TRIAL', 'SUSPENDED', 'ARCHIVED'].map((s) => (
              <span key={s} className="paper-card px-4 py-2 flex items-center gap-3">
                <StatusBadge value={s} />
                <span className="font-data font-bold">{byStatus[s] ?? 0}</span>
              </span>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

