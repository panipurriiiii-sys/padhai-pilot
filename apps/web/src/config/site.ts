/**
 * Public-site configuration. Nothing here is invented marketing data:
 * - portal links, contact address and pricing come from environment configuration;
 * - plan limits mirror the platform's feature registry (attendance quota = active students).
 * When a value is not configured the site says so (e.g. "Contact us") instead of showing a number.
 */

export interface PlanConfig {
  id: 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';
  name: string;
  /** Active students included; null = unlimited. Mirrors defaultQuotaByPlan.attendance in the API feature registry. */
  students: number | null;
  /** Display price from NEXT_PUBLIC_PRICING_JSON, e.g. {"STARTER":"Rs 999 / month"}. Undefined = not published. */
  price?: string;
}

function readPricing(): Record<string, string> {
  try {
    const raw = process.env.NEXT_PUBLIC_PRICING_JSON;
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

const pricing = readPricing();

export const PLANS: PlanConfig[] = [
  { id: 'STARTER', name: 'Starter', students: 100, price: pricing.STARTER },
  { id: 'GROWTH', name: 'Growth', students: 500, price: pricing.GROWTH },
  { id: 'PRO', name: 'Pro', students: 2000, price: pricing.PRO },
  { id: 'ENTERPRISE', name: 'Enterprise', students: null, price: pricing.ENTERPRISE },
];

export const SITE = {
  name: 'PadhaiPilot',
  tagline: 'Tuition operations for institutes, teachers and students',
  teacherUrl: process.env.NEXT_PUBLIC_TEACHER_URL || '',
  studentUrl: process.env.NEXT_PUBLIC_STUDENT_URL || '',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
};
