'use client';

import { createClient } from '@/lib/supabase/client';
import { useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Loader2, ShieldAlert, CheckCircle, MapPin, SearchX, AlertTriangle,
    CreditCard, Phone, Star, Search, SlidersHorizontal, Zap, Receipt,
    FileText, Banknote, Crown, MessageCircle, Heart, Gift, Sparkles,
    ShieldCheck, TrendingUp, Users, AlertCircle, ExternalLink, LayoutGrid, List, Check, Facebook
} from 'lucide-react';


import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SearchResult = {
    type: 'shop' | 'blacklist';
    data: any;
    adScore?: number;
    isBoosted?: boolean;
    isPPC?: boolean;
    impressionId?: string;
    isVerifiedPro?: boolean;
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

    const params = useParams();
    const locale = params.locale as string;
    const isThai = locale === 'th';
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'blacklist';
    const province = searchParams.get('province');
    const t = useTranslations('SearchPage');
    const tHome = useTranslations('HomePage');

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>('rating');

    // Search form state
    const [searchQuery, setSearchQuery] = useState(query || '');
    const [selectedProvince, setSelectedProvince] = useState(province || '');
    const [searchType, setSearchType] = useState<'blacklist' | 'rental'>(type as 'blacklist' | 'rental');

    // Filter state
    // Filter state
    const [filterVerifiedPro, setFilterVerifiedPro] = useState(false);
    const [filterTaxInvoice, setFilterTaxInvoice] = useState(false);
    const [filterWithholdingTax, setFilterWithholdingTax] = useState(false);
    const [filterPayOnPickup, setFilterPayOnPickup] = useState(false);
    const [filterCreditCard, setFilterCreditCard] = useState(false);

    // Track if this is initial load from URL params
    const [hasSearched, setHasSearched] = useState(false);

    // View mode: list (compact) or grid (full card)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const supabase = createClient();

    // Handle search form submission
    // Handle search form submission
    const handleSearch = () => {
        if (searchType === 'blacklist' && !searchQuery.trim()) {
            return;
        }

        // Rental search validation: must have query OR province
        if (searchType === 'rental' && !searchQuery.trim() && !selectedProvince) {
            return;
        }

        const params = new URLSearchParams();
        params.set('type', searchType);
        if (searchQuery) params.set('q', searchQuery);
        if (selectedProvince && searchType === 'rental') params.set('province', selectedProvince);

        window.history.replaceState({}, '', `/search?${params.toString()}`);
        fetchResults(searchType, searchQuery, selectedProvince);
    };

    // Clear results when switching tabs
    const handleTabChange = (type: 'blacklist' | 'rental') => {
        if (type !== searchType) {
            setSearchType(type);
            setResults([]); // Clear results immediately
            setHasSearched(false); // Reset search state
            setSearchQuery(''); // Optional: clear query too if desired, but maybe keep it
            // If we want to keep query, we can, but results must be cleared.
        }
    };

    // Sort results
    const sortResults = (results: SearchResult[]): SearchResult[] => {
        if (searchType !== 'rental') return results;

        return [...results].sort((a, b) => {
            const aScore = a.adScore || 0;
            const bScore = b.adScore || 0;
            if (aScore !== bScore) {
                return bScore - aScore;
            }

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

    // Record impressions
    const recordImpressions = async (shopResults: SearchResult[]) => {
        const shopIds = shopResults.filter(r => r.type === 'shop').map(r => r.data.id);
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

    // Record click
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

    const fetchResults = async (type: 'blacklist' | 'rental', q: string, prov: string) => {
        setLoading(true);
        setResults([]);
        setHasSearched(true);

        try {
            if (type === 'rental') {
                // RENTAL SEARCH LOGIC: Only verified shops
                let shopQuery = supabase
                    .from('shops')
                    .select('*')
                    .eq('verification_status', 'verified')
                    .eq('is_active', true);

                if (prov) {
                    shopQuery = shopQuery.contains('service_provinces', [prov]);
                }

                if (q) {
                    shopQuery = shopQuery.ilike('name', `%${q}%`);
                }

                const { data: shops } = await shopQuery;

                if (shops) {
                    const shopIds = shops.map(s => s.id);
                    const { data: adSettings } = await supabase
                        .from('shop_ad_settings')
                        .select('*')
                        .in('shop_id', shopIds);

                    const { data: subscriptions } = await supabase
                        .from('shop_subscriptions')
                        .select('shop_id, status, ends_at')
                        .in('shop_id', shopIds)
                        .eq('status', 'active');

                    const adSettingsMap: Record<string, any> = {};
                    adSettings?.forEach(s => { adSettingsMap[s.shop_id] = s; });

                    const verifiedProShops = new Set<string>();
                    subscriptions?.forEach(s => {
                        if (s.status === 'active' && new Date(s.ends_at) > new Date()) {
                            verifiedProShops.add(s.shop_id);
                        }
                    });

                    const shopResults = shops.map(shop => {
                        const settings = adSettingsMap[shop.id];
                        let adScore = 0;
                        let isBoosted = false;
                        let isPPC = false;
                        const isVerifiedPro = verifiedProShops.has(shop.id);

                        if (isVerifiedPro) adScore += 300;

                        if (settings) {
                            if (settings.boost_active && settings.boost_expires_at &&
                                new Date(settings.boost_expires_at) > new Date()) {
                                adScore += 500;
                                isBoosted = true;
                            }
                            if (settings.ppc_enabled) {
                                adScore += settings.ppc_bid * 10;
                                isPPC = true;
                            }
                        }

                        return { type: 'shop' as const, data: shop, adScore, isBoosted, isPPC, isVerifiedPro };
                    });

                    setResults(shopResults);
                    setTimeout(() => recordImpressions(shopResults), 500);
                }

            } else {
                // BLACKLIST SEARCH LOGIC: Only suspicious entries and reported shops
                if (!q) {
                    setResults([]);
                    return;
                }

                // Search in shop_names array using textSearch (case-insensitive, partial match)
                // Use RPC for search to support partial matches in arrays (shop_names, etc.)
                const { data: blacklistEntries, error } = await supabase
                    .rpc('search_blacklist', { keyword: q });

                if (error) {
                    console.error('Search error:', error);
                    // Fallback using simple text search if RPC fails/doesn't exist
                    const { data: fallbackData } = await supabase
                        .from('blacklist_entries')
                        .select('*')
                        .or(`bank_account_no.ilike.%${q}%`) // Only bank account reliable without RPC
                        .order('total_reports', { ascending: false });

                    if (fallbackData) {
                        // Combine manually if needed or just use fallback
                        // For now, let's just use what we can get via simpler query
                        const combinedResults: SearchResult[] = [];
                        fallbackData.forEach(entry => combinedResults.push({ type: 'blacklist', data: entry }));
                        setResults(combinedResults);
                        return;
                    }
                }

                // Find shops matching query (Verified shops included)
                const { data: shops } = await supabase
                    .from('shops')
                    .select('*')
                    .or(`name.ilike.%${q}%,bank_account_no.ilike.%${q}%,phone_number.ilike.%${q}%`);
                // Removed .gt('report_count', 0) to include good shops too

                const combinedResults: SearchResult[] = [];
                const seenIds = new Set<string>();

                // 1. Priority: Verified Shops First (To provide safe alternative)
                if (shops) {
                    shops.filter(s => s.verification_status === 'verified').forEach(shop => {
                        if (!seenIds.has(shop.id)) {
                            seenIds.add(shop.id);
                            // Mock isVerifiedPro for now based on status, or fetch properly if needed.
                            // Assuming s.verification_status === 'verified' is enough for search context
                            combinedResults.push({ type: 'shop', data: shop, isVerifiedPro: true });
                        }
                    });
                }

                // 2. Blacklist Entries (The main intent)
                if (blacklistEntries) {
                    (blacklistEntries as any[]).sort((a, b) => b.total_reports - a.total_reports).forEach(entry => {
                        if (!seenIds.has(entry.id)) {
                            seenIds.add(entry.id);
                            combinedResults.push({ type: 'blacklist', data: entry });
                        }
                    });
                }

                // 3. Other Shops (Unverified or Reported)
                if (shops) {
                    shops.filter(s => s.verification_status !== 'verified').forEach(shop => {
                        if (!seenIds.has(shop.id)) {
                            seenIds.add(shop.id);
                            combinedResults.push({ type: 'shop', data: shop, isVerifiedPro: false });
                        }
                    });
                }

                setResults(combinedResults);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Sync state with URL parameters
    useEffect(() => {
        const typeFromUrl = searchParams.get('type') as 'blacklist' | 'rental' || 'blacklist';
        const queryFromUrl = searchParams.get('q') || '';
        const provinceFromUrl = searchParams.get('province') || '';

        setSearchType(typeFromUrl);
        setSearchQuery(queryFromUrl);
        setSelectedProvince(provinceFromUrl);

        if (queryFromUrl || provinceFromUrl) {
            fetchResults(typeFromUrl, queryFromUrl, provinceFromUrl);
        } else {
            setLoading(false);
            setHasSearched(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Filter results
    // Filter results
    const filteredResults = results.filter(r => {
        if (searchType !== 'rental' || r.type !== 'shop') return true;

        // Verified Pro Filter
        if (filterVerifiedPro && !r.isVerifiedPro) return false;

        // Service Filters
        if (filterTaxInvoice && !r.data.can_issue_tax_invoice) return false;
        if (filterWithholdingTax && !r.data.can_issue_withholding_tax) return false;
        if (filterPayOnPickup && !r.data.pay_on_pickup) return false;
        if (filterCreditCard && !r.data.accept_credit_card) return false;

        return true;
    });

    const sortedResults = sortResults(filteredResults);

    // Hero Section Component
    const HeroSection = () => (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white mb-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl"></div>
            </div>

            <div className="relative px-6 py-8 md:py-12">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <ShieldCheck className="w-10 h-10 text-blue-400" />
                        <h1 className="text-3xl md:text-4xl font-bold">
                            {isThai ? 'ปกป้องตัวคุณจากมิจฉาชีพ' : 'Protect Yourself from Fraud'}
                        </h1>
                    </div>
                    <p className="text-blue-200 text-lg mb-6">
                        {isThai
                            ? 'ตรวจสอบร้านรถเช่าก่อนโอนเงิน หรือค้นหาร้านที่น่าเชื่อถือ'
                            : 'Check rental shops before transfer, or find trusted shops'}
                    </p>

                </div>
            </div>
        </div>
    );

    // Search Form Component - Memoized to prevent recreation on every render
    const searchFormElement = useMemo(() => (
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
                {/* Search Type Tabs - Modern Design */}
                {/* Search Type Tabs - Modern Design */}
                <div className="flex gap-2 sm:gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => handleTabChange('blacklist')}
                        className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${searchType === 'blacklist'
                            ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30 scale-[1.02]'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <ShieldAlert className="w-5 h-5" />
                        <span className="hidden sm:inline">{tHome('checkBlacklist')}</span>
                        <span className="sm:hidden text-sm">{tHome('checkBlacklist').split(' ')[0]}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('rental')}
                        className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${searchType === 'rental'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <Star className="w-5 h-5" />
                        <span className="hidden sm:inline">{tHome('findRental')}</span>
                        <span className="sm:hidden text-sm">{tHome('findRental').split(' ')[0]}</span>
                    </button>
                </div>

                {/* Search Input - Modern Design */}
                <div className="space-y-4">
                    <div className="relative group">
                        <div className={`absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-xl ${searchType === 'blacklist' ? 'bg-red-500/20' : 'bg-blue-500/20'
                            }`}></div>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                        <input
                            id="search-query"
                            name="search-query"
                            type="text"
                            inputMode="text"
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={searchType === 'blacklist'
                                ? (isThai ? 'พิมพ์เลขบัญชี, เบอร์โทร, หรือชื่อร้าน...' : 'Enter bank account, phone, or shop name...')
                                : (isThai ? 'พิมพ์ชื่อร้านรถเช่า...' : 'Enter car rental shop name...')}
                            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 transition-all bg-white"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    {/* Province Dropdown - Only for rental */}
                    {searchType === 'rental' && (
                        <select
                            id="province-select"
                            name="province-select"
                            value={selectedProvince}
                            onChange={(e) => setSelectedProvince(e.target.value)}
                            className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all appearance-none bg-white cursor-pointer text-lg"
                        >
                            <option value="">{isThai ? 'เลือกจังหวัด (ไม่บังคับ)' : 'Select Province (Optional)'}</option>
                            {ALL_PROVINCES.map((prov) => (
                                <option key={prov} value={prov}>{prov}</option>
                            ))}
                        </select>
                    )}

                    {/* Quick Search Buttons - Only for rental */}
                    {searchType === 'rental' && (
                        <div className="flex flex-wrap gap-2">
                            {[
                                { name: isThai ? 'กรุงเทพฯ' : 'Bangkok', value: 'กรุงเทพมหานคร' },
                                { name: isThai ? 'เชียงใหม่' : 'Chiang Mai', value: 'เชียงใหม่' },
                                { name: isThai ? 'เชียงราย' : 'Chiang Rai', value: 'เชียงราย' },
                                { name: isThai ? 'ภูเก็ต' : 'Phuket', value: 'ภูเก็ต' },
                            ].map((prov) => (
                                <button
                                    key={prov.value}
                                    type="button"
                                    onClick={() => {
                                        setSelectedProvince(prov.value);
                                        const params = new URLSearchParams();
                                        params.set('type', 'rental');
                                        if (searchQuery) params.set('q', searchQuery);
                                        params.set('province', prov.value);
                                        window.history.replaceState({}, '', `/search?${params.toString()}`);
                                        fetchResults('rental', searchQuery, prov.value);
                                    }}
                                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                >
                                    {prov.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <Button
                        type="button"
                        onClick={handleSearch}
                        disabled={searchType === 'rental' && !searchQuery.trim() && !selectedProvince}
                        className={`w-full py-6 text-lg font-bold rounded-xl transition-all duration-300 ${searchType === 'blacklist'
                            ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/30'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Search className="w-5 h-5 mr-2" />
                        {isThai ? 'ค้นหา' : 'Search'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    ), [searchType, searchQuery, selectedProvince, isThai, tHome]);

    // No Results Component with Report CTA
    const NoResultsView = () => {
        if (searchType === 'blacklist') {
            return (
                <div className="text-center py-16">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800 mb-3">
                        {isThai ? 'ไม่พบข้อมูลในระบบ' : 'No Records Found'}
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        {isThai
                            ? 'ข่าวดี! ไม่พบข้อมูลร้านนี้ใน Blacklist แต่ถ้าคุณเคยโดนโกงจากร้านนี้ ช่วยรายงานเพื่อปกป้องคนอื่น'
                            : 'Good news! No records found in blacklist. But if you were scammed by this shop, please report to protect others.'}
                    </p>

                    {/* Report CTA Card */}
                    <Card className="max-w-lg mx-auto bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="text-left flex-1">
                                    <h4 className="font-bold text-slate-800 mb-2">
                                        {isThai ? 'เคยโดนโกงจากร้านนี้?' : 'Were you scammed by this shop?'}
                                    </h4>
                                    <p className="text-sm text-slate-600 mb-4">
                                        {isThai
                                            ? 'รายงานมิจฉาชีพเพื่อช่วยเหลือคนอื่น และรับเครดิตปลอบใจเมื่อรายงานได้รับการยืนยัน!'
                                            : 'Report the scammer to help others and earn karma credits when your report is verified!'}
                                    </p>
                                    <div className="flex items-center gap-3 mb-4 p-3 bg-white/60 rounded-lg">
                                        <Gift className="w-5 h-5 text-amber-500" />
                                        <div className="text-sm">
                                            <span className="font-semibold text-amber-600">
                                                {isThai ? '+10 เครดิตปลอบใจ' : '+10 Karma Credits'}
                                            </span>
                                            <span className="text-slate-500">
                                                {isThai ? ' เมื่อรายงานได้รับการยืนยัน' : ' when report is verified'}
                                            </span>
                                        </div>
                                    </div>
                                    <Link href={`/report${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}>
                                        <Button className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/30">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            {isThai ? 'รายงานมิจฉาชีพ' : 'Report Scammer'}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Karma Info Banner */}
                    <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 max-w-lg mx-auto">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-purple-500" />
                            <div className="text-left">
                                <p className="text-sm font-medium text-purple-800">
                                    {isThai ? 'ระบบเครดิตปลอบใจ' : 'Karma Credit System'}
                                </p>
                                <p className="text-xs text-purple-600">
                                    {isThai
                                        ? 'สะสมเครดิตปลอบใจ เพื่อรับสิทธิพิเศษเร็วๆ นี้!'
                                        : 'Collect karma credits for special rewards coming soon!'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Rental Search No Results
        return (
            <div className="text-center py-16">
                <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl"></div>
                    <div className="relative w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <SearchX className="w-12 h-12 text-slate-400" />
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                    {isThai ? 'ไม่พบร้านรถเช่า' : 'No Rental Shops Found'}
                </h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                    {isThai
                        ? 'ไม่พบร้านรถเช่าที่ตรงกับการค้นหาของคุณ ลองเปลี่ยนคำค้นหาหรือเลือกจังหวัดอื่น'
                        : 'No rental shops found matching your search. Try changing the keyword or selecting another province.'}
                </p>

                <Button
                    variant="outline"
                    className="rounded-xl px-8"
                    onClick={() => {
                        setSearchQuery('');
                        setSelectedProvince('');
                        setResults([]);
                        setHasSearched(false);
                    }}
                >
                    {isThai ? 'ล้างการค้นหา' : 'Clear Search'}
                </Button>
            </div>
        );
    };

    // Helper for risk status (Copied from BlacklistDetail)
    const getRiskStatus = (entry: any, isThai: boolean) => {
        const lastReport = new Date(entry.last_reported_at || entry.first_reported_at || new Date());
        const now = new Date();
        const daysSinceLastReport = (now.getTime() - lastReport.getTime()) / (1000 * 3600 * 24);

        // Trend: Recent activity (< 30 days)
        if (daysSinceLastReport < 30) {
            return {
                label: isThai ? '🔥 กำลังระบาด' : '🔥 Active Threat',
                className: 'bg-red-600 text-white border-red-700 animate-pulse shadow-md'
            };
        }

        // Impact: High Impact (Reports > 5 or Loss > 50,000)
        if (entry.total_reports > 5 || entry.total_amount_lost > 50000) {
            return {
                label: isThai ? '🚨 เสียหายหนัก' : '🚨 High Risk',
                className: 'bg-red-100 text-red-800 border-red-200'
            };
        }

        // Default: Caution
        return {
            label: isThai ? '⚠️ เฝ้าระวัง' : '⚠️ Caution',
            className: 'bg-orange-100 text-orange-800 border-orange-200'
        };
    };

    // Blacklist Result Card
    const BlacklistCard = ({ result }: { result: SearchResult }) => {
        const status = getRiskStatus(result.data, isThai);

        return (
            <Card className="group overflow-hidden border-l-4 border-l-red-500 hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-red-50/30">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                            {/* Header with badges */}
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <Badge className={`${status.className} border px-3 py-1`}>
                                    {status.label}
                                </Badge>
                                <Badge variant="outline" className="text-slate-600 border-slate-300">
                                    <Users className="w-3 h-3 mr-1" />
                                    {t('reportsCount', { count: result.data.total_reports })}
                                </Badge>
                                {result.data.heart_count > 0 && (
                                    <Badge variant="outline" className="text-pink-600 border-pink-200 bg-pink-50">
                                        <Heart className="w-3 h-3 mr-1 fill-pink-500" />
                                        {result.data.heart_count}
                                    </Badge>
                                )}
                            </div>

                            {/* Shop Name(s) */}
                            <div className="mb-3">
                                <h3 className="text-xl font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                                    {result.data.shop_names?.[0] || t('unknownShop')}
                                </h3>
                                {/* Show additional shop names/aliases if any */}
                                {result.data.shop_names && result.data.shop_names.length > 1 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="text-xs text-slate-500 flex items-center">{isThai ? 'ชื่ออื่นๆ:' : 'Aliases:'}</span>
                                        {result.data.shop_names.slice(1).map((name: string, idx: number) => (
                                            <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 text-xs font-normal border-slate-200">
                                                {name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-sm">
                                {result.data.bank_account_no && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="font-mono font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded">
                                            {result.data.bank_account_no}
                                        </span>
                                    </div>
                                )}

                                {/* Phone Numbers */}
                                {result.data.phone_numbers && result.data.phone_numbers.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                        {result.data.phone_numbers.map((phone: string, idx: number) => (
                                            <div key={`phone-${idx}`} className="flex items-center gap-2 text-slate-600">
                                                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="font-medium">{phone}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Line IDs */}
                                {result.data.line_ids && result.data.line_ids.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                        {result.data.line_ids.map((line: string, idx: number) => (
                                            <div key={`line-${idx}`} className="flex items-center gap-2 text-slate-600">
                                                <MessageCircle className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="font-medium text-green-700">{line}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Facebook URLs */}
                                {result.data.facebook_urls && result.data.facebook_urls.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                        {result.data.facebook_urls.map((url: string, idx: number) => (
                                            <div key={`fb-${idx}`} className="flex items-center gap-2 text-slate-600">
                                                <Facebook className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="font-medium text-blue-700 truncate max-w-[200px]" title={url}>
                                                    {url.replace(/^https?:\/\/(www\.)?facebook\.com\//, '')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {result.data.total_amount_lost > 0 && (
                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                        <span className="text-red-600 font-semibold">
                                            {t('totalLoss')}: {formatMoney(result.data.total_amount_lost)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex flex-col gap-2">
                            <Link href={`/blacklist/${result.data.id}`}>
                                <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-md">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    {t('viewDetails')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Shop Result Card
    const ShopCard = ({ result }: { result: SearchResult }) => {
        // Helper to extract clean URL for display
        const displayFacebook = result.data.facebook_url?.replace(/^https?:\/\/(www\.)?facebook\.com\//, '') || '';

        return (
            <Card className={`group overflow-hidden hover:shadow-xl transition-all duration-300 ${result.isVerifiedPro
                ? 'border-l-4 border-l-yellow-500 bg-gradient-to-r from-white to-yellow-50/30'
                : 'border-l-4 border-l-green-500 bg-gradient-to-r from-white to-green-50/30'
                }`}>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                            {/* Badges */}
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                {result.isVerifiedPro && (
                                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-sm px-3 py-1">
                                        <Crown className="w-3 h-3 mr-1" />
                                        {isThai ? 'ร้านรับรอง' : 'Verified Shop'}
                                    </Badge>
                                )}
                                {result.isBoosted && (
                                    <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200">
                                        <Zap className="w-3 h-3 mr-1" />
                                        {isThai ? 'แนะนำ' : 'Featured'}
                                    </Badge>
                                )}
                                {result.isPPC && !result.isBoosted && (
                                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 border-indigo-200">
                                        <Zap className="w-3 h-3 mr-1" />
                                        {isThai ? 'แนะนำ' : 'Featured'}
                                    </Badge>
                                )}
                                {!result.isVerifiedPro && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        {t('verifiedShop')}
                                    </Badge>
                                )}
                                {result.data.report_count > 0 && (
                                    <Badge className="bg-red-100 text-red-700 border-red-200">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        {t('hasReports', { count: result.data.report_count })}
                                    </Badge>
                                )}
                            </div>

                            {/* Service Badges */}
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                {result.data.can_issue_tax_invoice && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                        <Receipt className="w-3 h-3 mr-1" />
                                        {isThai ? 'ใบกำกับภาษี' : 'Tax Invoice'}
                                    </Badge>
                                )}
                                {result.data.can_issue_withholding_tax && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                        <FileText className="w-3 h-3 mr-1" />
                                        {isThai ? 'หัก ณ ที่จ่าย' : 'WHT'}
                                    </Badge>
                                )}
                                {result.data.pay_on_pickup && (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                        <Banknote className="w-3 h-3 mr-1" />
                                        {isThai ? 'จ่ายตอนรับรถ' : 'Pay on Pickup'}
                                    </Badge>
                                )}
                                {result.data.accept_credit_card && (
                                    <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-xs">
                                        <CreditCard className="w-3 h-3 mr-1" />
                                        {isThai ? 'บัตรเครดิต' : 'Credit Card'}
                                    </Badge>
                                )}
                            </div>

                            {/* Shop Name */}
                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                                {result.data.name}
                            </h3>

                            {/* Details */}
                            <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span>{result.data.service_provinces?.join(', ') || '-'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium">{result.data.rating_average?.toFixed(1) || '0.0'}</span>
                                    <span className="text-slate-400">({result.data.review_count || 0})</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 items-end">
                            {/* Contact buttons for ร้านรับรอง */}
                            {result.isVerifiedPro && (
                                <div className="flex flex-col gap-2 items-end w-full sm:w-auto">
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
                                                        <p>{isThai ? 'โทร' : 'Call'} {result.data.phone_number}</p>
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

                                    {/* Official Page Button with Safety Dialog */}
                                    {result.data.facebook_url && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm w-full sm:w-auto">
                                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-white" />
                                                    {isThai ? 'เพจหลักร้านค้า (Official)' : 'Official Page'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="border-green-200 bg-green-50/50">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="flex items-center text-green-700">
                                                        <ShieldCheck className="w-6 h-6 mr-2 text-green-600" />
                                                        {isThai ? 'ยืนยันร้านค้าปลอดภัย' : 'Verified Secure Shop'}
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-600">
                                                        {isThai
                                                            ? `คุณกำลังจะเข้าสู่เพจ Facebook อย่างเป็นทางการของร้าน "${result.data.name}" ซึ่งผ่านการยืนยันตัวตนกับทาง RentSafe เรียบร้อยแล้ว มั่นใจได้ว่าไม่ใช่เพจปลอม`
                                                            : `You are proceeding to the official Facebook page of "${result.data.name}", which has been verified by RentSafe. Guaranteed authentic.`}
                                                        <div className="mt-4 p-3 bg-white rounded-lg border border-green-100 flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                                <Facebook className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="font-semibold text-slate-800 text-sm">Target Page</p>
                                                                <p className="text-xs text-blue-600 truncate">{result.data.facebook_url}</p>
                                                            </div>
                                                        </div>
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{isThai ? 'ยกเลิก' : 'Cancel'}</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => {
                                                            handleShopClick(result);
                                                            window.open(result.data.facebook_url, '_blank');
                                                        }}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        {isThai ? 'ไปที่เพจหลักทันที' : 'Go to Official Page'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            )}

                            <Link href={`/shop/${result.data.id}`} onClick={() => handleShopClick(result)}>
                                <Button variant="outline" className={`${result.isVerifiedPro ? 'border-2 w-full sm:w-auto' : 'border-2'} hover:bg-slate-50`}>
                                    {t('viewShop')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Shop List Item (Compact View)
    const ShopListItem = ({ result }: { result: SearchResult }) => (
        <div className={`group flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${result.isVerifiedPro
            ? 'bg-gradient-to-r from-yellow-50/50 to-white border-yellow-200 hover:border-yellow-300'
            : 'bg-white border-slate-200 hover:border-slate-300'
            }`}>
            {/* Badges (compact) */}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {result.isVerifiedPro && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-sm px-2 py-0.5 text-xs">
                            <Crown className="w-3 h-3 mr-0.5" />
                            {isThai ? 'ร้านรับรอง' : 'Verified'}
                        </Badge>
                    )}
                    {(result.isBoosted || result.isPPC) && (
                        <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200 px-2 py-0.5 text-xs">
                            <Zap className="w-3 h-3 mr-0.5" />
                            {isThai ? 'แนะนำ' : 'Featured'}
                        </Badge>
                    )}
                    {result.data.pay_on_pickup && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 text-xs hidden sm:flex">
                            <Banknote className="w-3 h-3 mr-0.5" />
                            {isThai ? 'จ่ายตอนรับรถ' : 'Pay on Pickup'}
                        </Badge>
                    )}
                </div>
                <Link href={`/shop/${result.data.id}`} onClick={() => handleShopClick(result)} className="block">
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate text-sm sm:text-base">
                        {result.data.name}
                    </h3>
                </Link>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {result.data.service_provinces?.[0] || '-'}
                    </span>
                    <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {result.data.rating_average?.toFixed(1) || '0.0'}
                        <span className="text-slate-400">({result.data.review_count || 0})</span>
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {result.isVerifiedPro && (
                    <>
                        {result.data.phone_number && (
                            <a
                                href={`tel:${result.data.phone_number}`}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                onClick={() => handleShopClick(result)}
                            >
                                <Phone className="w-4 h-4" />
                            </a>
                        )}
                        {result.data.line_id && (
                            <a
                                href={result.data.line_id.startsWith('@')
                                    ? `https://line.me/R/ti/p/${result.data.line_id}`
                                    : `https://line.me/R/ti/p/~${result.data.line_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#06C755]/10 text-[#06C755] hover:bg-[#06C755]/20 transition-colors"
                                onClick={() => handleShopClick(result)}
                            >
                                <MessageCircle className="w-4 h-4" />
                            </a>
                        )}
                    </>
                )}
                <Link href={`/shop/${result.data.id}`} onClick={() => handleShopClick(result)}>
                    <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 text-xs sm:text-sm">
                        {isThai ? 'ดูหน้าร้าน' : 'View'}
                    </Button>
                </Link>
            </div>
        </div>
    );

    // Filters Component
    const FiltersSection = () => (
        <div className="space-y-4 mb-6">
            {/* Verified Pro Filter - Highlighted */}
            <div className="flex">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 w-full sm:w-auto ${filterVerifiedPro
                                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400 shadow-md'
                                : 'bg-white border-slate-200 hover:border-yellow-200'
                                }`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filterVerifiedPro ? 'bg-yellow-500 border-yellow-500' : 'border-slate-300 bg-white'
                                    }`}>
                                    {filterVerifiedPro && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={filterVerifiedPro}
                                    onChange={(e) => setFilterVerifiedPro(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-2">
                                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-1 rounded-full">
                                        <Crown className="w-3 h-3" />
                                    </div>
                                    <span className={`font-bold ${filterVerifiedPro ? 'text-yellow-700' : 'text-slate-700'}`}>
                                        {isThai ? 'แสดงเฉพาะร้านรับรอง' : 'Verified Shops Only'}
                                    </span>
                                </div>
                            </label>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isThai ? 'การันตีประกันเงินมัดจำสูงสุด 1,000 บาท หากโดนโกง' : 'Guarantee deposit coverage up to 1,000 THB if scammed'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Other Service Filters */}
            <div className="flex flex-wrap gap-2">
                {[
                    { key: 'payOnPickup', state: filterPayOnPickup, setter: setFilterPayOnPickup, icon: Banknote, label: isThai ? 'ชำระตอนรับรถ' : 'Pay on Pickup', color: 'emerald' },
                    { key: 'creditCard', state: filterCreditCard, setter: setFilterCreditCard, icon: CreditCard, label: isThai ? 'รับบัตรเครดิต' : 'Credit Card', color: 'violet' },
                    { key: 'taxInvoice', state: filterTaxInvoice, setter: setFilterTaxInvoice, icon: Receipt, label: isThai ? 'ออกใบกำกับภาษี' : 'Tax Invoice', color: 'blue' },
                    { key: 'withholdingTax', state: filterWithholdingTax, setter: setFilterWithholdingTax, icon: FileText, label: isThai ? 'หัก ณ ที่จ่าย' : 'Withholding Tax', color: 'purple' },
                ].map(({ key, state, setter, icon: Icon, label, color }) => (
                    <label
                        key={key}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 text-sm ${state
                            ? `bg-${color}-50 border-${color}-200 text-${color}-700 shadow-sm`
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={state}
                            onChange={(e) => setter(e.target.checked)}
                            className="sr-only"
                        />
                        <Icon className="w-3.5 h-3.5" />
                        <span className="font-medium">{label}</span>
                        {state && <CheckCircle className="w-3.5 h-3.5" />}
                    </label>
                ))}
            </div>
        </div>
    );

    // Loading State
    if (loading) {
        return (
            <>
                <HeroSection />
                {searchFormElement}
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                    <p className="text-slate-500">{isThai ? 'กำลังค้นหา...' : 'Searching...'}</p>
                </div>
            </>
        );
    }

    // No Results
    if (hasSearched && results.length === 0) {
        return (
            <>
                <HeroSection />
                {searchFormElement}
                <NoResultsView />
            </>
        );
    }

    // Initial State (no search yet)
    if (!hasSearched) {
        return (
            <>
                <HeroSection />
                {searchFormElement}
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">
                        {isThai ? 'เริ่มค้นหา' : 'Start Searching'}
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {searchType === 'blacklist'
                            ? (isThai ? 'กรอกเลขบัญชี เบอร์โทร หรือชื่อร้าน เพื่อตรวจสอบ' : 'Enter bank account, phone, or shop name to check')
                            : (isThai ? 'กรอกชื่อร้านหรือเลือกจังหวัดเพื่อค้นหา' : 'Enter shop name or select province to search')}
                    </p>
                </div>
            </>
        );
    }

    // Results View
    return (
        <div className="space-y-6">
            <HeroSection />
            {searchFormElement}

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${searchType === 'blacklist' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                        <TrendingUp className={`w-5 h-5 ${searchType === 'blacklist' ? 'text-red-600' : 'text-blue-600'
                            }`} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {t('resultsCount', { count: sortedResults.length })}
                        </h2>
                        {(filterTaxInvoice || filterWithholdingTax || filterPayOnPickup || filterCreditCard) &&
                            sortedResults.length !== results.length && (
                                <p className="text-sm text-slate-500">
                                    {isThai ? `กรองจาก ${results.length} รายการ` : `filtered from ${results.length} items`}
                                </p>
                            )}
                    </div>
                </div>

                {/* View Mode Toggle & Sort Controls */}
                <div className="flex items-center gap-3">
                    {searchType === 'rental' && (
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                title={isThai ? 'มุมมองรายการ' : 'List View'}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                title={isThai ? 'มุมมองการ์ด' : 'Grid View'}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {searchType === 'rental' && results.length > 1 && (
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-slate-500 hidden sm:block" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white cursor-pointer"
                            >
                                <option value="rating">{isThai ? 'คะแนนสูงสุด' : 'Highest Rating'}</option>
                                <option value="reviews">{isThai ? 'รีวิวมากสุด' : 'Most Reviews'}</option>
                                <option value="name">{isThai ? 'ชื่อ ก-ฮ' : 'Name A-Z'}</option>
                                <option value="newest">{isThai ? 'ใหม่ล่าสุด' : 'Newest'}</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            {searchType === 'rental' && <FiltersSection />}

            {/* Results Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'flex flex-col gap-3'}>
                {searchType === 'blacklist' ? (
                    // Blacklist Search Results: Split into Sections from Verified Shops & Blacklist Entries
                    <div className="space-y-8">
                        {/* 1. Verified / Safe Shops Section */}
                        {results.some(r => r.type === 'shop') && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-green-200">
                                    <ShieldCheck className="w-5 h-5 text-green-600" />
                                    <h3 className="font-bold text-lg text-green-800">
                                        {isThai ? 'ร้านค้าที่ผ่านการตรวจสอบแล้ว (แนะนำ)' : 'Verified & Safe Shops (Recommended)'}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {results
                                        .filter(r => r.type === 'shop')
                                        .map((result, index) => (
                                            <ShopCard key={`shop-${index}`} result={result} />
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Blacklist Entries Section */}
                        {results.some(r => r.type === 'blacklist') && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-red-200 mt-4">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <h3 className="font-bold text-lg text-red-800">
                                        {isThai ? 'ประวัติการร้องเรียน (Blacklist)' : 'Blacklist Reports'}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {results
                                        .filter(r => r.type === 'blacklist')
                                        .map((result, index) => (
                                            <BlacklistCard key={`bl-${index}`} result={result} />
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Regular Rental Search Results
                    sortedResults.map((result, index) => (
                        result.type === 'blacklist'
                            ? <BlacklistCard key={index} result={result} />
                            : viewMode === 'grid'
                                ? <ShopCard key={index} result={result} />
                                : <ShopListItem key={index} result={result} />
                    ))
                )}
            </div>
        </div>
    );
}
