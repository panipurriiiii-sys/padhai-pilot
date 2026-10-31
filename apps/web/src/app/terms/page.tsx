import Link from 'next/link';
import { SITE } from '../../config/site';

export const metadata = { title: 'Terms of Use - PadhaiPilot' };

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-6 text-sm leading-relaxed text-ink-secondary">
      <Link href="/" className="text-xs text-electric underline">Back to home</Link>
      <h1 className="font-serif text-3xl font-bold text-ink-primary">Terms of Use</h1>
      <p>
        These terms govern use of {SITE.name}. They are a plain-language summary and should be reviewed by the operator&apos;s legal
        adviser before launch.
      </p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Accounts</h2>
      <p>You are responsible for keeping your password confidential and for activity under your account. Institutes decide who may join their batches.</p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Acceptable use</h2>
      <p>Do not upload unlawful content, attempt to access another institute&apos;s data, or interfere with the service.</p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Institute data</h2>
      <p>
        Institutes own the records they enter. Documents generated for an institute, such as result sheets and receipts, carry that
        institute&apos;s own name and branding.
      </p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Plans and fees</h2>
      <p>Plans differ by the number of active students. Commercial terms are agreed with the platform operator when an institute is onboarded.</p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Availability</h2>
      <p>The service is provided as is. We aim for high availability but do not guarantee uninterrupted access.</p>

      <h2 className="font-serif text-xl font-bold text-ink-primary">Contact</h2>
      <p>{SITE.contactEmail ? <a className="underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> : 'Contact the platform operator for questions about these terms.'}</p>
    </main>
  );
}
