import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Noto_Sans_Thai, Inter } from 'next/font/google';
import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomMenu from '@/components/layout/BottomMenu';
import { Toaster } from '@/components/ui/sonner';
import PWARegister from '@/components/PWARegister';
import "../globals.css";

const BASE_URL = 'https://rentsafe.in.th';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });

  const title = locale === 'th'
    ? 'RentSafe - ตรวจสอบร้านเช่ารถที่น่าเชื่อถือ'
    : 'RentSafe - Trusted Car Rental Verification';
  const description = locale === 'th'
    ? 'ระบบตรวจสอบร้านเช่ารถที่น่าเชื่อถือ ค้นหาร้านรถเช่า ตรวจสอบ blacklist ปกป้องคุณจากการโกง'
    : 'Trusted car rental shop verification system. Search rental shops, check blacklist, protect yourself from fraud.';

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: title,
      template: `%s | RentSafe`,
    },
    description,
    keywords: locale === 'th'
      ? ['เช่ารถ', 'รถเช่า', 'ตรวจสอบร้านเช่ารถ', 'blacklist', 'รีวิวร้านรถเช่า', 'เช่ารถปลอดภัย']
      : ['car rental', 'rent car', 'car rental verification', 'blacklist', 'car rental review', 'safe car rental'],
    authors: [{ name: 'RentSafe' }],
    creator: 'RentSafe',
    publisher: 'RentSafe',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      url: BASE_URL,
      siteName: 'RentSafe',
      title,
      description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'RentSafe - Trusted Car Rental Verification',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'th': `${BASE_URL}/th`,
        'en': `${BASE_URL}/en`,
      },
    },
    verification: {
      // Add Google Search Console verification when available
      // google: 'verification-code',
    },
  };
}

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
          <PWARegister />
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
