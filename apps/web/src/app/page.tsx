import Link from 'next/link';
import Image from 'next/image';

// ISR: regenerate at most once per hour; serves stale instantly while revalidating in the background
export const revalidate = 3600;
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  Award,
  CreditCard,
  Building2,
  ShieldCheck,
  Sparkles,
  Users,
  Bell,
  Star,
  ChevronRight,
  Zap,
  Smartphone,
  Layers,
  HeartHandshake,
  Menu,
} from 'lucide-react';
import { PLANS, SITE } from '../config/site';

const STATS_RIBBON = [
  { value: 'Roll call', label: 'Batch Attendance', desc: 'Mark a whole batch from a phone' },
  { value: 'Live', label: 'Fee Ledger', desc: 'Balances, receipts and reminders' },
  { value: 'Free', label: 'Starter Plan', desc: 'No credit card required' },
  { value: 'PDF', label: 'Report Cards & Receipts', desc: 'Branded with your institute' },
];

const FEATURES_CREATIVE = [
  {
    icon: CalendarCheck,
    tag: 'ATTENDANCE & TIME',
    title: 'Attendance in a couple of taps, not a paper register.',
    desc: 'Teachers take batch roll call from a phone. Students see their attendance in their own portal, so nothing is lost on paper.',
    accent: '#1677FF',
    accentBg: '#EFF6FF',
    accentBorder: '#BFDBFE',
    pill: 'Zero Paper Registers',
  },
  {
    icon: Award,
    tag: 'EXAMS & REPORT CARDS',
    title: 'Spreadsheet-fast marks, instant branded report cards.',
    desc: 'Enter scores for a whole batch on one screen. Generate clean PDF report cards that carry your institute name and logo.',
    accent: '#10B981',
    accentBg: '#DAF5E4',
    accentBorder: '#B2E6C4',
    pill: 'Custom Academy Crest',
  },
  {
    icon: CreditCard,
    tag: 'FEE LEDGER & RECEIPT',
    title: 'No more awkward fee calls. Clear ledgers and gentle alerts.',
    desc: 'Set batch fees, record cash or UPI payments, and let students view their balance receipts. Reminders do the asking for you.',
    accent: '#F59E0B',
    accentBg: '#FEF3C7',
    accentBorder: '#F6E09E',
    pill: 'Cash & UPI Records',
  },
  {
    icon: BookOpen,
    tag: 'STUDY HUB & HOMEWORK',
    title: 'Notes, assignments & tests directly on student phones.',
    desc: 'Distribute chapter PDFs, numerical sheets, and due dates effortlessly. Students review notes and submit homework from anywhere.',
    accent: '#6366F1',
    accentBg: '#EEF2FF',
    accentBorder: '#C7D2FE',
    pill: 'Always Accessible',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Set up your academy',
    desc: 'Choose your tuition name, add your subjects, and customize your institute letterhead.',
  },
  {
    step: '02',
    title: 'Create Batches & Share Invite Codes',
    desc: 'Create a shareable enrollment code for each batch. Students join from their phones with the code or link.',
  },
  {
    step: '03',
    title: 'Teach with Total Peace of Mind',
    desc: 'Attendance, tests, homework and fee records live in one place instead of notebooks.',
  },
];

