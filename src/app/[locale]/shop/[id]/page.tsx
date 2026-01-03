import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CheckCircle, MapPin, Phone, MessageCircle, AlertTriangle,
    Calendar, Star, Building2, CreditCard, Globe, ShieldCheck,
    Clock, Users, ExternalLink, Crown, Shield, Check, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PROVINCES } from '@/lib/constants/provinces';
import SaveShopButton from '@/components/features/shop/SaveShopButton';
import ShopServiceBadges from '@/components/features/shop/ShopServiceBadges';
import ShareShopButton from '@/components/features/shop/ShareShopButton';
import ReviewFormModal from '@/components/features/shop/ReviewFormModal';
import ReviewList from '@/components/features/shop/ReviewList';
import ShopTour from '@/components/features/shop/ShopTour';

const BASE_URL = 'https://rentsafe.in.th';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
    const { id, locale } = await params;
    const supabase = await createClient();
    const isThai = locale === 'th';

    const { data: shop } = await supabase
        .from('shops')
        .select('name, description, service_provinces, rating_average, review_count, logo_url')
        .eq('id', id)
        .single();

    if (!shop) {
        return {
            title: isThai ? 'ไม่พบร้านค้า' : 'Shop Not Found',
        };
    }

    const provinces = shop.service_provinces?.join(', ') || '';
    const title = isThai
        ? `${shop.name} - ร้านเช่ารถ${provinces ? ` ${provinces}` : ''}`
        : `${shop.name} - Car Rental${provinces ? ` in ${provinces}` : ''}`;
    const description = shop.description || (isThai
        ? `รีวิวและข้อมูลร้านเช่ารถ ${shop.name} คะแนน ${shop.rating_average?.toFixed(1) || '0.0'}/5 จาก ${shop.review_count || 0} รีวิว`
        : `Reviews and info for ${shop.name} car rental. Rating ${shop.rating_average?.toFixed(1) || '0.0'}/5 from ${shop.review_count || 0} reviews`);

    return {
        title,
        description,
        openGraph: {
            title: `${title} | RentSafe`,
            description,
            type: 'website',
            url: `${BASE_URL}/${locale}/shop/${id}`,
            images: shop.logo_url ? [{ url: shop.logo_url, alt: shop.name }] : [],
        },
        twitter: {
            card: 'summary',
            title,
            description,
        },
        alternates: {
            canonical: `${BASE_URL}/${locale}/shop/${id}`,
            languages: {
                'th': `${BASE_URL}/th/shop/${id}`,
                'en': `${BASE_URL}/en/shop/${id}`,
            },
        },
    };
}

