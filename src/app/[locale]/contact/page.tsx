import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowLeft, Clock } from 'lucide-react'

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

                    {/* Email Contact */}
                    <div className="mb-12">
                        <a
                            href="mailto:rentsafeth@gmail.com"
                            className="flex items-center gap-4 p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                        >
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                                <Mail className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">{isThai ? 'อีเมล' : 'Email'}</div>
                                <div className="text-xl font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    rentsafeth@gmail.com
                                </div>
                            </div>
                        </a>
                    </div>

                    {/* Response Time */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isThai ? 'เวลาตอบกลับ' : 'Response Time'}
                            </h2>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6">
                            <p className="text-gray-600">
                                {isThai
                                    ? 'เราจะตอบกลับอีเมลภายใน 24-48 ชั่วโมง'
                                    : 'We will respond to emails within 24-48 hours'}
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
