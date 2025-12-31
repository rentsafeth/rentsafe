import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Noto_Sans_Thai, Inter } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomMenu from '@/components/layout/BottomMenu';
import { Toaster } from '@/components/ui/sonner';
import "../globals.css";

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  variable: '--font-noto-sans-thai',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${notoSansThai.variable}`}>
      <body className="antialiased bg-slate-50 min-h-screen flex flex-col font-sans">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <BottomMenu />
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
