'use client';

import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  Building2,
  GraduationCap,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type { UserSession } from '@padhai-pilot/shared';

type AuthTab = 'login' | 'register' | 'forgot' | 'reset';

interface AuthWelcomeScreenProps {
  onAuthSuccess: (user: UserSession) => void;
}

export function AuthWelcomeScreen({ onAuthSuccess }: AuthWelcomeScreenProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [role, setRole] = useState<'TEACHER' | 'TUITION_OWNER'>('TEACHER');
  const [instituteName, setInstituteName] = useState('');
  const [subject, setSubject] = useState('');

  // Forgot / Reset state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Async & UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Minimalist password strength score (0 to 4)
  const getStrengthScore = (pwd: string) => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 10) s++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };
  const strengthScore = getStrengthScore(registerPassword);

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
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

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
      });

      setSuccessMsg('Workspace created! Logging you in...');
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await teacherApi.requestPasswordReset(forgotEmail.trim());
      setSuccessMsg(res.message || 'Reset instructions dispatched.');
      if (res.debugToken) {
        setResetToken(res.debugToken);
        setActiveTab('reset');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to process reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await teacherApi.resetPassword(resetToken.trim(), newPassword);
      setSuccessMsg(res.message || 'Password successfully updated.');
      setActiveTab('login');
      setLoginPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: 'TEACHER' | 'TUITION_OWNER' | 'SUPER_ADMIN') => {
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
      setErrorMsg(err.message || 'Demo access unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex flex-col justify-between items-center p-6 md:p-10 select-none relative overflow-hidden font-['Raleway']">
      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-b from-blue-50/70 via-amber-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header / Subtle Brand Presence */}
      <header className="w-full max-w-md pt-2 sm:pt-6 flex flex-col items-center text-center">
        {/* Monogram Seal */}
        <div className="w-11 h-11 rounded-2xl bg-white border border-[#E8E4DD] shadow-sm flex items-center justify-center mb-3 transition hover:scale-105 duration-200">
          <span className="font-['Playfair_Display'] font-black text-xl text-[var(--brand-electric)]">
            P
          </span>
        </div>

        <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-extrabold text-[#1F1E1D] tracking-tight">
          PadhaiPilot
        </h1>
        <p className="text-xs text-[#78716C] mt-1 font-medium tracking-wide">
          The quiet, paper-crafted workspace for educators.
        </p>
      </header>

      {/* Main Floating Auth Card */}
      <main className="w-full max-w-[420px] my-6">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E8E4DD] p-7 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
          
          {/* Fluid Segmented Tab Controller */}
          <div className="flex bg-[#F4F1EB] p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-white text-[#1F1E1D] shadow-sm'
                  : 'text-[#78716C] hover:text-[#1F1E1D]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-white text-[#1F1E1D] shadow-sm'
                  : 'text-[#78716C] hover:text-[#1F1E1D]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                  <input
                    type="email"
                    required
                    placeholder="name@institution.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-['Inter'] text-[#1F1E1D] placeholder:text-[#A8A29E] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setForgotEmail(loginEmail);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-[var(--brand-electric)] hover:underline font-semibold"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-['Inter'] text-[#1F1E1D] placeholder:text-[#A8A29E] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1F1E1D] transition"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#57534E]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#DDD8D2] text-[var(--brand-electric)] focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1677FF] hover:bg-[#0A6FE8] active:scale-[0.99] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Role Segmented Pill Switcher */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#F4F1EB] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole('TEACHER')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      role === 'TEACHER'
                        ? 'bg-white text-[var(--brand-electric)] shadow-sm'
                        : 'text-[#78716C] hover:text-[#1F1E1D]'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Teacher / Faculty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('TUITION_OWNER')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      role === 'TUITION_OWNER'
                        ? 'bg-white text-[var(--brand-electric)] shadow-sm'
                        : 'text-[#78716C] hover:text-[#1F1E1D]'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Academy Owner</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alok Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-medium text-[#1F1E1D] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="alok.verma@academy.in"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-['Inter'] text-[#1F1E1D] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                />
              </div>

              {/* Role-Specific Context Field */}
              {role === 'TUITION_OWNER' ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
                    Academy / Coaching Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zenith Academy"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-medium text-[#1F1E1D] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
                    Subject Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Physics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-medium text-[#1F1E1D] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-3.5 py-2 pr-9 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-['Inter'] text-[#1F1E1D] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1F1E1D] transition"
                  >
                    {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Minimalist 4-Segment Strength Indicator */}
                {registerPassword && (
                  <div className="flex gap-1.5 mt-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          strengthScore >= step
                            ? strengthScore <= 2
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                            : 'bg-[#E8E4DD]'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-[#FAFAF8] text-xs font-['Inter'] text-[#1F1E1D] focus:outline-none focus:bg-white transition ${
                    confirmPassword && confirmPassword !== registerPassword
                      ? 'border-rose-400'
                      : 'border-[#E3DFD9] focus:border-[var(--brand-electric)]'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1677FF] hover:bg-[#0A6FE8] active:scale-[0.99] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-[#57534E] leading-relaxed">
                Enter your institutional email. We will generate password recovery instructions for your account.
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                  <input
                    type="email"
                    required
                    placeholder="name@institution.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-['Inter'] text-[#1F1E1D] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1677FF] hover:bg-[#0A6FE8] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Instructions</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-[#78716C] hover:text-[#1F1E1D] font-bold transition"
                >
                  ← Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: RESET PASSWORD */}
          {activeTab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <p className="text-xs text-[#57534E] leading-relaxed">
                Paste your reset token below to configure your new password.
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
                  Reset Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                  <input
                    type="text"
                    required
                    placeholder="Token string"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-['Inter'] font-mono text-[#1F1E1D] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E3DFD9] bg-[#FAFAF8] text-xs font-['Inter'] text-[#1F1E1D] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1F1E1D] transition"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1677FF] hover:bg-[#0A6FE8] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-[#78716C] hover:text-[#1F1E1D] font-bold transition"
                >
                  ← Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Discreet Sandbox Quick Switcher */}
          <div className="mt-6 pt-5 border-t border-[#F0ECE6] flex items-center justify-between text-[11px] text-[#A8A29E]">
            <span className="font-medium">Sandbox Demo:</span>
            <div className="flex items-center gap-2.5 text-[#57534E]">
              <button
                type="button"
                onClick={() => handleQuickDemo('TEACHER')}
                disabled={isLoading}
                className="hover:text-[var(--brand-electric)] hover:underline font-semibold transition"
              >
                Faculty
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('TUITION_OWNER')}
                disabled={isLoading}
                className="hover:text-[var(--brand-electric)] hover:underline font-semibold transition"
              >
                Owner
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('SUPER_ADMIN')}
                disabled={isLoading}
                className="hover:text-[var(--brand-electric)] hover:underline font-semibold transition"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer Trust Seal */}
      <footer className="w-full max-w-md pb-2 sm:pb-6 text-center text-[11px] text-[#A8A29E] flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Tenant-Isolated Database</span>
        <span>•</span>
        <span>Upstash Redis Caching</span>
      </footer>
    </div>
  );
}
