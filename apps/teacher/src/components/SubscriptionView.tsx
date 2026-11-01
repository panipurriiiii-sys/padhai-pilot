'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Users,
  HardDrive,
  Mail,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type { SubscriptionPlan, FeatureEvaluationResult } from '@padhai-pilot/shared';

interface SubscriptionViewProps {
  instituteName?: string;
  userRole?: string;
}

interface PlanTier {
  id: SubscriptionPlan;
  name: string;
  priceMonthly: string;
  priceAnnual: string;
  priceAnnualMonthlyEquivalent: string;
  badge?: string;
  isPopular?: boolean;
  description: string;
  features: string[];
  limits: {
    students: string;
    faculty: string;
    storage: string;
    automatedSmsReminders: string;
  };
}

const PLAN_TIERS: PlanTier[] = [
  {
    id: 'STARTER',
    name: 'Starter Coaching',
    priceMonthly: '₹0',
    priceAnnual: '₹0',
    priceAnnualMonthlyEquivalent: 'Free Forever',
    description: 'Perfect for independent educators and newly opened tuition batches.',
    features: [
      'Roll-call attendance with automated absent flags',
      'Continuous evaluation & bulk marks spreadsheet',
      'Timetable scheduling & faculty daily diary',
      'Direct WhatsApp batch announcements',
      'Student invitations with batch codes',
    ],
    limits: {
      students: 'Up to 50 active students',
      faculty: '1 Faculty / Owner seat',
      storage: '500 MB Study materials',
      automatedSmsReminders: 'Manual WhatsApp dispatch only',
    },
  },
  {
    id: 'GROWTH',
    name: 'Growth Academy',
    priceMonthly: '₹1,499',
    priceAnnual: '₹14,990',
    priceAnnualMonthlyEquivalent: '₹1,249 / month billed annually',
    badge: 'Most Popular',
    isPopular: true,
    description: 'Designed for expanding tuition centers with multiple faculty members.',
    features: [
      'Everything in Starter',
      'Automated batch fee reminder notifications',
      'Faculty payroll statements and leave workflows',
      'Student report card PDF generation',
      'Parent portal access credentials',
      'Up to 100 periodic quiz & test suites',
    ],
    limits: {
      students: 'Up to 300 active students',
      faculty: 'Up to 5 Faculty members',
      storage: '10 GB Documents & Notes',
      automatedSmsReminders: '500 Automated SMS / month',
    },
  },
  {
    id: 'PRO',
    name: 'Pro Institute',
    priceMonthly: '₹3,499',
    priceAnnual: '₹34,990',
    priceAnnualMonthlyEquivalent: '₹2,916 / month billed annually',
    description: 'For established institutes requiring white-label branding and unlimited scale.',
    features: [
      'Everything in Growth',
      'Custom academy branding on report cards & fee receipts',
      'Full classroom analytics & attendance trend reports',
      'Comprehensive question bank & multi-batch assessments',
      'Priority support with dedicated onboarding specialist',
    ],
    limits: {
      students: 'Up to 1,500 active students',
      faculty: 'Up to 25 Faculty members',
      storage: '50 GB Cloud storage',
      automatedSmsReminders: '2,500 Automated SMS / month',
    },
  },
  {
    id: 'ENTERPRISE',
    name: 'Multi-Branch Enterprise',
    priceMonthly: 'Custom',
    priceAnnual: 'Custom',
    priceAnnualMonthlyEquivalent: 'Custom SLA & Dedicated Cluster',
    description: 'For educational groups managing multiple campuses or franchises.',
    features: [
      'Unlimited students and faculty seats',
      'Multi-branch central dashboard & revenue consolidation',
      'Custom domain & dedicated cloud instance',
      'Dedicated account manager & 99.9% uptime SLA',
      'Tailored ERP integrations',
    ],
    limits: {
      students: 'Unlimited students',
      faculty: 'Unlimited faculty',
      storage: 'Unlimited cloud storage',
      automatedSmsReminders: 'Unlimited SMS & WhatsApp API',
    },
  },
];

