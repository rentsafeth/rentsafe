import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: {
    default: 'RentSafe - เช็คก่อนเช่า ปลอดภัยแน่นอน',
    template: '%s | RentSafe',
  },
  description:
    'ตรวจสอบความน่าเชื่อถือของร้านรถเช่าก่อนใช้บริการ ป้องกันการโกง ปลอดภัย มั่นใจ 100%',
  keywords: [
    'เช่ารถ',
    'รถเช่า',
    'ตรวจสอบร้านเช่ารถ',
    'โกง',
    'หลอกลวง',
    'รายงานโกง',
    'car rental',
    'scam',
  ],
  authors: [{ name: 'RentSafe' }],
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: 'https://rentsafe.in.th',
    siteName: 'RentSafe',
    title: 'RentSafe - เช็คก่อนเช่า ปลอดภัยแน่นอน',
    description:
      'ตรวจสอบความน่าเชื่อถือของร้านรถเช่าก่อนใช้บริการ ป้องกันการโกง ปลอดภัย มั่นใจ 100%',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
