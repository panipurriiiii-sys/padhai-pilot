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
  title: 'PadhaiPilot — Platform Admin',
  description: 'Private platform administration for PadhaiPilot',
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
