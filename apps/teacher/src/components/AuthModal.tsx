'use client';

import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type { UserSession } from '@padhai-pilot/shared';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserSession) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [subject, setSubject] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await teacherApi.login(email, password);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'TEACHER' | 'TUITION_OWNER' | 'SUPER_ADMIN') => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let res: { user: UserSession; token: string };
      if (role === 'TUITION_OWNER') {
        res = await teacherApi.loginDemoOwner();
      } else if (role === 'SUPER_ADMIN') {
        res = await teacherApi.loginDemoAdmin();
      } else {
        res = await teacherApi.loginDemoTeacher();
      }
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await teacherApi.registerTeacher({
        fullName,
        email,
        password,
        subject,
        invitationCode: invitationCode || undefined,
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await teacherApi.requestPasswordReset(email);
      setSuccessMsg(res.message);
      if (res.debugToken) {
        setResetToken(res.debugToken);
        setMode('reset');
      }
    } catch (err) {
      setErrorMsg((err as Error).message || 'Could not process password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await teacherApi.resetPassword(resetToken, newPassword);
      setSuccessMsg(res.message);
      setMode('login');
    } catch (err) {
      setErrorMsg((err as Error).message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md paper-card p-6 paper-lift-shadow relative animate-in zoom-in-95 duration-150 text-xs">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="mb-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-electric)] mx-auto flex items-center justify-center text-white font-['Playfair_Display'] font-bold text-lg shadow-[0_2px_10px_rgba(22,119,255,0.35)] mb-2.5">
            P
          </div>
          <h2 className="font-['Playfair_Display'] text-xl font-bold text-[var(--ink-primary)]">
            PadhaiPilot <span className="font-['Raleway'] font-normal text-xs text-[var(--ink-muted)]">Unified Auth</span>
          </h2>
          <p className="text-[var(--ink-secondary)] text-[11px] mt-0.5 font-['Raleway']">
            {mode === 'login' && 'Sign in to access your academy, faculty records, or classroom'}
            {mode === 'register' && 'Create your teacher profile or join with an institutional code'}
            {mode === 'forgot' && 'Reset your account password securely'}
            {mode === 'reset' && 'Enter your authorization token and set a new password'}
          </p>
        </div>

        {/* 1-Click Role Fast-Switches */}
        {mode === 'login' && (
          <div className="mb-5 p-3 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)]">
            <div className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[var(--brand-electric)]" />
              <span>Instant Demo Switcher (1-Click)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('TEACHER')}
                disabled={isLoading}
                className="p-2 rounded-lg bg-[var(--bg-paper)] border border-[var(--border-paper)] hover:border-[var(--brand-electric)] text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-1.5 mb-1 text-[var(--brand-electric)]">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="font-bold font-['Raleway'] text-[10px]">Faculty</span>
                </div>
                <div className="text-[10px] text-[var(--ink-muted)] truncate">Prof. Sharma</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('TUITION_OWNER')}
                disabled={isLoading}
                className="p-2 rounded-lg bg-[var(--bg-paper)] border border-[var(--border-paper)] hover:border-[var(--brand-electric)] text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-1.5 mb-1 text-emerald-600">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="font-bold font-['Raleway'] text-[10px]">Owner</span>
                </div>
                <div className="text-[10px] text-[var(--ink-muted)] truncate">R. Singhania</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('SUPER_ADMIN')}
                disabled={isLoading}
                className="p-2 rounded-lg bg-[var(--bg-paper)] border border-[var(--border-paper)] hover:border-[var(--brand-electric)] text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-1.5 mb-1 text-purple-600">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="font-bold font-['Raleway'] text-[10px]">Admin</span>
                </div>
                <div className="text-[10px] text-[var(--ink-muted)] truncate">Dr. Vikram</div>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-['Raleway'] text-xs">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-['Raleway'] text-xs">{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[var(--ink-secondary)] mb-1 font-['Raleway'] font-semibold">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="teacher@padhaipilot.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full input-paper"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[var(--ink-secondary)] font-['Raleway'] font-semibold">Password *</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-[var(--brand-electric)] hover:underline font-['Raleway']"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input-paper"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary justify-center text-xs py-2.5 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            </button>

            <div className="pt-2 flex items-center justify-between text-[11px] font-['Raleway']">
              <button
                type="button"
                onClick={() => {
                  setEmail('teacher@padhaipilot.com');
                  setPassword('password123');
                }}
                className="text-[var(--brand-electric)] hover:underline flex items-center gap-1 font-semibold"
              >
                Fill Faculty Credentials
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:underline"
              >
                Register New Teacher
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTRATION FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-[var(--ink-secondary)] mb-1 font-['Raleway'] font-semibold">
                Full Name with Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Sunita Rao"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full input-paper"
              />
            </div>

            <div>
              <label className="block text-[var(--ink-secondary)] mb-1 font-['Raleway'] font-semibold">
                Official Email *
              </label>
              <input
                type="email"
                required
                placeholder="faculty@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full input-paper"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[var(--ink-secondary)] mb-1 font-['Raleway'] font-semibold">
                  Teaching Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chemistry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full input-paper"
                />
              </div>
              <div>
                <label className="block text-[var(--ink-secondary)] mb-1 font-['Raleway'] font-semibold">
                  Teacher Invite Code
                </label>
                <input
                  type="text"
                  placeholder="Optional code"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  className="w-full input-paper"
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--ink-secondary)] mb-1 font-['Raleway'] font-semibold">
                Create Password (min 6 chars) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input-paper"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary justify-center text-xs py-2.5 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'Registering...' : 'Complete Teacher Registration'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[var(--brand-electric)] hover:underline text-[11px] font-['Raleway']"
              >
                Already registered? Sign in here
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-3.5">
            <div>
              <label className="block text-[var(--ink-secondary)] mb-1 font-['Raleway'] font-semibold">
                Enter your registered email address *
              </label>
              <input
                type="email"
                required
                placeholder="teacher@padhaipilot.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full input-paper"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary justify-center text-xs py-2.5"
            >
              {isLoading ? 'Generating token...' : 'Request Password Reset'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] text-[11px] font-['Raleway']"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* 4. RESET PASSWORD */}
        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-3.5">
            <div>
              <label className="block text-[var(--ink-secondary)] mb-1 font-['Raleway'] font-semibold">
                Reset Token *
              </label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full input-paper font-mono"
              />
            </div>

            <div>
              <label className="block text-[var(--ink-secondary)] mb-1 font-['Raleway'] font-semibold">
                New Password (min 6 chars) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full input-paper"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary justify-center text-xs py-2.5"
            >
              {isLoading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