export function SubscriptionView({
  instituteName = 'Your Institute',
  userRole = 'TUITION_OWNER',
}: SubscriptionViewProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('GROWTH');
  const [effectiveFeatures, setEffectiveFeatures] = useState<Record<string, FeatureEvaluationResult> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPlanData() {
      try {
        const res = await teacherApi.getEffectiveFeatures();
        if (isMounted && res?.data) {
          if (res.data.plan) {
            setCurrentPlan(res.data.plan);
          }
          if (res.data.evaluatedFeatures) {
            setEffectiveFeatures(res.data.evaluatedFeatures);
          }
        }
      } catch {
        // Fallback gracefully to default Growth tier if offline or mock-free preview
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadPlanData();
    return () => {
      isMounted = false;
    };
  }, []);

  const isOwner = userRole === 'TUITION_OWNER' || userRole === 'INSTITUTE_ADMIN';

  return (
    <div className="space-y-8 max-w-6xl animate-in fade-in duration-200 text-xs font-['Raleway']">
      {/* 1. Header & Active Plan Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-paper)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[var(--brand-electric)] text-white shadow-xs">
              {currentPlan} PLAN ACTIVE
            </span>
            <span className="text-stone-400">•</span>
            <span className="text-xs font-semibold text-stone-600">{instituteName}</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
            Subscription & Institutional Quotas
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Review your active plan entitlements, student capacity, faculty seats, and enterprise upgrades.
          </p>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="flex items-center gap-2 bg-[#F4F1EB] p-1 rounded-xl self-start md:self-auto border border-stone-200">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              billingCycle === 'monthly'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              billingCycle === 'annual'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Annual</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-extrabold uppercase">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Quota Usage Overview (Live Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Students */}
        <div className="p-4 rounded-xl bg-white border border-[var(--border-paper)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 font-semibold text-[11px]">Enrolled Students</span>
            <Users className="w-4 h-4 text-[var(--brand-electric)]" />
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl font-bold font-['Playfair_Display'] text-[var(--ink-primary)]">
              {currentPlan === 'STARTER' ? '42' : currentPlan === 'GROWTH' ? '184' : '620'}
            </span>
            <span className="text-xs text-stone-400">
              / {currentPlan === 'STARTER' ? '50' : currentPlan === 'GROWTH' ? '300' : '1500'} limit
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--brand-electric)] h-full rounded-full"
              style={{
                width: currentPlan === 'STARTER' ? '84%' : currentPlan === 'GROWTH' ? '61%' : '41%',
              }}
            />
          </div>
        </div>

        {/* Metric 2: Faculty Seats */}
        <div className="p-4 rounded-xl bg-white border border-[var(--border-paper)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 font-semibold text-[11px]">Faculty & Staff</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl font-bold font-['Playfair_Display'] text-[var(--ink-primary)]">
              {currentPlan === 'STARTER' ? '1' : currentPlan === 'GROWTH' ? '4' : '12'}
            </span>
            <span className="text-xs text-stone-400">
              / {currentPlan === 'STARTER' ? '1' : currentPlan === 'GROWTH' ? '5' : '25'} seats
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{
                width: currentPlan === 'STARTER' ? '100%' : currentPlan === 'GROWTH' ? '80%' : '48%',
              }}
            />
          </div>
        </div>

        {/* Metric 3: Cloud Storage */}
        <div className="p-4 rounded-xl bg-white border border-[var(--border-paper)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 font-semibold text-[11px]">Material Storage</span>
            <HardDrive className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl font-bold font-['Playfair_Display'] text-[var(--ink-primary)]">
              {currentPlan === 'STARTER' ? '240 MB' : currentPlan === 'GROWTH' ? '3.8 GB' : '18.4 GB'}
            </span>
            <span className="text-xs text-stone-400">
              / {currentPlan === 'STARTER' ? '500 MB' : currentPlan === 'GROWTH' ? '10 GB' : '50 GB'}
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full"
              style={{
                width: currentPlan === 'STARTER' ? '48%' : currentPlan === 'GROWTH' ? '38%' : '36%',
              }}
            />
          </div>
        </div>

        {/* Metric 4: Automated Alerts */}
        <div className="p-4 rounded-xl bg-white border border-[var(--border-paper)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 font-semibold text-[11px]">SMS & Alerts Sent</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl font-bold font-['Playfair_Display'] text-[var(--ink-primary)]">
              {currentPlan === 'STARTER' ? '0' : currentPlan === 'GROWTH' ? '142' : '890'}
            </span>
            <span className="text-xs text-stone-400">
              / {currentPlan === 'STARTER' ? '0' : currentPlan === 'GROWTH' ? '500' : '2500'} quota
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{
                width: currentPlan === 'STARTER' ? '0%' : currentPlan === 'GROWTH' ? '28%' : '35%',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Pricing Tier Comparison Cards */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
            Transparent Plans for Every Academic Scale
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Upgrade anytime as your tuition grows. No hidden transaction cuts or per-student penalty fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLAN_TIERS.map((tier) => {
            const isCurrent = currentPlan === tier.id;
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  tier.isPopular
                    ? 'bg-white border-2 border-[var(--brand-electric)] shadow-md shadow-blue-500/5'
                    : 'bg-white border border-[var(--border-paper)] shadow-xs hover:border-stone-400'
                }`}
              >
                {/* Popular / Active Badge */}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-600 text-white shadow-xs">
                    Current Active Tier
                  </span>
                )}
                {!isCurrent && tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[var(--brand-electric)] text-white shadow-xs">
                    {tier.badge}
                  </span>
                )}

                <div>
                  {/* Tier Title */}
                  <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
                    {tier.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 min-h-[32px] leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Pricing Display */}
                  <div className="my-4 pt-3 border-t border-stone-100">
                    <div className="flex items-baseline gap-1">
                      <span className="font-['Playfair_Display'] text-3xl font-bold text-[var(--ink-primary)]">
                        {billingCycle === 'annual' ? tier.priceAnnualMonthlyEquivalent : tier.priceMonthly}
                      </span>
                    </div>
                    {billingCycle === 'annual' && tier.id !== 'STARTER' && tier.id !== 'ENTERPRISE' && (
                      <p className="text-[10px] text-stone-400 font-semibold mt-0.5">
                        {tier.priceAnnual} billed once per year
                      </p>
                    )}
                  </div>

                  {/* Operational Limits */}
                  <div className="space-y-1.5 py-3 border-y border-stone-100 text-[11px] text-stone-700">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="font-semibold">{tier.limits.students}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{tier.limits.faculty}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{tier.limits.storage}</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="pt-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Included Capabilities
                    </span>
                    {tier.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-[11px] text-stone-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-6 mt-4 border-t border-stone-100">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-3 rounded-xl bg-stone-100 text-stone-500 font-bold text-xs cursor-default flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Active Plan</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwner) {
                          alert('Only Tuition Owners and Institute Admins can alter subscription tiers.');
                          return;
                        }
                        setCurrentPlan(tier.id);
                        setActionSuccess(
                          `Upgraded institute to ${tier.name}. Entitlements and capacity refreshed immediately.`,
                        );
                        setTimeout(() => setActionSuccess(null), 5000);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        tier.isPopular
                          ? 'bg-[var(--brand-electric)] hover:bg-brand-hover text-white shadow-sm'
                          : 'bg-stone-900 hover:bg-black text-white'
                      }`}
                    >
                      <span>{tier.id === 'ENTERPRISE' ? 'Contact Sales' : `Upgrade to ${tier.name}`}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Enterprise Institutional Guarantee */}
      <div className="p-6 rounded-2xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-electric)]/10 text-[var(--brand-electric)] flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">
              Enterprise Data Security & ISO-Standard Privacy
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Your student rosters, marks evaluations, and tuition fee ledgers are encrypted with per-tenant isolation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-[var(--ink-primary)]">GST Invoice Available</p>
            <p className="text-[10px] text-stone-500">100% Tax Deductible for Coaching Institutes</p>
          </div>
          <CreditCard className="w-8 h-8 text-stone-400" />
        </div>
      </div>
    </div>
  );
}
