'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
    HelpCircle, ArrowLeft, ChevronDown, Search, Shield, CreditCard,
    Users, AlertTriangle, Store, Car, Building2, UserCheck, FileText, Clock
} from 'lucide-react'

interface FAQItem {
    question: string
    answer: string
}

interface FAQCategory {
    title: string
    icon: React.ReactNode
    items: FAQItem[]
}

export default function FAQPage() {
    const params = useParams()
    const locale = params.locale as string
    const isThai = locale === 'th'

    const [activeTab, setActiveTab] = useState<'user' | 'shop'>('user')

    // FAQ สำหรับผู้ใช้ทั่วไป (ผู้เช่ารถ)
    const userFAQs: FAQCategory[] = isThai ? [
        {
            title: 'ทั่วไป',
            icon: <HelpCircle className="w-5 h-5" />,
            items: [
                {
                    question: 'RentSafe คืออะไร?',
                    answer: 'RentSafe เป็นแพลตฟอร์มที่รวบรวมข้อมูลร้านเช่ารถที่ผ่านการตรวจสอบ ช่วยให้คุณค้นหาร้านเช่ารถที่น่าเชื่อถือ และตรวจสอบความน่าเชื่อถือของร้านก่อนตัดสินใจเช่า'
                },
                {
                    question: 'ฉันต้องสมัครสมาชิกไหมถึงจะใช้งานได้?',
                    answer: 'ไม่จำเป็น คุณสามารถค้นหาและดูข้อมูลร้านเช่ารถได้โดยไม่ต้องสมัครสมาชิก แต่ถ้าต้องการรีวิวร้านหรือรายงานปัญหา จะต้องเข้าสู่ระบบก่อน'
                },
                {
                    question: 'การใช้งาน RentSafe มีค่าใช้จ่ายไหม?',
                    answer: 'ไม่มีค่าใช้จ่ายสำหรับผู้ใช้ทั่วไป การค้นหาร้าน ดูรีวิว และรายงานปัญหาล้วนเป็นบริการฟรี'
                }
            ]
        },
        {
            title: 'การค้นหาร้านเช่ารถ',
            icon: <Search className="w-5 h-5" />,
            items: [
                {
                    question: 'ค้นหาร้านเช่ารถได้อย่างไร?',
                    answer: 'ไปที่หน้าค้นหา แล้วพิมพ์ชื่อร้าน หรือเลือกจังหวัดที่ต้องการ ระบบจะแสดงรายชื่อร้านพร้อมข้อมูลและรีวิว'
                },
                {
                    question: 'ร้านที่มีเครื่องหมาย "ร้านรับรอง" คืออะไร?',
                    answer: 'ร้านรับรอง คือร้านที่ผ่านการยืนยันตัวตนจาก RentSafe และเป็นสมาชิกพรีเมียม แสดงว่าร้านมีความน่าเชื่อถือและมีการดำเนินธุรกิจจริง'
                },
                {
                    question: 'ดูรีวิวของร้านได้ที่ไหน?',
                    answer: 'คลิกที่ชื่อร้านเพื่อดูหน้าร้าน จะเห็นรีวิวจากผู้ใช้คนอื่นๆ พร้อมคะแนน และรายละเอียดประสบการณ์การเช่า'
                }
            ]
        },
        {
            title: 'การรีวิวและรายงาน',
            icon: <FileText className="w-5 h-5" />,
            items: [
                {
                    question: 'รีวิวร้านได้อย่างไร?',
                    answer: 'เข้าสู่ระบบ แล้วไปที่หน้าร้านที่ต้องการรีวิว กดปุ่ม "เขียนรีวิว" ให้คะแนนและเขียนประสบการณ์ของคุณ'
                },
                {
                    question: 'ถ้าเจอร้านมีปัญหาหรือหลอกลวง ทำอย่างไร?',
                    answer: 'กดปุ่ม "รายงานร้าน" ที่หน้าร้านนั้น กรอกรายละเอียดปัญหาและแนบหลักฐาน ทีมงานจะตรวจสอบและดำเนินการภายใน 24-48 ชม.'
                },
                {
                    question: 'รีวิวของฉันจะแสดงทันทีไหม?',
                    answer: 'รีวิวจะแสดงทันทีหลังจากส่ง แต่ทีมงานอาจตรวจสอบและซ่อนรีวิวที่ไม่เหมาะสมหรือมีเนื้อหาหมิ่นประมาทในภายหลัง'
                }
            ]
        },
        {
            title: 'ความปลอดภัย',
            icon: <Shield className="w-5 h-5" />,
            items: [
                {
                    question: 'ข้อมูลส่วนตัวของฉันปลอดภัยไหม?',
                    answer: 'เราใช้การเข้ารหัสข้อมูลและมาตรการรักษาความปลอดภัยตามมาตรฐาน ข้อมูลส่วนตัวจะไม่ถูกเปิดเผยต่อร้านค้าหรือบุคคลที่สาม'
                },
                {
                    question: 'ถ้าถูกร้านเช่ารถโกงควรทำอย่างไร?',
                    answer: 'รายงานผ่านระบบ RentSafe พร้อมหลักฐาน และแนะนำให้แจ้งความที่สถานีตำรวจใกล้บ้าน เก็บหลักฐานทุกอย่างไว้'
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
                    answer: 'RentSafe is a platform that collects verified car rental shop information, helping you find trustworthy rental shops and verify their credibility before making a decision.'
                },
                {
                    question: 'Do I need to register to use it?',
                    answer: 'No, you can search and view car rental shop information without registering. However, if you want to review shops or report issues, you need to log in first.'
                },
                {
                    question: 'Is there a cost to use RentSafe?',
                    answer: 'No cost for general users. Searching for shops, viewing reviews, and reporting issues are all free services.'
                }
            ]
        },
        {
            title: 'Searching for Rental Shops',
            icon: <Search className="w-5 h-5" />,
            items: [
                {
                    question: 'How do I search for rental shops?',
                    answer: 'Go to the search page, type the shop name or select a province. The system will display a list of shops with information and reviews.'
                },
                {
                    question: 'What does "Verified Shop" mean?',
                    answer: 'Verified Shop indicates that the shop has been identity verified by RentSafe and is a premium member, showing that the shop is trustworthy and operates a real business.'
                },
                {
                    question: 'Where can I see shop reviews?',
                    answer: 'Click on a shop name to view its page. You will see reviews from other users along with ratings and rental experience details.'
                }
            ]
        },
        {
            title: 'Reviews and Reports',
            icon: <FileText className="w-5 h-5" />,
            items: [
                {
                    question: 'How do I review a shop?',
                    answer: 'Log in, then go to the shop page you want to review. Click the "Write Review" button, give a rating and write about your experience.'
                },
                {
                    question: 'What if I encounter a problematic or fraudulent shop?',
                    answer: 'Click the "Report Shop" button on that shop\'s page. Fill in the problem details and attach evidence. The team will investigate within 24-48 hours.'
                }
            ]
        },
        {
            title: 'Safety',
            icon: <Shield className="w-5 h-5" />,
            items: [
                {
                    question: 'Is my personal information safe?',
                    answer: 'We use data encryption and standard security measures. Personal information will not be disclosed to shops or third parties.'
                },
                {
                    question: 'What should I do if I get scammed by a rental shop?',
                    answer: 'Report through the RentSafe system with evidence, and we recommend filing a police report at your local station. Keep all evidence.'
                }
            ]
        }
    ]

    // FAQ สำหรับร้านค้า
    const shopFAQs: FAQCategory[] = isThai ? [
        {
            title: 'เริ่มต้นใช้งาน',
            icon: <Store className="w-5 h-5" />,
            items: [
                {
                    question: 'RentSafe ช่วยร้านเช่ารถได้อย่างไร?',
                    answer: 'RentSafe ช่วยให้ร้านค้าตรวจสอบประวัติลูกค้าก่อนให้เช่า ป้องกันลูกค้าที่มีประวัติไม่ดี และเพิ่มความน่าเชื่อถือของร้านผ่านระบบร้านรับรอง'
                },
                {
                    question: 'ลงทะเบียนร้านค้าได้อย่างไร?',
                    answer: 'คลิก "ลงทะเบียนร้านค้า" กรอกข้อมูลร้าน อัปโหลดเอกสารยืนยันตัวตน และรอการตรวจสอบจากทีมงาน (ปกติ 1-3 วันทำการ)'
                },
                {
                    question: 'ต้องมีเอกสารอะไรบ้างในการลงทะเบียน?',
                    answer: 'ต้องมีสำเนาบัตรประชาชนเจ้าของ, ใบอนุญาตประกอบธุรกิจ (ถ้ามี), และรูปถ่ายหน้าร้านหรือรถที่ให้เช่า'
                }
            ]
        },
        {
            title: 'การค้นหาและตรวจสอบลูกค้า',
            icon: <Search className="w-5 h-5" />,
            items: [
                {
                    question: 'ค้นหาประวัติลูกค้าได้อย่างไร?',
                    answer: 'ไปที่ Dashboard > ค้นหา Blacklist > ใส่ชื่อ-นามสกุล, เลขบัตรประชาชน, หรือเบอร์โทรของลูกค้า ระบบจะแสดงประวัติ (ถ้ามี)'
                },
                {
                    question: 'มีจำกัดจำนวนการค้นหาต่อวันไหม?',
                    answer: 'บัญชีฟรีค้นหาได้ 3 ครั้งต่อวัน ส่วนแพ็คเกจ "ร้านรับรอง" ค้นหาได้ไม่จำกัด'
                },
                {
                    question: 'ข้อมูลที่ค้นหาได้มีความน่าเชื่อถือแค่ไหน?',
                    answer: 'ข้อมูลมาจากการรายงานของร้านเช่ารถในระบบและผ่านการตรวจสอบจากทีมงาน แนะนำให้ใช้เป็นข้อมูลประกอบการตัดสินใจร่วมกับการตรวจสอบอื่นๆ'
                }
            ]
        },
        {
            title: 'ร้านรับรอง (Verified Shop)',
            icon: <UserCheck className="w-5 h-5" />,
            items: [
                {
                    question: '"ร้านรับรอง" คืออะไร?',
                    answer: 'แพ็คเกจสมาชิกพรีเมียมที่ได้รับสิทธิพิเศษ: ค้นหาไม่จำกัด, แสดงป้ายยืนยันตัวตน, โปรโมทบนหน้าแรก, และความน่าเชื่อถือที่สูงขึ้นในสายตาลูกค้า'
                },
                {
                    question: 'แพ็คเกจร้านรับรองมีราคาเท่าไหร่?',
                    answer: 'มี 3 แพ็คเกจ: รายเดือน 199 บาท (30 วัน), รายไตรมาส 499 บาท (90 วัน), และรายปี 1,499 บาท (365 วัน) - คุ้มที่สุด!'
                },
                {
                    question: 'สมัครร้านรับรองได้อย่างไร?',
                    answer: 'ไปที่ Dashboard > อัพเกรดร้านรับรอง > เลือกแพ็คเกจ > ชำระเงินผ่าน PromptPay หรือโอน > อัปโหลดสลิป > รอการอนุมัติ (ปกติไม่เกิน 24 ชม.)'
                },
                {
                    question: 'ต่ออายุร้านรับรองอย่างไร?',
                    answer: 'ระบบจะแจ้งเตือนก่อนหมดอายุ 7 วันและ 3 วัน สามารถต่ออายุได้ที่ Dashboard > อัพเกรดร้านรับรอง เลือกแพ็คเกจและชำระเงินเหมือนสมัครใหม่'
                }
            ]
        },
        {
            title: 'การรายงาน Blacklist',
            icon: <AlertTriangle className="w-5 h-5" />,
            items: [
                {
                    question: 'รายงานลูกค้าเข้า Blacklist ได้อย่างไร?',
                    answer: 'ไปที่ Dashboard > รายงานลูกค้า > กรอกข้อมูลลูกค้า, ประเภทปัญหา, รายละเอียด > อัปโหลดหลักฐาน > ส่งรายงาน'
                },
                {
                    question: 'ต้องมีหลักฐานอะไรบ้างในการรายงาน?',
                    answer: 'ควรมี: สำเนาสัญญาเช่า, รูปถ่ายความเสียหาย, บันทึกการติดต่อ/แชท, ใบแจ้งความ (ถ้ามี) ยิ่งหลักฐานครบ ยิ่งอนุมัติเร็ว'
                },
                {
                    question: 'รายงานจะได้รับการอนุมัติเมื่อไหร่?',
                    answer: 'ทีมงานจะตรวจสอบและอนุมัติภายใน 24-48 ชม. หากหลักฐานครบถ้วน อาจได้รับการอนุมัติเร็วกว่านั้น'
                },
                {
                    question: 'รายงานเท็จมีผลอย่างไร?',
                    answer: 'การรายงานเท็จถือเป็นการละเมิดข้อกำหนด อาจทำให้บัญชีถูกระงับหรือยกเลิก และอาจต้องรับผิดชอบทางกฎหมายหากผู้ถูกรายงานฟ้องร้อง'
                }
            ]
        },
        {
            title: 'การชำระเงิน',
            icon: <CreditCard className="w-5 h-5" />,
            items: [
                {
                    question: 'ชำระเงินได้ช่องทางไหนบ้าง?',
                    answer: 'รองรับ PromptPay และโอนเงินเข้าบัญชีธนาคาร (กสิกรไทย) โดยต้องอัปโหลดสลิปเพื่อยืนยัน'
                },
                {
                    question: 'หลังชำระเงินแล้วต้องรอนานแค่ไหน?',
                    answer: 'หลังอัปโหลดสลิป ทีมงานจะตรวจสอบและเปิดใช้งานภายใน 24 ชม. (ปกติเร็วกว่านั้นมาก)'
                },
                {
                    question: 'ขอคืนเงินได้ไหม?',
                    answer: 'ค่าบริการที่ชำระแล้วไม่สามารถขอคืนได้ กรุณาศึกษารายละเอียดแพ็คเกจก่อนชำระเงิน'
                }
            ]
        },
        {
            title: 'บัญชีและความปลอดภัย',
            icon: <Users className="w-5 h-5" />,
            items: [
                {
                    question: 'ลืมรหัสผ่านทำอย่างไร?',
                    answer: 'กด "ลืมรหัสผ่าน" ที่หน้าเข้าสู่ระบบ > กรอกอีเมลที่ลงทะเบียน > ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปทางอีเมล'
                },
                {
                    question: 'เปลี่ยนข้อมูลร้านได้อย่างไร?',
                    answer: 'ไปที่ Dashboard > แก้ไขข้อมูลร้าน > แก้ไขข้อมูล > กดบันทึก'
                },
                {
                    question: 'ข้อมูลร้านของฉันปลอดภัยไหม?',
                    answer: 'เราใช้การเข้ารหัสและมาตรการรักษาความปลอดภัยตามมาตรฐาน ข้อมูลธุรกิจจะไม่ถูกเปิดเผยนอกเหนือจากที่แสดงบนโปรไฟล์ร้าน'
                }
            ]
        }
    ] : [
        {
            title: 'Getting Started',
            icon: <Store className="w-5 h-5" />,
            items: [
                {
                    question: 'How does RentSafe help rental shops?',
                    answer: 'RentSafe helps shops verify customer history before renting, prevent problematic customers, and increase shop credibility through the Verified Shop system.'
                },
                {
                    question: 'How do I register my shop?',
                    answer: 'Click "Register Shop", fill in shop information, upload identity documents, and wait for verification (usually 1-3 business days).'
                },
                {
                    question: 'What documents are required for registration?',
                    answer: 'You need a copy of the owner\'s ID card, business license (if any), and photos of your shop or rental vehicles.'
                }
            ]
        },
        {
            title: 'Customer Search and Verification',
            icon: <Search className="w-5 h-5" />,
            items: [
                {
                    question: 'How do I search for customer history?',
                    answer: 'Go to Dashboard > Search Blacklist > Enter name, ID card number, or phone number. The system will display history (if any).'
                },
                {
                    question: 'Is there a daily search limit?',
                    answer: 'Free accounts can search 3 times per day. The "Verified Shop" package has unlimited searches.'
                },
                {
                    question: 'How reliable is the search data?',
                    answer: 'Data comes from reports by rental shops in the system and is verified by our team. Use it as supplementary information along with other verification methods.'
                }
            ]
        },
        {
            title: 'Verified Shop',
            icon: <UserCheck className="w-5 h-5" />,
            items: [
                {
                    question: 'What is "Verified Shop"?',
                    answer: 'A premium membership package with benefits: unlimited searches, verified badge display, homepage promotion, and higher credibility with customers.'
                },
                {
                    question: 'How much does Verified Shop cost?',
                    answer: '3 packages available: Monthly 199 THB (30 days), Quarterly 499 THB (90 days), and Yearly 1,499 THB (365 days) - best value!'
                },
                {
                    question: 'How do I sign up for Verified Shop?',
                    answer: 'Go to Dashboard > Upgrade to Verified Shop > Choose package > Pay via PromptPay or transfer > Upload slip > Wait for approval (usually within 24 hours).'
                }
            ]
        },
        {
            title: 'Blacklist Reporting',
            icon: <AlertTriangle className="w-5 h-5" />,
            items: [
                {
                    question: 'How do I report a customer to Blacklist?',
                    answer: 'Go to Dashboard > Report Customer > Fill in customer info, problem type, details > Upload evidence > Submit report.'
                },
                {
                    question: 'What evidence is needed for reporting?',
                    answer: 'You should have: rental contract copy, damage photos, communication records/chats, police report (if any). More complete evidence = faster approval.'
                },
                {
                    question: 'What happens with false reports?',
                    answer: 'False reporting violates terms of service and may result in account suspension or termination, and possible legal liability if the reported person takes action.'
                }
            ]
        },
        {
            title: 'Payment',
            icon: <CreditCard className="w-5 h-5" />,
            items: [
                {
                    question: 'What payment methods are available?',
                    answer: 'We support PromptPay and bank transfer (Kasikorn Bank). You must upload a slip to confirm payment.'
                },
                {
                    question: 'How long until activation after payment?',
                    answer: 'After uploading the slip, the team will verify and activate within 24 hours (usually much faster).'
                },
                {
                    question: 'Can I get a refund?',
                    answer: 'Service fees paid are non-refundable. Please study package details before payment.'
                }
            ]
        },
        {
            title: 'Account and Security',
            icon: <Users className="w-5 h-5" />,
            items: [
                {
                    question: 'What if I forget my password?',
                    answer: 'Click "Forgot Password" on the login page > Enter your registered email > The system will send a password reset link.'
                },
                {
                    question: 'How do I change shop information?',
                    answer: 'Go to Dashboard > Edit Shop Info > Make changes > Click Save.'
                },
                {
                    question: 'Is my shop data secure?',
                    answer: 'We use encryption and standard security measures. Business information will not be disclosed beyond what is shown on your shop profile.'
                }
            ]
        }
    ]

    const currentFAQs = activeTab === 'user' ? userFAQs : shopFAQs

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    {isThai ? 'กลับหน้าหลัก' : 'Back to Home'}
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                            <HelpCircle className="w-7 h-7 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                {isThai ? 'คำถามที่พบบ่อย' : 'Frequently Asked Questions'}
                            </h1>
                            <p className="text-gray-500">
                                {isThai ? 'คำตอบสำหรับคำถามที่พบบ่อย' : 'Answers to common questions'}
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

                    {/* FAQ Content */}
                    <div className="space-y-8">
                        {currentFAQs.map((category, categoryIndex) => (
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
                                                <span className="pr-4">{item.question}</span>
                                                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
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
