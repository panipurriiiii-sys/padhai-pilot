export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const formatInr = (amount?: number | null): string => `₹${(amount ?? 0).toLocaleString('en-IN')}`;

/** yyyy-mm-dd in the device's local calendar day (what the attendance API expects). */
export const todayIso = (): string => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const errorMessage = (err: unknown, fallback = 'Something went wrong. Please try again.'): string =>
  err instanceof Error && err.message ? err.message : fallback;

export const STAFF_ROLES = ['TEACHER', 'FACULTY', 'TUITION_OWNER', 'INSTITUTE_MANAGER', 'INSTITUTE_ADMIN'];
export const isStaffRole = (role?: string | null): boolean => !!role && STAFF_ROLES.includes(role);
