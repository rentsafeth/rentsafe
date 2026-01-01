'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

export default function Footer() {
    const params = useParams()
    const locale = params.locale as string
    const isThai = locale === 'th'
    const currentYear = new Date().getFullYear()

    const content = {
        brand: {
            description: isThai
                ? 'ระบบตรวจสอบร้านเช่ารถที่น่าเชื่อถือ\nปกป้องคุณจากการโกง'
                : 'Trusted car rental shop verification\nProtect yourself from fraud'
        },
        menu: {
            title: isThai ? 'เมนูหลัก' : 'Menu',
            home: isThai ? 'หน้าแรก' : 'Home',
            search: isThai ? 'ค้นหาร้านค้า' : 'Search Shops',
            report: isThai ? 'รายงานร้านค้า' : 'Report Shop',
            register: isThai ? 'ลงทะเบียนร้านค้า' : 'Register Shop'
        },
        support: {
            title: isThai ? 'ช่วยเหลือ' : 'Support',
            faq: isThai ? 'คำถามที่พบบ่อย' : 'FAQ',
            contact: isThai ? 'ติดต่อเรา' : 'Contact Us',
            privacy: isThai ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy',
            terms: isThai ? 'เงื่อนไขการใช้งาน' : 'Terms of Service'
        },
        contact: {
            title: isThai ? 'ติดต่อเรา' : 'Contact Us',
            email: isThai ? 'อีเมล' : 'Email',
            phone: isThai ? 'โทรศัพท์' : 'Phone',
            hours: isThai ? 'เวลาทำการ' : 'Business Hours',
            hoursValue: isThai ? 'จันทร์ - ศุกร์ 09:00 - 18:00' : 'Mon - Fri 09:00 - 18:00'
        }
    }

    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-6 md:py-12">
                {/* Mobile: Compact 2-column layout */}
                <div className="md:hidden">
                    {/* Brand - compact */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">RentSafe</span>
                    </div>
                    <p className="text-gray-400 text-xs mb-4">
                        {isThai ? 'ระบบตรวจสอบร้านเช่ารถที่น่าเชื่อถือ' : 'Trusted car rental verification'}
                    </p>

                    {/* 2-column links */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <h3 className="text-white font-semibold text-sm mb-2">{content.menu.title}</h3>
                            <ul className="space-y-1.5 text-xs">
                                <li><Link href="/" className="text-gray-400 hover:text-white">{content.menu.home}</Link></li>
                                <li><Link href="/search" className="text-gray-400 hover:text-white">{content.menu.search}</Link></li>
                                <li><Link href="/report" className="text-gray-400 hover:text-white">{content.menu.report}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm mb-2">{content.support.title}</h3>
                            <ul className="space-y-1.5 text-xs">
                                <li><Link href="/faq" className="text-gray-400 hover:text-white">{content.support.faq}</Link></li>
                                <li><Link href="/privacy" className="text-gray-400 hover:text-white">{content.support.privacy}</Link></li>
                                <li><Link href="/terms" className="text-gray-400 hover:text-white">{content.support.terms}</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact - inline */}
                    <div className="text-xs text-gray-400 border-t border-gray-800 pt-4 text-center">
                        <a href="mailto:rentsafeth@gmail.com" className="text-blue-400">rentsafeth@gmail.com</a>
                    </div>
                </div>

                {/* Desktop: Full 4-column layout */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">RentSafe</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                            {content.brand.description}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">{content.menu.title}</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                                    {content.menu.home}
                                </Link>
                            </li>
                            <li>
                                <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
                                    {content.menu.search}
                                </Link>
                            </li>
                            <li>
                                <Link href="/report" className="text-gray-400 hover:text-white transition-colors">
                                    {content.menu.report}
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop/register" className="text-gray-400 hover:text-white transition-colors">
                                    {content.menu.register}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">{content.support.title}</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                                    {content.support.faq}
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                                    {content.support.contact}
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                                    {content.support.privacy}
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                                    {content.support.terms}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">{content.contact.title}</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li>
                                <span className="block text-sm">{content.contact.email}</span>
                                <a href="mailto:rentsafeth@gmail.com" className="text-white hover:text-blue-400 transition-colors">
                                    rentsafeth@gmail.com
                                </a>
                            </li>
                            <li>
                                <span className="block text-sm">{content.contact.hours}</span>
                                <span className="text-white">{content.contact.hoursValue}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs md:text-sm text-gray-400">
                        <p>&copy; {currentYear} RentSafe</p>
                        <p className="hidden md:block">Rent with Confidence. Verify Before You Drive.</p>
                    </div>
                </div>
            </div>

            {/* Spacer for mobile bottom menu */}
            <div className="h-16 md:h-0"></div>
        </footer>
    )
}
