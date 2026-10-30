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
  Disc3,
  Play,
  Pause,
  Sparkles,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type { UserSession } from '@padhai-pilot/shared';
import { Corkboard, CoffeeCup, YellowPencil, DeskPetPill } from './ui';
import { StickyNote } from './ui/StickyNote';
import { PushPin } from './ui/PushPin';

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
  const [isVinylPlaying, setIsVinylPlaying] = useState(false);

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

      setSuccessMsg('Account registered! Launching your studio...');
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
      setSuccessMsg(res.message || 'Reset token generated.');
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

  // Dynamic preview text for lanyard badge
  const previewName = activeTab === 'register' ? fullName || 'New Faculty' : 'Faculty Member';
  const previewAcademy = activeTab === 'register' ? (instituteName || 'PadhaiPilot Academy') : 'PadhaiPilot Academy';
  const previewRole = role === 'TUITION_OWNER' ? 'Tuition Director' : 'Senior Faculty';

  return (
    <div className="min-h-screen ak-desk-surface flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none relative overflow-x-hidden font-['Raleway']">
      
      {/* 1. TOP GLASS NAV BAR */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-2 px-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#E3DFD9] shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--brand-electric)] flex items-center justify-center text-white font-['Playfair_Display'] font-black text-sm shadow-[0_2px_8px_rgba(22,119,255,0.3)]">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Playfair_Display'] font-extrabold text-sm sm:text-base text-[#1C1917] tracking-tight">
                PadhaiPilot
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[var(--brand-electric)] border border-blue-100 hidden sm:inline-block">
                Faculty Studio
              </span>
            </div>
          </div>
        </div>

        {/* Right Session & Desk State */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="hidden md:inline-flex items-center gap-1.5 text-stone-600 font-['Inter'] text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Academic Session 2026–27
          </span>
          <div className="h-4 w-[1px] bg-stone-300 hidden md:block" />
          <button
            type="button"
            onClick={() => setIsVinylPlaying(!isVinylPlaying)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] transition"
            title="Toggle focus ambience"
          >
            <Disc3 className={`w-3.5 h-3.5 text-[var(--brand-electric)] ${isVinylPlaying ? 'animate-spin' : ''}`} />
            <span>{isVinylPlaying ? 'Sound On' : 'Sound Off'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN INTERACTIVE DESK WORKSPACE */}
      <main className="max-w-7xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6 z-20">
        
        {/* LEFT FLANK: Interactive Faculty Lanyard ID Card & Vinyl Turntable */}
        <div className="lg:col-span-3 hidden lg:flex flex-col items-center gap-6 animate-in fade-in slide-in-from-left-4 duration-300">
          
          {/* Real Lanyard Strap & Faculty Pass Badge */}
          <div className="flex flex-col items-center group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
            {/* Black Fabric Lanyard Strap */}
            <div className="w-5 h-14 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-t-sm shadow-sm flex justify-center">
              <div className="w-[1.5px] h-full bg-blue-500/40" />
            </div>

            {/* Metallic Silver Swivel Clip */}
            <div className="w-7 h-4 bg-gradient-to-r from-stone-300 via-stone-100 to-stone-400 border border-stone-400 rounded-sm shadow-sm flex items-center justify-center -mt-0.5 z-10">
              <div className="w-3 h-1.5 bg-stone-700 rounded-full" />
            </div>

            {/* Translucent PVC ID Badge Sleeve */}
            <div className="w-56 bg-white/95 rounded-2xl border border-stone-300/80 shadow-[0_12px_32px_rgba(40,30,20,0.12)] p-4 relative overflow-hidden backdrop-blur-md">
              {/* Holographic Gloss Sheen */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 via-amber-300/10 to-transparent rotate-45 pointer-events-none" />

              {/* Slot cutout */}
              <div className="w-12 h-1.5 bg-stone-200 border border-stone-300 rounded-full mx-auto mb-3" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-[var(--brand-electric)] text-white text-[10px] font-bold font-['Playfair_Display'] flex items-center justify-center">
                    P
                  </div>
                  <span className="font-['Playfair_Display'] font-black text-xs text-stone-900">
                    PadhaiPilot
                  </span>
                </div>
                <span className="text-[9px] font-['Inter'] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  VERIFIED
                </span>
              </div>

              {/* Faculty Info Body */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 font-bold text-lg font-['Playfair_Display'] shadow-inner">
                    {previewName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Playfair_Display'] font-bold text-xs text-stone-900 truncate">
                      {previewName}
                    </p>
                    <p className="text-[10px] font-['Raleway'] text-[var(--brand-electric)] font-bold truncate">
                      {previewRole}
                    </p>
                    <p className="text-[9px] font-['Inter'] text-stone-500 truncate">
                      {previewAcademy}
                    </p>
                  </div>
                </div>

                {/* Micro Barcode & Key */}
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[8px] font-['Inter'] text-stone-400">
                  <span className="font-mono tracking-widest">FAC-2026-9042</span>
                  <QrCode className="w-4 h-4 text-stone-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Turntable Vinyl Record Player */}
          <div className="w-56 bg-white p-3.5 rounded-2xl border border-[#E3DFD9] shadow-[0_8px_24px_rgba(60,52,40,0.08)] relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600">
                Focus Vinyl
              </span>
              <button
                type="button"
                onClick={() => setIsVinylPlaying(!isVinylPlaying)}
                className="w-6 h-6 rounded-full bg-[var(--brand-electric)] text-white flex items-center justify-center shadow-sm hover:scale-105 transition"
              >
                {isVinylPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
              </button>
            </div>

            {/* Grooved Vinyl Disc */}
            <div className="relative w-full aspect-square rounded-full bg-gradient-to-tr from-stone-950 via-stone-900 to-stone-950 border-4 border-stone-800 shadow-inner flex items-center justify-center overflow-hidden">
              {/* Circular grooves */}
              <div className="absolute inset-2 rounded-full border border-stone-700/50" />
              <div className="absolute inset-5 rounded-full border border-stone-700/40" />
              <div className="absolute inset-8 rounded-full border border-stone-700/30" />

              {/* Spinning Vinyl Center Label */}
              <div
                className={`w-14 h-14 rounded-full bg-[var(--brand-electric)] border-2 border-stone-100 flex flex-col items-center justify-center text-white text-[8px] font-bold font-['Playfair_Display'] ${
                  isVinylPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
                }`}
              >
                <span>STUDIO</span>
                <span className="text-[6px] font-['Inter'] font-normal opacity-80">2026–27</span>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 font-['Raleway'] text-center mt-2 font-medium">
              {isVinylPlaying ? 'Now Playing: Academic Flow' : 'Click to play ambient focus'}
            </p>
          </div>

        </div>

        {/* CENTER STAGE: The Master Paper Stationery Ledger (The Auth Pad) */}
        <div className="lg:col-span-6 w-full max-w-lg mx-auto">
          <div className="relative bg-[#FFFFFF] rounded-3xl border border-[#E3DFD9] p-6 sm:p-9 shadow-[0_4px_6px_rgba(60,52,40,0.04),0_20px_40px_-8px_rgba(60,52,40,0.14)]">
            
            {/* Top Brass Binder Clip Accent */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-10">
              <div className="w-12 h-3 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 border border-amber-600 rounded-sm shadow-sm" />
              <div className="w-8 h-2 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 rounded-b-md shadow-inner" />
            </div>

            {/* Ledger Editorial Title */}
            <div className="text-center pt-2 pb-5 border-b border-[#F0ECE6]">
              <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-widest text-[var(--brand-electric)] block mb-1">
                Institutional Workspace Access
              </span>
              <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight">
                Faculty Studio Ledger
              </h2>
              <p className="text-xs text-stone-500 mt-1 font-['Raleway'] font-medium">
                Where dedicated teachers manage classrooms, attendance & grading.
              </p>
            </div>

            {/* Seamless Segmented Tab Controller */}
            <div className="flex bg-[#F4F1EB] p-1 rounded-xl my-5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-['Raleway'] font-bold rounded-lg transition-all duration-200 ${
                  activeTab === 'login'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Sign In to Studio
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-['Raleway'] font-bold rounded-lg transition-all duration-200 ${
                  activeTab === 'register'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Register Account
              </button>
            </div>

            {/* Alert Messages */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-['Raleway'] font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-['Raleway'] font-semibold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Institutional Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      required
                      placeholder="faculty@academy.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] placeholder:text-stone-400 focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600">
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
                      className="text-[11px] text-[var(--brand-electric)] hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter workstation password"
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
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-['Raleway'] text-stone-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-stone-300 text-[var(--brand-electric)] focus:ring-0"
                    />
                    <span>Remember workstation session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[var(--brand-electric)] hover:bg-[#0A6FE8] active:scale-[0.99] text-white text-xs font-['Raleway'] font-bold shadow-[0_4px_12px_rgba(22,119,255,0.25)] transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Faculty Studio</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Role Switcher Pill */}
                <div>
                  <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Account Category *
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[#F4F1EB] p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRole('TEACHER')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-['Raleway'] font-bold rounded-lg transition-all ${
                        role === 'TEACHER'
                          ? 'bg-white text-[var(--brand-electric)] shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Faculty Member</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('TUITION_OWNER')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-['Raleway'] font-bold rounded-lg transition-all ${
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
                  <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Alok Verma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Raleway'] font-bold text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alok.verma@academy.edu"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                  />
                </div>

                {/* Conditional Fields */}
                {role === 'TUITION_OWNER' ? (
                  <div>
                    <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Coaching / Tuition Academy Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zenith IIT-JEE Academy"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Raleway'] font-bold text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Subject Specialization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Higher Mathematics, Mechanics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Raleway'] text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                    />
                  </div>
                )}

                {/* Password & Confirm */}
                <div>
                  <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Password (min 6 characters) *
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

                  {/* Micro Strength Bars */}
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

                <div>
                  <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Confirm Password *
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
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[var(--brand-electric)] hover:bg-[#0A6FE8] active:scale-[0.99] text-white text-xs font-['Raleway'] font-bold shadow-[0_4px_12px_rgba(22,119,255,0.25)] transition flex items-center justify-center gap-2"
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
                <p className="text-xs text-stone-600 leading-relaxed font-['Raleway']">
                  Enter your registered institutional email. We will generate password recovery instructions for your workstation.
                </p>

                <div>
                  <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      required
                      placeholder="faculty@academy.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--brand-electric)] hover:bg-[#0A6FE8] text-white text-xs font-['Raleway'] font-bold shadow-sm transition flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Dispatch Reset Token</span>}
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
                <p className="text-xs text-stone-600 leading-relaxed font-['Raleway']">
                  Paste the verification token to configure your new password.
                </p>

                <div>
                  <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Reset Token *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="Paste reset token string"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD8D2] bg-[#FAF8F5] text-xs font-['Inter'] font-mono text-[#1C1917] focus:outline-none focus:border-[var(--brand-electric)] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-['Raleway'] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    New Password (min 6 chars) *
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
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--brand-electric)] hover:bg-[#0A6FE8] text-white text-xs font-['Raleway'] font-bold shadow-sm transition flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
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
              <span className="font-['Raleway'] font-bold flex items-center gap-1 text-stone-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Demo:</span>
              </span>
              <div className="flex items-center gap-2 text-stone-600 font-semibold text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('TEACHER')}
                  disabled={isLoading}
                  className="hover:text-[var(--brand-electric)] hover:underline"
                >
                  Faculty
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('TUITION_OWNER')}
                  disabled={isLoading}
                  className="hover:text-[var(--brand-electric)] hover:underline"
                >
                  Owner
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
        </div>

        {/* RIGHT FLANK: Framed Wooden Corkboard with Tangible Sticky Notes */}
        <div className="lg:col-span-3 hidden lg:flex flex-col items-center gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Porcelain Coffee Cup top down */}
          <div className="self-end mr-4">
            <CoffeeCup />
          </div>

          {/* Framed Corkboard with 3 realistic sticky notes */}
          <Corkboard title="Live Academy Noticeboard" className="w-full max-w-xs">
            <div className="space-y-4 pt-1">
              {/* Yellow Note */}
              <StickyNote
                color="yellow"
                pinColor="blue"
                rotation={1.5}
                title="Class 12 Adv Calculus"
              >
                <p className="text-[11px] font-['Raleway'] font-medium leading-relaxed">
                  42 students marked present. Automatic SMS triggered to absent guardians.
                </p>
                <div className="mt-1.5 text-[9px] font-bold font-['Inter'] text-amber-800">
                  ● Batch Roll Call Done
                </div>
              </StickyNote>

              {/* Mint Note */}
              <StickyNote
                color="mint"
                pinColor="red"
                rotation={-2}
                title="Bulk Marks Evaluation"
              >
                <p className="text-[11px] font-['Raleway'] font-medium leading-relaxed">
                  Physics Mock #4 evaluated in 4 mins. Full batch ranks published.
                </p>
                <div className="mt-1.5 text-[9px] font-bold font-['Inter'] text-emerald-800">
                  ● 100% Graded
                </div>
              </StickyNote>

              {/* Pink Note */}
              <StickyNote
                color="pink"
                pinColor="green"
                rotation={1.2}
                title="White-Label Identity"
              >
                <p className="text-[11px] font-['Raleway'] font-medium leading-relaxed">
                  Tenant-isolated PostgreSQL & Upstash Redis caching layer active.
                </p>
                <div className="mt-1.5 text-[9px] font-bold font-['Inter'] text-rose-800">
                  ● Zero Cross-Academy Leaks
                </div>
              </StickyNote>
            </div>
          </Corkboard>

          {/* Yellow Drafting Pencil resting on desk */}
          <div className="self-start ml-2 mt-2">
            <YellowPencil rotation={-15} />
          </div>

        </div>

      </main>

      {/* 3. BOTTOM DESK FOOTER */}
      <footer className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between py-3 border-t border-[#E3DFD9] text-[11px] text-stone-500 font-['Raleway']">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Tenant-Isolated Database • Upstash Redis Realtime • Session 2026–27</span>
        </div>
        <div className="mt-2 sm:mt-0">
          <DeskPetPill />
        </div>
      </footer>

    </div>
  );
}
