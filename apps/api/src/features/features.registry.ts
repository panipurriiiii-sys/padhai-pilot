import type { FeatureDefinition, FeatureKey, SubscriptionPlan } from '@padhai-pilot/shared';

/**
 * Authoritative Canonical Feature Registry for PadhaiPilot Platform
 * Every feature supported in the platform must be registered here with strict schema metadata.
 */
export const FEATURE_REGISTRY: Record<FeatureKey, FeatureDefinition> = {
  attendance: {
    key: 'attendance',
    name: 'Daily Attendance Register',
    description: 'Classroom roll call, biometric sync, headcounts, and attendance status tracking',
    module: 'ACADEMIC_OPS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'MEDIUM',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 100, // max active students
      GROWTH: 500,
      PRO: 2000,
      ENTERPRISE: null, // unlimited
    },
  },
  assignments: {
    key: 'assignments',
    name: 'Assignments & Homework',
    description: 'Digital homework creation, submission deadlines, file attachments, and grading',
    module: 'ACADEMIC_OPS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'LOW',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: false,
    defaultQuotaByPlan: {
      STARTER: 25, // active assignments
      GROWTH: 100,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  bulk_marks_entry: {
    key: 'bulk_marks_entry',
    name: 'Bulk Marks & Evaluations Sheet',
    description: 'Spreadsheet-style classroom evaluation, auto percentage & grade computation',
    module: 'ASSESSMENT',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'HIGH',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 10, // assessments per month
      GROWTH: 50,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  exam_management: {
    key: 'exam_management',
    name: 'Exams & Periodic Quizzes',
    description: 'Exam scheduling, seating layouts, invigilation duty, and question paper links',
    module: 'ASSESSMENT',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'MEDIUM',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 5,
      GROWTH: 25,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  question_bank: {
    key: 'question_bank',
    name: 'Curated Question Bank',
    description: 'Centralized repository of MCQ, Numerical, and Subjective questions by chapter',
    module: 'ASSESSMENT',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'LOW',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: false,
    defaultQuotaByPlan: {
      STARTER: 100, // items
      GROWTH: 1000,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  published_results: {
    key: 'published_results',
    name: 'Result Publishing & Student Feed',
    description: 'Official result release workflow with verified publishing audit stamps',
    module: 'ASSESSMENT',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'HIGH',
    dependencies: ['bulk_marks_entry'],
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 10,
      GROWTH: 50,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  staff_leave_management: {
    key: 'staff_leave_management',
    name: 'Staff & Faculty Leave Tracking',
    description: 'Leave request applications, substitute teacher assignments, and approvals',
    module: 'ACADEMIC_OPS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'MEDIUM',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 5, // faculty members
      GROWTH: 20,
      PRO: 100,
      ENTERPRISE: null,
    },
  },
  timetable: {
    key: 'timetable',
    name: 'Weekly Timetable & Schedule',
    description: 'Room and lecture slot allocation, recurring faculty weekly timetable',
    module: 'ACADEMIC_OPS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'LOW',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: false,
    defaultQuotaByPlan: {
      STARTER: 2, // batches
      GROWTH: 10,
      PRO: 50,
      ENTERPRISE: null,
    },
  },
  lesson_planning: {
    key: 'lesson_planning',
    name: 'Lesson Planning & Syllabus Tracker',
    description: 'Curriculum milestones, lecture chapter plans, and completion indicators',
    module: 'ACADEMIC_OPS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'LOW',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: false,
    defaultQuotaByPlan: {
      STARTER: 10,
      GROWTH: 50,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  pdf_generation: {
    key: 'pdf_generation',
    name: 'Single Document & PDF Generation',
    description: 'Individual assessment report cards, attendance transcripts, and receipts',
    module: 'SYSTEM_BRANDING',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'MEDIUM',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: false,
    defaultQuotaByPlan: {
      STARTER: 100, // per month
      GROWTH: 1000,
      PRO: 10000,
      ENTERPRISE: null,
    },
  },
  bulk_pdf_generation: {
    key: 'bulk_pdf_generation',
    name: 'Bulk Batch PDF Generation',
    description: 'Asynchronous generation of entire batch report cards and archive ZIPs',
    module: 'SYSTEM_BRANDING',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'HIGH',
    dependencies: ['pdf_generation'],
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 0, // Not permitted in Starter
      GROWTH: 5, // 5 bulk runs/mo
      PRO: 50,
      ENTERPRISE: null,
    },
  },
  bulk_import: {
    key: 'bulk_import',
    name: 'Bulk CSV / Excel Student Import',
    description: 'Validated batch ingestion of student rosters and historical academic marks',
    module: 'ACADEMIC_OPS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'HIGH',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 0, // Excluded
      GROWTH: 5,
      PRO: 50,
      ENTERPRISE: null,
    },
  },
  bulk_export: {
    key: 'bulk_export',
    name: 'Bulk Data & Compliance Export',
    description: 'Full institutional export of student rosters, attendance logs, and marks in CSV',
    module: 'ACADEMIC_OPS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'HIGH',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 1, // 1 export/mo
      GROWTH: 10,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  fee_management: {
    key: 'fee_management',
    name: 'Fee Structure & Dues Register',
    description: 'Installment tracking, pending fee registers, and receipt generation',
    module: 'FINANCE',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'CRITICAL',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 0, // Finance excluded in Starter
      GROWTH: 200,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  fee_reminders: {
    key: 'fee_reminders',
    name: 'Automated Fee Reminders',
    description: 'Scheduled SMS and WhatsApp pending fee reminder dispatches',
    module: 'FINANCE',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'CRITICAL',
    dependencies: ['fee_management'],
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 0,
      GROWTH: 100, // SMS quota/mo
      PRO: 1000,
      ENTERPRISE: null,
    },
  },
  announcements: {
    key: 'announcements',
    name: 'Announcements & Noticeboard',
    description: 'Broadcast alerts to batches with priority flags (NORMAL / URGENT)',
    module: 'COMMUNICATIONS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'LOW',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: false,
    defaultQuotaByPlan: {
      STARTER: 20,
      GROWTH: 100,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  in_app_notifications: {
    key: 'in_app_notifications',
    name: 'In-App Student & Teacher Notifications',
    description: 'Real-time in-app notification center for results, tests, and attendance notices',
    module: 'COMMUNICATIONS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'LOW',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: false,
    defaultQuotaByPlan: {
      STARTER: 500,
      GROWTH: 5000,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  email_notifications: {
    key: 'email_notifications',
    name: 'Transactional Email Alerts',
    description: 'Automated email dispatch for password resets, student invites, and summaries',
    module: 'COMMUNICATIONS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'MEDIUM',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 50,
      GROWTH: 500,
      PRO: 5000,
      ENTERPRISE: null,
    },
  },
  advanced_reports: {
    key: 'advanced_reports',
    name: 'Advanced Reports & Faculty KPIs',
    description: 'Cross-batch performance trends, attendance drop-off alerts, and faculty metrics',
    module: 'REPORTS_ANALYTICS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'LOW',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: false,
    defaultQuotaByPlan: {
      STARTER: 0, // Not in Starter
      GROWTH: 1, // Standard analytics
      PRO: null,
      ENTERPRISE: null,
    },
  },
  white_label_branding: {
    key: 'white_label_branding',
    name: 'White-Label Branding & Colors',
    description: 'Custom institute logo, primary theme tints, custom PDF headers, and portals',
    module: 'SYSTEM_BRANDING',
    defaultGloballyEnabled: true,
    isKillSwitchable: false,
    securityImpact: 'LOW',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 0, // Excluded
      GROWTH: 0,
      PRO: 1,
      ENTERPRISE: 1,
    },
  },
  custom_domains: {
    key: 'custom_domains',
    name: 'Custom Domain Routing (CNAME)',
    description: 'Dedicated portal address e.g. student.apexacademy.com',
    module: 'SYSTEM_BRANDING',
    defaultGloballyEnabled: true,
    isKillSwitchable: false,
    securityImpact: 'MEDIUM',
    dependencies: ['white_label_branding'],
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 0,
      GROWTH: 0,
      PRO: 1,
      ENTERPRISE: 5,
    },
  },
  parent_portal: {
    key: 'parent_portal',
    name: 'Parent / Guardian Portal',
    description: 'Dedicated login for parents to inspect child attendance and marks cards',
    module: 'STUDENT_PORTAL',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'HIGH',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: true,
    defaultQuotaByPlan: {
      STARTER: 0,
      GROWTH: 0,
      PRO: null,
      ENTERPRISE: null,
    },
  },
  mobile_features: {
    key: 'mobile_features',
    name: 'React Native Mobile Capabilities',
    description: 'Mobile offline attendance sync, camera QR scanning, and push notifications',
    module: 'ACADEMIC_OPS',
    defaultGloballyEnabled: true,
    isKillSwitchable: true,
    securityImpact: 'MEDIUM',
    applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
    auditRequired: false,
    defaultQuotaByPlan: {
      STARTER: 0,
      GROWTH: 1,
      PRO: 1,
      ENTERPRISE: 1,
    },
  },
};

/**
 * Helper to fetch a registered feature definition or throw if unknown
 */
export function getRegisteredFeature(key: FeatureKey): FeatureDefinition {
  const def = FEATURE_REGISTRY[key];
  if (!def) {
    throw new Error(`Unregistered feature key: "${key}". Features must be authoritatively registered in FEATURE_REGISTRY.`);
  }
  return def;
}

/**
 * Return all registered features
 */
export function getAllRegisteredFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY);
}

