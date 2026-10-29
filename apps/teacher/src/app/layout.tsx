import type { Metadata } from 'next';
import { Playfair_Display, Raleway, Inter } from 'next/font/google';
import './globals.css';

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
  title: 'PadhaiPilot — Faculty Studio & Teacher Portal',
  description: 'Tactile Academic Workspace for Educators and Coaching Academies',
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
      <body className="min-h-full flex flex-col bg-[#F8F6F0] text-[#1C1917]">
        {children}
      </body>
    </html>
  );
}
