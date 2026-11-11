import Link from 'next/link';
import Image from 'next/image';
import { SITE } from '../../config/site';

export const metadata = {
  title: 'Terms of Service — PadhaiPilot',
  description: 'The terms that govern your use of PadhaiPilot.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#1C1917]">{title}</h2>
      <div className="space-y-2 text-[#44403C] text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function TermsPage() {
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
          <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1C1917]">Terms of Service</h1>
          <p className="text-sm text-[#57534E]">Last updated: November 2026</p>
          <p className="text-sm text-[#57534E] leading-relaxed">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of PadhaiPilot (&ldquo;Service&rdquo;), a
            software platform for tuition centres and coaching institutes operated by PadhaiPilot Inc. By registering for or using the
            Service you agree to these Terms. If you do not agree, do not use the Service.
          </p>
        </div>

        <Section title="1. Eligibility">
          <p>
            You must be at least 13 years old to use the Service. If you are under 18, your institute owner or a parent / guardian
            must accept these Terms on your behalf. By using the Service you represent that you meet these requirements.
          </p>
        </Section>

        <Section title="2. Account Responsibilities">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You are responsible for keeping your login credentials confidential.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>Notify us immediately at{' '}
              <a className="text-[#1677FF] hover:underline font-bold" href={`mailto:${contact}`}>{contact}</a>
              {' '}if you suspect unauthorised access.</li>
            <li>Each account is personal and may not be shared or transferred without our consent.</li>
          </ul>
        </Section>

        <Section title="3. Institute Owner Responsibilities">
          <p>
            Institute owners (account holders who create and manage an institute on PadhaiPilot) are responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Obtaining any consents required to enrol students, including consent from parents or guardians for minors.</li>
            <li>Ensuring that the institute&apos;s use of the Service complies with applicable Indian laws and regulations.</li>
            <li>The accuracy of data entered into the platform, including fee amounts, attendance records and test scores.</li>
            <li>Not sharing enrollment codes or access links beyond their intended recipients.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Upload unlawful, harmful, defamatory or infringing content.</li>
            <li>Attempt to access another institute&apos;s data.</li>
            <li>Reverse-engineer, decompile or scrape the Service.</li>
            <li>Use the Service to send unsolicited communications or spam.</li>
            <li>Interfere with the availability or security of the Service or its underlying infrastructure.</li>
          </ul>
          <p>
            Violation of these rules may result in immediate termination of your account without refund.
          </p>
        </Section>

        <Section title="5. Payment Terms">
          <p>
            Paid plans are billed as described on the pricing page. Payments are processed by Razorpay and are subject to
            Razorpay&apos;s terms and privacy policy. PadhaiPilot does not store card numbers or bank account details.
          </p>
          <p>
            Fees for the current billing period are non-refundable except where required by applicable Indian consumer-protection law.
            We reserve the right to change plan pricing with reasonable advance notice.
          </p>
          <p>
            The Starter plan is provided free of charge subject to the student limits described on the pricing page.
          </p>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            The PadhaiPilot platform, including its software, design and documentation, is owned by PadhaiPilot Inc. and protected
            by Indian and international intellectual-property laws. You are granted a limited, non-exclusive, non-transferable licence
            to use the Service for its intended purpose.
          </p>
          <p>
            Institute owners retain ownership of all data, files and content they upload. By uploading content you grant us a limited
            licence to store and process it solely to provide the Service.
          </p>
        </Section>

        <Section title="7. No Guarantee of Academic Results">
          <p>
            PadhaiPilot is a management and communication tool. We make no representation that use of the Service will improve
            academic performance, test results or any other educational outcome.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by Indian law, PadhaiPilot Inc. shall not be liable for indirect, incidental, special or
            consequential damages arising from use of the Service. Our total aggregate liability in any calendar year shall not exceed
            the total fees paid by the institute in that year.
          </p>
        </Section>

        <Section title="9. Service Availability">
          <p>
            We aim for high availability but do not guarantee uninterrupted access. We may suspend the Service for maintenance with
            reasonable notice where practicable.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            You may delete your account at any time. We may suspend or terminate accounts that violate these Terms or for any other
            legitimate reason with reasonable notice. On termination, your data will be handled as described in our Privacy Policy.
          </p>
        </Section>

        <Section title="11. Governing Law and Disputes">
          <p>
            These Terms are governed by the laws of India. Any dispute arising from these Terms shall be subject to the exclusive
            jurisdiction of the courts located in India. We encourage you to contact us first at{' '}
            <a className="text-[#1677FF] hover:underline font-bold" href={`mailto:${contact}`}>{contact}</a>
            {' '}to resolve any dispute informally.
          </p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>
            We may revise these Terms from time to time. We will notify institute owners of material changes via email or an in-app
            notice. Continued use of the Service after changes become effective constitutes acceptance.
          </p>
        </Section>

        <Section title="13. Contact">
          <div className="p-4 rounded-2xl bg-white border border-[#E3DFD9]">
            <p className="font-bold text-[#1C1917]">PadhaiPilot Inc.</p>
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
