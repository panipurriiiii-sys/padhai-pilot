import Link from 'next/link';
import { BookOpen, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PLANS, SITE } from '../config/site';

const FEATURES = [
  { title: 'Attendance and marks', body: 'Take attendance per batch, enter marks for a whole class in one sheet, and publish results when you are ready.' },
  { title: 'Assignments and tests', body: 'Set homework with due dates, collect submissions, grade them and release results to students.' },
  { title: 'Fees and receipts', body: 'Set batch fees, record payments, and let students see their balance and receipts.' },
  { title: 'Timetable and announcements', body: 'Keep a weekly timetable per batch and send announcements to a batch or the whole institute.' },
  { title: 'Reports on your own letterhead', body: 'Result sheets, receipts and reports carry your institute name, logo and signatory, not ours.' },
  { title: 'Charts that reflect real records', body: 'Attendance, scores and submissions are charted from saved data. When there is no data yet, we say so.' },
];

export default function HomePage() {
  const teacherHref = SITE.teacherUrl || undefined;
  const studentHref = SITE.studentUrl || undefined;
  return (
    <div className="min-h-screen bg-desk text-ink-primary font-sans">
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-border-paper px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <span className="font-serif font-bold text-xl tracking-tight">{SITE.name}</span>
          <nav aria-label="Primary" className="flex items-center gap-4 text-xs font-semibold">
            <a href="#features" className="hover:text-electric">Features</a>
            <a href="#plans" className="hover:text-electric">Plans</a>
            <Link href="/privacy" className="hover:text-electric">Privacy</Link>
            <Link href="/terms" className="hover:text-electric">Terms</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 space-y-24">
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-tight">{SITE.tagline}</h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            Attendance, marks, assignments, fees and reports for tuition institutes, in one place for teachers and students.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <PortalLink href={teacherHref} primary icon={<BookOpen className="w-4 h-4" />} label="Teacher portal" />
            <PortalLink href={studentHref} icon={<GraduationCap className="w-4 h-4 text-electric" />} label="Student portal" />
          </div>
        </section>

        <section id="features" aria-labelledby="features-h" className="space-y-8">
          <h2 id="features-h" className="font-serif text-2xl md:text-3xl font-bold">What it does</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-paper p-6 rounded-2xl border border-border-paper space-y-2">
                <h3 className="font-serif text-lg font-bold">{f.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="plans" aria-labelledby="plans-h" className="space-y-8">
          <div>
            <h2 id="plans-h" className="font-serif text-2xl md:text-3xl font-bold">Plans</h2>
            <p className="text-xs text-ink-muted mt-2">Plans differ by the number of active students an institute can enrol.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((p) => (
              <div key={p.id} className="bg-paper p-6 rounded-2xl border border-border-paper space-y-3">
                <h3 className="font-serif text-lg font-bold">{p.name}</h3>
                <p className="font-data text-sm font-semibold">{p.price ?? 'Contact us for pricing'}</p>
                <p className="flex items-center gap-2 text-xs text-ink-secondary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success-text" />
                  {p.students === null ? 'Unlimited active students' : `Up to ${p.students} active students`}
                </p>
              </div>
            ))}
          </div>
          {SITE.contactEmail && (
            <p className="text-xs text-ink-muted">
              Questions about plans? Write to <a className="underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-border-paper py-8 px-6 text-xs text-ink-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif font-bold text-ink-primary">{SITE.name}</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-electric">Privacy</Link>
            <Link href="/terms" className="hover:text-electric">Terms</Link>
            {SITE.contactEmail && <a href={`mailto:${SITE.contactEmail}`} className="hover:text-electric">Contact</a>}
          </div>
        </div>
      </footer>
    </div>
  );
}

function PortalLink({ href, label, icon, primary }: { href?: string; label: string; icon: React.ReactNode; primary?: boolean }) {
  const cls = `px-6 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
    primary ? 'bg-electric hover:bg-brand-hover text-on-brand shadow-lift' : 'bg-surface-subtle border border-border-paper text-ink-primary'
  }`;
  if (!href) {
    return (
      <span className={`${cls} opacity-60 cursor-not-allowed`} aria-disabled="true">
        {icon}
        <span>{label} (link not configured)</span>
      </span>
    );
  }
  return (
    <a href={href} className={cls} rel="noopener noreferrer">
      {icon}
      <span>{label}</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </a>
  );
}
