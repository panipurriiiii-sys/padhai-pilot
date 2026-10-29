'use client';

import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  CalendarCheck,
  FileSpreadsheet,
  BookOpen,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type { UserSession } from '@padhai-pilot/shared';
import { YellowPencil, CoffeeCup, PushPin } from './ui';

type AuthTab = 'login' | 'register' | 'forgot' | 'reset';

interface AuthWelcomeScreenProps {
  onAuthSuccess: (user: UserSession) => void;
}

export function AuthWelcomeScreen({ onAuthSuccess }: AuthWelcomeScreenProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [role, setRole] = useState<'TEACHER' | 'TUITION_OWNER'>('TEACHER');
  const [instituteName, setInstituteName] = useState('');
  const [subject, setSubject] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot/Reset form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Status & error state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Strong', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Excellent', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: '' };
    }
  };

  const pwdStrength = getPasswordStrength(registerPassword);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await teacherApi.login(loginEmail.trim(), loginPassword);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !registerEmail.trim() || !registerPassword) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please accept the institutional terms to continue.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await teacherApi.registerTeacher({
        fullName: fullName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        role,
        instituteName: role === 'TUITION_OWNER' ? instituteName.trim() : undefined,
        subject: role === 'TEACHER' ? subject.trim() : undefined,
        invitationCode: invitationCode.trim() || undefined,
      });

      setSuccessMsg('Account created successfully! Welcome to PadhaiPilot.');
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await teacherApi.requestPasswordReset(forgotEmail.trim());
      setSuccessMsg(res.message || 'Password reset instructions have been generated.');
      if (res.debugToken) {
        setResetToken(res.debugToken);
        setActiveTab('reset');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await teacherApi.resetPassword(resetToken.trim(), newPassword);
      setSuccessMsg(res.message || 'Password updated successfully! Please sign in with your new password.');
      setActiveTab('login');
      setLoginPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick One-Click Switcher for testing/demo
  const handleDemoLogin = async (demoRole: 'TEACHER' | 'TUITION_OWNER' | 'SUPER_ADMIN') => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let res;
      if (demoRole === 'TUITION_OWNER') {
        res = await teacherApi.loginDemoOwner();
      } else if (demoRole === 'SUPER_ADMIN') {
        res = await teacherApi.loginDemoAdmin();
      } else {
        res = await teacherApi.loginDemoTeacher();
      }
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo access failed. Please try manual login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen ak-desk-surface flex flex-col justify-between p-4 sm:p-6 md:p-12 relative overflow-hidden select-none">
      {/* Subtle Background Desk Texture Accents */}
      <div className="absolute top-10 left-12 opacity-80 hidden xl:block pointer-events-none">
        <YellowPencil rotation={-12} />
      </div>
      <div className="absolute bottom-10 right-14 opacity-80 hidden xl:block pointer-events-none">
        <CoffeeCup />
      </div>

      {/* Main Dual-Column Content */}
      <div className="max-w-6xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 py-6">
        
        {/* LEFT COLUMN: Editorial Showcase & Brand Heritage */}
        <div className="lg:col-span-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[var(--border-paper)] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-['Raleway'] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
              PadhaiPilot Academic Cloud • 2026–27
            </span>
          </div>

          {/* Main Title & Vision */}
          <div>
            <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--ink-primary)] tracking-tight leading-[1.15]">
              The Tangible Operating System for Modern Faculty & Tuitions.
            </h1>
            <p className="font-['Raleway'] text-sm sm:text-base text-[var(--ink-secondary)] mt-3 leading-relaxed max-w-xl">
              Replace chaotic spreadsheets, fragmented WhatsApp groups, and lost notebooks with a unified, paper-inspired command center.
            </p>
          </div>

          {/* Feature Highlight Cards (Parchment micro-cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Feature 1 */}
            <div className="paper-card p-4 space-y-1.5 bg-white/80 backdrop-blur-sm hover:shadow-md transition">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--brand-electric)] mb-1">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <h3 className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)]">
                Tangible Roll Call
              </h3>
              <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] leading-relaxed">
                Daily ledger attendance with instantaneous statistics & parent SMS triggers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="paper-card p-4 space-y-1.5 bg-white/80 backdrop-blur-sm hover:shadow-md transition">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-1">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)]">
                Bulk Marks Grading
              </h3>
              <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] leading-relaxed">
                Spreadsheet-speed evaluation. Grade whole batches with live rank computation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="paper-card p-4 space-y-1.5 bg-white/80 backdrop-blur-sm hover:shadow-md transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-1">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)]">
                Curriculum & DPPs
              </h3>
              <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] leading-relaxed">
                Publish verified study materials, problem sets, and weekly lesson milestones.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="paper-card p-4 space-y-1.5 bg-white/80 backdrop-blur-sm hover:shadow-md transition">
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 mb-1">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)]">
                Tuition Identity
              </h3>
              <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] leading-relaxed">
                Full white-label academy branding, faculty payroll statements & fee dues alerts.
              </p>
            </div>
          </div>

          {/* Security & Isolation Seal */}
          <div className="pt-2 flex items-center gap-4 text-xs font-['Raleway'] text-[var(--ink-muted)]">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--ink-secondary)]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tenant-Isolated Postgres
            </span>
            <span className="text-[var(--ink-faint)]">•</span>
            <span>Upstash Redis Caching</span>
            <span className="text-[var(--ink-faint)]">•</span>
            <span>Zero Data Leakage</span>
          </div>
        </div>

        {/* RIGHT COLUMN: The Master Authentication Paper Card */}
        <div className="lg:col-span-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="paper-card p-6 sm:p-8 md:p-10 bg-white border border-[var(--border-paper)] shadow-2xl relative rounded-3xl">
            {/* Top PushPin Accent */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 select-none pointer-events-none">
              <PushPin color="blue" />
            </div>

            {/* Navigation Tabs Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-4 mb-6">
              <div className="flex items-center gap-1 bg-[var(--bg-paper-warm)] p-1 rounded-xl border border-[var(--border-paper)]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-['Raleway'] font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'login'
                      ? 'bg-white text-[var(--brand-electric)] shadow-sm'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-['Raleway'] font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'register'
                      ? 'bg-white text-[var(--brand-electric)] shadow-sm'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              <span className="badge-code font-['Inter'] text-[10px]">
                {activeTab === 'login' ? 'FACULTY PORTAL' : activeTab === 'register' ? 'NEW ONBOARDING' : 'SECURITY'}
              </span>
            </div>

            {/* Alert Banners */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-['Raleway'] font-semibold flex items-center gap-2 mb-5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-['Raleway'] font-semibold flex items-center gap-2 mb-5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type="email"
                      required
                      placeholder="faculty@institution.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="input-paper w-full pl-9 text-xs font-['Inter']"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)]">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setForgotEmail(loginEmail);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-xs text-[var(--brand-electric)] hover:underline font-['Raleway'] font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter account password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="input-paper w-full pl-9 pr-9 text-xs font-['Inter']"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-['Raleway'] text-[var(--ink-secondary)]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[var(--border-paper)] text-[var(--brand-electric)] focus:ring-0"
                    />
                    <span>Remember workstation session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 text-xs font-bold font-['Raleway'] justify-center mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Faculty Studio</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Instant Switcher for Testing/Demonstration */}
                <div className="pt-4 mt-4 border-t border-[var(--border-paper)]">
                  <div className="text-[10px] font-['Raleway'] uppercase font-bold tracking-wider text-[var(--ink-muted)] mb-2.5 flex items-center justify-between">
                    <span>Developer / Role Sandbox</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('TEACHER')}
                      disabled={isLoading}
                      className="btn-subtle text-[11px] font-['Raleway'] font-bold py-2 px-1 text-center truncate"
                    >
                      👨‍🏫 Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('TUITION_OWNER')}
                      disabled={isLoading}
                      className="btn-subtle text-[11px] font-['Raleway'] font-bold py-2 px-1 text-center truncate"
                    >
                      🏛️ Academy Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('SUPER_ADMIN')}
                      disabled={isLoading}
                      className="btn-subtle text-[11px] font-['Raleway'] font-bold py-2 px-1 text-center truncate"
                    >
                      ⚡ Super Admin
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
                {/* Role Switcher Pill Cards */}
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1.5">
                    Account Category *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('TEACHER')}
                      className={`p-3 rounded-xl border text-left transition ${
                        role === 'TEACHER'
                          ? 'border-[var(--brand-electric)] bg-blue-50/50 shadow-sm'
                          : 'border-[var(--border-paper)] bg-[var(--bg-paper-warm)] hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <GraduationCap className={`w-4 h-4 ${role === 'TEACHER' ? 'text-[var(--brand-electric)]' : 'text-[var(--ink-muted)]'}`} />
                        <span className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)]">
                          Faculty Member
                        </span>
                      </div>
                      <p className="font-['Raleway'] text-[10px] text-[var(--ink-muted)] leading-tight">
                        Conduct batches, mark attendance & evaluate students
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('TUITION_OWNER')}
                      className={`p-3 rounded-xl border text-left transition ${
                        role === 'TUITION_OWNER'
                          ? 'border-[var(--brand-electric)] bg-blue-50/50 shadow-sm'
                          : 'border-[var(--border-paper)] bg-[var(--bg-paper-warm)] hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className={`w-4 h-4 ${role === 'TUITION_OWNER' ? 'text-[var(--brand-electric)]' : 'text-[var(--ink-muted)]'}`} />
                        <span className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)]">
                          Tuition Owner
                        </span>
                      </div>
                      <p className="font-['Raleway'] text-[10px] text-[var(--ink-muted)] leading-tight">
                        Manage institute branding, faculty payroll & dues
                      </p>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Alok Verma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-paper w-full text-xs font-['Raleway'] font-semibold"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alok.verma@institution.edu"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="input-paper w-full text-xs font-['Inter']"
                  />
                </div>

                {/* Dynamic Field: Institute Name (if owner) OR Subject Specialization (if teacher) */}
                {role === 'TUITION_OWNER' ? (
                  <div>
                    <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                      Coaching / Tuition Academy Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zenith IIT-JEE & Medical Academy"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      className="input-paper w-full text-xs font-['Raleway'] font-semibold"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                        Subject Specialty
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Higher Mathematics"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="input-paper w-full text-xs font-['Raleway']"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                        Invitation Code <span className="font-normal text-[10px] text-[var(--ink-muted)]">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ZEN-MATH-8820"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value)}
                        className="input-paper w-full text-xs font-['Inter'] uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* Password & Confirm */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                      Password (min 6 characters) *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Choose a strong password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="input-paper w-full pr-9 text-xs font-['Inter']"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  {registerPassword && (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${pwdStrength.color}`}
                          style={{ width: `${pwdStrength.score}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-['Raleway']">
                        <span className="text-[var(--ink-muted)]">Strength: {pwdStrength.label}</span>
                        {registerPassword.length >= 6 && <span className="text-emerald-600 font-bold">✓ Minimum met</span>}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`input-paper w-full text-xs font-['Inter'] ${
                        confirmPassword && confirmPassword !== registerPassword ? 'border-rose-400' : ''
                      }`}
                    />
                    {confirmPassword && confirmPassword === registerPassword && (
                      <span className="text-[10px] text-emerald-600 font-['Raleway'] font-bold flex items-center gap-1 mt-1">
                        <Check className="w-3 h-3" /> Passwords match
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-[11px] font-['Raleway'] text-[var(--ink-secondary)]">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-[var(--border-paper)] text-[var(--brand-electric)] focus:ring-0"
                    />
                    <span>
                      I agree to the institutional code of conduct and educational tenant guidelines.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 text-xs font-bold font-['Raleway'] justify-center mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: FORGOT PASSWORD */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs font-['Raleway'] text-[var(--ink-secondary)]">
                  Enter your registered institutional email address to generate verification reset instructions.
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type="email"
                      required
                      placeholder="faculty@institution.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="input-paper w-full pl-9 text-xs font-['Inter']"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-2.5 text-xs font-bold font-['Raleway'] justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Instructions...</span>
                    </>
                  ) : (
                    <span>Dispatch Reset Instructions</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-[var(--brand-electric)] hover:underline font-['Raleway'] font-bold"
                  >
                    ← Return to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: RESET PASSWORD */}
            {activeTab === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-['Raleway'] text-amber-900">
                  Enter your reset verification token and choose a new password.
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Reset Token *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type="text"
                      required
                      placeholder="Paste your reset token"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="input-paper w-full pl-9 text-xs font-['Inter'] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    New Password (min 6 characters) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-paper w-full pl-9 pr-9 text-xs font-['Inter']"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-2.5 text-xs font-bold font-['Raleway'] justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Set New Password</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-[var(--brand-electric)] hover:underline font-['Raleway'] font-bold"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Footer Trust Indicator */}
            <div className="mt-6 pt-4 border-t border-[var(--border-paper)] text-center text-[10px] font-['Raleway'] text-[var(--ink-muted)]">
              An ISO-Certified Institutional Management Infrastructure • PadhaiPilot 2026–27
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Identity Bar */}
      <footer className="text-center text-[11px] font-['Raleway'] text-[var(--ink-muted)] py-2 border-t border-[var(--border-paper)] bg-white/40">
        PadhaiPilot Faculty Studio • Built with Paper-Desk Craftsmanship • All Educational Tenants Protected
      </footer>
    </div>
  );
}
