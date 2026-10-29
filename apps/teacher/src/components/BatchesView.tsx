'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  BookOpen,
  MapPin,
  CheckCircle,
  XCircle,
  GraduationCap,
  X,
} from 'lucide-react';
import type { BatchSummary, StudentRosterItem } from '@padhai-pilot/shared';

interface BatchesViewProps {
  batches: BatchSummary[];
  students: StudentRosterItem[];
  selectedBatchId?: string;
  onSelectBatch: (id: string) => void;
  onCreateBatch: (data: { name: string; code: string; subject: string; gradeLevel: string; room?: string }) => Promise<void>;
}

export function BatchesView({
  batches,
  students,
  selectedBatchId,
  onSelectBatch,
  onCreateBatch,
}: BatchesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Class 12');
  const [room, setRoom] = useState('');

  const activeBatch = batches.find((b) => b.id === (selectedBatchId || batches[0]?.id)) || batches[0];

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject) return;

    setIsSubmitting(true);
    try {
      await onCreateBatch({ name, code, subject, gradeLevel, room });
      setShowCreateModal(false);
      setName('');
      setCode('');
      setSubject('');
      setRoom('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-paper)]">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
            Batches & Student Rosters
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-1 font-['Raleway']">
            Manage your assigned teaching batches, monitor enrollment status, and inspect authorized student rosters.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Batch</span>
        </button>
      </div>

      {/* Batch Cards Selector */}
      {batches.length === 0 ? (
        <div className="paper-card p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-[var(--ink-muted)] mx-auto opacity-50" />
          <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
            No Batches Found
          </h3>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] max-w-md mx-auto">
            You don&apos;t have any active batches yet. Click &quot;Create New Batch&quot; above to create a batch and generate student invite codes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {batches.map((batch) => {
            const isSelected = batch.id === activeBatch?.id;
            return (
              <button
                key={batch.id}
                onClick={() => onSelectBatch(batch.id)}
                className={`text-left p-4 rounded-2xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'paper-card-selected'
                    : 'paper-card-interactive'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge-code">
                      {batch.code}
                    </span>
                    <span className="font-['Inter'] text-xs font-bold text-[var(--ink-primary)]">
                      {batch.studentCount} Students
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--ink-primary)] line-clamp-1 font-['Raleway']">
                    {batch.name}
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5 font-['Raleway']">{batch.subject}</p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[var(--border-paper)] flex items-center justify-between text-[11px] text-[var(--ink-muted)] font-['Raleway']">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[var(--brand-electric)]" />
                    {batch.room || 'General Hall'}
                  </span>
                  <span className="font-semibold text-[var(--ink-secondary)]">{batch.gradeLevel}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Batch Roster Table */}
      {activeBatch && (
        <div className="paper-card overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 border-b border-[var(--border-paper)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-paper-warm)]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--brand-electric)]" />
              <span className="text-sm font-bold text-[var(--ink-primary)] font-['Raleway']">
                {activeBatch.name}
              </span>
              <span className="text-xs text-[var(--ink-muted)] font-['Inter']">
                ({filteredStudents.length} enrolled)
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                type="text"
                placeholder="Search by name, roll no, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-paper w-full sm:w-64 pl-9"
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-paper)] text-[var(--ink-secondary)] font-bold uppercase tracking-wider text-[10px] bg-[var(--bg-paper-warm)]">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-paper)] font-['Raleway']">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--ink-muted)]">
                      {searchTerm
                        ? `No student records found matching "${searchTerm}".`
                        : 'No students enrolled in this batch yet. Generate an invitation code to invite students.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-amber-50/20 transition">
                      <td className="py-3 px-4 font-['Inter'] font-bold text-[var(--brand-electric)]">
                        {std.rollNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-[var(--ink-primary)] flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-[var(--brand-electric)]">
                          {std.fullName.charAt(0)}
                        </div>
                        {std.fullName}
                      </td>
                      <td className="py-3 px-4 text-[var(--ink-secondary)] font-['Inter']">{std.email}</td>
                      <td className="py-3 px-4 text-center font-['Inter'] font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            std.attendanceRate >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : std.attendanceRate >= 80
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {std.attendanceRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-['Playfair_Display'] text-xl font-bold text-[var(--ink-primary)] mb-1">
              Create Teaching Batch
            </h3>
            <p className="text-xs text-[var(--ink-secondary)] mb-5 font-['Raleway']">
              Add a new class section to your academic profile and generate enrollment codes.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-['Raleway']">
              <div>
                <label className="block text-[var(--ink-primary)] mb-1 font-bold">Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JEE Advanced 2027 Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-paper w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--ink-primary)] mb-1 font-bold">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="input-paper w-full"
                  />
                </div>
                <div>
                  <label className="block text-[var(--ink-primary)] mb-1 font-bold">Batch Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MTH-JEE-27"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="input-paper w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--ink-primary)] mb-1 font-bold">Grade / Target</label>
                  <input
                    type="text"
                    placeholder="e.g. Class 12 / Repeater"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="input-paper w-full"
                  />
                </div>
                <div>
                  <label className="block text-[var(--ink-primary)] mb-1 font-bold">Room / Hall</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 302"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="input-paper w-full"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
