import Link from 'next/link'
import { ShieldCheck, Facebook, Twitter, Mail } from 'lucide-react'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">RentSafe</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            ระบบตรวจสอบร้านเช่ารถที่น่าเชื่อถือ<br />
                            ปกป้องคุณจากการโกง
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 hover:bg-blue-400 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="mailto:rentsafeth@gmail.com"
                                className="w-10 h-10 bg-gray-800 hover:bg-red-500 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">เมนูหลัก</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                                    หน้าแรก
                                </Link>
                            </li>
                            <li>
                                <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
                                    ค้นหาร้านค้า
                                </Link>
                            </li>
                            <li>
                                <Link href="/report" className="text-gray-400 hover:text-white transition-colors">
                                    รายงานร้านค้า
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop/register" className="text-gray-400 hover:text-white transition-colors">
                                    ลงทะเบียนร้านค้า
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">ช่วยเหลือ</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                                    คำถามที่พบบ่อย
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                                    ติดต่อเรา
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                                    นโยบายความเป็นส่วนตัว
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                                    เงื่อนไขการใช้งาน
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">ติดต่อเรา</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li>
                                <span className="block text-sm">อีเมล</span>
                                <a href="mailto:rentsafeth@gmail.com" className="text-white hover:text-blue-400 transition-colors">
                                    rentsafeth@gmail.com
                                </a>
                            </li>
                            <li>
                                <span className="block text-sm">โทรศัพท์</span>
                                <a href="tel:0838068396" className="text-white hover:text-blue-400 transition-colors">
                                    083-806-8396
                                </a>
                            </li>
                            <li>
                                <span className="block text-sm">เวลาทำการ</span>
                                <span className="text-white">จันทร์ - ศุกร์ 09:00 - 18:00</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
                        <p>&copy; {currentYear} RentSafe. All rights reserved.</p>
                        <p>Rent with Confidence. Verify Before You Drive.</p>
                    </div>
                </div>
            </div>

            {/* Spacer for mobile bottom menu */}
            <div className="h-16 md:h-0"></div>
        </footer>
    )
}
