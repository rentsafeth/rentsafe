'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FileText, ArrowLeft, Car, Building2 } from 'lucide-react'

export default function TermsPage() {
    const params = useParams()
    const locale = params.locale as string
    const isThai = locale === 'th'

    const [activeTab, setActiveTab] = useState<'user' | 'shop'>('user')

    // ข้อกำหนดสำหรับผู้เช่ารถ (ผู้ใช้ทั่วไป)
    const userTermsThai = [
        {
            title: '1. การยอมรับข้อกำหนด',
            content: 'เมื่อท่านเข้าใช้งานเว็บไซต์ RentSafe ท่านตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขการใช้งานทั้งหมดที่ระบุไว้ในเอกสารนี้ หากท่านไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาหยุดใช้งานเว็บไซต์ทันที'
        },
        {
            title: '2. คำอธิบายบริการ',
            content: 'RentSafe เป็นแพลตฟอร์มที่รวบรวมข้อมูลร้านเช่ารถที่ผ่านการตรวจสอบ เพื่อช่วยให้ผู้เช่ารถสามารถค้นหาร้านเช่ารถที่น่าเชื่อถือ ดูรีวิว และรายงานปัญหาที่พบ',
            list: [
                'ค้นหาร้านเช่ารถที่ผ่านการยืนยัน',
                'ดูรีวิวและคะแนนของร้านจากผู้ใช้คนอื่น',
                'รายงานร้านที่มีปัญหาหรือหลอกลวง',
                'รับข้อมูลและคำแนะนำในการเช่ารถอย่างปลอดภัย'
            ]
        },
        {
            title: '3. การใช้งานบริการ',
            content: 'การใช้งาน RentSafe สำหรับผู้เช่ารถเป็นบริการฟรี ท่านสามารถค้นหาร้านและดูข้อมูลได้โดยไม่ต้องสมัครสมาชิก แต่หากต้องการเขียนรีวิวหรือรายงานร้าน จะต้องเข้าสู่ระบบก่อน'
        },
        {
            title: '4. การเขียนรีวิวและรายงาน',
            content: 'เมื่อท่านเขียนรีวิวหรือรายงานร้าน ท่านตกลงว่า:',
            list: [
                'ข้อมูลที่ให้เป็นความจริงตามประสบการณ์จริงของท่าน',
                'ไม่เขียนข้อมูลเท็จ หมิ่นประมาท หรือทำลายชื่อเสียงผู้อื่น',
                'ไม่โพสต์เนื้อหาที่ไม่เหมาะสม ลามก หรือผิดกฎหมาย',
                'ยินยอมให้ RentSafe ตรวจสอบและลบเนื้อหาที่ไม่เหมาะสม'
            ]
        },
        {
            title: '5. ความรับผิดชอบของผู้ใช้',
            content: 'ท่านรับผิดชอบต่อ:',
            list: [
                'การตรวจสอบข้อมูลร้านเพิ่มเติมก่อนตัดสินใจเช่า',
                'การทำสัญญาเช่าโดยตรงกับร้านเช่ารถ',
                'การเก็บหลักฐานการทำธุรกรรมทั้งหมด',
                'การแจ้งความหากเกิดปัญหาทางกฎหมาย'
            ]
        },
        {
            title: '6. ข้อจำกัดความรับผิดชอบ',
            content: 'RentSafe เป็นเพียงแพลตฟอร์มให้ข้อมูล เราไม่ได้เป็นตัวแทนหรือมีส่วนเกี่ยวข้องกับการเช่ารถโดยตรง เราไม่รับผิดชอบต่อ:',
            list: [
                'คุณภาพการบริการของร้านเช่ารถ',
                'ความเสียหายที่เกิดจากการเช่ารถ',
                'ข้อพิพาทระหว่างท่านกับร้านเช่ารถ',
                'ความถูกต้องของข้อมูลที่ร้านค้าให้ไว้'
            ]
        },
        {
            title: '7. ความเป็นส่วนตัว',
            content: 'ข้อมูลส่วนตัวของท่านจะได้รับการปกป้องตามนโยบายความเป็นส่วนตัวของเรา รีวิวที่ท่านเขียนจะแสดงชื่อผู้ใช้ของท่านให้ผู้อื่นเห็น'
        },
        {
            title: '8. การติดต่อ',
            content: 'หากท่านมีคำถามหรือต้องการรายงานปัญหา กรุณาติดต่อเราที่หน้าติดต่อเรา'
        }
    ]

    const userTermsEng = [
        {
            title: '1. Acceptance of Terms',
            content: 'By accessing the RentSafe website, you agree to comply with all terms and conditions outlined in this document. If you do not accept these terms, please stop using the website immediately.'
        },
        {
            title: '2. Description of Service',
            content: 'RentSafe is a platform that collects verified car rental shop information to help renters find trustworthy rental shops, view reviews, and report issues.',
            list: [
                'Search for verified car rental shops',
                'View reviews and ratings from other users',
                'Report problematic or fraudulent shops',
                'Receive information and tips for safe car rental'
            ]
        },
        {
            title: '3. Service Usage',
            content: 'Using RentSafe as a renter is free. You can search for shops and view information without registration. However, writing reviews or reporting shops requires logging in.'
        },
        {
            title: '4. Writing Reviews and Reports',
            content: 'When you write reviews or report shops, you agree that:',
            list: [
                'The information provided is true based on your actual experience',
                'You will not write false, defamatory, or reputation-damaging information',
                'You will not post inappropriate, obscene, or illegal content',
                'You consent to RentSafe reviewing and removing inappropriate content'
            ]
        },
        {
            title: '5. User Responsibilities',
            content: 'You are responsible for:',
            list: [
                'Verifying shop information before deciding to rent',
                'Making rental agreements directly with the rental shop',
                'Keeping records of all transactions',
                'Filing police reports if legal issues arise'
            ]
        },
        {
            title: '6. Limitation of Liability',
            content: 'RentSafe is only an information platform. We are not representatives of or directly involved in car rentals. We are not responsible for:',
            list: [
                'Service quality of rental shops',
                'Damages arising from car rentals',
                'Disputes between you and rental shops',
                'Accuracy of information provided by shops'
            ]
        },
        {
            title: '7. Privacy',
            content: 'Your personal information is protected according to our privacy policy. Reviews you write will display your username publicly.'
        },
        {
            title: '8. Contact',
            content: 'If you have questions or need to report issues, please contact us through our Contact page.'
        }
    ]

    // ข้อกำหนดสำหรับร้านเช่ารถ
    const shopTermsThai = [
        {
            title: '1. การยอมรับข้อกำหนด',
            content: 'เมื่อท่านลงทะเบียนร้านค้าและใช้งาน RentSafe ท่านตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขทั้งหมดที่ระบุไว้ หากท่านไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาหยุดใช้งานทันที'
        },
        {
            title: '2. คำอธิบายบริการ',
            content: 'RentSafe เป็นแพลตฟอร์มที่ให้บริการตรวจสอบประวัติลูกค้าสำหรับธุรกิจรถเช่า บริการของเรารวมถึง:',
            list: [
                'ระบบค้นหาและตรวจสอบประวัติลูกค้า',
                'ระบบรายงานลูกค้าที่มีปัญหา (Blacklist)',
                'ระบบร้านรับรอง (Verified Shop)',
                'ระบบแจ้งเตือนและการสื่อสาร',
                'หน้าโปรไฟล์ร้านค้าให้ลูกค้าค้นหาได้'
            ]
        },
        {
            title: '3. การลงทะเบียนและบัญชีผู้ใช้',
            content: 'ในการใช้บริการ RentSafe ท่านจำเป็นต้องลงทะเบียนร้านค้า ท่านตกลงที่จะ:',
            list: [
                'ให้ข้อมูลร้านค้าที่ถูกต้อง ครบถ้วน และเป็นปัจจุบัน',
                'อัปโหลดเอกสารยืนยันตัวตนที่ถูกต้อง',
                'รักษาความปลอดภัยของรหัสผ่านและบัญชี',
                'แจ้งให้เราทราบทันทีหากพบการใช้งานบัญชีโดยไม่ได้รับอนุญาต',
                'รับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่าน'
            ]
        },
        {
            title: '4. การใช้งานที่ยอมรับได้',
            content: 'ท่านตกลงที่จะไม่:',
            list: [
                'ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย',
                'เผยแพร่ข้อมูลเท็จหรือหมิ่นประมาทผู้อื่น',
                'รายงานลูกค้าเข้า Blacklist โดยไม่มีหลักฐาน',
                'ละเมิดสิทธิ์ความเป็นส่วนตัวของผู้อื่น',
                'พยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต'
            ]
        },
        {
            title: '5. การรายงาน Blacklist',
            content: 'เมื่อท่านรายงานลูกค้าเข้าสู่ระบบ Blacklist ท่านรับรองว่า:',
            list: [
                'ข้อมูลที่ให้เป็นความจริงและมีหลักฐานสนับสนุน',
                'ท่านมีสิทธิ์ในการเปิดเผยข้อมูลดังกล่าว',
                'การรายงานเป็นไปโดยสุจริตและไม่มีเจตนาทำลายชื่อเสียงผู้อื่น',
                'ท่านยินดีรับผิดชอบทางกฎหมายหากรายงานเท็จ'
            ],
            note: 'RentSafe ขอสงวนสิทธิ์ในการตรวจสอบและอนุมัติรายงานทุกฉบับก่อนเผยแพร่'
        },
        {
            title: '6. ค่าบริการและการชำระเงิน',
            content: 'บริการบางส่วนของ RentSafe เป็นบริการที่มีค่าใช้จ่าย รวมถึงแพ็คเกจ "ร้านรับรอง" ท่านตกลงที่จะ:',
            list: [
                'ชำระค่าบริการตามราคาที่กำหนด (รายเดือน 99 บาท / รายปี 999 บาท)',
                'ยอมรับว่าค่าบริการที่ชำระแล้วไม่สามารถขอคืนได้',
                'รับทราบว่าราคาอาจมีการเปลี่ยนแปลงโดยจะแจ้งให้ทราบล่วงหน้า'
            ]
        },
        {
            title: '7. ข้อจำกัดความรับผิดชอบ',
            content: 'RentSafe ให้บริการ "ตามสภาพที่เป็น" โดยไม่มีการรับประกันใดๆ เราไม่รับผิดชอบต่อ:',
            list: [
                'ความถูกต้องของข้อมูลที่ผู้ใช้รายงาน',
                'ความเสียหายที่เกิดจากการตัดสินใจโดยอ้างอิงข้อมูลในระบบ',
                'การหยุดชะงักของบริการหรือข้อผิดพลาดทางเทคนิค'
            ]
        },
        {
            title: '8. การยกเลิกบัญชี',
            content: 'RentSafe ขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของท่าน หากพบว่ามีการละเมิดข้อกำหนดการใช้งาน รายงานเท็จซ้ำๆ หรือมีพฤติกรรมที่อาจส่งผลเสียต่อผู้ใช้รายอื่นหรือระบบ'
        },
        {
            title: '9. การเปลี่ยนแปลงข้อกำหนด',
            content: 'เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดเหล่านี้ได้ตลอดเวลา การเปลี่ยนแปลงจะมีผลบังคับใช้ทันทีที่ประกาศบนเว็บไซต์'
        },
        {
            title: '10. การติดต่อ',
            content: 'หากท่านมีคำถามเกี่ยวกับข้อกำหนดการใช้งาน กรุณาติดต่อเราที่หน้าติดต่อเรา'
        }
    ]

    const shopTermsEng = [
        {
            title: '1. Acceptance of Terms',
            content: 'By registering your shop and using RentSafe, you agree to comply with all terms and conditions outlined here. If you do not accept these terms, please stop using the service immediately.'
        },
        {
            title: '2. Description of Service',
            content: 'RentSafe is a platform that provides customer background verification services for car rental businesses. Our services include:',
            list: [
                'Customer search and verification system',
                'Problem customer reporting system (Blacklist)',
                'Verified Shop system',
                'Notification and communication system',
                'Shop profile page for customers to find'
            ]
        },
        {
            title: '3. Registration and User Accounts',
            content: 'To use RentSafe services, you must register your shop. You agree to:',
            list: [
                'Provide accurate, complete, and current shop information',
                'Upload valid identity verification documents',
                'Maintain the security of your password and account',
                'Notify us immediately of any unauthorized account use',
                'Be responsible for all activities under your account'
            ]
        },
        {
            title: '4. Acceptable Use',
            content: 'You agree not to:',
            list: [
                'Use the service for illegal purposes',
                'Spread false information or defame others',
                'Report customers to Blacklist without evidence',
                'Violate the privacy rights of others',
                'Attempt unauthorized access to the system'
            ]
        },
        {
            title: '5. Blacklist Reporting',
            content: 'When you report a customer to the Blacklist system, you certify that:',
            list: [
                'The information provided is true and supported by evidence',
                'You have the right to disclose such information',
                'The report is made in good faith without intent to harm reputation',
                'You accept legal liability if the report is false'
            ],
            note: 'RentSafe reserves the right to review and approve all reports before publication.'
        },
        {
            title: '6. Fees and Payments',
            content: 'Some RentSafe services are paid services, including the "Verified Shop" package. You agree to:',
            list: [
                'Pay service fees as specified (Monthly 99 THB / Yearly 999 THB)',
                'Accept that paid fees are non-refundable',
                'Acknowledge that prices may change with advance notice'
            ]
        },
        {
            title: '7. Limitation of Liability',
            content: 'RentSafe provides services "as is" without any warranties. We are not responsible for:',
            list: [
                'The accuracy of user-reported information',
                'Damages from decisions based on system data',
                'Service interruptions or technical errors'
            ]
        },
        {
            title: '8. Account Termination',
            content: 'RentSafe reserves the right to suspend or terminate your account if violations of terms of service are found, repeated false reports are made, or behavior that may harm other users or the system is detected.'
        },
        {
            title: '9. Changes to Terms',
            content: 'We reserve the right to modify these terms at any time. Changes will take effect immediately upon posting on the website.'
        },
        {
            title: '10. Contact',
            content: 'If you have questions about these terms, please contact us through our Contact page.'
        }
    ]

    const currentTerms = activeTab === 'user'
        ? (isThai ? userTermsThai : userTermsEng)
        : (isThai ? shopTermsThai : shopTermsEng)

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    {isThai ? 'กลับหน้าหลัก' : 'Back to Home'}
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                {isThai ? 'ข้อกำหนดการใช้งาน' : 'Terms of Service'}
                            </h1>
                            <p className="text-gray-500">
                                {isThai ? 'อัปเดตล่าสุด: มกราคม 2569' : 'Last updated: January 2026'}
                            </p>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-8">
                        <button
                            onClick={() => setActiveTab('user')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                                activeTab === 'user'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Car className="w-5 h-5" />
                            {isThai ? 'สำหรับผู้เช่ารถ' : 'For Renters'}
                        </button>
                        <button
                            onClick={() => setActiveTab('shop')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                                activeTab === 'shop'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Building2 className="w-5 h-5" />
                            {isThai ? 'สำหรับร้านเช่ารถ' : 'For Rental Shops'}
                        </button>
                    </div>

                    {/* Terms Content */}
                    <div className="prose prose-gray max-w-none">
                        {currentTerms.map((section, index) => (
                            <section key={index} className="mb-8">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                                <p className="text-gray-600 mb-4">{section.content}</p>
                                {section.list && (
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        {section.list.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                                {section.note && (
                                    <p className="text-gray-600 mt-4 italic">{section.note}</p>
                                )}
                            </section>
                        ))}
                    </div>

                    {/* Contact Link */}
                    <div className="mt-8 p-6 bg-blue-50 rounded-xl text-center">
                        <h3 className="font-semibold text-gray-900 mb-2">
                            {isThai ? 'มีคำถามเกี่ยวกับข้อกำหนด?' : 'Questions about the terms?'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {isThai ? 'หากมีข้อสงสัย กรุณาติดต่อเรา' : 'If you have questions, please contact us'}
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