export default async function ShopProfilePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id, locale } = await params;
    const supabase = await createClient();
    const isThai = locale === 'th';

    const { data: shop, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !shop) {
        notFound();
    }

    // Get reports count for this shop
    const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', id)
        .eq('status', 'approved');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Get reviews count and average
    const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('shop_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    const reviewsCount = reviewsData?.length || 0;
    const avgRating = reviewsCount > 0
        ? (reviewsData?.reduce((acc, r) => acc + r.rating, 0) || 0) / reviewsCount
        : 0;

    // Check if shop is verified pro
    const { data: subData } = await supabase
        .from('shop_subscriptions')
        .select('status, ends_at')
        .eq('shop_id', id)
        .eq('status', 'active')
        .order('ends_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Use getTime() for consistent comparison
    const now = new Date();
    const endsAt = subData ? new Date(subData.ends_at) : null;
    const isVerifiedPro = !!(endsAt && endsAt.getTime() > now.getTime());

    const getProvinceLabel = (value: string) => {
        return PROVINCES.find(p => p.value === value)?.label || value;
    };

    // Calculate days since registration
    const daysSinceRegistration = Math.floor(
        (new Date().getTime() - new Date(shop.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Format registration date
    const registrationDate = new Date(shop.created_at).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Bank name mapping
    const bankNames: Record<string, string> = {
        'kbank': 'ธนาคารกสิกรไทย',
        'scb': 'ธนาคารไทยพาณิชย์',
        'bbl': 'ธนาคารกรุงเทพ',
        'ktb': 'ธนาคารกรุงไทย',
        'bay': 'ธนาคารกรุงศรีอยุธยา',
        'tmb': 'ธนาคารทหารไทยธนชาต',
        'gsb': 'ธนาคารออมสิน',
        'baac': 'ธนาคาร ธ.ก.ส.',
    };

    const getBankDisplayName = (bankCode: string | null) => {
        if (!bankCode) return null;
        return bankNames[bankCode.toLowerCase()] || bankCode;
    };

    // JSON-LD Structured Data for LocalBusiness
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${BASE_URL}/shop/${shop.id}`,
        name: shop.name,
        description: shop.description || `ร้านเช่ารถ ${shop.name}`,
        url: `${BASE_URL}/shop/${shop.id}`,
        ...(shop.logo_url && { image: shop.logo_url }),
        ...(shop.phone_number && { telephone: shop.phone_number }),
        ...(shop.service_provinces?.length > 0 && {
            areaServed: shop.service_provinces.map((p: string) => ({
                '@type': 'State',
                name: p,
            })),
        }),
        ...(avgRating > 0 && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: avgRating.toFixed(1),
                reviewCount: reviewsCount,
                bestRating: 5,
                worstRating: 1,
            },
        }),
        priceRange: '฿฿',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <div className="container mx-auto px-4 py-8">
                    {/* Hero Header Section */}
                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-8">
                        {/* Top Banner / Cover Image */}
                        <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 relative">
                            {shop.cover_url ? (
                                <Image
                                    src={shop.cover_url}
                                    alt={`${shop.name} cover`}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                            )}
                        </div>

                        {/* Shop Info */}
                        <div className="px-6 pb-6 -mt-16 relative">
                            {/* Shop Logo / Avatar */}
                            <div className={`w-28 h-28 md:w-32 md:h-32 bg-white rounded-2xl shadow-lg border-4 ${isVerifiedPro ? 'border-yellow-400 ring-4 ring-yellow-400/30' : 'border-white'} overflow-hidden mb-4 relative z-10`}>
                                {shop.logo_url ? (
                                    <Image
                                        src={shop.logo_url}
                                        alt={`${shop.name} logo`}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                        <Building2 className={`w-12 h-12 ${isVerifiedPro ? 'text-yellow-500' : 'text-blue-600'}`} />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{shop.name}</h1>
                                            {isVerifiedPro && (
                                                <div className="bg-blue-500 text-white rounded-full p-0.5" title="Verified Partner">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        {isVerifiedPro ? (
                                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500 px-3 py-1 border-0 shadow-sm">
                                                <Crown className="w-4 h-4 mr-1 fill-white" />
                                                {isThai ? 'ร้านรับรอง' : 'Verified Shop'}
                                            </Badge>
                                        ) : shop.verification_status === 'verified' ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 px-3 py-1">
                                                <ShieldCheck className="w-4 h-4 mr-1" />
                                                {isThai ? 'ร้านค้ายืนยันตัวตนแล้ว' : 'Verified Identity'}
                                            </Badge>
                                        ) : shop.verification_status === 'pending' ? (
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {isThai ? 'รอการตรวจสอบ' : 'Pending Verification'}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    {shop.description && (
                                        <p className="text-slate-600 max-w-2xl mb-4">{shop.description}</p>
                                    )}

                                    {/* Service Provinces Badges */}
                                    {shop.service_provinces && shop.service_provinces.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {shop.service_provinces.map((province: string) => (
                                                <Badge key={province} className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 font-normal px-3 py-1">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {getProvinceLabel(province)}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Stats */}
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{isThai ? 'ลงทะเบียนเมื่อ' : 'Joined'} {registrationDate}</span>
                                            <Badge variant="secondary" className="ml-1 text-xs">
                                                {daysSinceRegistration} {isThai ? 'วัน' : 'days'}
                                            </Badge>
                                        </div>
                                        {shop.business_type && (
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Building2 className="w-4 h-4" />
                                                <span>{shop.business_type === 'company'
                                                    ? (isThai ? 'นิติบุคคล' : 'Company')
                                                    : (isThai ? 'บุคคลธรรมดา' : 'Individual')}</span>
                                            </div>
                                        )}
                                        <ShopServiceBadges
                                            canIssueTaxInvoice={shop.can_issue_tax_invoice}
                                            canIssueWithholdingTax={shop.can_issue_withholding_tax}
                                            payOnPickup={shop.pay_on_pickup}
                                            acceptCreditCard={shop.accept_credit_card}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 items-center">
                                    <SaveShopButton shopId={shop.id} variant="icon" />
                                    <ShareShopButton
                                        shopName={shop.name}
                                        shopId={shop.id}
                                        isVerifiedPro={isVerifiedPro}
                                        size="icon"
                                    />
                                    <Link href={`/report?shop_id=${shop.id}`}>
                                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            {isThai ? 'รายงาน' : 'Report'}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className="p-2.5 bg-blue-100 rounded-xl mb-1">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-blue-600">{daysSinceRegistration}</p>
                                        <p className="text-xs text-slate-500">{isThai ? 'วันที่ลงทะเบียน' : 'Days Active'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className="p-2.5 bg-yellow-100 rounded-xl mb-1">
                                        <Star className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {avgRating > 0 ? avgRating.toFixed(1) : '-'}
                                        </p>
                                        <p className="text-xs text-slate-500">{isThai ? 'คะแนนรีวิว' : 'Rating'} ({reviewsCount})</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {isVerifiedPro ? (
                            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                                <CardContent className="pt-6 relative z-10">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl shadow-sm mb-1">
                                            <Shield className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-emerald-700 leading-tight">{isThai ? 'คุ้มครองเงินมัดจำ' : 'Deposit Guarantee'}</p>
                                            <p className="text-xs text-emerald-600 font-medium">{isThai ? 'โดย RentSafe Guarantee' : 'by RentSafe Guarantee'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div className="p-2.5 bg-green-100 rounded-xl mb-1">
                                            <ShieldCheck className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-green-600">
                                                {shop.verification_status === 'verified' ? 'ยืนยันแล้ว' : 'รอตรวจสอบ'}
                                            </p>
                                            <p className="text-xs text-slate-500">สถานะร้านค้า</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className="p-2.5 bg-red-100 rounded-xl mb-1">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-red-600">{reportsCount || 0}</p>
                                        <p className="text-xs text-slate-500">รายงานความผิดปกติ</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Contact Info */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                        {isThai ? 'ข้อมูลการติดต่อ' : 'Contact Information'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {shop.phone_number && (
                                        <a href={`tel:${shop.phone_number}`}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isVerifiedPro
                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100'
                                                : 'bg-slate-50 hover:bg-slate-100'
                                                }`}>
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Phone className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">{isThai ? 'โทรศัพท์' : 'Phone'}</p>
                                                <p className="font-medium text-slate-900">{shop.phone_number}</p>
                                            </div>
                                        </a>
                                    )}

                                    {/* Line IDs */}
                                    {(shop.line_ids?.length > 0 ? shop.line_ids : (shop.line_id ? [shop.line_id] : [])).map((lineId: string, index: number) => (
                                        <div key={`line-${index}`} className={`flex items-center gap-3 p-3 rounded-lg ${isVerifiedPro
                                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'
                                            : 'bg-slate-50'
                                            }`}>
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <MessageCircle className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Line ID {index > 0 ? index + 1 : ''}</p>
                                                <p className="font-medium text-slate-900">{lineId}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Facebook URLs */}
                                    {(shop.facebook_urls?.length > 0 ? shop.facebook_urls : (shop.facebook_url ? [shop.facebook_url] : [])).map((fbUrl: string, index: number) => (
                                        <a key={`fb-${index}`} id={`shop-contact-facebook-${index}`} href={fbUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group">
                                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                                <Globe className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-500">Facebook {index > 0 ? index + 1 : ''}</p>
                                                <p className="font-medium text-blue-600 truncate">{fbUrl}</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                        </a>
                                    ))}

                                    {shop.website && (
                                        <a href={shop.website} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <Globe className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-500">{isThai ? 'เว็บไซต์' : 'Website'}</p>
                                                <p className="font-medium text-purple-600 truncate">{shop.website}</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                        </a>
                                    )}

                                    {!shop.phone_number && !shop.line_id && !shop.facebook_url && !shop.website && (
                                        <p className="text-slate-500 text-center py-4">{isThai ? 'ไม่มีข้อมูลการติดต่อ' : 'No contact information available'}</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Bank Account Info */}
                            {(shop.bank_name || shop.bank_account_no) && (
                                <Card id="shop-bank-card">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-green-600" />
                                            {isThai ? 'ข้อมูลบัญชีธนาคาร' : 'Bank Account Info'}
                                        </CardTitle>
                                        <p className="text-xs text-slate-500 mt-1 ml-7">
                                            {isThai ? 'หมายเลขบัญชีธนาคารที่ลงทะเบียนและตรวจสอบแล้ว' : 'Registered and verified bank account number'}
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                            <div className="space-y-3">
                                                {shop.bank_name && (
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-0.5">{isThai ? 'ธนาคาร' : 'Bank'}</p>
                                                        <p className="font-semibold text-slate-900">{getBankDisplayName(shop.bank_name)}</p>
                                                    </div>
                                                )}
                                                {shop.bank_account_no && (
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-0.5">{isThai ? 'เลขบัญชี' : 'Account No.'}</p>
                                                        <p className="font-mono font-semibold text-slate-900 tracking-wider">{shop.bank_account_no}</p>
                                                    </div>
                                                )}
                                                {shop.bank_account_name && (
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-0.5">{isThai ? 'ชื่อบัญชี' : 'Account Name'}</p>
                                                        <p className="font-semibold text-slate-900">{shop.bank_account_name}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-3 text-center">
                                            {isThai ? '* กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนโอนเงิน' : '* Please verify information before transferring money'}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                        </div>

                        {/* Right Column - Reports History */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        {isThai ? 'ประวัติการรายงานความผิดปกติ' : 'Report History'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {reportsCount && reportsCount > 0 ? (
                                        <div className="text-center py-8 bg-red-50 rounded-xl border border-red-100">
                                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                            <p className="text-red-700 font-medium">{isThai ? `พบรายงานความผิดปกติ ${reportsCount} รายการ` : `Found ${reportsCount} reports`}</p>
                                            <p className="text-sm text-red-600 mt-1">{isThai ? 'กรุณาตรวจสอบข้อมูลให้ดีก่อนทำธุรกรรม' : 'Please verify carefully before transaction'}</p>
                                        </div>
                                    ) : (
                                        <div className={`text-center py-12 rounded-xl border ${isVerifiedPro
                                            ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-100'
                                            : 'bg-gradient-to-b from-green-50 to-white border-green-100'
                                            }`}>
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isVerifiedPro ? 'bg-emerald-100' : 'bg-green-100'
                                                }`}>
                                                {isVerifiedPro ? (
                                                    <Sparkles className="w-8 h-8 text-emerald-600" />
                                                ) : (
                                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                                )}
                                            </div>
                                            <p className={`font-medium text-lg ${isVerifiedPro ? 'text-emerald-700' : 'text-green-700'}`}>
                                                {isVerifiedPro
                                                    ? (isThai ? 'ประวัติขาวสะอาด 100%' : '100% Clean History')
                                                    : (isThai ? 'ไม่พบรายงานความผิดปกติ' : 'No Reports Found')}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-2">
                                                {isVerifiedPro
                                                    ? (isThai ? 'ร้านนี้ไม่เคยมีประวัติการถูกร้องเรียน' : 'This shop has never been reported')
                                                    : (isThai ? 'ร้านนี้มีประวัติขาวสะอาด' : 'This shop has a clean history')}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Reviews Section */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-500" />
                                        {isThai ? 'รีวิวจากผู้ใช้งาน' : 'User Reviews'}
                                    </CardTitle>
                                    {/* Review Button */}
                                    {user && user.id !== shop.owner_id && (
                                        <div className="ml-auto">
                                            <ReviewFormModal
                                                shopId={shop.id}
                                                userId={user.id}
                                                isThai={isThai}
                                            />
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {reviewsCount > 0 ? (
                                        <div className="space-y-8">
                                            {/* Summary Stats */}
                                            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                                <div className="text-center">
                                                    <p className="text-4xl font-bold text-yellow-600">{avgRating.toFixed(1)}</p>
                                                    <div className="flex gap-0.5 mt-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-slate-600">{isThai ? `จาก ${reviewsCount} รีวิว` : `From ${reviewsCount} reviews`}</p>
                                                </div>
                                            </div>

                                            {/* Review List */}
                                            <ReviewList
                                                reviews={reviewsData || []}
                                                currentUserId={user?.id}
                                                isShopOwner={user?.id === shop.owner_id}
                                                shopId={shop.id}
                                                isThai={isThai}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500">{isThai ? 'ยังไม่มีรีวิวสำหรับร้านนี้' : 'No reviews yet'}</p>
                                            <p className="text-sm text-slate-400 mt-1 mb-4">{isThai ? 'เป็นคนแรกที่รีวิวร้านนี้' : 'Be the first to review this shop'}</p>

                                            {user ? (
                                                user.id !== shop.owner_id && (
                                                    <ReviewFormModal
                                                        shopId={shop.id}
                                                        userId={user.id}
                                                        isThai={isThai}
                                                    />
                                                )
                                            ) : (
                                                <Link href={`/${locale}/login?next=/shop/${id}`}>
                                                    <Button variant="outline">
                                                        {isThai ? 'เข้าสู่ระบบเพื่อรีวิว' : 'Login to Review'}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
            <ShopTour isThai={isThai} isVerifiedPro={isVerifiedPro} />
        </>
    );
}
