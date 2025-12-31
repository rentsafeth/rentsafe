import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Phone, MapPin, Clock, ArrowLeft, MessageCircle, Facebook } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return {
        title: locale === 'th' ? 'ติดต่อเรา - RentSafe' : 'Contact Us - RentSafe',
        description: locale === 'th' ? 'ติดต่อทีมงาน RentSafe' : 'Contact RentSafe team',
    }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const isThai = locale === 'th'

    const contactInfo = [
        {
            icon: <Phone className="w-6 h-6" />,
            title: isThai ? 'โทรศัพท์' : 'Phone',
            value: '098-323-6189',
            href: 'tel:0983236189',
            color: 'bg-green-100 text-green-600'
        },
        {
            icon: <Mail className="w-6 h-6" />,
            title: isThai ? 'อีเมล' : 'Email',
            value: 'support@rentsafe.in.th',
            href: 'mailto:support@rentsafe.in.th',
            color: 'bg-blue-100 text-blue-600'
        },
        {
            icon: <MessageCircle className="w-6 h-6" />,
            title: 'LINE Official',
            value: '@rentsafe',
            href: 'https://line.me/R/ti/p/@rentsafe',
            color: 'bg-emerald-100 text-emerald-600'
        },
        {
            icon: <Facebook className="w-6 h-6" />,
            title: 'Facebook',
            value: 'RentSafe Thailand',
            href: 'https://facebook.com/rentsafe',
            color: 'bg-indigo-100 text-indigo-600'
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    {isThai ? 'กลับหน้าหลัก' : 'Back to Home'}
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Mail className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isThai ? 'ติดต่อเรา' : 'Contact Us'}
                            </h1>
                            <p className="text-gray-500">
                                {isThai ? 'เรายินดีให้บริการทุกท่าน' : 'We are happy to help you'}
                            </p>
                        </div>
                    </div>

                    {/* Contact Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                        {contactInfo.map((item, index) => (
                            <a
                                key={index}
                                href={item.href}
                                target={item.href.startsWith('http') ? '_blank' : undefined}
                                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">{item.title}</div>
                                    <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {item.value}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Business Hours */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isThai ? 'เวลาทำการ' : 'Business Hours'}
                            </h2>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">
                                        {isThai ? 'จันทร์ - ศุกร์' : 'Monday - Friday'}
                                    </div>
                                    <div className="font-medium text-gray-900">09:00 - 18:00</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">
                                        {isThai ? 'เสาร์ - อาทิตย์' : 'Saturday - Sunday'}
                                    </div>
                                    <div className="font-medium text-gray-900">10:00 - 16:00</div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">
                                {isThai
                                    ? '* ตอบกลับข้อความภายใน 24 ชั่วโมงในวันทำการ'
                                    : '* Messages will be responded within 24 hours on business days'}
                            </p>
                        </div>
                    </div>

                    {/* Support Topics */}
                    <div className="mb-12">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            {isThai ? 'หัวข้อที่สามารถช่วยเหลือ' : 'How can we help?'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(isThai ? [
                                'สอบถามเกี่ยวกับบริการ',
                                'ปัญหาการใช้งานระบบ',
                                'สอบถามเรื่องการชำระเงิน',
                                'แจ้งปัญหาหรือข้อร้องเรียน',
                                'สมัครแพ็คเกจร้านรับรอง',
                                'ขอความช่วยเหลืออื่นๆ'
                            ] : [
                                'Service inquiries',
                                'System usage issues',
                                'Payment questions',
                                'Report problems or complaints',
                                'Verified Shop subscription',
                                'Other assistance'
                            ]).map((topic, index) => (
                                <div key={index} className="flex items-center gap-2 text-gray-600">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    {topic}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="border-t border-gray-100 pt-8">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">
                                    {isThai ? 'RentSafe Thailand' : 'RentSafe Thailand'}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {isThai
                                        ? 'แพลตฟอร์มตรวจสอบประวัติลูกค้าสำหรับธุรกิจรถเช่า'
                                        : 'Customer verification platform for car rental businesses'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Link */}
                    <div className="mt-8 p-6 bg-purple-50 rounded-xl text-center">
                        <h3 className="font-semibold text-gray-900 mb-2">
                            {isThai ? 'มีคำถาม?' : 'Have questions?'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {isThai
                                ? 'ลองดูคำถามที่พบบ่อยก่อน อาจพบคำตอบที่ต้องการ'
                                : 'Check our FAQ first, you might find your answer'}
                        </p>
                        <Link
                            href="/faq"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
                        >
                            {isThai ? 'ดูคำถามที่พบบ่อย' : 'View FAQ'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
