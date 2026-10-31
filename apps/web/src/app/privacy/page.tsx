import Link from 'next/link';
import { SITE } from '../../config/site';

export const metadata = { title: 'Privacy Policy - PadhaiPilot' };

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-6 text-sm leading-relaxed text-ink-secondary">
      <Link href="/" className="text-xs text-electric underline">Back to home</Link>
      <h1 className="font-serif text-3xl font-bold text-ink-primary">Privacy Policy</h1>
      <p>
        This policy explains what information {SITE.name} processes when an institute, teacher or student uses the platform.
        It is a plain-language summary and should be reviewed by the operator&apos;s legal adviser before launch.
      </p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Information we process</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Account details: name, email address, phone number and role (teacher, owner, student).</li>
        <li>Academic records created by the institute: batches, attendance, assignments, marks, results, fee records and timetables.</li>
        <li>Files the institute uploads, such as study materials and logos.</li>
        <li>Technical data needed to keep accounts secure, such as sign-in times and audit logs.</li>
      </ul>

      <h2 className="font-serif text-xl font-bold text-ink-primary">How it is used</h2>
      <p>
        Data is used only to provide the service to the institute that holds it. Each institute&apos;s data is kept separate from
        every other institute&apos;s. We do not sell personal data.
      </p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Students and minors</h2>
      <p>
        Student records are created and controlled by the institute the student belongs to. Parents or guardians should contact the
        institute to access or correct a child&apos;s records.
      </p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Security</h2>
      <p>Passwords are stored as one-way hashes and sessions use signed tokens. No system is perfectly secure, and we work to limit access to those who need it.</p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Your choices</h2>
      <p>
        To request access, correction or deletion of your information, contact your institute or{' '}
        {SITE.contactEmail ? <a className="underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> : 'the platform operator'}.
      </p>
    </main>
  );
}
