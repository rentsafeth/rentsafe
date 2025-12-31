'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Store, Clock, CheckCircle, AlertTriangle, Mail, FileText, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ShopData {
    id: string
    name: string
    verification_status: string
    created_at: string
}

export default function ShopRegistrationPendingPage() {
    const t = useTranslations('Common')
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [shop, setShop] = useState<ShopData | null>(null)
    const [user, setUser] = useState<{ email: string; full_name: string } | null>(null)

    useEffect(() => {
        checkRegistrationStatus()
    }, [])

    async function checkRegistrationStatus() {
        try {
            const supabase = createClient()

            // Check if user is logged in
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (!authUser) {
                // Not logged in, check if we have pending registration
                const pendingData = localStorage.getItem('pendingShopRegistration')
                if (pendingData) {
                    // Show message to login first
                    setError('กรุณาเข้าสู่ระบบด้วย Google เพื่อดำเนินการต่อ')
                    setLoading(false)
                    return
                }
                router.push('/register/shop')
                return
            }

            // Get user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', authUser.id)
                .single()

            if (profile) {
                setUser(profile)
            }

            // Check if user already has a shop
            const { data: existingShop, error: shopError } = await supabase
                .from('shops')
                .select('id, name, verification_status, created_at')
                .eq('owner_id', authUser.id)
                .single()

            if (existingShop) {
                setShop(existingShop)
                setLoading(false)
                return
            }

            // Check if there's pending registration data
            const pendingData = localStorage.getItem('pendingShopRegistration')
            if (!pendingData) {
                // No pending data and no existing shop - redirect to registration
                router.push('/register/shop')
                return
            }

            // Process the pending registration
            setProcessing(true)
            await processRegistration(authUser.id, supabase)

        } catch (err) {
            console.error('Error checking registration status:', err)
            setError('เกิดข้อผิดพลาดในการตรวจสอบสถานะ')
        } finally {
            setLoading(false)
        }
    }

    async function processRegistration(userId: string, supabase: ReturnType<typeof createClient>) {
        try {
            const pendingDataStr = localStorage.getItem('pendingShopRegistration')
            if (!pendingDataStr) {
                setError('ไม่พบข้อมูลการลงทะเบียน')
                return
            }

            const formData = JSON.parse(pendingDataStr)

            // Create the shop with document URLs
            const { data: newShop, error: insertError } = await supabase
                .from('shops')
                .insert({
                    owner_id: userId,
                    name: formData.name,
                    description: formData.description || null,
                    phone_number: formData.phone_number,
                    line_id: formData.line_id || null,
                    facebook_url: formData.facebook_url || null,
                    website: formData.website || null,
                    service_provinces: formData.service_provinces,
                    business_type: formData.business_type || 'individual',
                    bank_name: formData.bank_name,
                    bank_account_no: formData.bank_account_no,
                    bank_account_name: formData.bank_account_name,
                    id_card_url: formData.id_card_url || null,
                    business_license_url: formData.business_license_url || null,
                    verification_status: 'pending',
                    pdpa_accepted_at: new Date().toISOString(),
                })
                .select('id, name, verification_status, created_at')
                .single()

            if (insertError) {
                console.error('Insert error:', insertError)
                setError('ไม่สามารถสร้างข้อมูลร้านค้าได้: ' + insertError.message)
                return
            }

            // Clear pending data
            localStorage.removeItem('pendingShopRegistration')
            localStorage.removeItem('pendingIdCardFileName')
            localStorage.removeItem('pendingBusinessLicenseFileName')

            setShop(newShop)
            setProcessing(false)

        } catch (err) {
            console.error('Error processing registration:', err)
            setError('เกิดข้อผิดพลาดในการสร้างข้อมูลร้านค้า')
            setProcessing(false)
        }
    }

    if (loading || processing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">
                        {processing ? 'กำลังสร้างข้อมูลร้านค้า...' : 'กำลังตรวจสอบสถานะ...'}
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-4 py-12">
                <div className="w-full max-w-lg mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link
                            href="/register/shop"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            กลับไปหน้าลงทะเบียน
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (!shop) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-4 py-12">
                <div className="w-full max-w-lg mx-auto text-center">
                    <p className="text-gray-600">ไม่พบข้อมูลร้านค้า</p>
                    <Link
                        href="/register/shop"
                        className="inline-flex items-center gap-2 px-6 py-3 mt-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                    >
                        ลงทะเบียนร้านค้า
                    </Link>
                </div>
            </div>
        )
    }

    const getStatusIcon = () => {
        switch (shop.verification_status) {
            case 'verified':
                return <CheckCircle className="w-12 h-12 text-green-600" />
            case 'rejected':
                return <AlertTriangle className="w-12 h-12 text-red-600" />
            default:
                return <Clock className="w-12 h-12 text-yellow-600" />
        }
    }

    const getStatusColor = () => {
        switch (shop.verification_status) {
            case 'verified':
                return 'bg-green-100 border-green-200'
            case 'rejected':
                return 'bg-red-100 border-red-200'
            default:
                return 'bg-yellow-100 border-yellow-200'
        }
    }

    const getStatusText = () => {
        switch (shop.verification_status) {
            case 'verified':
                return { title: 'ร้านค้าได้รับการยืนยันแล้ว!', message: 'ยินดีด้วย! ร้านค้าของคุณผ่านการตรวจสอบแล้ว สามารถเข้าใช้งานระบบได้เลย' }
            case 'rejected':
                return { title: 'การลงทะเบียนถูกปฏิเสธ', message: 'กรุณาติดต่อทีมงานเพื่อขอข้อมูลเพิ่มเติมหรือแก้ไขเอกสาร' }
            default:
                return { title: 'กำลังรอการตรวจสอบ', message: 'ทีมงานกำลังตรวจสอบข้อมูลและเอกสารของคุณ โดยปกติจะใช้เวลา 1-3 วันทำการ' }
        }
    }

    const status = getStatusText()

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-4 py-12">
            <div className="w-full max-w-lg mx-auto">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-2xl mb-4">
                        <Store className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">RentSafe</h1>
                    <p className="text-gray-500">ระบบลงทะเบียนร้านค้า</p>
                </div>

                {/* Status Card */}
                <div className={`rounded-2xl shadow-xl p-8 border ${getStatusColor()}`}>
                    <div className="text-center mb-6">
                        <div className="mb-4">
                            {getStatusIcon()}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{status.title}</h2>
                        <p className="text-gray-600">{status.message}</p>
                    </div>

                    {/* Shop Info */}
                    <div className="bg-white rounded-xl p-4 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Store className="w-5 h-5 text-green-600" />
                            ข้อมูลร้านค้า
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">ชื่อร้าน:</span>
                                <span className="font-medium text-gray-900">{shop.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">วันที่สมัคร:</span>
                                <span className="font-medium text-gray-900">
                                    {new Date(shop.created_at).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">สถานะ:</span>
                                <span className={`font-medium ${shop.verification_status === 'verified' ? 'text-green-600' :
                                        shop.verification_status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                                    }`}>
                                    {shop.verification_status === 'verified' ? 'ยืนยันแล้ว' :
                                        shop.verification_status === 'rejected' ? 'ถูกปฏิเสธ' : 'รอตรวจสอบ'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* What's Next */}
                    {shop.verification_status === 'pending' && (
                        <div className="bg-white rounded-xl p-4 mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-green-600" />
                                ขั้นตอนถัดไป
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs">1</span>
                                    <span>ทีมงานจะตรวจสอบเอกสารและข้อมูลที่คุณส่งมา</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs">2</span>
                                    <span>หากข้อมูลครบถ้วน จะได้รับการยืนยันภายใน 1-3 วันทำการ</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs">3</span>
                                    <span>คุณจะได้รับอีเมลแจ้งผลการตรวจสอบ</span>
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Email notification */}
                    {user && (
                        <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-900">การแจ้งเตือนทางอีเมล</p>
                                <p className="text-blue-700">
                                    เราจะส่งผลการตรวจสอบไปที่ <span className="font-medium">{user.email}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        {shop.verification_status === 'verified' && (
                            <Link
                                href="/dashboard/shop"
                                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-center transition-colors"
                            >
                                เข้าสู่แดชบอร์ดร้านค้า
                            </Link>
                        )}
                        <Link
                            href="/"
                            className="block w-full py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl text-center hover:bg-gray-50 transition-colors"
                        >
                            กลับหน้าหลัก
                        </Link>
                    </div>
                </div>

                {/* Contact Support */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-500">
                        มีคำถาม? ติดต่อทีมงาน{' '}
                        <a href="mailto:rentsafeth@gmail.com" className="text-green-600 hover:underline">
                            rentsafeth@gmail.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
