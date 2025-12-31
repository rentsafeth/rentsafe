'use client'

import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Store, ArrowLeft, Upload, X, Check, ChevronDown, FileText, CreditCard, Building2, User, AlertTriangle, Banknote, Wallet } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Thai provinces list
const PROVINCES = [
    'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร',
    'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท',
    'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง',
    'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม',
    'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส',
    'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์',
    'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พังงา', 'พัทลุง',
    'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่',
    'พะเยา', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน',
    'ยะลา', 'ยโสธร', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง',
    'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย',
    'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ',
    'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี',
    'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย',
    'หนองบัวลำภู', 'อ่างทอง', 'อุดรธานี', 'อุทัยธานี', 'อุตรดิตถ์',
    'อุบลราชธานี', 'อำนาจเจริญ'
]

// Thai banks list
const BANKS = [
    { code: 'BBL', name: 'ธนาคารกรุงเทพ' },
    { code: 'KBANK', name: 'ธนาคารกสิกรไทย' },
    { code: 'KTB', name: 'ธนาคารกรุงไทย' },
    { code: 'TTB', name: 'ธนาคารทหารไทยธนชาต' },
    { code: 'SCB', name: 'ธนาคารไทยพาณิชย์' },
    { code: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา' },
    { code: 'KKP', name: 'ธนาคารเกียรตินาคินภัทร' },
    { code: 'CIMB', name: 'ธนาคารซีไอเอ็มบี ไทย' },
    { code: 'TISCO', name: 'ธนาคารทิสโก้' },
    { code: 'UOBT', name: 'ธนาคารยูโอบี' },
    { code: 'LH', name: 'ธนาคารแลนด์ แอนด์ เฮ้าส์' },
    { code: 'GSB', name: 'ธนาคารออมสิน' },
    { code: 'BAAC', name: 'ธนาคาร ธ.ก.ส.' },
    { code: 'GHB', name: 'ธนาคารอาคารสงเคราะห์' },
]

export default function RegisterShopPage() {
    const t = useTranslations('Common')
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [acceptPDPA, setAcceptPDPA] = useState(false)
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [showPDPA, setShowPDPA] = useState(false)
    const [showTerms, setShowTerms] = useState(false)
    const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)

    // File refs
    const idCardRef = useRef<HTMLInputElement>(null)
    const businessLicenseRef = useRef<HTMLInputElement>(null)

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        phone_number: '',
        line_id: '',
        facebook_url: '',
        website: '',
        service_provinces: [] as string[],
        business_type: 'individual' as 'individual' | 'company',
        bank_name: '',
        bank_account_no: '',
        bank_account_name: '',
        can_issue_tax_invoice: false,
        can_issue_withholding_tax: false,
        pay_on_pickup: false,
        accept_credit_card: false,
    })

    // File previews
    const [idCardFile, setIdCardFile] = useState<File | null>(null)
    const [idCardPreview, setIdCardPreview] = useState<string | null>(null)
    const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null)
    const [businessLicensePreview, setBusinessLicensePreview] = useState<string | null>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const toggleProvince = (province: string) => {
        setFormData(prev => ({
            ...prev,
            service_provinces: prev.service_provinces.includes(province)
                ? prev.service_provinces.filter(p => p !== province)
                : [...prev.service_provinces, province]
        }))
    }

    const removeProvince = (province: string) => {
        setFormData(prev => ({
            ...prev,
            service_provinces: prev.service_provinces.filter(p => p !== province)
        }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'businessLicense') => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('ไฟล์มีขนาดใหญ่เกิน 5MB')
            return
        }

        // Check file type
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            setError('รองรับเฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            if (type === 'idCard') {
                setIdCardFile(file)
                setIdCardPreview(file.type.startsWith('image/') ? reader.result as string : null)
            } else {
                setBusinessLicenseFile(file)
                setBusinessLicensePreview(file.type.startsWith('image/') ? reader.result as string : null)
            }
        }
        reader.readAsDataURL(file)
        setError(null)
    }

    const removeFile = (type: 'idCard' | 'businessLicense') => {
        if (type === 'idCard') {
            setIdCardFile(null)
            setIdCardPreview(null)
            if (idCardRef.current) idCardRef.current.value = ''
        } else {
            setBusinessLicenseFile(null)
            setBusinessLicensePreview(null)
            if (businessLicenseRef.current) businessLicenseRef.current.value = ''
        }
    }

    async function signInWithGoogle() {
        if (!acceptPDPA || !acceptTerms) {
            setError('กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว')
            return
        }

        try {
            setLoading(true)
            setError(null)

            const supabase = createClient()

            // Generate a unique temp ID for file uploads
            const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`

            // Upload files to Supabase Storage first (public bucket for temp files)
            let idCardUrl: string | null = null
            let businessLicenseUrl: string | null = null

            if (idCardFile) {
                const fileExt = idCardFile.name.split('.').pop()
                const filePath = `pending/${tempId}/id_card.${fileExt}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('verification-docs')
                    .upload(filePath, idCardFile, {
                        cacheControl: '3600',
                        upsert: true
                    })

                if (uploadError) {
                    console.error('ID card upload error:', uploadError)
                    setError('ไม่สามารถอัปโหลดสำเนาบัตรประชาชนได้: ' + uploadError.message)
                    setLoading(false)
                    return
                }

                const { data: urlData } = supabase.storage.from('verification-docs').getPublicUrl(filePath)
                idCardUrl = urlData.publicUrl
            }

            if (businessLicenseFile) {
                const fileExt = businessLicenseFile.name.split('.').pop()
                const filePath = `pending/${tempId}/business_license.${fileExt}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('verification-docs')
                    .upload(filePath, businessLicenseFile, {
                        cacheControl: '3600',
                        upsert: true
                    })

                if (uploadError) {
                    console.error('Business license upload error:', uploadError)
                    setError('ไม่สามารถอัปโหลดเอกสารธุรกิจได้: ' + uploadError.message)
                    setLoading(false)
                    return
                }

                const { data: urlData } = supabase.storage.from('verification-docs').getPublicUrl(filePath)
                businessLicenseUrl = urlData.publicUrl
            }

            // Store form data in localStorage temporarily (including file URLs)
            const dataToStore = {
                ...formData,
                id_card_url: idCardUrl,
                business_license_url: businessLicenseUrl,
                temp_id: tempId
            }
            localStorage.setItem('pendingShopRegistration', JSON.stringify(dataToStore))

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?type=shop`,
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
            console.error('Registration error:', err)
            setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
            setLoading(false)
        }
    }

    const validateStep1 = () => {
        if (!formData.name.trim()) {
            setError('กรุณากรอกชื่อร้าน')
            return false
        }
        if (!formData.phone_number.trim()) {
            setError('กรุณากรอกเบอร์โทรศัพท์')
            return false
        }
        if (formData.service_provinces.length === 0) {
            setError('กรุณาเลือกจังหวัดที่ให้บริการอย่างน้อย 1 จังหวัด')
            return false
        }
        setError(null)
        return true
    }

    const validateStep2 = () => {
        if (!formData.bank_name) {
            setError('กรุณาเลือกธนาคาร')
            return false
        }
        if (!formData.bank_account_no) {
            setError('กรุณากรอกเลขบัญชี')
            return false
        }
        if (!formData.bank_account_name) {
            setError('กรุณากรอกชื่อบัญชี')
            return false
        }
        setError(null)
        return true
    }

    const validateStep3 = () => {
        if (!idCardFile) {
            setError(formData.business_type === 'individual'
                ? 'กรุณาแนบสำเนาบัตรประชาชน'
                : 'กรุณาแนบสำเนาบัตรประชาชนผู้มีอำนาจลงนาม')
            return false
        }
        if (!businessLicenseFile) {
            setError(formData.business_type === 'individual'
                ? 'กรุณาแนบทะเบียนพาณิชย์'
                : 'กรุณาแนบหนังสือรับรองบริษัท')
            return false
        }
        setError(null)
        return true
    }

    const nextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2)
        } else if (step === 2 && validateStep2()) {
            setStep(3)
        } else if (step === 3 && validateStep3()) {
            setStep(4)
        }
    }

    const prevStep = () => {
        setError(null)
        setStep(step - 1)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-4 py-12">
            <div className="w-full max-w-2xl mx-auto">
                {/* Back Button */}
                <Link href="/register" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    กลับไปเลือกประเภท
                </Link>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">สมัครสมาชิกร้านค้า</h1>
                    <p className="text-gray-500 mt-2">ลงทะเบียนร้านเช่ารถของคุณเพื่อสร้างความน่าเชื่อถือ</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}>
                                {step > s ? <Check className="w-5 h-5" /> : s}
                            </div>
                            {s < 4 && (
                                <div className={`w-12 h-1 mx-2 ${step > s ? 'bg-green-600' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center text-sm text-gray-500 mb-6">
                    {step === 1 && 'ขั้นตอนที่ 1: ข้อมูลร้านค้า'}
                    {step === 2 && 'ขั้นตอนที่ 2: ข้อมูลธนาคาร'}
                    {step === 3 && 'ขั้นตอนที่ 3: เอกสารยืนยันตัวตน'}
                    {step === 4 && 'ขั้นตอนที่ 4: ยืนยันและสมัคร'}
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Shop Info */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* Business Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ประเภทผู้ประกอบการ <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, business_type: 'individual' }))}
                                        className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${formData.business_type === 'individual'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <User className={`w-8 h-8 ${formData.business_type === 'individual' ? 'text-green-600' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${formData.business_type === 'individual' ? 'text-green-700' : 'text-gray-600'}`}>
                                            บุคคลธรรมดา
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, business_type: 'company' }))}
                                        className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${formData.business_type === 'company'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Building2 className={`w-8 h-8 ${formData.business_type === 'company' ? 'text-green-600' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${formData.business_type === 'company' ? 'text-green-700' : 'text-gray-600'}`}>
                                            นิติบุคคล/บริษัท
                                        </span>
                                    </button>
                                </div>

                                {/* Tax/Withholding checkbox based on business type */}
                                {formData.business_type === 'individual' ? (
                                    <label className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.can_issue_withholding_tax}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                can_issue_withholding_tax: e.target.checked,
                                                can_issue_tax_invoice: false
                                            }))}
                                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-700">สามารถออกหนังสือหัก ณ ที่จ่ายได้</span>
                                            <p className="text-xs text-gray-500">สำหรับลูกค้าที่ต้องการหักภาษี ณ ที่จ่าย</p>
                                        </div>
                                    </label>
                                ) : (
                                    <label className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.can_issue_tax_invoice}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                can_issue_tax_invoice: e.target.checked,
                                                can_issue_withholding_tax: false
                                            }))}
                                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-700">สามารถออกใบกำกับภาษีได้</span>
                                            <p className="text-xs text-gray-500">สำหรับลูกค้าที่ต้องการใบกำกับภาษี VAT 7%</p>
                                        </div>
                                    </label>
                                )}

                                {/* Payment Options */}
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm font-medium text-gray-700">ตัวเลือกการชำระเงิน</p>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.pay_on_pickup}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                pay_on_pickup: e.target.checked
                                            }))}
                                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Banknote className="w-5 h-5 text-emerald-600" />
                                            <div>
                                                <span className="font-medium text-gray-700">รับชำระเงินตอนรับรถ</span>
                                                <p className="text-xs text-gray-500">ลูกค้าสามารถจ่ายเงินสดหรือโอนตอนมารับรถได้</p>
                                            </div>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.accept_credit_card}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                accept_credit_card: e.target.checked
                                            }))}
                                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-violet-600" />
                                            <div>
                                                <span className="font-medium text-gray-700">รับบัตรเครดิต</span>
                                                <p className="text-xs text-gray-500">รองรับการชำระเงินด้วยบัตรเครดิต/เดบิต</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อร้าน <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="เช่น รถเช่าสุขใจ"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                    placeholder="0XX-XXX-XXXX"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    จังหวัดที่ให้บริการ <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-2">เลือกได้หลายจังหวัด</p>

                                {/* Selected provinces */}
                                {formData.service_provinces.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.service_provinces.map(province => (
                                            <span
                                                key={province}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                                            >
                                                {province}
                                                <button
                                                    type="button"
                                                    onClick={() => removeProvince(province)}
                                                    className="hover:text-green-900"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Province dropdown */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <span className="text-gray-500">
                                            {formData.service_provinces.length === 0
                                                ? 'เลือกจังหวัด...'
                                                : `เลือกแล้ว ${formData.service_provinces.length} จังหวัด`}
                                        </span>
                                        <ChevronDown className={`w-5 h-5 transition-transform ${showProvinceDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showProvinceDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {PROVINCES.map(province => (
                                                <button
                                                    key={province}
                                                    type="button"
                                                    onClick={() => toggleProvince(province)}
                                                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${formData.service_provinces.includes(province)
                                                            ? 'bg-green-50 text-green-700'
                                                            : ''
                                                        }`}
                                                >
                                                    {province}
                                                    {formData.service_provinces.includes(province) && (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รายละเอียดร้าน
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="อธิบายเกี่ยวกับร้านของคุณ เช่น ประเภทรถที่มี บริการพิเศษ ฯลฯ"
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Additional contact */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        LINE ID
                                    </label>
                                    <input
                                        type="text"
                                        name="line_id"
                                        value={formData.line_id}
                                        onChange={handleInputChange}
                                        placeholder="@yourshop"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Facebook
                                    </label>
                                    <input
                                        type="text"
                                        name="facebook_url"
                                        value={formData.facebook_url}
                                        onChange={handleInputChange}
                                        placeholder="facebook.com/..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={nextStep}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                            >
                                ถัดไป
                            </button>
                        </div>
                    )}

                    {/* Step 2: Bank Info */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-600" />
                                ข้อมูลบัญชีธนาคาร
                            </h3>
                            <p className="text-sm text-gray-500 -mt-2 mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <strong>หมายเหตุ:</strong> ข้อมูลนี้ใช้สำหรับยืนยันตัวตนเท่านั้น และจะถูกล็อคหลังจากผ่านการยืนยันแล้ว
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ธนาคาร <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="bank_name"
                                    value={formData.bank_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="">เลือกธนาคาร...</option>
                                    {BANKS.map(bank => (
                                        <option key={bank.code} value={bank.name}>{bank.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เลขบัญชี <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_account_no"
                                    value={formData.bank_account_no}
                                    onChange={handleInputChange}
                                    placeholder="XXX-X-XXXXX-X"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อบัญชี <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_account_name"
                                    value={formData.bank_account_name}
                                    onChange={handleInputChange}
                                    placeholder={formData.business_type === 'individual' ? 'ชื่อ-นามสกุล' : 'ชื่อบริษัท'}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    ย้อนกลับ
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Documents */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-green-600" />
                                เอกสารยืนยันตัวตน
                            </h3>

                            {/* ID Card Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {formData.business_type === 'individual'
                                        ? 'สำเนาบัตรประชาชน'
                                        : 'สำเนาบัตรประชาชนผู้มีอำนาจลงนาม'}
                                    <span className="text-red-500"> *</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                    พร้อมเซ็นกำกับ &quot;สำหรับลงทะเบียนร้านค้ากับ www.rentsafe.in.th เท่านั้น&quot;
                                </p>

                                {idCardPreview ? (
                                    <div className="relative border-2 border-green-500 rounded-xl p-4 bg-green-50">
                                        <button
                                            type="button"
                                            onClick={() => removeFile('idCard')}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <img
                                            src={idCardPreview}
                                            alt="ID Card Preview"
                                            className="max-h-48 mx-auto rounded-lg"
                                        />
                                        <p className="text-center text-sm text-green-700 mt-2">
                                            <Check className="w-4 h-4 inline mr-1" />
                                            {idCardFile?.name}
                                        </p>
                                    </div>
                                ) : idCardFile ? (
                                    <div className="relative border-2 border-green-500 rounded-xl p-4 bg-green-50">
                                        <button
                                            type="button"
                                            onClick={() => removeFile('idCard')}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText className="w-8 h-8 text-green-600" />
                                            <span className="text-green-700">{idCardFile.name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors">
                                        <input
                                            ref={idCardRef}
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileChange(e, 'idCard')}
                                            className="hidden"
                                        />
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600">คลิกเพื่ออัปโหลด</p>
                                        <p className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG, PDF (ไม่เกิน 5MB)</p>
                                    </label>
                                )}
                            </div>

                            {/* Business License Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {formData.business_type === 'individual'
                                        ? 'ทะเบียนพาณิชย์'
                                        : 'หนังสือรับรองบริษัท'}
                                    <span className="text-red-500"> *</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                    {formData.business_type === 'individual'
                                        ? 'ใบทะเบียนพาณิชย์ หรือเอกสารอนุญาตประกอบธุรกิจ'
                                        : 'หนังสือรับรองการจดทะเบียนบริษัท อายุไม่เกิน 3 เดือน'}
                                </p>

                                {businessLicensePreview ? (
                                    <div className="relative border-2 border-green-500 rounded-xl p-4 bg-green-50">
                                        <button
                                            type="button"
                                            onClick={() => removeFile('businessLicense')}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <img
                                            src={businessLicensePreview}
                                            alt="Business License Preview"
                                            className="max-h-48 mx-auto rounded-lg"
                                        />
                                        <p className="text-center text-sm text-green-700 mt-2">
                                            <Check className="w-4 h-4 inline mr-1" />
                                            {businessLicenseFile?.name}
                                        </p>
                                    </div>
                                ) : businessLicenseFile ? (
                                    <div className="relative border-2 border-green-500 rounded-xl p-4 bg-green-50">
                                        <button
                                            type="button"
                                            onClick={() => removeFile('businessLicense')}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText className="w-8 h-8 text-green-600" />
                                            <span className="text-green-700">{businessLicenseFile.name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors">
                                        <input
                                            ref={businessLicenseRef}
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileChange(e, 'businessLicense')}
                                            className="hidden"
                                        />
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600">คลิกเพื่ออัปโหลด</p>
                                        <p className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG, PDF (ไม่เกิน 5MB)</p>
                                    </label>
                                )}
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    ย้อนกลับ
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirm & Register */}
                    {step === 4 && (
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">สรุปข้อมูลร้านค้า</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">ประเภท:</span>
                                        <span className="font-medium">
                                            {formData.business_type === 'individual' ? 'บุคคลธรรมดา' : 'นิติบุคคล/บริษัท'}
                                        </span>
                                    </div>
                                    {(formData.can_issue_tax_invoice || formData.can_issue_withholding_tax) && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">บริการเอกสารภาษี:</span>
                                            <span className="font-medium text-green-600">
                                                {formData.can_issue_tax_invoice && 'ออกใบกำกับภาษีได้'}
                                                {formData.can_issue_withholding_tax && 'ออกหนังสือหัก ณ ที่จ่ายได้'}
                                            </span>
                                        </div>
                                    )}
                                    {(formData.pay_on_pickup || formData.accept_credit_card) && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">การชำระเงิน:</span>
                                            <span className="font-medium text-green-600">
                                                {[
                                                    formData.pay_on_pickup && 'ชำระตอนรับรถ',
                                                    formData.accept_credit_card && 'รับบัตรเครดิต'
                                                ].filter(Boolean).join(', ')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">ชื่อร้าน:</span>
                                        <span className="font-medium">{formData.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">เบอร์โทร:</span>
                                        <span className="font-medium">{formData.phone_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">ธนาคาร:</span>
                                        <span className="font-medium">{formData.bank_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">เลขบัญชี:</span>
                                        <span className="font-medium">{formData.bank_account_no}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">จังหวัดที่ให้บริการ:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {formData.service_provinces.map(p => (
                                                <span key={p} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200">
                                        <span className="text-gray-500">เอกสารที่แนบ:</span>
                                        <div className="mt-1 space-y-1">
                                            <div className="flex items-center gap-2 text-green-600">
                                                <Check className="w-4 h-4" />
                                                <span className="text-sm">{idCardFile?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-green-600">
                                                <Check className="w-4 h-4" />
                                                <span className="text-sm">{businessLicenseFile?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms & PDPA Checkbox */}
                            <div className="space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        ข้าพเจ้ายอมรับ{' '}
                                        <button
                                            type="button"
                                            onClick={() => setShowTerms(true)}
                                            className="text-green-600 hover:underline"
                                        >
                                            เงื่อนไขการใช้งานสำหรับร้านค้า
                                        </button>
                                        {' '}และยืนยันว่าข้อมูลที่ให้ไว้เป็นความจริง
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={acceptPDPA}
                                        onChange={(e) => setAcceptPDPA(e.target.checked)}
                                        className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        ข้าพเจ้ายินยอมให้เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลตาม{' '}
                                        <button
                                            type="button"
                                            onClick={() => setShowPDPA(true)}
                                            className="text-green-600 hover:underline"
                                        >
                                            นโยบายความเป็นส่วนตัว (PDPA)
                                        </button>
                                    </span>
                                </label>
                            </div>

                            {/* Info Box */}
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <h4 className="font-medium text-blue-900 mb-2">ขั้นตอนหลังจากสมัคร:</h4>
                                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                    <li>ระบบจะส่งข้อมูลไปยังทีมตรวจสอบ</li>
                                    <li>ทีมงานจะตรวจสอบเอกสารภายใน 1-3 วันทำการ</li>
                                    <li>เมื่อผ่านการตรวจสอบ จะได้รับอีเมลยืนยัน</li>
                                    <li>ร้านค้าจะได้รับ Verified Badge และเปิดใช้งาน</li>
                                </ol>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    ย้อนกลับ
                                </button>
                                <button
                                    type="button"
                                    onClick={signInWithGoogle}
                                    disabled={loading || !acceptPDPA || !acceptTerms}
                                    className="flex-1 flex items-center justify-center gap-3 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    )}
                                    <span>{loading ? 'กำลังดำเนินการ...' : 'สมัครด้วย Google'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Login Link */}
                    <p className="text-center text-gray-500 text-sm mt-6">
                        มีบัญชีอยู่แล้ว?{' '}
                        <Link href="/login" className="text-green-600 font-medium hover:underline">
                            เข้าสู่ระบบ
                        </Link>
                    </p>
                </div>
            </div>

            {/* PDPA Modal */}
            {showPDPA && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">นโยบายความเป็นส่วนตัว (PDPA) สำหรับร้านค้า</h2>
                            <button onClick={() => setShowPDPA(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="prose prose-sm max-w-none">
                                <h3>1. ข้อมูลที่เราเก็บรวบรวม</h3>
                                <p>สำหรับร้านค้า เราเก็บรวบรวมข้อมูลดังนี้:</p>
                                <ul>
                                    <li>ข้อมูลร้านค้า: ชื่อร้าน ที่อยู่ เบอร์โทรศัพท์ ช่องทางติดต่อ</li>
                                    <li>ข้อมูลเจ้าของ: ชื่อ-นามสกุล อีเมล รูปโปรไฟล์ (จาก Google Account)</li>
                                    <li>ข้อมูลยืนยันตัวตน: สำเนาบัตรประชาชน ข้อมูลบัญชีธนาคาร</li>
                                    <li>เอกสารทะเบียนพาณิชย์หรือหนังสือรับรองบริษัท</li>
                                </ul>

                                <h3>2. วัตถุประสงค์ในการใช้ข้อมูล</h3>
                                <ul>
                                    <li>เพื่อยืนยันตัวตนและความน่าเชื่อถือของร้านค้า</li>
                                    <li>เพื่อแสดงข้อมูลร้านค้าต่อผู้ใช้ทั่วไป</li>
                                    <li>เพื่อออก Verified Badge</li>
                                    <li>เพื่อติดต่อสื่อสารเกี่ยวกับบริการ</li>
                                    <li>เพื่อจัดการข้อร้องเรียนและรีวิว</li>
                                </ul>

                                <h3>3. การเปิดเผยข้อมูล</h3>
                                <p>ข้อมูลที่จะแสดงต่อสาธารณะ:</p>
                                <ul>
                                    <li>ชื่อร้าน ที่อยู่ เบอร์โทร ช่องทางติดต่อ</li>
                                    <li>รูปภาพร้านและรถที่ให้บริการ</li>
                                    <li>คะแนนและรีวิว</li>
                                    <li>สถานะ Verified (ถ้ามี)</li>
                                </ul>
                                <p>ข้อมูลที่จะไม่เปิดเผย:</p>
                                <ul>
                                    <li>สำเนาบัตรประชาชน</li>
                                    <li>ข้อมูลบัญชีธนาคาร</li>
                                    <li>อีเมลส่วนตัว</li>
                                </ul>

                                <h3>4. สิทธิ์ของเจ้าของข้อมูล</h3>
                                <p>ท่านมีสิทธิ์ในการเข้าถึง แก้ไข ลบ หรือขอสำเนาข้อมูลส่วนบุคคลของท่านได้ รวมถึงการขอยกเลิกการลงทะเบียนร้านค้า</p>

                                <h3>5. การรักษาความปลอดภัย</h3>
                                <p>ข้อมูลที่ละเอียดอ่อน เช่น สำเนาบัตรประชาชน และข้อมูลธนาคาร จะถูกเข้ารหัสและเก็บรักษาอย่างปลอดภัย เฉพาะทีมงานที่ได้รับอนุญาตเท่านั้นที่สามารถเข้าถึงได้</p>

                                <h3>6. การติดต่อ</h3>
                                <p>หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัว สามารถติดต่อได้ที่ rentsafeth@gmail.com</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowPDPA(false)}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Terms Modal */}
            {showTerms && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">เงื่อนไขการใช้งานสำหรับร้านค้า</h2>
                            <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="prose prose-sm max-w-none">
                                <h3>1. คุณสมบัติของผู้สมัคร</h3>
                                <ul>
                                    <li>ต้องเป็นเจ้าของธุรกิจหรือผู้มีอำนาจลงนามแทนนิติบุคคล</li>
                                    <li>ต้องมีเอกสารทางธุรกิจที่ถูกต้องตามกฎหมาย</li>
                                    <li>ต้องให้ข้อมูลที่เป็นความจริงทั้งหมด</li>
                                </ul>

                                <h3>2. การยืนยันตัวตน</h3>
                                <ul>
                                    <li>ร้านค้าต้องผ่านการตรวจสอบเอกสารก่อนเปิดใช้งาน</li>
                                    <li>ทีมงานจะตรวจสอบภายใน 1-3 วันทำการ</li>
                                    <li>หากเอกสารไม่ครบหรือไม่ถูกต้อง อาจถูกปฏิเสธการสมัคร</li>
                                </ul>

                                <h3>3. ข้อห้ามและข้อจำกัด</h3>
                                <ul>
                                    <li>ห้ามใช้ข้อมูลเท็จในการลงทะเบียน</li>
                                    <li>ห้ามโพสต์เนื้อหาที่ไม่เหมาะสมหรือผิดกฎหมาย</li>
                                    <li>ห้ามกระทำการใดๆ ที่สร้างความเสียหายต่อผู้ใช้อื่น</li>
                                    <li>ห้ามละเมิดลิขสิทธิ์หรือทรัพย์สินทางปัญญา</li>
                                </ul>

                                <h3>4. การระงับหรือยกเลิกบัญชี</h3>
                                <p>RentSafe ขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีร้านค้าในกรณีดังต่อไปนี้:</p>
                                <ul>
                                    <li>พบว่าให้ข้อมูลเท็จ</li>
                                    <li>มีรายงานการฉ้อโกงจากผู้ใช้หลายราย</li>
                                    <li>ละเมิดเงื่อนไขการใช้งาน</li>
                                    <li>ไม่มีการเคลื่อนไหวเป็นเวลานานกว่า 1 ปี</li>
                                </ul>

                                <h3>5. ความรับผิดชอบ</h3>
                                <ul>
                                    <li>ร้านค้าต้องรับผิดชอบต่อข้อมูลและเนื้อหาที่โพสต์</li>
                                    <li>ร้านค้าต้องรับผิดชอบต่อการให้บริการกับลูกค้า</li>
                                    <li>RentSafe เป็นเพียงตัวกลางในการเชื่อมต่อ ไม่รับผิดชอบต่อข้อพิพาทระหว่างร้านค้าและลูกค้า</li>
                                </ul>

                                <h3>6. การเปลี่ยนแปลงเงื่อนไข</h3>
                                <p>RentSafe ขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขการใช้งานได้ตลอดเวลา โดยจะแจ้งให้ทราบล่วงหน้าผ่านทางอีเมล</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowTerms(false)}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
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
