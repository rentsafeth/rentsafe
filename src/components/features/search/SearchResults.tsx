'use client';

import { createClient } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, CheckCircle, MapPin, SearchX, AlertTriangle, CreditCard, Phone, Star, Search, ArrowUpDown, SlidersHorizontal, Zap, Receipt, FileText, Banknote, Wallet, Crown, MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

type SearchResult = {
    type: 'shop' | 'blacklist';
    data: any;
    adScore?: number;
    isBoosted?: boolean;
    isPPC?: boolean;
    impressionId?: string;
    isVerifiedPro?: boolean; // ร้านรับรอง (มี subscription active)
};

type SortOption = 'rating' | 'reviews' | 'name' | 'newest';

const severityColors: Record<string, string> = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    high: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-red-600 text-white border-red-700',
};

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
];

export default function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'blacklist'; // 'blacklist' or 'rental'
    const province = searchParams.get('province');
    const t = useTranslations('SearchPage');

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>('rating');

    // Search form state
    const [searchQuery, setSearchQuery] = useState(query || '');
    const [selectedProvince, setSelectedProvince] = useState(province || '');
    const [searchType, setSearchType] = useState<'blacklist' | 'rental'>(type as 'blacklist' | 'rental');

    // Filter state
    const [filterTaxInvoice, setFilterTaxInvoice] = useState(false);
    const [filterWithholdingTax, setFilterWithholdingTax] = useState(false);
    const [filterPayOnPickup, setFilterPayOnPickup] = useState(false);
    const [filterCreditCard, setFilterCreditCard] = useState(false);

    const supabase = createClient();

    // Handle search form submission
    const handleSearch = () => {
        const params = new URLSearchParams();
        params.set('type', searchType);
        if (searchQuery) params.set('q', searchQuery);
        if (selectedProvince && searchType === 'rental') params.set('province', selectedProvince);

        if (searchQuery || (searchType === 'rental' && selectedProvince)) {
            router.push(`/search?${params.toString()}`);
        }
    };

    // Sort results - boosted/PPC shops first, then by selected sort
    const sortResults = (results: SearchResult[]): SearchResult[] => {
        if (type !== 'rental') return results;

        return [...results].sort((a, b) => {
            // First priority: Ad score (boosted/PPC shops)
            const aScore = a.adScore || 0;
            const bScore = b.adScore || 0;
            if (aScore !== bScore) {
                return bScore - aScore;
            }

            // Second priority: User selected sort
            switch (sortBy) {
                case 'rating':
                    return (b.data.rating_average || 0) - (a.data.rating_average || 0);
                case 'reviews':
                    return (b.data.review_count || 0) - (a.data.review_count || 0);
                case 'name':
                    return (a.data.name || '').localeCompare(b.data.name || '', 'th');
                case 'newest':
                    return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime();
                default:
                    return 0;
            }
        });
    };

    // Record impressions when results are displayed
    const recordImpressions = async (shopResults: SearchResult[]) => {
        const shopIds = shopResults
            .filter(r => r.type === 'shop')
            .map(r => r.data.id);

        if (shopIds.length === 0) return;

        try {
            const response = await fetch('/api/ads/impression', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shop_ids: shopIds,
                    source: 'search',
                    search_query: query,
                    province: province
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Store impression IDs for click tracking
                if (data.impression_ids) {
                    setResults(prev => prev.map(r => {
                        if (r.type === 'shop' && data.impression_ids[r.data.id]) {
                            return { ...r, impressionId: data.impression_ids[r.data.id] };
                        }
                        return r;
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to record impressions:', error);
        }
    };

    // Record click when user clicks on shop
    const handleShopClick = async (result: SearchResult) => {
        if (result.type !== 'shop') return;

        try {
            await fetch('/api/ads/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shop_id: result.data.id,
                    impression_id: result.impressionId,
                    source: 'search'
                })
            });
        } catch (error) {
            console.error('Failed to record click:', error);
        }
    };

    useEffect(() => {
        async function fetchResults() {
            setLoading(true);
            setResults([]);

            try {
                if (type === 'rental') {
                    // Search for Rental Shops - support both text query and province filter
                    let shopQuery = supabase
                        .from('shops')
                        .select('*')
                        .eq('verification_status', 'verified')
                        .eq('is_active', true);

                    // Filter by province if provided
                    if (province) {
                        shopQuery = shopQuery.contains('service_provinces', [province]);
                    }

                    // Filter by text query if provided (search by shop name)
                    if (query) {
                        shopQuery = shopQuery.ilike('name', `%${query}%`);
                    }

                    const { data: shops } = await shopQuery;

                    if (shops) {
                        // Get ad settings for all shops
                        const shopIds = shops.map(s => s.id);
                        const { data: adSettings } = await supabase
                            .from('shop_ad_settings')
                            .select('*')
                            .in('shop_id', shopIds);

                        // Get subscription status for all shops (ร้านรับรอง)
                        const { data: subscriptions } = await supabase
                            .from('shop_subscriptions')
                            .select('shop_id, status, ends_at')
                            .in('shop_id', shopIds)
                            .eq('status', 'active');

                        const adSettingsMap: Record<string, any> = {};
                        adSettings?.forEach(s => {
                            adSettingsMap[s.shop_id] = s;
                        });

                        // Create a set of verified pro shops (active subscription)
                        const verifiedProShops = new Set<string>();
                        subscriptions?.forEach(s => {
                            if (s.status === 'active' && new Date(s.ends_at) > new Date()) {
                                verifiedProShops.add(s.shop_id);
                            }
                        });

                        // Map shops with ad info
                        const shopResults = shops.map(shop => {
                            const settings = adSettingsMap[shop.id];
                            let adScore = 0;
                            let isBoosted = false;
                            let isPPC = false;
                            const isVerifiedPro = verifiedProShops.has(shop.id);

                            // ร้านรับรอง gets priority in sorting
                            if (isVerifiedPro) {
                                adScore += 300;
                            }

                            if (settings) {
                                // Check boost
                                if (settings.boost_active && settings.boost_expires_at &&
                                    new Date(settings.boost_expires_at) > new Date()) {
                                    adScore += 500;
                                    isBoosted = true;
                                }
                                // Check PPC
                                if (settings.ppc_enabled) {
                                    adScore += settings.ppc_bid * 10;
                                    isPPC = true;
                                }
                            }

                            return {
                                type: 'shop' as const,
                                data: shop,
                                adScore,
                                isBoosted,
                                isPPC,
                                isVerifiedPro
                            };
                        });

                        setResults(shopResults);

                        // Record impressions after a short delay
                        setTimeout(() => recordImpressions(shopResults), 500);
                    }

                } else if (query) {
                    // Search for Blacklist entries first
                    const { data: blacklistEntries } = await supabase
                        .from('blacklist_entries')
                        .select('*')
                        .or(`bank_account_no.ilike.%${query}%,shop_names.cs.{${query}}`)
                        .order('total_reports', { ascending: false });

                    // Also search by phone in arrays
                    const { data: blacklistByPhone } = await supabase
                        .from('blacklist_entries')
                        .select('*')
                        .contains('phone_numbers', [query]);

                    // Search in Shops (registered shops) - but only with reports
                    const { data: shops } = await supabase
                        .from('shops')
                        .select('*')
                        .or(`name.ilike.%${query}%,bank_account_no.ilike.%${query}%,phone_number.ilike.%${query}%`)
                        .gt('report_count', 0);

                    const combinedResults: SearchResult[] = [];
                    const seenIds = new Set<string>();

                    // Add blacklist entries
                    if (blacklistEntries) {
                        blacklistEntries.forEach(entry => {
                            if (!seenIds.has(entry.id)) {
                                seenIds.add(entry.id);
                                combinedResults.push({ type: 'blacklist', data: entry });
                            }
                        });
                    }

                    if (blacklistByPhone) {
                        blacklistByPhone.forEach(entry => {
                            if (!seenIds.has(entry.id)) {
                                seenIds.add(entry.id);
                                combinedResults.push({ type: 'blacklist', data: entry });
                            }
                        });
                    }

                    // Add shops with reports
                    if (shops) {
                        shops.forEach(shop => combinedResults.push({ type: 'shop', data: shop }));
                    }

                    setResults(combinedResults);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        if (query || (type === 'rental' && (province || query))) {
            fetchResults();
        } else if (type === 'rental') {
            // For rental type without filters, show all verified shops
            fetchResults();
        } else {
            setLoading(false);
        }
    }, [query, type, province, supabase]);

    // Update form state when URL params change
    useEffect(() => {
        setSearchQuery(query || '');
        setSelectedProvince(province || '');
        setSearchType(type as 'blacklist' | 'rental');
    }, [query, province, type]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Filter results based on filters
    const filteredResults = results.filter(r => {
        if (type !== 'rental' || r.type !== 'shop') return true;

        // Apply filters
        if (filterTaxInvoice && !r.data.can_issue_tax_invoice) return false;
        if (filterWithholdingTax && !r.data.can_issue_withholding_tax) return false;
        if (filterPayOnPickup && !r.data.pay_on_pickup) return false;
        if (filterCreditCard && !r.data.accept_credit_card) return false;

        return true;
    });

    const sortedResults = sortResults(filteredResults);

    // Search form component
    const SearchForm = () => (
        <Card className="mb-6">
            <CardContent className="pt-6">
                {/* Search Type Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setSearchType('blacklist')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                            searchType === 'blacklist'
                                ? 'bg-red-50 text-red-600 border-2 border-red-200'
                                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                        }`}
                    >
                        <ShieldAlert className="w-4 h-4 inline mr-2" />
                        ตรวจสอบ Blacklist
                    </button>
                    <button
                        onClick={() => setSearchType('rental')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                            searchType === 'rental'
                                ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                        }`}
                    >
                        <Star className="w-4 h-4 inline mr-2" />
                        ค้นหารถเช่า
                    </button>
                </div>

                {/* Search Input */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={searchType === 'blacklist' ? 'พิมพ์เลขบัญชี, เบอร์โทร, หรือชื่อร้าน...' : 'พิมพ์ชื่อร้านรถเช่า...'}
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                                searchType === 'blacklist'
                                    ? 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                            }`}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    {/* Province Dropdown - only for rental */}
                    {searchType === 'rental' && (
                        <select
                            value={selectedProvince}
                            onChange={(e) => setSelectedProvince(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none bg-white cursor-pointer"
                        >
                            <option value="">เลือกจังหวัด (ไม่บังคับ)</option>
                            {ALL_PROVINCES.map((prov) => (
                                <option key={prov} value={prov}>
                                    {prov}
                                </option>
                            ))}
                        </select>
                    )}

                    <Button
                        onClick={handleSearch}
                        className={`w-full py-3 font-semibold ${
                            searchType === 'blacklist'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        <Search className="w-4 h-4 mr-2" />
                        ค้นหา
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <>
                <SearchForm />
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
            </>
        );
    }

    if (results.length === 0) {
        return (
            <>
                <SearchForm />
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                    <SearchX className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">{t('noResults')}</h3>
                    <p className="text-slate-500">{t('tryDifferent')}</p>
                </div>
            </>
        );
    }

    return (
        <div className="space-y-6">
            <SearchForm />

            {/* Results Header with Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold">
                    {t('resultsCount', { count: sortedResults.length })}
                    {(filterTaxInvoice || filterWithholdingTax || filterPayOnPickup || filterCreditCard) && sortedResults.length !== results.length && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            (กรองจาก {results.length} รายการ)
                        </span>
                    )}
                </h2>

                {/* Sort Controls - only for rental type */}
                {type === 'rental' && results.length > 1 && (
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">เรียงตาม:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
                        >
                            <option value="rating">คะแนนสูงสุด</option>
                            <option value="reviews">รีวิวมากสุด</option>
                            <option value="name">ชื่อ ก-ฮ</option>
                            <option value="newest">ใหม่ล่าสุด</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Filters - only for rental type */}
            {type === 'rental' && (
                <div className="flex flex-wrap gap-3">
                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                        filterPayOnPickup
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                        <input
                            type="checkbox"
                            checked={filterPayOnPickup}
                            onChange={(e) => setFilterPayOnPickup(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <Banknote className="w-4 h-4" />
                        <span className="text-sm font-medium">ชำระตอนรับรถ</span>
                    </label>
                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                        filterCreditCard
                            ? 'bg-violet-50 border-violet-300 text-violet-700'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                        <input
                            type="checkbox"
                            checked={filterCreditCard}
                            onChange={(e) => setFilterCreditCard(e.target.checked)}
                            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                        />
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-medium">รับบัตรเครดิต</span>
                    </label>
                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                        filterTaxInvoice
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                        <input
                            type="checkbox"
                            checked={filterTaxInvoice}
                            onChange={(e) => setFilterTaxInvoice(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Receipt className="w-4 h-4" />
                        <span className="text-sm font-medium">ออกใบกำกับภาษีได้</span>
                    </label>
                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                        filterWithholdingTax
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                        <input
                            type="checkbox"
                            checked={filterWithholdingTax}
                            onChange={(e) => setFilterWithholdingTax(e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">ออกหัก ณ ที่จ่ายได้</span>
                    </label>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {sortedResults.map((result, index) => (
                    <Card key={index} className={`border-l-4 ${result.type === 'blacklist' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {result.type === 'shop' ? (
                                            <>
                                                {result.isVerifiedPro && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-sm">
                                                                    <Crown className="w-3 h-3 mr-1" /> ร้านรับรอง
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>ร้านนี้ผ่านการตรวจสอบและรับประกันมัดจำ ฿1,000</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                                {result.isBoosted && (
                                                    <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200">
                                                        <Zap className="w-3 h-3 mr-1" /> แนะนำ
                                                    </Badge>
                                                )}
                                                {result.isPPC && !result.isBoosted && (
                                                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 border-indigo-200">
                                                        <Zap className="w-3 h-3 mr-1" /> แนะนำ
                                                    </Badge>
                                                )}
                                                {!result.isVerifiedPro && (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> {t('verifiedShop')}
                                                    </Badge>
                                                )}
                                                {result.data.report_count > 0 && (
                                                    <Badge className="bg-red-100 text-red-700 border-red-200">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        {t('hasReports', { count: result.data.report_count })}
                                                    </Badge>
                                                )}
                                                {result.data.can_issue_tax_invoice && (
                                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                                        <Receipt className="w-3 h-3 mr-1" /> ออกใบกำกับภาษีได้
                                                    </Badge>
                                                )}
                                                {result.data.can_issue_withholding_tax && (
                                                    <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                                                        <FileText className="w-3 h-3 mr-1" /> ออกหัก ณ ที่จ่ายได้
                                                    </Badge>
                                                )}
                                                {result.data.pay_on_pickup && (
                                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        <Banknote className="w-3 h-3 mr-1" /> ชำระตอนรับรถ
                                                    </Badge>
                                                )}
                                                {result.data.accept_credit_card && (
                                                    <Badge className="bg-violet-50 text-violet-700 border-violet-200">
                                                        <CreditCard className="w-3 h-3 mr-1" /> รับบัตรเครดิต
                                                    </Badge>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Badge className={`${severityColors[result.data.severity]} border`}>
                                                    <ShieldAlert className="w-3 h-3 mr-1" />
                                                    {t(`severity.${result.data.severity}`)}
                                                </Badge>
                                                <Badge variant="outline" className="text-slate-600">
                                                    {t('reportsCount', { count: result.data.total_reports })}
                                                </Badge>
                                            </>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                        {result.type === 'shop' ? result.data.name : result.data.shop_names?.[0] || t('unknownShop')}
                                    </h3>

                                    {result.type === 'shop' && (
                                        <div className="text-slate-600 space-y-1">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <p className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {result.data.service_provinces?.join(', ') || '-'}
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    {result.data.rating_average?.toFixed(1) || '0.0'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {result.type === 'blacklist' && (
                                        <div className="text-slate-600 space-y-2">
                                            <div className="flex items-center gap-4 flex-wrap text-sm">
                                                {result.data.bank_account_no && (
                                                    <p className="flex items-center gap-1">
                                                        <CreditCard className="w-4 h-4" />
                                                        <span className="font-mono">{result.data.bank_account_no}</span>
                                                    </p>
                                                )}
                                                {result.data.phone_numbers?.[0] && (
                                                    <p className="flex items-center gap-1">
                                                        <Phone className="w-4 h-4" />
                                                        {result.data.phone_numbers[0]}
                                                    </p>
                                                )}
                                            </div>
                                            {result.data.total_amount_lost > 0 && (
                                                <p className="text-red-600 font-medium">
                                                    {t('totalLoss')}: {formatMoney(result.data.total_amount_lost)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="ml-4 flex flex-col gap-2">
                                    {result.type === 'shop' ? (
                                        <>
                                            {/* Contact buttons for ร้านรับรอง (Pro shops) */}
                                            {result.isVerifiedPro && (
                                                <div className="flex gap-2">
                                                    {result.data.phone_number && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <a
                                                                        href={`tel:${result.data.phone_number}`}
                                                                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                                        onClick={() => handleShopClick(result)}
                                                                    >
                                                                        <Phone className="w-4 h-4" />
                                                                    </a>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>โทร {result.data.phone_number}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {result.data.line_id && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <a
                                                                        href={result.data.line_id.startsWith('@')
                                                                            ? `https://line.me/R/ti/p/${result.data.line_id}`
                                                                            : `https://line.me/R/ti/p/~${result.data.line_id}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#06C755]/10 text-[#06C755] hover:bg-[#06C755]/20 transition-colors"
                                                                        onClick={() => handleShopClick(result)}
                                                                    >
                                                                        <MessageCircle className="w-4 h-4" />
                                                                    </a>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>LINE: {result.data.line_id}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            )}
                                            <Link
                                                href={`/shop/${result.data.id}`}
                                                onClick={() => handleShopClick(result)}
                                            >
                                                <Button variant="outline">{t('viewShop')}</Button>
                                            </Link>
                                        </>
                                    ) : (
                                        <Link href={`/blacklist/${result.data.id}`}>
                                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                {t('viewDetails')}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
