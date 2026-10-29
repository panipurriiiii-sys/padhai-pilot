/**
 * Authoritative Feature Keys for PadhaiPilot SaaS Platform
 */
export type FeatureKey = 'attendance' | 'assignments' | 'bulk_marks_entry' | 'exam_management' | 'question_bank' | 'published_results' | 'staff_leave_management' | 'timetable' | 'lesson_planning' | 'pdf_generation' | 'bulk_pdf_generation' | 'bulk_import' | 'bulk_export' | 'fee_management' | 'fee_reminders' | 'announcements' | 'in_app_notifications' | 'email_notifications' | 'advanced_reports' | 'white_label_branding' | 'custom_domains' | 'parent_portal' | 'mobile_features';
/**
 * Standard Commercial Subscription Plans
 */
export type SubscriptionPlan = 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';
/**
 * Feature Evaluation Decision Status
 */
export type FeatureStatus = 'ACTIVE' | 'GLOBALLY_DISABLED' | 'EMERGENCY_KILLED' | 'PLAN_RESTRICTED' | 'INSTITUTE_DISABLED' | 'PERMISSION_DENIED' | 'QUOTA_EXCEEDED';
/**
 * Module Classification for Features
 */
export type FeatureModule = 'ACADEMIC_OPS' | 'ASSESSMENT' | 'STUDENT_PORTAL' | 'COMMUNICATIONS' | 'FINANCE' | 'REPORTS_ANALYTICS' | 'SYSTEM_BRANDING';
/**
 * Detailed Metadata for a Feature Definition
 */
export interface FeatureDefinition {
    key: FeatureKey;
    name: string;
    description: string;
    module: FeatureModule;
    defaultGloballyEnabled: boolean;
    isKillSwitchable: boolean;
    securityImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dependencies?: FeatureKey[];
    defaultQuotaByPlan?: Record<SubscriptionPlan, number | null>;
    applicableScopes: ('PLATFORM' | 'PLAN' | 'INSTITUTE')[];
    auditRequired: boolean;
}
/**
 * Quota Usage State
 */
export interface FeatureQuotaStatus {
    limit: number | null;
    used: number;
    remaining: number | null;
    period: string;
}
/**
 * Result of Deterministic Feature Evaluation
 */
export interface FeatureEvaluationResult {
    featureKey: FeatureKey;
    isAvailable: boolean;
    status: FeatureStatus;
    reason?: string;
    requiredPlan?: SubscriptionPlan;
    quota?: FeatureQuotaStatus;
    evaluatedAt: string;
}
/**
 * Effective Features Matrix for a specific institute
 */
export interface InstituteEffectiveFeatures {
    instituteId: string;
    instituteName: string;
    plan: SubscriptionPlan;
    isInstituteActive: boolean;
    evaluatedFeatures: Record<FeatureKey, FeatureEvaluationResult>;
    evaluatedAt: string;
}
/**
 * Administrative Feature Audit Log Entry
 */
export interface FeatureAuditLogItem {
    id: string;
    featureKey: FeatureKey;
    actorId: string;
    actorEmail: string;
    scope: 'PLATFORM' | 'PLAN' | 'INSTITUTE';
    targetInstituteId?: string | null;
    action: 'GLOBAL_TOGGLE' | 'EMERGENCY_KILL' | 'EMERGENCY_RESTORE' | 'PLAN_UPDATE' | 'INSTITUTE_OVERRIDE' | 'QUOTA_UPDATE';
    previousValue?: any;
    newValue?: any;
    reason?: string | null;
    createdAt: string;
}
/**
 * DTOs for Admin Control Plane Operations
 */
export interface UpdateGlobalFeatureFlagDto {
    featureKey: FeatureKey;
    isGloballyEnabled: boolean;
    reason?: string;
}
export interface EmergencyKillSwitchDto {
    featureKey: FeatureKey;
    reason: string;
    confirmCode: string;
}
export interface UpdatePlanEntitlementDto {
    plan: SubscriptionPlan;
    featureKey: FeatureKey;
    isIncluded: boolean;
    quotaLimit?: number | null;
    reason?: string;
}
export interface UpdateInstituteFeatureConfigDto {
    instituteId: string;
    featureKey: FeatureKey;
    isEnabled: boolean;
    customQuota?: number | null;
    reason?: string;
}
