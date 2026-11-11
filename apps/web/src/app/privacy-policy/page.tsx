import Link from 'next/link';
import Image from 'next/image';
import { SITE } from '../../config/site';

export const metadata = {
  title: 'Privacy Policy — PadhaiPilot',
  description: 'How PadhaiPilot collects, uses and protects your data.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#1C1917]">{title}</h2>
      <div className="space-y-2 text-[#44403C] text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const contact = SITE.contactEmail || 'techsupport@ellebeo.com';
  return (
    <div className="min-h-screen bg-[#FBFBF9] font-['Inter'] antialiased">
      {/* Nav */}
      <header className="border-b border-[#E3DFD9] px-4 sm:px-6 py-4 bg-white">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <Image src="/logo.png" alt="PadhaiPilot" width={32} height={32} className="rounded-xl object-contain" />
            <span className="font-['Playfair_Display'] font-bold text-lg text-[#1C1917]">PadhaiPilot</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center min-h-[44px] text-xs text-[#1677FF] hover:underline font-bold">
            ← Back to home
          </Link>
          <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1C1917]">Privacy Policy</h1>
          <p className="text-sm text-[#57534E]">Last updated: November 2026</p>
          <p className="text-sm text-[#57534E] leading-relaxed">
            PadhaiPilot (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a software platform for tuition centres and
            coaching institutes. This Privacy Policy explains what personal data we collect, why we collect it, how we store it, and
            your rights over it. It applies to anyone who uses our web portals, mobile applications, or any service under the
            PadhaiPilot brand.
          </p>
        </div>

        <Section title="1. Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Identity & Contact:</strong> Full name, email address, phone number, and role (institute owner, teacher, student,
              or parent).
            </li>
            <li>
              <strong>Academic Records:</strong> Batch enrolments, attendance logs, assignment submissions, test scores, report-card
              data and timetables created by the institute.
            </li>
            <li>
              <strong>Financial Records:</strong> Fee amounts, payment receipts and payment status. Online payments are processed by
              Razorpay; we do not store card numbers or bank account details on our servers.
            </li>
            <li>
              <strong>Institute Assets:</strong> Logos, study materials, PDFs and other files uploaded by the institute.
            </li>
            <li>
              <strong>Technical Data:</strong> IP address, browser type, sign-in timestamps and audit logs used to maintain security
              and diagnose issues.
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Data">
          <p>Personal data is used exclusively to deliver the PadhaiPilot service:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Creating and managing your account and institute profile.</li>
            <li>Generating attendance records, report cards, fee receipts and other institute documents.</li>
            <li>Processing fee payments via Razorpay and sending payment confirmations.</li>
            <li>Sending transactional notifications (e.g. fee reminders, assignment alerts) on behalf of the institute.</li>
            <li>Maintaining platform security and preventing unauthorised access.</li>
            <li>Complying with legal obligations under Indian law.</li>
          </ul>
          <p className="font-semibold text-[#1C1917]">We do not sell, rent or trade your personal data to any third party.</p>
        </Section>

        <Section title="3. Data Storage and Security">
          <p>
            All data is stored in a PostgreSQL database managed via Prisma ORM, hosted on infrastructure with encryption in transit
            (TLS/HTTPS) and at rest. Passwords are stored as one-way scrypt hashes and are never stored in plaintext. Session tokens
            are signed JWTs with strong secrets and short expiry windows.
          </p>
          <p>
            Access to the database is restricted to authenticated application services and authorised personnel only. We apply
            role-based access controls so that each institute&apos;s data is logically isolated from every other institute&apos;s.
          </p>
          <p>
            No security system is perfect. We work continuously to identify and address vulnerabilities and to limit the impact of any
            incident.
          </p>
        </Section>

        <Section title="4. Data Sharing">
          <p>We share data only in the following limited circumstances:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Payment processor (Razorpay):</strong> Fee payment data is processed under Razorpay&apos;s own privacy policy.
            </li>
            <li>
              <strong>Cloud infrastructure providers:</strong> Our hosting providers process data on our behalf under data-processing
              agreements.
            </li>
            <li>
              <strong>Legal obligations:</strong> We may disclose data if required by a court order or applicable Indian law.
            </li>
          </ul>
        </Section>

        <Section title="5. Students and Minors">
          <p>
            Student accounts are created and administered by the institute the student belongs to. We rely on the institute to have
            obtained any consents required for minors. Parents or guardians who wish to access, correct or delete a child&apos;s
            records should first contact their institute. For further assistance, contact us at{' '}
            <a className="text-[#1677FF] hover:underline font-bold" href={`mailto:${contact}`}>
              {contact}
            </a>
            .
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>
            Depending on applicable law, you may have the right to access the personal data we hold about you, request correction of
            inaccurate data, request deletion of your data, and object to or restrict certain processing.
          </p>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a className="text-[#1677FF] hover:underline font-bold" href={`mailto:${contact}`}>
              {contact}
            </a>
            . We will respond within a reasonable period as required by applicable law.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p>
            We retain personal data for as long as an institute account is active. When an account is closed, we delete or anonymise
            the associated personal data within 90 days unless a longer retention period is required by law.
          </p>
        </Section>

        <Section title="8. Cookies and Tracking">
          <p>
            We use session cookies strictly necessary to keep you signed in. We do not use third-party advertising or tracking cookies.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top of
            this page. Continued use of the platform after a change constitutes acceptance of the revised policy.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>
            For any questions or concerns about this privacy policy or your personal data, please contact:
          </p>
          <div className="p-4 rounded-2xl bg-white border border-[#E3DFD9]">
            <p className="font-bold text-[#1C1917]">PadhaiPilot — Data Privacy</p>
            <p>
              Email:{' '}
              <a className="text-[#1677FF] hover:underline font-bold" href={`mailto:${contact}`}>
                {contact}
              </a>
            </p>
          </div>
        </Section>
      </main>

      <footer className="border-t border-[#E3DFD9] py-8 px-4 sm:px-6 text-xs text-[#57534E] bg-white mt-10">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>© 2026–2027 PadhaiPilot Inc.</span>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-semibold">
            <Link href="/privacy-policy" className="hover:text-[#1C1917] transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#1C1917] transition">Terms of Service</Link>
            <Link href="/contact" className="hover:text-[#1C1917] transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
