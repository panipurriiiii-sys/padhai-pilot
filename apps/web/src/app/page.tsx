import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Users,
  CalendarCheck,
  Award,
  CreditCard,
  Building2,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Clock,
  HeartHandshake,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { PLANS, SITE } from '../config/site';

const MARKETING_HIGHLIGHTS = [
  {
    icon: CalendarCheck,
    title: 'Smart Daily Attendance',
    subtitle: 'Zero paper registers',
    body: 'Take batch attendance in under 15 seconds. Absent alerts notify parents instantly so every student stays on track.',
  },
  {
    icon: Award,
    title: 'Marks, Quizzes & Growth',
    subtitle: 'Celebrate student milestones',
    body: 'Enter marks effortlessly in a single sheet. Share progress cards, rankings, and feedback that inspire confidence.',
  },
  {
    icon: CreditCard,
    title: 'Easy Fee Collection & Receipts',
    subtitle: 'On-time fee payments',
    body: 'Say goodbye to awkward fee reminders. Send gentle automated reminders and print elegant branded payment receipts.',
  },
  {
    icon: BookOpen,
    title: 'Homework & Study Materials',
    subtitle: 'Everything in one digital hub',
    body: 'Share lecture notes, assignments, and test schedules directly. Students access everything from their phone or laptop.',
  },
  {
    icon: Building2,
    title: 'Your Coaching Brand First',
    subtitle: 'Custom institute identity',
    body: 'Your academy name, logo, and signature proudly appear on all report cards, payment slips, and notice boards.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe, Simple & Private',
    subtitle: 'Built for coaching peace of mind',
    body: 'Your institute data belongs 100% to you. No complicated setups, no confusing technical jargon—just clear results.',
  },
];

const AUDIENCE_BENEFITS = [
  {
    role: 'FOR COACHING OWNERS & DIRECTORS',
    title: 'Run your institute with total clarity and peace of mind.',
    points: [
      'Track total admissions, fee dues, and batch collections at a glance',
      'Manage faculty workloads, schedules, and payroll effortlessly',
      'Retain students and build trusted relationships with parents',
    ],
    image: '/onboarding/onboarding_bg_3.jpg',
    imageAlt: 'Classroom teaching and institute management',
  },
  {
    role: 'FOR TEACHERS & FACULTY',
    title: 'Less paperwork, more time inspiring and teaching students.',
    points: [
      'Take attendance in seconds right from your mobile or desk',
      'Publish test results and distribute revision notes without hassle',
      'Keep your daily teaching diary and syllabus schedule organized',
    ],
    image: '/onboarding/onboarding_bg_2.jpg',
    imageAlt: 'Teacher desk with study goals and planning',
  },
  {
    role: 'FOR STUDENTS & PARENTS',
    title: 'Stay informed, motivated, and ahead in every class.',
    points: [
      'View upcoming classes, test dates, and assignments anytime',
      'Track test marks and performance growth over the academic year',
      'Receive official receipts and notices directly on WhatsApp or portal',
    ],
    image: '/onboarding/onboarding_bg_1.jpg',
    imageAlt: 'Student campus and learning pathway',
  },
];

