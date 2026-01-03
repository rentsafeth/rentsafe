import { useLocale } from 'next-intl';

export default function PrivacyPolicyPage() {
    const locale = useLocale();

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl text-gray-800">
            <h1 className="text-3xl font-bold mb-6 text-blue-900 border-b pb-4">นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
            <p className="mb-4 text-sm text-gray-500">อัปเดตล่าสุดเมื่อ: {new Date().toLocaleDateString('th-TH')}</p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">1. บทนำ</h2>
                    <p className="leading-relaxed">
                        RentSafe ("เรา") ให้ความสำคัญกับความเป็นส่วนตัวของคุณ เราจัดทำนโยบายความเป็นส่วนตัวนี้เพื่อแจ้งให้คุณทราบเกี่ยวกับวิธีการที่เราเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของคุณ เมื่อคุณใช้งานเว็บไซต์และบริการของเรา ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">2. ข้อมูลที่เราเก็บรวบรวม</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>ข้อมูลส่วนตัว:</strong> ชื่อ, นามสกุล, เบอร์โทรศัพท์, อีเมล (เมื่อคุณลงทะเบียนหรือติดต่อเรา)</li>
                        <li><strong>ข้อมูลการใช้งาน:</strong> ข้อมูลเกี่ยวกับอุปกรณ์, IP Address, คุกกี้, และประวัติการเข้าชมเว็บไซต์</li>
                        <li><strong>ข้อมูลร้านค้า (สำหรับ Partner):</strong> รายละเอียดร้านเช่ารถ, ที่ตั้ง, และเอกสารยืนยันตัวตน</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">3. วัตถุประสงค์การใช้ข้อมูล</h2>
                    <p className="leading-relaxed">เราใช้ข้อมูลของคุณเพื่อ:</p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>ให้บริการแพลตฟอร์มตรวจสอบและค้นหาร้านเช่ารถ</li>
                        <li>ยืนยันตัวตนและความน่าเชื่อถือของผู้ใช้งานและร้านค้า</li>
                        <li>ติดต่อสื่อสารและแจ้งเตือนข้อมูลสำคัญ</li>
                        <li>ปรับปรุงและพัฒนาประสบการณ์การใช้งานเว็บไซต์</li>
                        <li>ปฏิบัติตามกฎหมายและข้อบังคับที่เกี่ยวข้อง</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">4. คุกกี้ (Cookies)</h2>
                    <p className="leading-relaxed">
                        เว็บไซต์ของเรามีการใช้คุกกี้เพื่อจัดเก็บข้อมูลการตั้งค่าของผู้ใช้และวิเคราะห์การใช้งาน เพื่อให้เราสามารถส่งมอบบริการที่ดีที่สุดให้แก่คุณ
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mt-3 border border-gray-200">
                        <h3 className="font-semibold mb-2">หากคุณเลือก "ปฏิเสธคุกกี้"</h3>
                        <p className="text-sm">
                            เราจะระงับการทำงานของคุกกี้ที่ไม่จำเป็น (เช่น คุกกี้วิเคราะห์ข้อมูล คุกกี้การตลาด) แต่คุกกี้ที่จำเป็นต่อการทำงานพื้นฐานของระบบ (Strictly Necessary Cookies) จะยังคงทำงานเพื่อให้คุณสามารถใช้งานเว็บไซต์ได้ตามปกติ
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">5. การเปิดเผยข้อมูล</h2>
                    <p className="leading-relaxed">
                        เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของคุณแก่บุคคลภายนอก ยกเว้นในกรณีที่:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>ได้รับความยินยอมจากคุณ</li>
                        <li>เป็นการปฏิบัติตามกฎหมาย หรือคำสั่งจากหน่วยงานรัฐ</li>
                        <li>เพื่อปกป้องความปลอดภัยของระบบและผู้ใช้งานอื่น (เช่น กรณีฉ้อโกง หรือ Blacklist)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">6. สิทธิของคุณ</h2>
                    <p className="leading-relaxed">
                        คุณมีสิทธิในการขอเข้าถึง แก้ไข ลบ หรือระงับการใช้ข้อมูลส่วนบุคคลของคุณ รวมถึงสิทธิในการถอนความยินยอมได้ตลอดเวลา โดยติดต่อมาที่ Admin ของเรา
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">7. ติดต่อเรา</h2>
                    <p className="leading-relaxed">
                        หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัว สามารถติดต่อได้ที่: <br />
                        <strong>Email:</strong> support@rentsafe.in.th <br />
                        <strong>Website:</strong> www.rentsafe.in.th
                    </p>
                </section>
            </div>
        </div>
    );
}
