'use client'

import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'

export default function RegisterUserPage() {
    const t = useTranslations('Common')
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [acceptPDPA, setAcceptPDPA] = useState(false)
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [showPDPA, setShowPDPA] = useState(false)

    async function signInWithGoogle() {
        if (!acceptPDPA || !acceptTerms) {
            setError('กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว')
            return
        }

        try {
            setLoading(true)
            setError(null)

            const supabase = createClient()

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?type=user`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })

            if (error) {
                setError(error.message)
                setLoading(false)
                return
            }

            if (data?.url) {
                window.location.href = data.url
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Back Button */}
                <Link href="/register" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    กลับไปเลือกประเภท
                </Link>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">สมัครสมาชิกผู้ใช้ทั่วไป</h1>
                    <p className="text-gray-500 mt-2">ลงทะเบียนเพื่อค้นหาและรีวิวร้านเช่ารถ</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* PDPA & Terms Checkbox */}
                    <div className="space-y-4 mb-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                                ข้าพเจ้ายอมรับ{' '}
                                <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                                    เงื่อนไขการใช้งาน
                                </a>
                            </span>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={acceptPDPA}
                                onChange={(e) => setAcceptPDPA(e.target.checked)}
                                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                                ข้าพเจ้ายินยอมให้เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลตาม{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowPDPA(true)}
                                    className="text-blue-600 hover:underline"
                                >
                                    นโยบายความเป็นส่วนตัว (PDPA)
                                </button>
                            </span>
                        </label>
                    </div>

                    {/* Info Box */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                        <h4 className="font-medium text-blue-900 mb-2">ข้อมูลที่จะเก็บรวบรวม:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• ชื่อ-นามสกุล และอีเมล (จาก Google Account)</li>
                            <li>• รูปโปรไฟล์ (ถ้ามี)</li>
                            <li>• ประวัติการค้นหาและรีวิว</li>
                        </ul>
                    </div>

                    {/* Google Sign In Button */}
                    <button
                        type="button"
                        onClick={signInWithGoogle}
                        disabled={loading || !acceptPDPA || !acceptTerms}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                        <span>{loading ? 'กำลังดำเนินการ...' : 'สมัครด้วย Google'}</span>
                    </button>

                    {/* Login Link */}
                    <p className="text-center text-gray-500 text-sm mt-6">
                        มีบัญชีอยู่แล้ว?{' '}
                        <Link href="/login" className="text-blue-600 font-medium hover:underline">
                            เข้าสู่ระบบ
                        </Link>
                    </p>
                </div>
            </div>

            {/* PDPA Modal */}
            {showPDPA && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">นโยบายความเป็นส่วนตัว (PDPA)</h2>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="prose prose-sm max-w-none">
                                <h3>1. ข้อมูลที่เราเก็บรวบรวม</h3>
                                <p>เราเก็บรวบรวมข้อมูลส่วนบุคคลเมื่อท่านสมัครสมาชิกหรือใช้บริการ ได้แก่:</p>
                                <ul>
                                    <li>ชื่อ-นามสกุล</li>
                                    <li>อีเมล</li>
                                    <li>รูปโปรไฟล์</li>
                                    <li>ประวัติการใช้งาน เช่น การค้นหา รีวิว รายงาน</li>
                                </ul>

                                <h3>2. วัตถุประสงค์ในการใช้ข้อมูล</h3>
                                <ul>
                                    <li>เพื่อยืนยันตัวตนและจัดการบัญชีผู้ใช้</li>
                                    <li>เพื่อให้บริการค้นหาและรีวิวร้านเช่ารถ</li>
                                    <li>เพื่อพัฒนาและปรับปรุงบริการ</li>
                                    <li>เพื่อติดต่อสื่อสารเกี่ยวกับบริการ</li>
                                </ul>

                                <h3>3. การเปิดเผยข้อมูล</h3>
                                <p>เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลภายนอก ยกเว้นกรณี:</p>
                                <ul>
                                    <li>ได้รับความยินยอมจากท่าน</li>
                                    <li>เป็นไปตามกฎหมาย</li>
                                    <li>เพื่อปกป้องสิทธิ์และความปลอดภัยของผู้ใช้</li>
                                </ul>

                                <h3>4. สิทธิ์ของเจ้าของข้อมูล</h3>
                                <p>ท่านมีสิทธิ์ในการเข้าถึง แก้ไข ลบ หรือขอสำเนาข้อมูลส่วนบุคคลของท่านได้</p>

                                <h3>5. การติดต่อ</h3>
                                <p>หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัว สามารถติดต่อได้ที่ rentsafeth@gmail.com</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowPDPA(false)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
