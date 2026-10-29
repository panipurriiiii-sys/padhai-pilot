'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  Save,
  Eye,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  ShieldCheck,
  Image,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type { TuitionBrandingProfile, UpdateTuitionBrandingDto } from '@padhai-pilot/shared';

export function TuitionBrandingView() {
  const [profile, setProfile] = useState<TuitionBrandingProfile | null>(null);
  const [formData, setFormData] = useState<UpdateTuitionBrandingDto>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    try {
      const data = await teacherApi.getTuitionProfile();
      setProfile(data);
      setFormData({
        name: data.name,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        address: data.address,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        website: data.website,
        description: data.description,
        footerText: data.footerText,
        signatoryName: data.signatoryName,
        signatoryTitle: data.signatoryTitle,
        academicYear: data.academicYear,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await teacherApi.updateTuitionProfile(formData);
      setProfile(updated);
      setToastMessage('Tuition branding settings and letterhead profile saved!');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  }

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
              Tuition Owner • Institutional Identity & White-label Settings
            </span>
            <span className="badge-code font-['Inter'] text-[10px]">BRANDING ENGINE</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold tracking-tight text-[var(--ink-primary)] mt-1">
            Tuition Branding & Letterhead
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Configure coaching academy name, addresses, official signatory credentials, and document headers for student reports and salary slips.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="paper-card p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
          Loading tuition branding profile...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Settings (7 cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="paper-card p-6 md:p-8 space-y-5 bg-[var(--bg-paper)] shadow-sm">
              <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)] pb-2 border-b border-[var(--border-paper)]">
                General Institute Information
              </h3>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Tuition / Coaching Academy Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-paper w-full text-xs font-['Raleway'] py-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="input-paper w-full text-xs font-['Raleway'] py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Physical Campus Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-paper w-full text-xs font-['Raleway'] p-2.5 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Academic Year Default
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear || ''}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                  />
                </div>
              </div>

              {/* Signatory Authority */}
              <div className="pt-4 border-t border-[var(--border-paper)] space-y-3">
                <h3 className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">
                  Authorized Signatory Credentials
                </h3>
                <p className="font-['Raleway'] text-xs text-[var(--ink-muted)]">
                  Appears on official salary statements, fee receipts, and student performance certificates.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                      Signatory Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Dr. Anand K. Kulkarni"
                      value={formData.signatoryName || ''}
                      onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                      className="input-paper w-full text-xs font-['Raleway'] py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                      Official Designation / Title
                    </label>
                    <input
                      type="text"
                      placeholder="Founder & Academic Director"
                      value={formData.signatoryTitle || ''}
                      onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                      className="input-paper w-full text-xs font-['Raleway'] py-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Document Footer Notice / Compliance Stamp
                </label>
                <input
                  type="text"
                  value={formData.footerText || ''}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  className="input-paper w-full text-xs font-['Raleway'] py-2"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-paper)] flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs font-['Raleway'] font-bold px-6 py-2.5 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save Branding Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Document Letterhead Preview (5 cols) */}
          <div className="lg:col-span-5">
            <div className="paper-card p-6 sticky top-6 space-y-5 bg-[var(--bg-paper)] shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
                <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-widest text-[var(--brand-electric)] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Live Letterhead Preview
                </span>
                <span className="badge-code font-['Inter'] text-[10px]">
                  PDF RENDER ENGINE
                </span>
              </div>

              {/* Letterhead Frame */}
              <div className="p-5 rounded-xl border border-[var(--border-paper)] bg-[var(--bg-paper-warm)] space-y-4">
                <div className="flex items-start justify-between pb-3 border-b-2 border-stone-800">
                  <div>
                    <h4 className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">
                      {formData.name || 'Your Coaching Academy'}
                    </h4>
                    <p className="font-['Raleway'] text-[10px] text-[var(--ink-secondary)] mt-0.5 leading-relaxed">
                      {formData.address || 'Plot 42, Knowledge Park, Silicon Corridor'}
                    </p>
                    <p className="font-['Inter'] text-[9px] text-[var(--ink-muted)] mt-0.5">
                      Phone: {formData.contactPhone || '+91 98230 45678'} • Email: {formData.contactEmail || 'office@apex.edu.in'}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-electric)] flex items-center justify-center text-white font-['Playfair_Display'] font-bold text-xs shrink-0 shadow-sm">
                    P
                  </div>
                </div>

                {/* Mock Body */}
                <div className="space-y-2 py-2 text-[11px] font-['Raleway'] text-[var(--ink-muted)]">
                  <div className="h-2 w-3/4 bg-stone-200 rounded animate-pulse" />
                  <div className="h-2 w-full bg-stone-200 rounded animate-pulse" />
                  <div className="h-2 w-5/6 bg-stone-200 rounded animate-pulse" />
                </div>

                {/* Signatory Box */}
                <div className="flex items-end justify-between pt-4 border-t border-[var(--border-paper)] text-[10px] font-['Raleway']">
                  <div>
                    <span className="text-[var(--ink-faint)] block text-[9px]">
                      {formData.footerText || 'PadhaiPilot Verified Tuition Institute'}
                    </span>
                    <span className="font-['Inter'] text-[9px] text-[var(--ink-faint)]">
                      Session: {formData.academicYear || '2026-2027'}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="font-['Playfair_Display'] font-bold text-xs text-[var(--ink-primary)]">
                      {formData.signatoryName || 'Dr. Anand K. Kulkarni'}
                    </div>
                    <div className="text-[9px] text-[var(--ink-muted)]">
                      {formData.signatoryTitle || 'Founder & Academic Director'}
                    </div>
                    <div className="stamp-base font-['Inter'] text-[8px] uppercase px-1.5 py-0.5 inline-block text-[var(--brand-electric)] border-[var(--brand-electric)] mt-1">
                      VERIFIED
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-['Raleway'] text-blue-900 leading-relaxed">
                <strong>White-label Guarantee:</strong> All student report cards, fee receipts, and faculty salary slips automatically use this high-resolution letterhead layout.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

