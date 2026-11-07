'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Lock, User, Phone, Building2 } from 'lucide-react';
import { setAuthToken } from '../../lib/api';

interface InvitationPreview {
  valid: boolean;
  email: string;
  fullName?: string;
  instituteName: string;
  designation: string;
  assignedSubjects: string[];
  hasExistingAccount?: boolean;
}

function JoinFacultyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const rawBase = (process.env.NEXT_PUBLIC_API_URL || 'https://padhai-pilot.vercel.app/api').replace(/\/+$/, '');
  const apiBase = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided. Please use the complete link from your invitation email.');
      setLoading(false);
      return;
    }

    const cleanBase = apiBase.replace(/\/+$/, '');
    fetch(`${cleanBase}/faculty-invitations/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Invalid or expired invitation token.');
        }
        return res.json();
      })
      .then((data) => {
        setPreview(data);
        if (data.fullName) setFullName(data.fullName);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to verify invitation.');
        setLoading(false);
      });
  }, [token, apiBase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setFormError('Please choose a secure password.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const cleanBase = apiBase.replace(/\/+$/, '');
      const res = await fetch(`${cleanBase}/faculty-invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          fullName: fullName.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Failed to activate faculty account.');
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Error accepting invitation.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen ak-desk-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[var(--ink-primary)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="font-['Playfair_Display'] text-3xl font-extrabold tracking-tight">
          PadhaiPilot <span className="text-sm font-['Raleway'] font-normal text-[var(--ink-muted)]">Faculty Onboarding</span>
        </h1>
        <p className="mt-2 text-xs font-['Raleway'] text-[var(--ink-secondary)]">
          Accept your official faculty appointment
        </p>
      </div>

      <div className="mt-8 px-4 sm:px-0 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--bg-paper-warm)] py-8 px-5 shadow-2xl rounded-2xl border border-[var(--border-paper)] sm:px-10">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-600">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-electric)]" />
              <p className="text-xs font-semibold">Verifying faculty appointment token...</p>
            </div>
          )}

          {!loading && error && !success && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-stone-900 font-['Playfair_Display']">Invitation Unavailable</h2>
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg leading-relaxed">
                {error}
              </p>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition"
              >
                Return to Faculty Studio
              </button>
            </div>
          )}

          {!loading && success && (
            <div className="space-y-4 text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold font-['Playfair_Display'] text-stone-900">Welcome to {preview?.instituteName}!</h2>
              <p className="text-xs text-stone-600 font-['Raleway']">
                Your faculty account is active and verified. Redirecting you to your faculty studio...
              </p>
            </div>
          )}

          {!loading && !error && !success && preview && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg leading-relaxed">{formError}</p>
              )}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>{preview.instituteName}</span>
                </div>
                <div className="text-xs text-stone-700 font-['Raleway'] space-y-0.5">
                  <p><span className="font-semibold text-stone-900">Designation:</span> {preview.designation}</p>
                  <p><span className="font-semibold text-stone-900">Registered Email:</span> {preview.email}</p>
                  {preview.assignedSubjects && preview.assignedSubjects.length > 0 && (
                    <p><span className="font-semibold text-stone-900">Subjects:</span> {preview.assignedSubjects.join(', ')}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    placeholder="Prof. Rajesh Sharma"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contact Phone (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {preview.hasExistingAccount ? 'Confirm Account Password' : 'Account password (new, or your current one if you already have an account)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-[11px] text-stone-500">
                  Use a strong password; the server checks the password policy.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <span>Accept Appointment & Enter Studio</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinFacultyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen ak-desk-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <JoinFacultyContent />
    </Suspense>
  );
}
