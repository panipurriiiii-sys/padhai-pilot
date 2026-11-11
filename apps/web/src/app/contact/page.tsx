import Link from 'next/link';
import Image from 'next/image';
import { Mail, MessageSquare } from 'lucide-react';
import { SITE } from '../../config/site';

export const metadata = {
  title: 'Contact — PadhaiPilot',
  description: 'Get in touch with the PadhaiPilot team.',
};

export default function ContactPage() {
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-20 space-y-10">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center min-h-[44px] text-xs text-[#1677FF] hover:underline font-bold">
            ← Back to home
          </Link>
          <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1C1917]">Contact Us</h1>
          <p className="text-sm text-[#57534E] leading-relaxed">
            Have a question about PadhaiPilot, your institute account, or our plans? We&apos;re here to help.
          </p>
        </div>

        {/* Email card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E3DFD9] shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#1677FF]" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#1C1917]">Email Support</h2>
            <p className="text-sm text-[#57534E] mt-1 leading-relaxed">
              Send us an email and we will respond as soon as possible, typically within one business day.
            </p>
          </div>
          <a
            href={`mailto:${contact}`}
            className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-xl bg-[#1677FF] text-white text-sm font-bold hover:bg-[#0A6FE8] transition shadow-sm"
          >
            <Mail className="w-4 h-4" />
            {contact}
          </a>
        </div>

        {/* What we can help with */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F5] border border-[#E3DFD9] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E3DFD9] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#44403C]" />
          </div>
          <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#1C1917]">What we can help with</h2>
          <ul className="space-y-2 text-sm text-[#44403C]">
            {[
              'Setting up your tuition centre or institute account',
              'Questions about plans and pricing',
              'Technical issues with the portal or mobile app',
              'Billing and payment queries',
              'Data deletion or privacy requests',
              'App Store / Play Store listing and compliance queries',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1677FF] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
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
