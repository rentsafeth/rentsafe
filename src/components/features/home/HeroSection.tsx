'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShieldAlert, Car, ShieldCheck } from 'lucide-react'

interface HeroSectionProps {
    stats?: {
        shops: number
        users: number
        reports: number
    }
}

// All Thai provinces
const ALL_PROVINCES = [
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

export default function HeroSection({ stats }: HeroSectionProps) {
    const t = useTranslations('HomePage')
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'blacklist' | 'rental'>('rental')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProvince, setSelectedProvince] = useState('')
    const [rentalSearchQuery, setRentalSearchQuery] = useState('')

    const handleSearch = () => {
        if (activeTab === 'blacklist' && searchQuery) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=blacklist`)
        } else if (activeTab === 'rental') {
            // Build query params
            const params = new URLSearchParams()
            params.set('type', 'rental')
            if (rentalSearchQuery) params.set('q', rentalSearchQuery)
            if (selectedProvince) params.set('province', selectedProvince)

            if (rentalSearchQuery || selectedProvince) {
                router.push(`/search?${params.toString()}`)
            }
        }
    }

    return (
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 md:py-24 lg:py-32 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Hero Text */}
                <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                        <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-blue-300 text-sm font-medium">{t('whyRentSafeDesc')}</span>
                    </div>

                    <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        <span className="block md:inline">ตรวจสอบประวัติร้านเช่ารถและรายงานการโกง</span>
                        <span className="block md:inline"> เพื่อความปลอดภัยของคุณ</span>
                    </p>
                </div>

                {/* Search Card */}
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8">
                        {/* Tabs */}
                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={() => setActiveTab('blacklist')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold transition-all duration-300 ${activeTab === 'blacklist'
                                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30 scale-[1.02]'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <ShieldAlert className="w-5 h-5" />
                                <span className="hidden sm:inline">{t('checkBlacklist')}</span>
                                <span className="sm:hidden">{t('checkBlacklist').split(' ')[0]}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('rental')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold transition-all duration-300 ${activeTab === 'rental'
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Car className="w-5 h-5" />
                                <span className="hidden sm:inline">{t('findRental')}</span>
                                <span className="sm:hidden">{t('findRental').split(' ')[0]}</span>
                            </button>
                        </div>

                        {/* Search Form - Blacklist */}
                        <div className={`space-y-4 ${activeTab === 'blacklist' ? '' : 'hidden'}`}>
                            <div className="relative group">
                                <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-xl bg-red-500/20"></div>
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                                <input
                                    id="blacklist-search"
                                    name="blacklist-search"
                                    type="text"
                                    inputMode="text"
                                    autoComplete="off"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    enterKeyHint="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('searchPlaceholder')}
                                    className="w-full pl-12 pr-4 py-4 text-base md:text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 transition-all bg-white"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 text-base md:text-lg"
                            >
                                {t('checkBlacklist')}
                            </button>
                        </div>

                        {/* Search Form - Rental */}
                        <div className={`space-y-4 ${activeTab === 'rental' ? '' : 'hidden'}`}>
                            <div className="relative group">
                                <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-xl bg-blue-500/20"></div>
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                                <input
                                    id="rental-search"
                                    name="rental-search"
                                    type="text"
                                    inputMode="text"
                                    autoComplete="off"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    enterKeyHint="search"
                                    value={rentalSearchQuery}
                                    onChange={(e) => setRentalSearchQuery(e.target.value)}
                                    placeholder="พิมพ์ชื่อร้านรถเช่า..."
                                    className="w-full pl-12 pr-4 py-4 text-base md:text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 transition-all bg-white"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            {/* Province dropdown */}
                            <select
                                id="home-province-select"
                                name="home-province-select"
                                value={selectedProvince}
                                onChange={(e) => setSelectedProvince(e.target.value)}
                                className="w-full px-4 py-4 text-base md:text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all appearance-none bg-white cursor-pointer"
                            >
                                <option value="">เลือกจังหวัด (ไม่บังคับ)</option>
                                {ALL_PROVINCES.map((province) => (
                                    <option key={province} value={province}>
                                        {province}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleSearch}
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 text-base md:text-lg"
                            >
                                {t('findRental')}
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-xl md:text-2xl font-bold text-gray-900">
                                    {stats?.shops?.toLocaleString() || '0'}
                                </div>
                                <div className="text-xs md:text-sm text-gray-500">{t('statsShops')}</div>
                            </div>
                            <div>
                                <div className="text-xl md:text-2xl font-bold text-gray-900">
                                    {stats?.users?.toLocaleString() || '0'}
                                </div>
                                <div className="text-xs md:text-sm text-gray-500">{t('statsUsers')}</div>
                            </div>
                            <div>
                                <div className="text-xl md:text-2xl font-bold text-gray-900">
                                    {stats?.reports?.toLocaleString() || '0'}
                                </div>
                                <div className="text-xs md:text-sm text-gray-500">{t('statsReports')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