export default function HomePage() {
  const teacherHref = SITE.teacherUrl || 'https://teacher.padhaipilot.com';
  const studentHref = SITE.studentUrl || 'https://student.padhaipilot.com';

  return (
    <div className="min-h-screen bg-[#050608] text-white font-sans selection:bg-[#1677FF] selection:text-white">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#050608]/90 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1677FF] flex items-center justify-center text-white font-serif font-black text-lg shadow-[0_2px_12px_rgba(22,119,255,0.4)]">
              P
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-white">
              {SITE.name}
            </span>
          </div>

          <nav aria-label="Primary" className="hidden sm:flex items-center gap-6 text-xs font-semibold text-white/80">
            <a href="#benefits" className="hover:text-white transition">Benefits</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#plans" className="hover:text-white transition">Pricing</a>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={studentHref}
              className="hidden md:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/15 transition border border-white/10"
            >
              Student Sign In
            </a>
            <a
              href={teacherHref}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1677FF] hover:bg-[#1260d4] transition shadow-[0_2px_10px_rgba(22,119,255,0.4)] flex items-center gap-1.5"
            >
              <span>Teacher Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="space-y-24 md:space-y-32">
        {/* 2. HERO SECTION */}
        <section className="relative pt-16 md:pt-24 pb-12 px-6 overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#1677FF]/15 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#1677FF]" />
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                The All-In-One Platform for Growing Tuitions & Academies
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] text-white">
              Give your tuition the <span className="text-[#1677FF]">professional edge</span> it deserves.
            </h1>

            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed font-normal">
              Effortlessly manage attendance, tests, homework, and fee payments—all in one beautiful app designed specifically for coaching institutes, teachers, and ambitious students.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href={teacherHref}
                className="px-7 py-3.5 rounded-2xl text-sm font-bold bg-[#1677FF] hover:bg-[#1260d4] text-white shadow-[0_8px_25px_rgba(22,119,255,0.45)] transition flex items-center gap-2.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Get Started as Teacher / Owner</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={studentHref}
                className="px-7 py-3.5 rounded-2xl text-sm font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-md transition flex items-center gap-2.5 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-[#1677FF]" />
                <span>Student & Parent Portal</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-white/60">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Free Starter Plan
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Works on Mobile & Desktop
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Instant WhatsApp Notices
              </span>
            </div>
          </div>
        </section>

        {/* 3. HERO VISUAL SHOWCASE */}
        <section className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            <div className="relative h-[320px] sm:h-[450px] md:h-[520px] w-full">
              <Image
                src="/onboarding/onboarding_bg_3.jpg"
                alt="PadhaiPilot Academy Classroom and Management"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent opacity-90" />
              
              <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 flex flex-col md:flex-row md:items-end justify-between gap-4 z-10">
                <div className="max-w-xl">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/30">
                    Trusted by passionate teachers across India
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2">
                    Transforming classrooms from chaotic registers to effortless confidence.
                  </h3>
                </div>

                <a
                  href={teacherHref}
                  className="px-5 py-3 rounded-xl bg-white text-black font-bold text-xs hover:bg-stone-200 transition self-start md:self-auto shrink-0 shadow-lg"
                >
                  Create Free Academy Account →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 4. AUDIENCE BENEFITS SECTION */}
        <section id="benefits" className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#1677FF] uppercase tracking-widest">
              Tailored for Everyone
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Everything your coaching needs to succeed every single day.
            </h2>
            <p className="text-xs sm:text-sm text-white/70">
              Clear, friendly tools crafted specifically around coaching schedules, parent communication, and student growth.
            </p>
          </div>

          <div className="space-y-12">
            {AUDIENCE_BENEFITS.map((item, idx) => (
              <div
                key={item.role}
                className={`p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col ${
                  idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } items-center gap-8 md:gap-12 backdrop-blur-xs`}
              >
                <div className="flex-1 space-y-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#1677FF]/20 text-[#1677FF] border border-[#1677FF]/40">
                    {item.role}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-snug">
                    {item.title}
                  </h3>
                  <div className="space-y-3 pt-2">
                    {item.points.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-white/80">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full lg:w-1/2 relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-white/15 shadow-xl shrink-0">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. MARKETING FEATURES GRID */}
        <section id="features" className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#1677FF] uppercase tracking-widest">
              Simple & Powerful
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Features that save hours every week.
            </h2>
            <p className="text-xs sm:text-sm text-white/70">
              No complicated manuals or training sessions needed. Start using it right away.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETING_HIGHLIGHTS.map((f, fIdx) => {
              const IconComp = f.icon;
              return (
                <div
                  key={fIdx}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1677FF]/15 border border-[#1677FF]/30 flex items-center justify-center text-[#1677FF]">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white">{f.title}</h3>
                      <p className="text-[11px] font-bold text-[#1677FF] uppercase tracking-wide mt-0.5">
                        {f.subtitle}
                      </p>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">{f.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. PRICING & SCALE */}
        <section id="plans" className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#1677FF] uppercase tracking-widest">
              Fair & Transparent
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Plans that grow alongside your tuition.
            </h2>
            <p className="text-xs sm:text-sm text-white/70">
              Start completely free with Starter Coaching. Upgrade only when you enroll more students.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((p) => {
              const isPopular = p.id === 'GROWTH';
              return (
                <div
                  key={p.id}
                  className={`p-6 rounded-3xl flex flex-col justify-between transition-all ${
                    isPopular
                      ? 'bg-gradient-to-b from-white/10 to-white/5 border-2 border-[#1677FF] shadow-[0_10px_30px_rgba(22,119,255,0.2)]'
                      : 'bg-white/5 border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-4">
                    {isPopular && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#1677FF] text-white tracking-widest">
                        Most Popular
                      </span>
                    )}
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-white/60 mt-1">
                        {p.students === null
                          ? 'Unlimited active students'
                          : `Up to ${p.students} active students`}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <span className="font-serif text-2xl font-bold text-white">
                        {p.price ?? 'Custom'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-white/80 pt-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Daily Attendance & Timetable</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Homework & Marks Register</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Student & Parent Portal</span>
                      </div>
                      {p.id !== 'STARTER' && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Fee Reminders & Receipts</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/10">
                    <a
                      href={teacherHref}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isPopular
                          ? 'bg-[#1677FF] hover:bg-[#1260d4] text-white shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-white'
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
            <p className="text-center text-xs text-white/60 pt-4">
              Need a personalized demo or custom multi-branch plan? Reach us at{' '}
              <a className="text-[#1677FF] hover:underline font-bold" href={`mailto:${SITE.contactEmail}`}>
                {SITE.contactEmail}
              </a>
            </p>
          )}
        </section>

        {/* 7. BOTTOM CTA CALLOUT */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#1677FF]/20 via-[#1677FF]/10 to-transparent border border-[#1677FF]/40 text-center space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl font-black text-white">
              Ready to give your tuition the easiest upgrade ever?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-lg mx-auto">
              Join educators who have eliminated paperwork and delight their students every day. Setup takes under 2 minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href={teacherHref}
                className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-[#1677FF] hover:bg-[#1260d4] text-white shadow-[0_8px_25px_rgba(22,119,255,0.4)] transition flex items-center gap-2"
              >
                <span>Open Your Academy Free</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 8. FOOTER */}
      <footer className="border-t border-white/10 py-10 px-6 text-xs text-white/60 bg-[#020304]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#1677FF] flex items-center justify-center text-white font-serif font-black text-xs">
              P
            </div>
            <span className="font-serif font-bold text-sm text-white">{SITE.name}</span>
            <span className="text-[10px] text-white/40 ml-2">© 2026–2027 PadhaiPilot Inc.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            {SITE.contactEmail && (
              <a href={`mailto:${SITE.contactEmail}`} className="hover:text-white transition">
                Contact Support
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
