'use client';

import React from 'react';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Smartphone,
  Layers,
  ArrowRight,
  Download,
  CheckCircle2,
  Lock,
  Cpu,
  Globe,
  FileText,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050608] text-[#F5F7FA] selection:bg-[#1677FF]/30 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP NAVIGATION                                             */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-[#0A0D12]/90 backdrop-blur-md border-b border-[#ffffff12] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1677FF] flex items-center justify-center text-white font-bold text-base shadow-[0_0_15px_rgba(22,119,255,0.4)]">
              P
            </div>
            <div>
              <span className="font-serif font-bold text-xl text-[#F5F7FA] tracking-tight">
                PadhaiPilot
              </span>
              <span className="text-[10px] text-[#929BAA] block uppercase font-mono tracking-wider -mt-0.5">
                Academic Operating System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://padhai-pilot-grwp.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#ffffff0a] hover:bg-[#ffffff14] text-[#F5F7FA] border border-[#ffffff14] transition"
            >
              Faculty Portal
            </a>
            <a
              href="/student"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1677FF] hover:bg-[#0A6FE8] text-white shadow-md transition flex items-center gap-1.5"
            >
              <span>Student Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 space-y-20">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1677FF]/10 border border-[#1677FF]/30 text-xs font-mono text-[#1677FF]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-Tenant SaaS • Cloudflare Media CDN • Zero Blobs</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#F5F7FA] leading-tight">
            The Academic Operating System for Modern Institutes
          </h1>

          <p className="text-sm sm:text-base text-[#929BAA] max-w-2xl mx-auto leading-relaxed">
            PadhaiPilot equips coaching academies, tuition centers, and schools with high-precision
            classroom test evaluation, multi-subject marks entry, real-time student syncing, and high-speed
            media distribution.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="https://padhai-pilot-grwp.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl bg-[#1677FF] hover:bg-[#0A6FE8] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Launch Faculty Portal</span>
            </a>

            <a
              href="/student"
              className="px-6 py-3 rounded-2xl bg-[#ffffff0a] hover:bg-[#ffffff14] border border-[#ffffff17] text-[#F5F7FA] text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#1677FF]" />
              <span>Launch Student Portal</span>
            </a>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. THREE PORTAL TILES & MOBILE APP                            */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Teacher Suite */}
          <div className="bg-[#0A0D12] p-8 rounded-3xl border border-[#ffffff14] flex flex-col justify-between space-y-6 hover:border-[#1677FF]/50 transition shadow-xl group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1677FF]/15 border border-[#1677FF]/30 flex items-center justify-center text-[#1677FF]">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#F5F7FA] group-hover:text-[#1677FF] transition">
                Teacher & Faculty Portal
              </h3>
              <p className="text-xs text-[#929BAA] leading-relaxed">
                Bulk multi-subject marks and attendance entry with 1-hand speed. Generate official
                result sheets in PDF, manage student rosters, and log daily teaching diaries.
              </p>
              <ul className="text-xs text-[#CAD0D9] space-y-2 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Multi-Subject Bulk Marks & Attendance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Client-Side PDF Report Sheets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Media CDN Study Material Upload</span>
                </li>
              </ul>
            </div>

            <a
              href="https://padhai-pilot-grwp.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-[#ffffff0a] group-hover:bg-[#1677FF] group-hover:text-white border border-[#ffffff14] group-hover:border-[#1677FF] text-xs font-bold text-[#F5F7FA] transition flex items-center justify-center gap-2"
            >
              <span>Open Faculty Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Student Portal */}
          <div className="bg-[#0A0D12] p-8 rounded-3xl border border-[#ffffff14] flex flex-col justify-between space-y-6 hover:border-[#1677FF]/50 transition shadow-xl group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#F5F7FA] group-hover:text-[#1677FF] transition">
                Student & Learning Portal
              </h3>
              <p className="text-xs text-[#929BAA] leading-relaxed">
                Instant access to published classroom marks, question feedback, attendance records,
                and high-speed direct downloads from the Cloudflare Worker Media CDN.
              </p>
              <ul className="text-xs text-[#CAD0D9] space-y-2 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Published Test Evaluations & Grades</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Study Notes & DPP Worksheets Vault</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Attendance Health & Fee Receipts</span>
                </li>
              </ul>
            </div>

            <a
              href="/student"
              className="w-full py-2.5 rounded-xl bg-[#ffffff0a] group-hover:bg-[#1677FF] group-hover:text-white border border-[#ffffff14] group-hover:border-[#1677FF] text-xs font-bold text-[#F5F7FA] transition flex items-center justify-center gap-2"
            >
              <span>Open Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile App */}
          <div className="bg-[#0A0D12] p-8 rounded-3xl border border-[#ffffff14] flex flex-col justify-between space-y-6 hover:border-[#1677FF]/50 transition shadow-xl group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#F5F7FA] group-hover:text-[#1677FF] transition">
                React Native Mobile App
              </h3>
              <p className="text-xs text-[#929BAA] leading-relaxed">
                Bare React Native CLI architecture (no Expo) with role-aware portals for both
                Faculty and Students. 60 FPS fluidity, offline caching, and one-hand usability.
              </p>
              <ul className="text-xs text-[#CAD0D9] space-y-2 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bare React Native CLI Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Faculty & Student Dual Portals</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zustand Global State & Theme Tokens</span>
                </li>
              </ul>
            </div>

            <div className="w-full py-2.5 rounded-xl bg-[#ffffff08] border border-[#ffffff14] text-xs font-mono text-center text-[#929BAA]">
              Bare React Native • Android & iOS
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. TECHNICAL ARCHITECTURE HIGHLIGHTS                          */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-[#0A0D12] p-8 md:p-12 rounded-3xl border border-[#ffffff14] space-y-8">
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#F5F7FA]">
              Production Engineering & Cloud Decisions
            </h2>
            <p className="text-xs text-[#929BAA] mt-2 leading-relaxed">
              Engineered strictly to the project specification for zero database bloat, sub-50ms API
              responses, and enterprise multi-tenant reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1677FF]">
                <Globe className="w-4 h-4" />
                <span>Media Worker CDN</span>
              </div>
              <p className="text-xs text-[#929BAA] leading-relaxed">
                Direct uploads to Cloudflare Worker CDN (https://media.dhyey.cc). 0MB binary blobs in
                PostgreSQL.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Cpu className="w-4 h-4" />
                <span>Redis Multi-Tenant Cache</span>
              </div>
              <p className="text-xs text-[#929BAA] leading-relaxed">
                Tenant-scoped caching on Upstash Redis with automatic eviction on marks and
                attendance mutations.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Emergency Kill Switches</span>
              </div>
              <p className="text-xs text-[#929BAA] leading-relaxed">
                Platform-wide and tenant-specific feature flags with instant kill switches and audit
                logging.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <FileText className="w-4 h-4" />
                <span>Client-Side PDF Sheets</span>
              </div>
              <p className="text-xs text-[#929BAA] leading-relaxed">
                Automated classroom result sheets with institutional headers and grading bands
                rendered with jsPDF.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 5. FOOTER                                                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-[#ffffff12] py-8 px-6 text-center text-xs text-[#929BAA]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#F5F7FA]">PadhaiPilot</span>
            <span>•</span>
            <span>Multi-Tenant Academic Operating System</span>
          </div>

          <div className="text-[11px] font-mono text-[#CAD0D9]">
            Vercel Serverless • Upstash Redis • PostgreSQL
          </div>
        </div>
      </footer>
    </div>
  );
}
