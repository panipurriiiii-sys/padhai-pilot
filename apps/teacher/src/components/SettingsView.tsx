'use client';

import React, { useState } from 'react';
import { User, Lock, Building2, Bell, Save, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import type { UserSession } from '@padhai-pilot/shared';
import { teacherApi } from '../lib/api';

interface SettingsViewProps {
  user: UserSession;
  onUpdateUser: (u: UserSession) => void;
  onLogout: () => void;
}

export function SettingsView({ user, onUpdateUser, onLogout }: SettingsViewProps) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '+91 98765 43210');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passErrorMsg, setPassErrorMsg] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccessMsg('');
    try {
      const res = await teacherApi.updateProfile({ fullName, phone });
      onUpdateUser(res.user);
      setProfileSuccessMsg('Profile information updated successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPassErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setIsChangingPass(true);
    try {
      await teacherApi.changePassword(oldPassword, newPassword);
      setPassSuccessMsg('Your account password has been updated.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccessMsg(''), 4000);
    } catch (err) {
      setPassErrorMsg((err as Error).message || 'Failed to change password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-paper">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-stone-900">
            Faculty Account & Settings
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-['Raleway']">
            Manage your profile, login credentials, and account settings.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-status-danger/15 hover:bg-status-danger text-status-danger hover:text-white border border-status-danger/30 font-semibold transition shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Institutional Context Card */}
      <div className="p-4 rounded-xl bg-white border border-border-paper flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-electric/15 border border-electric/30 flex items-center justify-center text-electric">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              Affiliated Institution
            </span>
            <span className="text-sm font-bold text-stone-900 block">
              {user.instituteName || 'No institute linked'}
            </span>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded bg-status-success/15 text-status-success font-bold uppercase tracking-wider text-[10px]">
          Verified Faculty
        </span>
      </div>

      {/* Profile Form */}
      <div className="p-5 rounded-xl bg-white border border-border-paper space-y-4">
        <h3 className="font-['Raleway'] font-bold text-sm text-stone-900 flex items-center gap-2">
          <User className="w-4 h-4 text-electric" />
          <span>Personal Profile Information</span>
        </h3>

        {profileSuccessMsg && (
          <div className="p-2.5 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-stone-500 mb-1 font-medium">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
              />
            </div>
            <div>
              <label className="block text-stone-500 mb-1 font-medium">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 font-['Inter'] focus:outline-none focus:border-electric"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-500 mb-1 font-medium">Email Address (Managed by Institution)</label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-[#55595F] cursor-not-allowed font-['Inter']"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2 rounded-lg bg-electric hover:bg-[#3395FF] text-white font-semibold transition disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password & Security Form */}
      <div className="p-5 rounded-xl bg-white border border-border-paper space-y-4">
        <h3 className="font-['Raleway'] font-bold text-sm text-stone-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-electric" />
          <span>Security & Password Management</span>
        </h3>

        {passErrorMsg && (
          <div className="p-2.5 rounded-lg bg-status-danger/15 border border-status-danger/30 text-status-danger flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passErrorMsg}</span>
          </div>
        )}

        {passSuccessMsg && (
          <div className="p-2.5 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <div>
            <label className="block text-stone-500 mb-1 font-medium">Current Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-stone-500 mb-1 font-medium">New Password (min 6 chars) *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
              />
            </div>
            <div>
              <label className="block text-stone-500 mb-1 font-medium">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPass}
              className="px-5 py-2 rounded-lg bg-electric hover:bg-[#3395FF] text-white font-semibold transition disabled:opacity-50"
            >
              {isChangingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

