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
  KeyRound,
  Sparkles,
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

  // Status & interactive feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password strength score
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

  // Handlers
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

      setSuccessMsg('Account created successfully.');
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
      setSuccessMsg(res.message || 'Reset code sent to your email.');
      if (res.debugToken) {
        setResetToken(res.debugToken);
        setActiveTab('reset');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to send reset code.');
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
      setSuccessMsg(res.message || 'Password updated successfully.');
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
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 font-['Raleway'] select-none">
      
      {/* 1. TOP HEADER */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-electric)] flex items-center justify-center text-white font-['Playfair_Display'] font-black text-sm shadow-sm">
            P
          </div>
          <span className="font-['Playfair_Display'] font-bold text-lg text-[#1C1917] tracking-tight">
            PadhaiPilot
          </span>
        </div>

        <div className="text-xs font-semibold text-stone-500">
          <span>Session 2026–27</span>
        </div>
      </header>

      {/* 2. CENTERED AUTH CARD */}
      <main className="w-full max-w-[440px] my-auto">
        <div className="bg-white rounded-2xl border border-[#E3DFD9] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          
          {/* Card Title */}
          <div className="text-center mb-6">
            <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              {activeTab === 'login' && 'Sign in to your account'}
              {activeTab === 'register' && 'Create your account'}
              {activeTab === 'forgot' && 'Reset your password'}
              {activeTab === 'reset' && 'Set a new password'}
            </h1>
            <p className="text-xs text-stone-500 mt-1 font-['Raleway']">
              {activeTab === 'login' && 'Enter your details to access your portal.'}
              {activeTab === 'register' && 'Sign up to manage batches, attendance, and tests.'}
              {activeTab === 'forgot' && 'Enter your email to receive a password reset code.'}
              {activeTab === 'reset' && 'Choose a secure new password.'}
            </p>
          </div>

          {/* Segmented Switcher for Login / Register */}
          {(activeTab === 'login' || activeTab === 'register') && (
            <div className="flex bg-[#F4F1EB] p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
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
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Alert Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] placeholder:text-stone-400 focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-stone-700">
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
                    className="text-xs text-[var(--brand-electric)] hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] placeholder:text-stone-400 focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 transition"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-stone-300 text-[var(--brand-electric)] focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[var(--brand-electric)] hover:bg-[#0A6FE8] active:scale-[0.99] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#F4F1EB] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole('TEACHER')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      role === 'TEACHER'
                        ? 'bg-white text-[var(--brand-electric)] shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('TUITION_OWNER')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      role === 'TUITION_OWNER'
                        ? 'bg-white text-[var(--brand-electric)] shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Tuition Owner</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alok Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-medium text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                />
              </div>

              {/* Conditional Fields */}
              {role === 'TUITION_OWNER' ? (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Academy / Coaching Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zenith Academy"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-medium text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-medium text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-3.5 py-2 pr-9 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 transition"
                  >
                    {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
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
                            : 'bg-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] focus:outline-none focus:bg-white transition ${
                    confirmPassword && confirmPassword !== registerPassword
                      ? 'border-rose-400'
                      : 'border-[#DDD8D2] focus:border-[var(--brand-electric)]'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[var(--brand-electric)] hover:bg-[#0A6FE8] active:scale-[0.99] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                Enter your email address and we will send you a password reset code.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--brand-electric)] hover:bg-[#0A6FE8] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Code</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-stone-600 hover:text-stone-900 font-bold transition"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: RESET PASSWORD */}
          {activeTab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                Enter the reset code sent to your email to choose a new password.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Reset Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter reset code"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] font-mono text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 transition"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--brand-electric)] hover:bg-[#0A6FE8] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save New Password</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-stone-600 hover:text-stone-900 font-bold transition"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Quick 1-Click Sandbox Test Bar */}
          <div className="mt-6 pt-4 border-t border-[#F0ECE6] flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold text-stone-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Accounts:</span>
            </span>
            <div className="flex items-center gap-2 text-stone-600 font-medium text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('TEACHER')}
                disabled={isLoading}
                className="hover:text-[var(--brand-electric)] hover:underline"
              >
                Teacher
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('TUITION_OWNER')}
                disabled={isLoading}
                className="hover:text-[var(--brand-electric)] hover:underline"
              >
                Tuition Owner
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('SUPER_ADMIN')}
                disabled={isLoading}
                className="hover:text-[var(--brand-electric)] hover:underline"
              >
                Admin
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full max-w-4xl mx-auto py-3 text-center text-xs text-stone-400">
        <span>PadhaiPilot • Session 2026–27</span>
      </footer>

    </div>
  );
}
