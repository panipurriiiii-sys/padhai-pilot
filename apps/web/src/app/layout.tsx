import type { Metadata } from 'next';
import { Playfair_Display, Raleway, Inter } from 'next/font/google';
import './globals.css';

// The three approved PadhaiPilot families (identical in every app; see docs/global-design-system.md).
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-primary',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-data',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PadhaiPilot — Run Your Entire Tuition from One App',
  description: 'PadhaiPilot lets tuition centres manage batches, attendance, fees, assignments, results and payroll — all in one place. Trusted by coaching institutes across India.',
  keywords: ['tuition management', 'coaching institute software', 'attendance app', 'fee collection', 'student results', 'India'],
  authors: [{ name: 'PadhaiPilot' }],
  metadataBase: new URL('https://padhaipilot.vercel.app'),
  openGraph: {
    title: 'PadhaiPilot — Run Your Entire Tuition from One App',
    description: 'Manage batches, attendance, fees, assignments and results from one dashboard. Online fee collection via Razorpay. Coming to Play Store & App Store.',
    url: 'https://padhaipilot.vercel.app',
    siteName: 'PadhaiPilot',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PadhaiPilot — Tuition Management Platform',
    description: 'All-in-one platform for tuition centres: batches, attendance, fees, results & more.',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${raleway.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-desk text-ink-primary">
        {children}
      </body>
    </html>
  );
}