export default function HomePage() {
  const teacherHref = SITE.teacherUrl || 'https://teacher.padhaipilot.com';
  const studentHref = SITE.studentUrl || 'https://student.padhaipilot.com';

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#1C1917] font-['Raleway'] antialiased selection:bg-[#1677FF] selection:text-white">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-[#1677FF] text-white text-[11px] font-['Inter'] font-bold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Academic Session 2026–27 is Live — Start Your Coaching Free Today</span>
      </div>

      {/* 2. STICKY LUXURY NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#FBFBF9]/90 backdrop-blur-md border-b border-[#E3DFD9] px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/logo.png" alt="PadhaiPilot" width={40} height={40} priority className="rounded-xl object-contain" />
            <div>
              <span className="font-['Playfair_Display'] font-bold text-xl tracking-tight text-[#1C1917]">
                {SITE.name}
              </span>
              <span className="hidden sm:inline-block text-[10px] text-[#57534E] ml-2 uppercase font-['Inter'] font-extrabold tracking-widest">
                Tuition Studio
              </span>
            </div>
          </div>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-6 [&_a]:min-h-[44px] [&_a]:inline-flex [&_a]:items-center text-xs font-bold text-[#44403C]">
            <a href="#features" className="hover:text-[#1677FF] transition">Capabilities</a>
            <a href="#experience" className="hover:text-[#1677FF] transition">Experience</a>
            <a href="#how" className="hover:text-[#1677FF] transition">How It Works</a>
            <a href="#plans" className="hover:text-[#1677FF] transition">Pricing</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={studentHref}
              className="hidden sm:flex items-center min-h-[44px] px-4 rounded-xl text-xs font-bold text-[#44403C] hover:text-[#1C1917] bg-[#FAF8F5] hover:bg-[#F3EFE9] transition border border-[#E3DFD9]"
            >
              Student Portal
            </a>
            <a
              href={teacherHref}
              className="min-h-[44px] px-4 rounded-xl text-xs font-bold text-white bg-[#1677FF] hover:bg-[#0A6FE8] transition shadow-[0_2px_10px_rgba(22,119,255,0.3)] flex items-center gap-1.5"
            >
              <span>Teacher Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <details className="md:hidden relative group">
              <summary
                aria-label="Open menu"
                className="list-none cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#E3DFD9] bg-[#FAF8F5] text-[#1C1917] [&::-webkit-details-marker]:hidden"
              >
                <Menu className="w-5 h-5" />
              </summary>
              <nav aria-label="Mobile" className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E3DFD9] bg-white shadow-xl p-2 flex flex-col text-sm font-bold text-[#44403C]">
                {[['#features', 'Capabilities'], ['#experience', 'Experience'], ['#how', 'How It Works'], ['#plans', 'Pricing']].map(([h, l]) => (
                  <a key={h} href={h} className="min-h-[44px] flex items-center px-3 rounded-lg hover:bg-[#FAF8F5]">{l}</a>
                ))}
                <a href={studentHref} className="min-h-[44px] flex items-center px-3 rounded-lg hover:bg-[#FAF8F5] border-t border-[#E3DFD9] mt-1">Student Portal</a>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main className="space-y-24 md:space-y-36">
        {/* 3. HERO SECTION (EDITORIAL + LUXURY PAPER AESTHETIC) */}
        <section className="relative pt-10 sm:pt-16 md:pt-24 pb-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E3DFD9] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] font-['Inter'] font-bold text-[#44403C] tracking-wide uppercase">
                For Tuition Centers & Independent Teachers
              </span>
            </div>

            {/* Hero Main Headline */}
            <h1 className="font-['Playfair_Display'] text-[2rem] sm:text-6xl md:text-7xl font-bold tracking-tight text-[#1C1917] leading-[1.12]">
              The calm, beautiful OS for your <span className="italic font-normal text-[#1677FF]">coaching institute.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-[#57534E] max-w-2xl mx-auto leading-relaxed font-normal">
              Track daily attendance, evaluate tests, share lecture notes and keep a clear fee ledger, all in one place for teachers and students.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4">
              <a
                href={teacherHref}
                className="px-6 sm:px-8 py-4 justify-center rounded-2xl text-sm font-bold bg-[#1677FF] hover:bg-[#0A6FE8] text-white shadow-[0_8px_24px_rgba(22,119,255,0.28)] transition flex items-center gap-2.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Start as Tuition Owner / Faculty</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={studentHref}
                className="px-6 sm:px-8 py-4 justify-center rounded-2xl text-sm font-bold bg-white hover:bg-[#FAF8F5] text-[#1C1917] border border-[#E3DFD9] shadow-xs transition flex items-center gap-2.5 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-[#1677FF]" />
                <span>Student & Parent Portal</span>
              </a>
            </div>

            <p className="text-xs text-[#57534E] font-['Inter'] font-medium pt-2">
              Free Starter plan • No credit card needed
            </p>
          </div>

          {/* 4. HERO VISUAL SHOWCASE (CINEMATIC ARTWORK FRAME) */}
          <div className="max-w-5xl mx-auto mt-12 px-2">
            <div className="relative rounded-3xl overflow-hidden border border-[#E3DFD9] shadow-[0_20px_50px_rgba(60,52,40,0.12)] bg-white p-2">
              <div className="relative h-[380px] sm:h-[480px] md:h-[540px] w-full rounded-2xl overflow-hidden">
                <Image
                  src="/onboarding/onboarding_bg_3.jpg"
                  alt="PadhaiPilot Academy Classroom and Management"
                  fill
                  priority
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/90 via-[#1C1917]/20 to-transparent" />

                {/* Bottom Card Copy */}
                <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
                  <div className="max-w-xl">
                    <span className="px-3 py-1 rounded-full text-[10px] font-['Inter'] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 text-white">
                      Built for tuition centers
                    </span>
                    <h3 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold mt-2 leading-snug">
                      Your teachers focus on teaching. PadhaiPilot handles the rest.
                    </h3>
                  </div>

                  <a
                    href={teacherHref}
                    className="min-h-[44px] px-6 py-3 rounded-xl bg-white text-[#1C1917] font-bold text-xs hover:bg-[#FAF8F5] transition self-start md:self-auto shrink-0 shadow-lg flex items-center gap-2"
                  >
                    <span>Open Free Academy</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#1677FF]" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. STATS & MOMENTUM RIBBON */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-[#E3DFD9] shadow-xs">
            {STATS_RIBBON.map((item, idx) => (
              <div key={idx} className="space-y-1 p-3">
                <span className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1677FF]">
                  {item.value}
                </span>
                <p className="text-xs font-bold text-[#1C1917] pt-1">{item.label}</p>
                <p className="text-[11px] text-[#57534E]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. CREATIVE FEATURE SUITE */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-['Inter'] font-extrabold text-[#1677FF] uppercase tracking-widest">
              Core Capabilities
            </span>
            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl md:text-5xl font-bold text-[#1C1917]">
              Engineered for the daily rhythm of coaching classes.
            </h2>
            <p className="text-xs sm:text-sm text-[#57534E]">
              Every tool is built to save faculty hours and keep students and parents informed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FEATURES_CREATIVE.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="p-5 sm:p-8 rounded-3xl bg-white border border-[#E3DFD9] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: item.accentBg, color: item.accent, border: `1px solid ${item.accentBorder}` }}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-['Inter'] font-extrabold uppercase px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E3DFD9] text-[#57534E]">
                        {item.pill}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-['Inter'] font-extrabold text-[#1677FF] tracking-wider uppercase">
                        {item.tag}
                      </span>
                      <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#1C1917] mt-1 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        {/* 7. EXPERIENCE SECTION: TEACHER & STUDENT ARTWORK прогресс */}
        <section id="experience" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
          <div className="p-5 sm:p-12 rounded-3xl bg-[#FAF8F5] border border-[#E3DFD9] flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <span className="px-3.5 py-1 rounded-full text-[10px] font-['Inter'] font-extrabold uppercase tracking-widest bg-[#EFF6FF] text-[#1677FF] border border-[#BFDBFE]">
                The Faculty Experience
              </span>
              <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1C1917] leading-tight">
                Designed to feel like a high-end physical desk.
              </h2>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                No clunky enterprise menus or confusing SaaS clutter. PadhaiPilot brings the calm, warm feel of fine parchment and rich wood surfaces to your classroom management.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#44403C]">Single-click attendance with absent reasons and medical flags</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#44403C]">Daily Teaching Diary and syllabus completion timelines</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#44403C]">Faculty salary slips and leave management</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={teacherHref}
                  className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-xl bg-[#1677FF] text-white text-xs font-bold hover:bg-[#0A6FE8] transition shadow-xs"
                >
                  <span>Experience Teacher Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#E3DFD9] shadow-lg shrink-0">
              <Image
                src="/onboarding/onboarding_bg_2.jpg"
                alt="Teacher Desk and Daily Academic Planning"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="p-5 sm:p-12 rounded-3xl bg-white border border-[#E3DFD9] flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="flex-1 space-y-6">
              <span className="px-3.5 py-1 rounded-full text-[10px] font-['Inter'] font-extrabold uppercase tracking-widest bg-[#DAF5E4] text-[#0E4A28] border border-[#B2E6C4]">
                The Student & Parent Experience
              </span>
              <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1C1917] leading-tight">
                Clear progress, zero confusion, genuine motivation.
              </h2>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                Students access verified test results, download homework sheets, review lecture diary notes, and monitor their attendance percentage straight from their phone.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#44403C]">Report card PDFs with a subject breakdown</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#44403C]">Downloadable fee payment receipts for parents</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#44403C]">Direct academic doubt solver connecting students to faculty</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={studentHref}
                  className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-xl bg-[#1C1917] text-white text-xs font-bold hover:bg-black transition shadow-xs"
                >
                  <span>Explore Student Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#E3DFD9] shadow-lg shrink-0">
              <Image
                src="/onboarding/onboarding_bg_1.jpg"
                alt="Student Learning and Campus Pathway"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* 8. HOW IT WORKS (3 SIMPLE STEPS) */}
        <section id="how" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-['Inter'] font-extrabold text-[#1677FF] uppercase tracking-widest">
              Simple Onboarding
            </span>
            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1C1917]">
              Up and running in three effortless steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((s, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-8 rounded-3xl bg-white border border-[#E3DFD9] shadow-xs relative space-y-4"
              >
                <span className="font-['Playfair_Display'] text-5xl font-black text-[#1677FF]/20 block">
                  {s.step}
                </span>
                <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1C1917]">
                  {s.title}
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 9. TRANSPARENT PRICING TIERS */}
        <section id="plans" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-['Inter'] font-extrabold text-[#1677FF] uppercase tracking-widest">
              Fair & Scalable Plans
            </span>
            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1C1917]">
              Transparent pricing that grows with your tuition.
            </h2>
            <p className="text-xs sm:text-sm text-[#57534E]">
              Start free with the Starter plan. Upgrade only when your student enrollment expands.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((p) => {
              const isPopular = p.id === 'GROWTH';
              return (
                <div
                  key={p.id}
                  className={`p-6 rounded-3xl flex flex-col justify-between transition-all bg-white ${
                    isPopular
                      ? 'border-2 border-[#1677FF] shadow-lg shadow-blue-500/10'
                      : 'border border-[#E3DFD9] shadow-xs hover:border-[#B8B2A6]'
                  }`}
                >
                  <div className="space-y-4">
                    {isPopular && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-['Inter'] font-extrabold uppercase bg-[#1677FF] text-white tracking-widest">
                        Recommended
                      </span>
                    )}
                    <div>
                      <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1C1917]">
                        {p.name}
                      </h3>
                      <p className="text-xs text-[#57534E] mt-1 font-['Inter']">
                        {p.students === null
                          ? 'Unlimited active students'
                          : `Up to ${p.students} active students`}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E3DFD9]">
                      <span className="font-['Playfair_Display'] text-3xl font-bold text-[#1C1917]">
                        {p.price ?? 'Custom'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-[#44403C] pt-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span>Daily Attendance & Timetable</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span>Homework & Marks Register</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span>Student & Parent Portal</span>
                      </div>
                      {p.id !== 'STARTER' && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          <span>Fee Reminders & Receipts</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#E3DFD9]">
                    <a
                      href={teacherHref}
                      className={`w-full min-h-[44px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isPopular
                          ? 'bg-[#1677FF] hover:bg-[#0A6FE8] text-white shadow-sm'
                          : 'bg-[#1C1917] hover:bg-black text-white'
                      }`}
                    >
                      <span>Choose {p.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {SITE.contactEmail && (
            <p className="text-center text-xs text-[#57534E] pt-4 font-['Inter']">
              Questions about custom setups or branch networks? Contact{' '}
              <a className="text-[#1677FF] hover:underline font-bold" href={`mailto:${SITE.contactEmail}`}>
                {SITE.contactEmail}
              </a>
            </p>
          )}
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1C1917] text-center">Common questions</h2>
          <div className="space-y-3">
            {[
              ['How do students join my batch?', 'Create a batch, copy its enrollment code or share link, and send it to your students. They register on the Student Portal and join with the code. You can change, revoke or set an expiry on a code at any time.'],
              ['Whose name is on report cards and receipts?', 'Your institute. Documents carry your institute name, logo, address and signatory, not ours.'],
              ['Do I record fee payments in the app?', 'Yes. Fees start as pending, you record full or partial payments with the date and mode, and students see their balance and receipts in their portal.'],
              ['Does it work on a phone?', 'Yes. The teacher and student portals are built to work on phones as well as laptops.'],
              ['How much does it cost?', 'The plans above list what is published. Where a price is not shown, contact us for details.'],
            ].map(([q, a]) => (
              <details key={q} className="group rounded-2xl bg-white border border-[#E3DFD9] px-4 sm:px-5">
                <summary className="cursor-pointer list-none min-h-[44px] py-3 flex items-center justify-between gap-3 text-sm font-bold text-[#1C1917] [&::-webkit-details-marker]:hidden">
                  <span>{q}</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-[#1677FF] transition group-open:rotate-90" />
                </summary>
                <p className="pb-4 text-sm text-[#57534E] leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 10. LUXURY CTA INVITATION */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          <div className="p-6 sm:p-14 rounded-3xl bg-[#FAF8F5] border border-[#E3DFD9] text-center space-y-6 shadow-sm relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4">
              <span className="text-[10px] font-['Inter'] font-extrabold uppercase tracking-widest text-[#1677FF]">
                Start In Minutes
              </span>
              <h2 className="font-['Playfair_Display'] text-3xl sm:text-5xl font-bold text-[#1C1917] leading-tight">
                Give your coaching academy the digital elegance it deserves.
              </h2>
              <p className="text-xs sm:text-sm text-[#57534E] max-w-lg mx-auto">
                No credit card required. Invite your students, start marking attendance, and publish report cards today.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <a
                href={teacherHref}
                className="px-8 py-4 rounded-2xl text-sm font-bold bg-[#1677FF] hover:bg-[#0A6FE8] text-white shadow-[0_6px_20px_rgba(22,119,255,0.3)] transition flex items-center gap-2"
              >
                <span>Launch Your Free Institute</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 11. FOOTER */}
      <footer className="border-t border-[#E3DFD9] py-10 sm:py-12 px-4 sm:px-6 text-xs text-[#57534E] bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Image src="/logo.png" alt="PadhaiPilot" width={28} height={28} className="rounded-xl object-contain" />
            <span className="font-['Playfair_Display'] font-bold text-base text-[#1C1917]">{SITE.name}</span>
            <span className="text-[11px] text-[#57534E] font-['Inter'] sm:ml-2">© 2026–2027 PadhaiPilot Inc.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 font-semibold [&_a]:min-h-[44px] [&_a]:inline-flex [&_a]:items-center">
            <Link href="/privacy" className="hover:text-[#1C1917] transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#1C1917] transition">Terms of Service</Link>
            {SITE.contactEmail && (
              <a href={`mailto:${SITE.contactEmail}`} className="hover:text-[#1C1917] transition font-['Inter']">
                Contact Support
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
