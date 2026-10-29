'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Building,
  GraduationCap,
  Calendar,
  X,
  Plus,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type {
  FacultyMember,
  CreateFacultyDto,
  BatchSummary,
  DelegatedPermission,
  CompensationType,
} from '@padhai-pilot/shared';

interface FacultyManagementViewProps {
  batches: BatchSummary[];
  instituteName?: string;
}

const ALL_PERMISSIONS: { key: DelegatedPermission; label: string; desc: string }[] = [
  { key: 'MANAGE_ATTENDANCE', label: 'Mark Attendance', desc: 'Can take and modify daily attendance registers' },
  { key: 'MANAGE_MARKS', label: 'Marks & Evaluations', desc: 'Can enter and publish exam marks and grades' },
  { key: 'PUBLISH_DIARY', label: 'Daily Lesson Diary', desc: 'Can publish lessons to student batch feeds' },
  { key: 'MANAGE_TIMETABLE', label: 'Schedule Timetable', desc: 'Can modify lecture slots and rooms' },
  { key: 'VIEW_FEES', label: 'View Student Dues', desc: 'Can view outstanding fees for enrolled students' },
  { key: 'APPROVE_LEAVES', label: 'Review Leaves', desc: 'Can review peer faculty leave applications' },
];

export function FacultyManagementView({
  batches,
  instituteName = 'Apex IIT-JEE & Medical Academy',
}: FacultyManagementViewProps) {
  const [faculties, setFaculties] = useState<FacultyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);

  // New Faculty Modal Form
  const [newFaculty, setNewFaculty] = useState<CreateFacultyDto>({
    fullName: '',
    email: '',
    phone: '',
    staffId: `FAC-${Math.floor(100 + Math.random() * 900)}`,
    designation: 'Faculty in Mathematics',
    compensationType: 'FIXED_MONTHLY',
    baseSalary: 65000,
    hourlyRate: 1500,
    assignedSubjects: ['Mathematics'],
    delegatedPermissions: ['MANAGE_ATTENDANCE', 'MANAGE_MARKS', 'PUBLISH_DIARY'],
    batchIds: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadFaculties();
  }, []);

  async function loadFaculties() {
    setIsLoading(true);
    try {
      const data = await teacherApi.getFaculties();
      setFaculties(data);
      if (data.length > 0 && !selectedFaculty) {
        setSelectedFaculty(data[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateFaculty(e: React.FormEvent) {
    e.preventDefault();
    if (!newFaculty.fullName.trim() || !newFaculty.email.trim()) {
      alert('Please fill in Full Name and Email Address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await teacherApi.createFaculty(newFaculty);
      setFaculties((prev) => [created, ...prev]);
      setSelectedFaculty(created);
      setShowInviteModal(false);
      setToastMessage(`Faculty invitation issued to ${created.fullName} (${created.staffId})!`);
      setTimeout(() => setToastMessage(null), 4000);

      // Reset
      setNewFaculty({
        fullName: '',
        email: '',
        phone: '',
        staffId: `FAC-${Math.floor(100 + Math.random() * 900)}`,
        designation: 'Faculty in Science',
        compensationType: 'FIXED_MONTHLY',
        baseSalary: 65000,
        hourlyRate: 1500,
        assignedSubjects: ['Physics'],
        delegatedPermissions: ['MANAGE_ATTENDANCE', 'MANAGE_MARKS', 'PUBLISH_DIARY'],
        batchIds: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredFaculties = faculties.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.fullName.toLowerCase().includes(q) ||
      f.staffId.toLowerCase().includes(q) ||
      f.designation.toLowerCase().includes(q) ||
      f.assignedSubjects.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-['Raleway'] font-bold text-xs shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-paper)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-widest text-[var(--brand-electric)]">
              Tuition Owner • Human Resources & Faculty
            </span>
            <span className="badge-code font-['Inter'] text-[10px]">STAFF DIRECTORY</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold tracking-tight text-[var(--ink-primary)] mt-1">
            Faculty & Workload Roster
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Manage teaching faculty, track weekly teaching workloads, and configure delegated operational permissions.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary self-start md:self-auto text-xs font-['Raleway'] font-bold px-4 py-2.5 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite New Faculty
        </button>
      </div>

      {/* Main Grid: List (7 cols) + Selected Faculty Profile (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Faculty List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Bar */}
          <div className="paper-card p-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--ink-muted)] shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Search faculty by name, staff ID, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 text-xs font-['Raleway'] text-[var(--ink-primary)] focus:outline-none placeholder:text-[var(--ink-faint)]"
            />
          </div>

          {isLoading ? (
            <div className="paper-card p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
              Loading faculty members...
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaculties.map((fac) => {
                const isSelected = selectedFaculty?.id === fac.id;
                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFaculty(fac)}
                    className={`paper-card p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[var(--brand-electric)] shadow-[0_2px_12px_rgba(22,119,255,0.18)] bg-[var(--bg-paper)]'
                        : 'hover:border-stone-400 bg-[var(--bg-paper-warm)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-[var(--brand-electric)] text-white font-['Playfair_Display'] font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                          {fac.fullName.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)]">
                              {fac.fullName}
                            </h3>
                            <span className="badge-code font-['Inter'] text-[10px]">
                              {fac.staffId}
                            </span>
                          </div>
                          <p className="font-['Raleway'] text-xs text-[var(--ink-secondary)] mt-0.5">
                            {fac.designation}
                          </p>

                          {/* Subjects Pill */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {fac.assignedSubjects.map((sub, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[10px] font-['Raleway'] font-semibold text-[var(--ink-secondary)]"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Workload & Status */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-['Raleway'] font-bold uppercase tracking-wider ${
                            fac.employmentStatus === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {fac.employmentStatus}
                        </span>

                        <div className="text-right">
                          <span className="font-['Inter'] text-xs font-bold text-[var(--ink-primary)] block">
                            {fac.weeklyLectureCount} hrs/wk
                          </span>
                          <span className="font-['Raleway'] text-[10px] text-[var(--ink-muted)]">
                            {fac.assignedBatchesCount} Batches Assigned
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detailed Profile Card */}
        <div className="lg:col-span-5">
          {selectedFaculty ? (
            <div className="paper-card p-6 sticky top-6 space-y-5 bg-[var(--bg-paper)] shadow-md">
              {/* Header */}
              <div className="flex items-start gap-4 pb-4 border-b border-[var(--border-paper)]">
                <div className="w-12 h-12 rounded-xl bg-[var(--brand-electric)] text-white font-['Playfair_Display'] font-bold flex items-center justify-center text-lg shrink-0 shadow-sm">
                  {selectedFaculty.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)] truncate">
                    {selectedFaculty.fullName}
                  </h3>
                  <p className="font-['Raleway'] text-xs text-[var(--ink-muted)]">
                    {selectedFaculty.designation}
                  </p>
                  <span className="badge-code font-['Inter'] text-[10px] mt-1 inline-block">
                    Staff ID: {selectedFaculty.staffId}
                  </span>
                </div>
              </div>

              {/* Contact & Terms */}
              <div className="space-y-2.5 text-xs font-['Raleway']">
                <div className="flex items-center gap-2.5 text-[var(--ink-secondary)]">
                  <Mail className="w-4 h-4 text-[var(--ink-muted)] shrink-0" />
                  <span className="truncate">{selectedFaculty.email}</span>
                </div>
                {selectedFaculty.phone && (
                  <div className="flex items-center gap-2.5 text-[var(--ink-secondary)]">
                    <Phone className="w-4 h-4 text-[var(--ink-muted)] shrink-0" />
                    <span>{selectedFaculty.phone}</span>
                  </div>
                )}
                {selectedFaculty.emergencyContact && (
                  <div className="text-[11px] text-[var(--ink-muted)] bg-[var(--bg-surface-subtle)] p-2 rounded-lg border border-[var(--border-paper)]">
                    <strong>Emergency:</strong> {selectedFaculty.emergencyContact}
                  </div>
                )}
              </div>

              {/* Compensation Terms */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] space-y-2">
                <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
                  Compensation Model
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)]">
                    {selectedFaculty.compensationType === 'FIXED_MONTHLY'
                      ? 'Fixed Monthly Remuneration'
                      : 'Per-Class / Hourly Model'}
                  </span>
                  <span className="font-['Inter'] text-sm font-bold text-[var(--brand-electric)]">
                    {selectedFaculty.compensationType === 'FIXED_MONTHLY'
                      ? `₹${selectedFaculty.baseSalary.toLocaleString()}/mo`
                      : `₹${selectedFaculty.hourlyRate.toLocaleString()}/class`}
                  </span>
                </div>
              </div>

              {/* Assigned Batches */}
              <div>
                <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)] block mb-2">
                  Assigned Coaching Batches
                </span>
                {selectedFaculty.assignedBatches && selectedFaculty.assignedBatches.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedFaculty.assignedBatches.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] text-xs font-['Raleway']"
                      >
                        <span className="font-semibold text-[var(--ink-primary)] truncate">
                          {b.name}
                        </span>
                        <span className="badge-code font-['Inter'] text-[10px]">
                          {b.code}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-['Raleway'] text-[var(--ink-muted)]">
                    No batches currently assigned.
                  </p>
                )}
              </div>

              {/* Delegated Permissions */}
              <div>
                <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)] block mb-2">
                  Delegated Operational Roles
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFaculty.delegatedPermissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-1 rounded-md bg-blue-50 text-[var(--brand-electric)] border border-blue-200 text-[10px] font-['Raleway'] font-bold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-[var(--brand-electric)] shrink-0" />
                      {perm.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="paper-card p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
              Select a faculty to inspect profile.
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* INVITE FACULTY MODAL */}
      {/* ------------------------------------------------------------------- */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="paper-card p-6 md:p-8 max-w-xl w-full space-y-5 bg-[var(--bg-paper)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
              <div>
                <h3 className="font-['Playfair_Display'] text-xl font-bold text-[var(--ink-primary)]">
                  Invite Faculty Member
                </h3>
                <p className="font-['Raleway'] text-xs text-[var(--ink-muted)]">
                  Create faculty profile and send coaching access credentials.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Prof. / Dr. ..."
                    value={newFaculty.fullName}
                    onChange={(e) => setNewFaculty({ ...newFaculty, fullName: e.target.value })}
                    className="input-paper w-full text-xs font-['Raleway'] py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Staff Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFaculty.staffId}
                    onChange={(e) => setNewFaculty({ ...newFaculty, staffId: e.target.value })}
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="faculty@tuition.com"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                    className="input-paper w-full text-xs font-['Raleway'] py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 ..."
                    value={newFaculty.phone || ''}
                    onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })}
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Designation / Academic Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Faculty & HOD Mathematics"
                  value={newFaculty.designation}
                  onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                  className="input-paper w-full text-xs font-['Raleway'] py-2"
                />
              </div>

              {/* Compensation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)]">
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Compensation Model
                  </label>
                  <select
                    value={newFaculty.compensationType}
                    onChange={(e) =>
                      setNewFaculty({
                        ...newFaculty,
                        compensationType: e.target.value as CompensationType,
                      })
                    }
                    className="select-paper w-full text-xs font-['Raleway'] py-2"
                  >
                    <option value="FIXED_MONTHLY">Fixed Monthly Salary</option>
                    <option value="HOURLY_PER_CLASS">Per-Class / Hourly Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    {newFaculty.compensationType === 'FIXED_MONTHLY'
                      ? 'Base Monthly Salary (₹)'
                      : 'Hourly Rate per Class (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={
                      newFaculty.compensationType === 'FIXED_MONTHLY'
                        ? newFaculty.baseSalary
                        : newFaculty.hourlyRate
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (newFaculty.compensationType === 'FIXED_MONTHLY') {
                        setNewFaculty({ ...newFaculty, baseSalary: val });
                      } else {
                        setNewFaculty({ ...newFaculty, hourlyRate: val });
                      }
                    }}
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                  />
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-primary)] mb-2">
                  Delegated Operational Permissions
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = newFaculty.delegatedPermissions?.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[var(--bg-paper)] border-[var(--brand-electric)]'
                            : 'border-[var(--border-paper)] bg-[var(--bg-paper-warm)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = newFaculty.delegatedPermissions || [];
                            if (e.target.checked) {
                              setNewFaculty({
                                ...newFaculty,
                                delegatedPermissions: [...cur, perm.key],
                              });
                            } else {
                              setNewFaculty({
                                ...newFaculty,
                                delegatedPermissions: cur.filter((k) => k !== perm.key),
                              });
                            }
                          }}
                          className="mt-0.5 rounded text-[var(--brand-electric)]"
                        />
                        <div className="text-[11px]">
                          <span className="font-['Raleway'] font-bold text-[var(--ink-primary)] block">
                            {perm.label}
                          </span>
                          <span className="font-['Raleway'] text-[10px] text-[var(--ink-muted)] block">
                            {perm.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-paper)]">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-subtle text-xs font-['Raleway'] font-bold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs font-['Raleway'] font-bold px-5 py-2"
                >
                  {isSubmitting ? 'Issuing Invite...' : 'Confirm Faculty Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

