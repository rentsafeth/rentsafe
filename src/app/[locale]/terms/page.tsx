import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return {
        title: locale === 'th' ? 'ข้อกำหนดการใช้งาน - RentSafe' : 'Terms of Service - RentSafe',
        description: locale === 'th' ? 'ข้อกำหนดและเงื่อนไขการใช้งาน RentSafe' : 'Terms and conditions for using RentSafe',
    }
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
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
                            <FileText className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isThai ? 'ข้อกำหนดการใช้งาน' : 'Terms of Service'}
                            </h1>
                            <p className="text-gray-500">
                                {isThai ? 'อัปเดตล่าสุด: มกราคม 2569' : 'Last updated: January 2026'}
                            </p>
                        </div>
                    </div>

                    <div className="prose prose-gray max-w-none">
                        {isThai ? (
                            <>
                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">1. การยอมรับข้อกำหนด</h2>
                                    <p className="text-gray-600 mb-4">
                                        เมื่อท่านเข้าใช้งานเว็บไซต์ RentSafe ท่านตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขการใช้งานทั้งหมดที่ระบุไว้ในเอกสารนี้ หากท่านไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาหยุดใช้งานเว็บไซต์ทันที
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">2. คำอธิบายบริการ</h2>
                                    <p className="text-gray-600 mb-4">
                                        RentSafe เป็นแพลตฟอร์มที่ให้บริการตรวจสอบประวัติลูกค้าสำหรับธุรกิจรถเช่า เพื่อช่วยให้ร้านเช่ารถสามารถป้องกันความเสี่ยงจากลูกค้าที่มีประวัติไม่ดี บริการของเรารวมถึง:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>ระบบค้นหาและตรวจสอบประวัติลูกค้า</li>
                                        <li>ระบบรายงานลูกค้าที่มีปัญหา (Blacklist)</li>
                                        <li>ระบบร้านรับรอง (Verified Shop)</li>
                                        <li>ระบบแจ้งเตือนและการสื่อสาร</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">3. การลงทะเบียนและบัญชีผู้ใช้</h2>
                                    <p className="text-gray-600 mb-4">
                                        ในการใช้บริการบางส่วนของ RentSafe ท่านจำเป็นต้องลงทะเบียนและสร้างบัญชีผู้ใช้ ท่านตกลงที่จะ:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>ให้ข้อมูลที่ถูกต้อง ครบถ้วน และเป็นปัจจุบัน</li>
                                        <li>รักษาความปลอดภัยของรหัสผ่านและบัญชีของท่าน</li>
                                        <li>แจ้งให้เราทราบทันทีหากพบการใช้งานบัญชีโดยไม่ได้รับอนุญาต</li>
                                        <li>รับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่าน</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">4. การใช้งานที่ยอมรับได้</h2>
                                    <p className="text-gray-600 mb-4">ท่านตกลงที่จะไม่:</p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย</li>
                                        <li>เผยแพร่ข้อมูลเท็จหรือหมิ่นประมาทผู้อื่น</li>
                                        <li>ละเมิดสิทธิ์ความเป็นส่วนตัวของผู้อื่น</li>
                                        <li>พยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต</li>
                                        <li>ส่งสแปมหรือเนื้อหาที่ไม่พึงประสงค์</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">5. การรายงาน Blacklist</h2>
                                    <p className="text-gray-600 mb-4">
                                        เมื่อท่านรายงานลูกค้าเข้าสู่ระบบ Blacklist ท่านรับรองว่า:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>ข้อมูลที่ให้เป็นความจริงและมีหลักฐานสนับสนุน</li>
                                        <li>ท่านมีสิทธิ์ในการเปิดเผยข้อมูลดังกล่าว</li>
                                        <li>การรายงานเป็นไปโดยสุจริตและไม่มีเจตนาทำลายชื่อเสียงผู้อื่น</li>
                                    </ul>
                                    <p className="text-gray-600 mt-4">
                                        RentSafe ขอสงวนสิทธิ์ในการตรวจสอบและอนุมัติรายงานทุกฉบับก่อนเผยแพร่
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">6. ค่าบริการและการชำระเงิน</h2>
                                    <p className="text-gray-600 mb-4">
                                        บริการบางส่วนของ RentSafe เป็นบริการที่มีค่าใช้จ่าย รวมถึงแพ็คเกจ &quot;ร้านรับรอง&quot; ท่านตกลงที่จะ:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>ชำระค่าบริการตามราคาที่กำหนด</li>
                                        <li>ยอมรับว่าค่าบริการที่ชำระแล้วไม่สามารถขอคืนได้</li>
                                        <li>รับทราบว่าราคาอาจมีการเปลี่ยนแปลงโดยจะแจ้งให้ทราบล่วงหน้า</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">7. ข้อจำกัดความรับผิดชอบ</h2>
                                    <p className="text-gray-600 mb-4">
                                        RentSafe ให้บริการ &quot;ตามสภาพที่เป็น&quot; โดยไม่มีการรับประกันใดๆ เราไม่รับผิดชอบต่อ:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>ความถูกต้องของข้อมูลที่ผู้ใช้รายงาน</li>
                                        <li>ความเสียหายที่เกิดจากการตัดสินใจโดยอ้างอิงข้อมูลในระบบ</li>
                                        <li>การหยุดชะงักของบริการหรือข้อผิดพลาดทางเทคนิค</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">8. การยกเลิกบัญชี</h2>
                                    <p className="text-gray-600 mb-4">
                                        RentSafe ขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของท่าน หากพบว่ามีการละเมิดข้อกำหนดการใช้งาน หรือมีพฤติกรรมที่อาจส่งผลเสียต่อผู้ใช้รายอื่นหรือระบบ
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">9. การเปลี่ยนแปลงข้อกำหนด</h2>
                                    <p className="text-gray-600 mb-4">
                                        เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดเหล่านี้ได้ตลอดเวลา การเปลี่ยนแปลงจะมีผลบังคับใช้ทันทีที่ประกาศบนเว็บไซต์ การใช้งานต่อหลังจากการเปลี่ยนแปลงถือว่าท่านยอมรับข้อกำหนดใหม่
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">10. การติดต่อ</h2>
                                    <p className="text-gray-600">
                                        หากท่านมีคำถามเกี่ยวกับข้อกำหนดการใช้งาน กรุณาติดต่อเราที่{' '}
                                        <Link href="/contact" className="text-blue-600 hover:underline">
                                            หน้าติดต่อเรา
                                        </Link>
                                    </p>
                                </section>
                            </>
                        ) : (
                            <>
                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                                    <p className="text-gray-600 mb-4">
                                        By accessing and using the RentSafe website, you agree to comply with all terms and conditions outlined in this document. If you do not accept these terms, please stop using the website immediately.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                                    <p className="text-gray-600 mb-4">
                                        RentSafe is a platform that provides customer background verification services for car rental businesses. Our services include:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>Customer search and verification system</li>
                                        <li>Problem customer reporting system (Blacklist)</li>
                                        <li>Verified Shop system</li>
                                        <li>Notification and communication system</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Registration and User Accounts</h2>
                                    <p className="text-gray-600 mb-4">
                                        To use certain services of RentSafe, you must register and create a user account. You agree to:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>Provide accurate, complete, and current information</li>
                                        <li>Maintain the security of your password and account</li>
                                        <li>Notify us immediately of any unauthorized use</li>
                                        <li>Be responsible for all activities under your account</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
                                    <p className="text-gray-600 mb-4">You agree not to:</p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>Use the service for illegal purposes</li>
                                        <li>Spread false information or defame others</li>
                                        <li>Violate the privacy rights of others</li>
                                        <li>Attempt unauthorized access to the system</li>
                                        <li>Send spam or unwanted content</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Blacklist Reporting</h2>
                                    <p className="text-gray-600 mb-4">
                                        When you report a customer to the Blacklist system, you certify that:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>The information provided is true and supported by evidence</li>
                                        <li>You have the right to disclose such information</li>
                                        <li>The report is made in good faith without intent to harm reputation</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Fees and Payments</h2>
                                    <p className="text-gray-600 mb-4">
                                        Some RentSafe services are paid services, including the &quot;Verified Shop&quot; package. You agree to:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>Pay service fees as specified</li>
                                        <li>Accept that paid fees are non-refundable</li>
                                        <li>Acknowledge that prices may change with advance notice</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
                                    <p className="text-gray-600 mb-4">
                                        RentSafe provides services &quot;as is&quot; without any warranties. We are not responsible for:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>The accuracy of user-reported information</li>
                                        <li>Damages from decisions based on system data</li>
                                        <li>Service interruptions or technical errors</li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Account Termination</h2>
                                    <p className="text-gray-600 mb-4">
                                        RentSafe reserves the right to suspend or terminate your account if violations of the terms of service are found.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
                                    <p className="text-gray-600 mb-4">
                                        We reserve the right to modify these terms at any time. Changes will take effect immediately upon posting on the website.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact</h2>
                                    <p className="text-gray-600">
                                        If you have questions about these terms, please contact us at our{' '}
                                        <Link href="/contact" className="text-blue-600 hover:underline">
                                            Contact page
                                        </Link>
                                    </p>
                                </section>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
