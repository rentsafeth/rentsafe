import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, ArrowLeft, Lock, Eye, Database, UserCheck, Bell, Trash2 } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return {
        title: locale === 'th' ? 'นโยบายความเป็นส่วนตัว - RentSafe' : 'Privacy Policy - RentSafe',
        description: locale === 'th' ? 'นโยบายความเป็นส่วนตัวของ RentSafe' : 'RentSafe Privacy Policy',
    }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const isThai = locale === 'th'

    const sections = isThai ? [
        {
            icon: <Database className="w-5 h-5" />,
            title: 'ข้อมูลที่เราเก็บรวบรวม',
            content: `เราเก็บรวบรวมข้อมูลต่อไปนี้เพื่อให้บริการ:

• ข้อมูลการลงทะเบียน: ชื่อ, อีเมล, เบอร์โทรศัพท์, ข้อมูลร้านค้า
• ข้อมูลการใช้งาน: ประวัติการค้นหา, การรายงาน, การเข้าสู่ระบบ
• ข้อมูลการชำระเงิน: สลิปการโอนเงิน, ประวัติการทำรายการ
• ข้อมูลลูกค้าที่ถูกรายงาน: ชื่อ, เลขบัตรประชาชน, เบอร์โทร, หลักฐานที่เกี่ยวข้อง
• ข้อมูลเทคนิค: IP Address, ข้อมูลอุปกรณ์, คุกกี้`
        },
        {
            icon: <Eye className="w-5 h-5" />,
            title: 'วัตถุประสงค์ในการใช้ข้อมูล',
            content: `เราใช้ข้อมูลของท่านเพื่อ:

• ให้บริการตรวจสอบประวัติลูกค้าตามที่ท่านร้องขอ
• ยืนยันตัวตนและรักษาความปลอดภัยของบัญชี
• ปรับปรุงและพัฒนาบริการให้ดียิ่งขึ้น
• ส่งการแจ้งเตือนและข้อมูลที่เกี่ยวข้องกับบริการ
• ปฏิบัติตามข้อกำหนดทางกฎหมาย
• วิเคราะห์และปรับปรุงประสิทธิภาพของเว็บไซต์`
        },
        {
            icon: <Lock className="w-5 h-5" />,
            title: 'การรักษาความปลอดภัยข้อมูล',
            content: `เราใช้มาตรการรักษาความปลอดภัยดังนี้:

• การเข้ารหัสข้อมูล SSL/TLS สำหรับการส่งข้อมูล
• การเข้ารหัสรหัสผ่านด้วย bcrypt
• Row Level Security (RLS) ในฐานข้อมูล
• การจำกัดสิทธิ์การเข้าถึงข้อมูลตามบทบาท
• การสำรองข้อมูลอย่างสม่ำเสมอ
• การตรวจสอบและอัปเดตระบบรักษาความปลอดภัยอย่างต่อเนื่อง`
        },
        {
            icon: <UserCheck className="w-5 h-5" />,
            title: 'การเปิดเผยข้อมูลต่อบุคคลที่สาม',
            content: `เราจะไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลของท่าน เราอาจเปิดเผยข้อมูลในกรณีต่อไปนี้:

• เมื่อได้รับความยินยอมจากท่าน
• เพื่อปฏิบัติตามกฎหมายหรือคำสั่งศาล
• เพื่อปกป้องสิทธิ์และทรัพย์สินของ RentSafe
• กับผู้ให้บริการที่ช่วยเหลือในการดำเนินงาน (เช่น hosting, payment gateway) โดยมีสัญญารักษาความลับ

ข้อมูล Blacklist ที่ได้รับการอนุมัติจะแสดงให้ผู้ใช้ที่มีสิทธิ์ค้นหาตามเงื่อนไขบริการ`
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: 'คุกกี้และเทคโนโลยีติดตาม',
            content: `เราใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อ:

• จดจำการเข้าสู่ระบบของท่าน
• ปรับปรุงประสบการณ์การใช้งาน
• วิเคราะห์การใช้งานเว็บไซต์

ท่านสามารถตั้งค่าเบราว์เซอร์เพื่อปฏิเสธคุกกี้ได้ แต่อาจส่งผลต่อการทำงานบางส่วนของเว็บไซต์`
        },
        {
            icon: <Trash2 className="w-5 h-5" />,
            title: 'สิทธิ์ของท่านเกี่ยวกับข้อมูล',
            content: `ท่านมีสิทธิ์ดังต่อไปนี้:

• เข้าถึงและขอสำเนาข้อมูลส่วนบุคคลของท่าน
• แก้ไขข้อมูลที่ไม่ถูกต้อง
• ขอให้ลบข้อมูลส่วนบุคคล (ภายใต้เงื่อนไขที่กำหนด)
• คัดค้านการประมวลผลข้อมูลในบางกรณี
• ถอนความยินยอมที่เคยให้ไว้

หากต้องการใช้สิทธิ์เหล่านี้ กรุณาติดต่อเราที่หน้าติดต่อเรา`
        }
    ] : [
        {
            icon: <Database className="w-5 h-5" />,
            title: 'Information We Collect',
            content: `We collect the following information to provide our services:

• Registration data: Name, email, phone number, shop information
• Usage data: Search history, reports, login records
• Payment data: Transfer slips, transaction history
• Reported customer data: Name, ID card number, phone, related evidence
• Technical data: IP Address, device information, cookies`
        },
        {
            icon: <Eye className="w-5 h-5" />,
            title: 'Purpose of Data Use',
            content: `We use your information to:

• Provide customer verification services as requested
• Verify identity and maintain account security
• Improve and develop better services
• Send notifications and service-related information
• Comply with legal requirements
• Analyze and improve website performance`
        },
        {
            icon: <Lock className="w-5 h-5" />,
            title: 'Data Security',
            content: `We implement the following security measures:

• SSL/TLS encryption for data transmission
• Password encryption with bcrypt
• Row Level Security (RLS) in the database
• Role-based access control
• Regular data backups
• Continuous security monitoring and updates`
        },
        {
            icon: <UserCheck className="w-5 h-5" />,
            title: 'Disclosure to Third Parties',
            content: `We will not sell or rent your personal information. We may disclose information in the following cases:

• With your consent
• To comply with laws or court orders
• To protect the rights and property of RentSafe
• With service providers who help with operations (e.g., hosting, payment gateway) under confidentiality agreements

Approved Blacklist data will be shown to authorized users according to service terms.`
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: 'Cookies and Tracking Technologies',
            content: `We use cookies and similar technologies to:

• Remember your login
• Improve user experience
• Analyze website usage

You can set your browser to reject cookies, but this may affect some website functionality.`
        },
        {
            icon: <Trash2 className="w-5 h-5" />,
            title: 'Your Rights Regarding Data',
            content: `You have the following rights:

• Access and request copies of your personal data
• Correct inaccurate information
• Request deletion of personal data (under certain conditions)
• Object to processing in certain cases
• Withdraw previously given consent

To exercise these rights, please contact us through our Contact page.`
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
                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-7 h-7 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isThai ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}
                            </h1>
                            <p className="text-gray-500">
                                {isThai ? 'อัปเดตล่าสุด: มกราคม 2569' : 'Last updated: January 2026'}
                            </p>
                        </div>
                    </div>

                    <div className="mb-8 p-4 bg-blue-50 rounded-xl">
                        <p className="text-gray-700">
                            {isThai
                                ? 'RentSafe ("เรา") ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้บริการ นโยบายนี้อธิบายวิธีที่เราเก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของท่าน'
                                : 'RentSafe ("we") values the privacy of our users. This policy explains how we collect, use, and protect your personal information.'}
                        </p>
                    </div>

                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <div key={index} className="pb-8 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                                </div>
                                <div className="text-gray-600 whitespace-pre-line pl-13">
                                    {section.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Data Retention */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            {isThai ? 'ระยะเวลาการเก็บรักษาข้อมูล' : 'Data Retention Period'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {isThai
                                ? 'เราจะเก็บรักษาข้อมูลส่วนบุคคลของท่านตราบเท่าที่จำเป็นสำหรับการให้บริการ หรือตามที่กฎหมายกำหนด ข้อมูล Blacklist จะถูกเก็บรักษาเป็นระยะเวลา 5 ปี นับจากวันที่รายงาน เว้นแต่จะมีการขอให้ลบก่อนหน้า'
                                : 'We will retain your personal data as long as necessary to provide services or as required by law. Blacklist data will be retained for 5 years from the report date, unless deletion is requested earlier.'}
                        </p>
                    </div>

                    {/* Children's Privacy */}
                    <div className="mt-6 p-6 bg-yellow-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            {isThai ? 'ความเป็นส่วนตัวของเด็ก' : "Children's Privacy"}
                        </h3>
                        <p className="text-gray-600">
                            {isThai
                                ? 'บริการของเราไม่ได้มุ่งเน้นไปที่ผู้ที่มีอายุต่ำกว่า 18 ปี เราไม่รวบรวมข้อมูลส่วนบุคคลจากเด็กโดยเจตนา หากท่านพบว่าเด็กได้ให้ข้อมูลส่วนบุคคลแก่เรา กรุณาติดต่อเราเพื่อดำเนินการลบข้อมูล'
                                : 'Our services are not directed at individuals under 18 years old. We do not knowingly collect personal information from children. If you find that a child has provided personal information to us, please contact us to delete the data.'}
                        </p>
                    </div>

                    {/* Policy Changes */}
                    <div className="mt-6 p-6 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            {isThai ? 'การเปลี่ยนแปลงนโยบาย' : 'Policy Changes'}
                        </h3>
                        <p className="text-gray-600">
                            {isThai
                                ? 'เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลบังคับใช้ทันทีที่ประกาศบนเว็บไซต์ เราแนะนำให้ท่านตรวจสอบนโยบายนี้เป็นระยะ'
                                : 'We may update this privacy policy from time to time. Changes will take effect immediately upon posting on the website. We recommend checking this policy periodically.'}
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="mt-8 p-6 bg-blue-50 rounded-xl text-center">
                        <h3 className="font-semibold text-gray-900 mb-2">
                            {isThai ? 'มีคำถามเกี่ยวกับความเป็นส่วนตัว?' : 'Questions about privacy?'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {isThai
                                ? 'หากท่านมีคำถามหรือข้อกังวลเกี่ยวกับนโยบายความเป็นส่วนตัว กรุณาติดต่อเรา'
                                : 'If you have questions or concerns about our privacy policy, please contact us'}
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            {isThai ? 'ติดต่อเรา' : 'Contact Us'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
