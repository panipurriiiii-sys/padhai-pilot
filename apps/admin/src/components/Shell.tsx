'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Building2,
  History,
  Layers,
  LogOut,
  Menu,
  Palette,
  Radio,
  ShieldAlert,
  ShieldCheck,
  ToggleRight,
  X,
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { ToastProvider, Spin, errMsg } from './ui';

const NAV = [
  { href: '/', label: 'Overview', icon: Activity },
  { href: '/institutes', label: 'Institutes', icon: Building2 },
  { href: '/plans', label: 'Plans & entitlements', icon: Layers },
  { href: '/features', label: 'Feature flags', icon: ToggleRight },
  { href: '/audit', label: 'Audit log', icon: History },
  { href: '/announcements', label: 'Announcements', icon: Radio },
  { href: '/theme', label: 'Theme', icon: Palette },
];

type User = { id: string; email: string; role: string; fullName?: string; name?: string };

function Login({ onDone, denied }: { onDone: (u: User) => void; denied?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(denied ?? null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await adminApi.login(email.trim(), password);
      onDone(user);
    } catch (err) {
      setError(errMsg(err, 'Sign-in failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="paper-card w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-brand-subtle text-electric flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl text-ink-primary">Platform Admin</h1>
            <p className="font-primary text-xs text-ink-muted">PadhaiPilot control center, Super Admin only</p>
          </div>
        </div>
        {error && (
          <div className="notice is-danger" role="alert">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words min-w-0">{error}</span>
          </div>
        )}
        <label className="block">
          <span className="block text-xs font-bold font-primary mb-1">Email</span>
          <input
            className="input-paper w-full"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="block text-xs font-bold font-primary mb-1">Password</span>
          <input
            className="input-paper w-full"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
          {busy ? <Spin /> : null} Sign in
        </button>
      </form>
    </main>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = adminApi.getCurrentUser();
    if (u && adminApi.getToken()) setUser(u);
    setReady(true);
    const onUnauthorized = () => setUser(null);
    window.addEventListener('pp:unauthorized', onUnauthorized);
    return () => window.removeEventListener('pp:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const logout = useCallback(() => {
    adminApi.clearToken();
    setUser(null);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Login onDone={setUser} />;
  if (user.role !== 'SUPER_ADMIN') {
    adminApi.clearToken();
    return <Login onDone={setUser} denied="Access denied: this console is for Platform Super Admins only." />;
  }

  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const current = NAV.find((n) => active(n.href));

  const nav = (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={active(n.href) ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 min-h-11 rounded-xl font-primary text-sm font-bold transition-colors ${
            active(n.href) ? 'bg-brand-subtle text-electric' : 'text-ink-secondary hover:bg-paper-warm hover:text-ink-primary'
          }`}
        >
          <n.icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{n.label}</span>
        </Link>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-border-paper pt-3 space-y-2">
      <p className="px-3 text-xs font-data text-ink-muted truncate" title={user.email}>
        {user.email}
      </p>
      <button type="button" onClick={logout} className="btn-secondary w-full justify-center">
        <LogOut className="w-3.5 h-3.5" /> Sign out
      </button>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* desktop sidebar */}
        <aside className="hidden lg:flex flex-col justify-between gap-6 p-4 sticky top-0 h-dvh border-r border-border-paper bg-paper">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2 pt-1">
              <ShieldCheck className="w-5 h-5 text-electric" />
              <span className="font-display font-bold text-lg">Platform Admin</span>
            </div>
            {nav}
          </div>
          {account}
        </aside>

        {/* mobile / tablet top bar */}
        <header className="lg:hidden glass-nav sticky top-0 z-30 flex items-center gap-2 px-3 h-14">
          <button type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)} className="tap rounded-xl hover:bg-paper-warm">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-base truncate">{current?.label ?? 'Platform Admin'}</span>
        </header>

        {open && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-scrim" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-paper border-r border-border-paper p-4 flex flex-col justify-between gap-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-lg">Platform Admin</span>
                  <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="tap rounded-xl hover:bg-paper-warm">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {nav}
              </div>
              {account}
            </div>
          </div>
        )}

        <main className="min-w-0 px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-[90rem] w-full">{children}</main>
      </div>
    </ToastProvider>
  );
}
