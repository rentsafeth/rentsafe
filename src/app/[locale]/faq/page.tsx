import { Metadata } from 'next'
import Link from 'next/link'
import { HelpCircle, ArrowLeft, ChevronDown, Search, Shield, CreditCard, Users, AlertTriangle } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return {
        title: locale === 'th' ? 'คำถามที่พบบ่อย - RentSafe' : 'FAQ - RentSafe',
        description: locale === 'th' ? 'คำถามที่พบบ่อยเกี่ยวกับการใช้งาน RentSafe' : 'Frequently asked questions about RentSafe',
    }
}

interface FAQItem {
    question: string
    answer: string
}

interface FAQCategory {
    title: string
    icon: React.ReactNode
    items: FAQItem[]
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const isThai = locale === 'th'

    const faqCategories: FAQCategory[] = isThai ? [
        {
            title: 'ทั่วไป',
            icon: <HelpCircle className="w-5 h-5" />,
            items: [
                {
                    question: 'RentSafe คืออะไร?',
                    answer: 'RentSafe เป็นแพลตฟอร์มตรวจสอบประวัติลูกค้าสำหรับธุรกิจรถเช่า ช่วยให้ร้านเช่ารถสามารถค้นหาและตรวจสอบประวัติลูกค้าก่อนทำธุรกรรม เพื่อป้องกันความเสี่ยงจากลูกค้าที่มีประวัติไม่ดี'
                },
                {
                    question: 'ใครสามารถใช้งาน RentSafe ได้?',
                    answer: 'RentSafe ออกแบบมาสำหรับผู้ประกอบการธุรกิจรถเช่าโดยเฉพาะ ไม่ว่าจะเป็นร้านเช่ารถขนาดเล็กหรือใหญ่ สามารถลงทะเบียนและใช้งานได้'
                },
                {
                    question: 'การใช้งาน RentSafe มีค่าใช้จ่ายหรือไม่?',
                    answer: 'มีทั้งบริการฟรีและบริการพรีเมียม บัญชีฟรีสามารถค้นหาและรายงานได้จำนวนจำกัด ส่วนแพ็คเกจ "ร้านรับรอง" มีค่าใช้จ่ายรายเดือน/รายปี และได้รับสิทธิพิเศษเพิ่มเติม'
                }
            ]
        },
        {
            title: 'การค้นหาและตรวจสอบ',
            icon: <Search className="w-5 h-5" />,
            items: [
                {
                    question: 'ค้นหาลูกค้าได้อย่างไร?',
                    answer: 'สามารถค้นหาได้โดยใช้ชื่อ-นามสกุล, เลขบัตรประชาชน, หรือเบอร์โทรศัพท์ของลูกค้า ระบบจะแสดงผลลัพธ์ที่ตรงกันพร้อมประวัติ (ถ้ามี)'
                },
                {
                    question: 'มีจำกัดจำนวนการค้นหาต่อวันหรือไม่?',
                    answer: 'บัญชีฟรีมีจำนวนการค้นหาจำกัด 3 ครั้งต่อวัน ส่วนแพ็คเกจ "ร้านรับรอง" สามารถค้นหาได้ไม่จำกัด'
                },
                {
                    question: 'ข้อมูลที่ค้นหาได้มีความน่าเชื่อถือแค่ไหน?',
                    answer: 'ข้อมูลทั้งหมดมาจากการรายงานของร้านเช่ารถในระบบ และผ่านการตรวจสอบจากทีมงานก่อนเผยแพร่ อย่างไรก็ตาม ขอแนะนำให้ใช้เป็นข้อมูลประกอบการตัดสินใจ'
                }
            ]
        },
        {
            title: 'ร้านรับรอง (Verified Shop)',
            icon: <Shield className="w-5 h-5" />,
            items: [
                {
                    question: '"ร้านรับรอง" คืออะไร?',
                    answer: 'ร้านรับรอง คือแพ็คเกจสมาชิกพรีเมียมสำหรับร้านเช่ารถที่ต้องการสิทธิพิเศษ เช่น ค้นหาไม่จำกัด, แสดงป้ายยืนยันตัวตน, และได้รับการโปรโมทบนหน้าแรก'
                },
                {
                    question: 'แพ็คเกจร้านรับรองมีราคาเท่าไหร่?',
                    answer: 'มี 3 แพ็คเกจให้เลือก: รายเดือน 199 บาท (30 วัน), รายไตรมาส 499 บาท (90 วัน), และรายปี 1,499 บาท (365 วัน)'
                },
                {
                    question: 'สมัครร้านรับรองได้อย่างไร?',
                    answer: 'ไปที่ Dashboard > สมัครร้านรับรอง > เลือกแพ็คเกจ > ชำระเงินผ่าน PromptPay หรือโอนเงิน > อัปโหลดสลิป > รอการอนุมัติ (ปกติไม่เกิน 24 ชม.)'
                },
                {
                    question: 'ต่ออายุร้านรับรองอย่างไร?',
                    answer: 'ระบบจะส่งการแจ้งเตือนก่อนหมดอายุ 7 วันและ 3 วัน ท่านสามารถต่ออายุได้ที่ Dashboard > สมัครร้านรับรอง โดยเลือกแพ็คเกจและชำระเงินเหมือนการสมัครใหม่'
                }
            ]
        },
        {
            title: 'การรายงาน Blacklist',
            icon: <AlertTriangle className="w-5 h-5" />,
            items: [
                {
                    question: 'รายงานลูกค้าเข้า Blacklist ได้อย่างไร?',
                    answer: 'ไปที่ Dashboard > รายงานลูกค้า > กรอกข้อมูลลูกค้า, เหตุผล, และอัปโหลดหลักฐาน > ส่งรายงาน ทีมงานจะตรวจสอบและอนุมัติภายใน 24-48 ชม.'
                },
                {
                    question: 'ต้องมีหลักฐานอะไรบ้างในการรายงาน?',
                    answer: 'ควรมีหลักฐานเช่น สำเนาสัญญาเช่า, รูปถ่ายความเสียหาย, บันทึกการติดต่อ, หรือเอกสารอื่นๆ ที่เกี่ยวข้อง ยิ่งมีหลักฐานครบถ้วน ยิ่งได้รับการอนุมัติเร็ว'
                },
                {
                    question: 'รายงานเท็จมีผลอย่างไร?',
                    answer: 'การรายงานเท็จถือเป็นการละเมิดข้อกำหนดการใช้งาน อาจส่งผลให้บัญชีถูกระงับหรือยกเลิก และอาจต้องรับผิดชอบทางกฎหมายหากผู้ถูกรายงานดำเนินคดี'
                }
            ]
        },
        {
            title: 'การชำระเงิน',
            icon: <CreditCard className="w-5 h-5" />,
            items: [
                {
                    question: 'ชำระเงินได้ช่องทางไหนบ้าง?',
                    answer: 'รองรับการชำระผ่าน PromptPay และโอนเงินเข้าบัญชีธนาคาร (กสิกรไทย) โดยต้องอัปโหลดสลิปเพื่อยืนยันการชำระ'
                },
                {
                    question: 'หลังชำระเงินแล้วต้องรอนานแค่ไหน?',
                    answer: 'หลังอัปโหลดสลิปการชำระเงิน ทีมงานจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง (ปกติเร็วกว่านั้น) และระบบจะเปิดใช้งานอัตโนมัติ'
                },
                {
                    question: 'ขอคืนเงินได้หรือไม่?',
                    answer: 'ค่าบริการที่ชำระแล้วไม่สามารถขอคืนได้ กรุณาศึกษารายละเอียดแพ็คเกจให้ดีก่อนชำระเงิน'
                }
            ]
        },
        {
            title: 'บัญชีและความปลอดภัย',
            icon: <Users className="w-5 h-5" />,
            items: [
                {
                    question: 'ลืมรหัสผ่านทำอย่างไร?',
                    answer: 'กดปุ่ม "ลืมรหัสผ่าน" ที่หน้าเข้าสู่ระบบ > กรอกอีเมลที่ลงทะเบียน > ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปทางอีเมล'
                },
                {
                    question: 'เปลี่ยนข้อมูลร้านได้อย่างไร?',
                    answer: 'ไปที่ Dashboard > แก้ไขข้อมูลร้าน > แก้ไขข้อมูลที่ต้องการ > กดบันทึก'
                },
                {
                    question: 'ข้อมูลของฉันปลอดภัยหรือไม่?',
                    answer: 'เราใช้การเข้ารหัสข้อมูลและมาตรการรักษาความปลอดภัยตามมาตรฐาน ข้อมูลส่วนตัวของท่านจะไม่ถูกเปิดเผยต่อบุคคลที่สาม ยกเว้นตามที่กฎหมายกำหนด'
                }
            ]
        }
    ] : [
        {
            title: 'General',
            icon: <HelpCircle className="w-5 h-5" />,
            items: [
                {
                    question: 'What is RentSafe?',
                    answer: 'RentSafe is a customer background verification platform for car rental businesses. It helps rental shops search and verify customer history before transactions to prevent risks from problematic customers.'
                },
                {
                    question: 'Who can use RentSafe?',
                    answer: 'RentSafe is designed specifically for car rental business operators, whether small or large rental shops can register and use it.'
                },
                {
                    question: 'Is there a cost to use RentSafe?',
                    answer: 'There are both free and premium services. Free accounts can search and report with limited quotas. The "Verified Shop" package has monthly/yearly fees with additional benefits.'
                }
            ]
        },
        {
            title: 'Search and Verification',
            icon: <Search className="w-5 h-5" />,
            items: [
                {
                    question: 'How do I search for customers?',
                    answer: 'You can search using the customer\'s name, ID card number, or phone number. The system will display matching results with history (if any).'
                },
                {
                    question: 'Is there a daily search limit?',
                    answer: 'Free accounts have a limit of 3 searches per day. The "Verified Shop" package has unlimited searches.'
                },
                {
                    question: 'How reliable is the search data?',
                    answer: 'All data comes from reports by rental shops in the system and is verified by our team before publication. However, we recommend using it as supplementary information for decision-making.'
                }
            ]
        },
        {
            title: 'Verified Shop',
            icon: <Shield className="w-5 h-5" />,
            items: [
                {
                    question: 'What is "Verified Shop"?',
                    answer: 'Verified Shop is a premium membership package for car rental shops that want special benefits such as unlimited searches, verified badge display, and homepage promotion.'
                },
                {
                    question: 'How much does Verified Shop cost?',
                    answer: 'There are 3 packages: Monthly 199 THB (30 days), Quarterly 499 THB (90 days), and Yearly 1,499 THB (365 days).'
                },
                {
                    question: 'How do I sign up for Verified Shop?',
                    answer: 'Go to Dashboard > Subscribe to Verified Shop > Choose package > Pay via PromptPay or bank transfer > Upload slip > Wait for approval (usually within 24 hours).'
                }
            ]
        },
        {
            title: 'Blacklist Reporting',
            icon: <AlertTriangle className="w-5 h-5" />,
            items: [
                {
                    question: 'How do I report a customer to the Blacklist?',
                    answer: 'Go to Dashboard > Report Customer > Fill in customer information, reason, and upload evidence > Submit report. The team will review and approve within 24-48 hours.'
                },
                {
                    question: 'What evidence is needed for reporting?',
                    answer: 'You should have evidence such as rental contract copies, damage photos, communication records, or other related documents. The more complete the evidence, the faster the approval.'
                },
                {
                    question: 'What happens with false reports?',
                    answer: 'False reporting is a violation of the terms of service and may result in account suspension or termination, and may face legal liability if the reported person takes legal action.'
                }
            ]
        },
        {
            title: 'Payment',
            icon: <CreditCard className="w-5 h-5" />,
            items: [
                {
                    question: 'What payment methods are available?',
                    answer: 'We support payment via PromptPay and bank transfer (Kasikorn Bank). You must upload a slip to confirm payment.'
                },
                {
                    question: 'How long after payment until activation?',
                    answer: 'After uploading the payment slip, the team will verify and approve within 24 hours (usually faster) and the system will activate automatically.'
                },
                {
                    question: 'Can I get a refund?',
                    answer: 'Service fees paid are non-refundable. Please study the package details carefully before payment.'
                }
            ]
        },
        {
            title: 'Account and Security',
            icon: <Users className="w-5 h-5" />,
            items: [
                {
                    question: 'What if I forget my password?',
                    answer: 'Click the "Forgot Password" button on the login page > Enter your registered email > The system will send a password reset link to your email.'
                },
                {
                    question: 'How do I change shop information?',
                    answer: 'Go to Dashboard > Edit Shop Information > Edit the information you want > Click Save.'
                },
                {
                    question: 'Is my data secure?',
                    answer: 'We use data encryption and standard security measures. Your personal information will not be disclosed to third parties except as required by law.'
                }
            ]
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
                        <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                            <HelpCircle className="w-7 h-7 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isThai ? 'คำถามที่พบบ่อย' : 'Frequently Asked Questions'}
                            </h1>
                            <p className="text-gray-500">
                                {isThai ? 'คำตอบสำหรับคำถามที่พบบ่อย' : 'Answers to common questions'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {faqCategories.map((category, categoryIndex) => (
                            <div key={categoryIndex}>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                                        {category.icon}
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                                </div>
                                <div className="space-y-3">
                                    {category.items.map((item, itemIndex) => (
                                        <details key={itemIndex} className="group bg-gray-50 rounded-xl">
                                            <summary className="flex items-center justify-between cursor-pointer p-4 text-gray-900 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                                                <span>{item.question}</span>
                                                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                                            </summary>
                                            <div className="px-4 pb-4 text-gray-600">
                                                {item.answer}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-blue-50 rounded-xl text-center">
                        <h3 className="font-semibold text-gray-900 mb-2">
                            {isThai ? 'ยังไม่พบคำตอบที่ต้องการ?' : 'Still have questions?'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {isThai ? 'ติดต่อทีมงานของเราได้ที่' : 'Contact our team at'}
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
