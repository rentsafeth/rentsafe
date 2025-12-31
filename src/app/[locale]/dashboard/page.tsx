import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Building2, Edit, ExternalLink, Clock, CheckCircle, XCircle,
    Star, AlertTriangle, Eye, Calendar, Phone, MessageCircle,
    Globe, MapPin, Coins, Megaphone, Crown, Shield, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PROVINCES } from '@/lib/constants/provinces';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user's shop if they have one
    const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

    // Get shop statistics if shop exists
    let reviewsCount = 0;
    let avgRating = 0;
    let reportsCount = 0;
    let subscription: any = null;
    let daysRemaining = 0;

    if (shop) {
        // Get subscription status
        const { data: subData } = await supabase
            .from('shop_subscriptions')
            .select('*, plan:subscription_plans(*)')
            .eq('shop_id', shop.id)
            .eq('status', 'active')
            .single();

        if (subData && new Date(subData.ends_at) > new Date()) {
            subscription = subData;
            daysRemaining = Math.ceil(
                (new Date(subData.ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
        }
        // Get reviews
        const { data: reviewsData } = await supabase
            .from('reviews')
            .select('rating')
            .eq('shop_id', shop.id);

        reviewsCount = reviewsData?.length || 0;
        avgRating = reviewsCount > 0
            ? (reviewsData?.reduce((acc, r) => acc + r.rating, 0) || 0) / reviewsCount
            : 0;

        // Get reports count
        const { count } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shop.id);

        reportsCount = count || 0;
    }

    // Calculate days since registration
    const daysSinceRegistration = shop
        ? Math.floor((new Date().getTime() - new Date(shop.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const getProvinceLabel = (value: string) => {
        return PROVINCES.find(p => p.value === value)?.label || value;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        ยืนยันแล้ว
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        รอการตรวจสอบ
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        ไม่ผ่านการตรวจสอบ
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
                    <p className="text-gray-600">ยินดีต้อนรับ, {user.email}</p>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-xl p-6">
                            <h3 className="font-semibold text-blue-900">ร้านที่บันทึก</h3>
                            <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-6">
                            <h3 className="font-semibold text-green-900">รีวิวของฉัน</h3>
                            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-6">
                            <h3 className="font-semibold text-red-900">รายงานที่ส่ง</h3>
                            <p className="text-3xl font-bold text-red-600 mt-2">0</p>
                        </div>
                    </div>
                </div>

                {/* Shop Management Section */}
                {shop && (
                    <div className="space-y-6">
                        {/* Shop Header Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Shop Cover */}
                            <div className="h-40 bg-gradient-to-r from-blue-600 to-cyan-500 relative">
                                {shop.cover_url && (
                                    <Image
                                        src={shop.cover_url}
                                        alt="Cover"
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </div>

                            <div className="p-6 -mt-12 relative">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                                    {/* Shop Logo */}
                                    <div className="w-24 h-24 bg-white rounded-xl shadow-lg border-4 border-white overflow-hidden relative flex-shrink-0">
                                        {shop.logo_url ? (
                                            <Image
                                                src={shop.logo_url}
                                                alt="Logo"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                <Building2 className="w-10 h-10 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-gray-900">{shop.name}</h2>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {getStatusBadge(shop.verification_status)}
                                            <span className="text-sm text-gray-500">
                                                ลงทะเบียนมา {daysSinceRegistration} วัน
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Link href="/dashboard/subscription">
                                            {subscription ? (
                                                <Button variant="outline" className="border-yellow-300 text-yellow-700 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100">
                                                    <Crown className="w-4 h-4 mr-2" />
                                                    ร้านรับรอง ({daysRemaining} วัน)
                                                </Button>
                                            ) : (
                                                <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                                                    <Crown className="w-4 h-4 mr-2" />
                                                    อัพเกรดร้านรับรอง
                                                </Button>
                                            )}
                                        </Link>
                                        <Link href="/dashboard/blacklist">
                                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                                <Shield className="w-4 h-4 mr-2" />
                                                Blacklist
                                            </Button>
                                        </Link>
                                        <Link href="/dashboard/credits">
                                            <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                                                <Coins className="w-4 h-4 mr-2" />
                                                {(shop.credit_balance || 0).toLocaleString()} เครดิต
                                            </Button>
                                        </Link>
                                        <Link href="/dashboard/ads">
                                            <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                                                <Megaphone className="w-4 h-4 mr-2" />
                                                โฆษณา
                                            </Button>
                                        </Link>
                                        <Link href="/dashboard/shop/edit">
                                            <Button className="bg-blue-600 hover:bg-blue-700">
                                                <Edit className="w-4 h-4 mr-2" />
                                                แก้ไขข้อมูล
                                            </Button>
                                        </Link>
                                        <Link href={`/shop/${shop.id}`}>
                                            <Button variant="outline">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                ดูหน้าร้าน
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {shop.description && (
                                    <p className="text-gray-600 mb-4">{shop.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Shop Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-100 rounded-xl">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-blue-600">{daysSinceRegistration}</p>
                                            <p className="text-xs text-slate-500">วันที่ลงทะเบียน</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-yellow-100 rounded-xl">
                                            <Star className="w-5 h-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-yellow-600">
                                                {avgRating > 0 ? avgRating.toFixed(1) : '-'}
                                            </p>
                                            <p className="text-xs text-slate-500">คะแนน ({reviewsCount} รีวิว)</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-100 rounded-xl">
                                            <Eye className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-purple-600">-</p>
                                            <p className="text-xs text-slate-500">ยอดเข้าชม</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={`bg-gradient-to-br ${reportsCount > 0 ? 'from-red-50 border-red-100' : 'from-green-50 border-green-100'} to-white`}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${reportsCount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                                            <AlertTriangle className={`w-5 h-5 ${reportsCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-2xl font-bold ${reportsCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {reportsCount}
                                            </p>
                                            <p className="text-xs text-slate-500">รายงานความผิดปกติ</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Shop Details Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Contact Info */}
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                        ข้อมูลติดต่อ
                                    </h3>
                                    <div className="space-y-3">
                                        {shop.phone_number && (
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                <Phone className="w-4 h-4 text-slate-500" />
                                                <div>
                                                    <p className="text-xs text-slate-500">เบอร์โทรศัพท์</p>
                                                    <p className="font-medium">{shop.phone_number}</p>
                                                </div>
                                            </div>
                                        )}
                                        {shop.line_id && (
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                <MessageCircle className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Line ID</p>
                                                    <p className="font-medium">{shop.line_id}</p>
                                                </div>
                                            </div>
                                        )}
                                        {shop.facebook_url && (
                                            <a href={shop.facebook_url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                                <Globe className="w-4 h-4 text-blue-600" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-500">Facebook</p>
                                                    <p className="font-medium text-blue-600 truncate">{shop.facebook_url}</p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-400" />
                                            </a>
                                        )}
                                        {shop.website && (
                                            <a href={shop.website} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                                <Globe className="w-4 h-4 text-purple-600" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-500">เว็บไซต์</p>
                                                    <p className="font-medium text-purple-600 truncate">{shop.website}</p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-400" />
                                            </a>
                                        )}
                                        {!shop.phone_number && !shop.line_id && !shop.facebook_url && !shop.website && (
                                            <p className="text-slate-500 text-center py-4">ยังไม่มีข้อมูลติดต่อ</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Service Areas */}
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-orange-600" />
                                        พื้นที่ให้บริการ
                                    </h3>
                                    {shop.service_provinces && shop.service_provinces.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {shop.service_provinces.map((province: string) => (
                                                <Badge key={province} variant="secondary" className="font-normal px-3 py-1.5">
                                                    <MapPin className="w-3 h-3 mr-1 text-orange-500" />
                                                    {getProvinceLabel(province)}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-4">ยังไม่ได้ระบุพื้นที่ให้บริการ</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Tips / Status Message */}
                        {shop.verification_status === 'pending' && (
                            <Card className="bg-yellow-50 border-yellow-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-yellow-800">ร้านค้าอยู่ระหว่างรอการตรวจสอบ</h3>
                                            <p className="text-yellow-700 text-sm mt-1">
                                                ทีมงานกำลังตรวจสอบข้อมูลร้านค้าของคุณ โดยปกติจะใช้เวลา 1-3 วันทำการ
                                                เมื่อผ่านการตรวจสอบแล้ว คุณจะได้รับอีเมลแจ้งเตือน
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {shop.verification_status === 'rejected' && (
                            <Card className="bg-red-50 border-red-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-red-800">ร้านค้าไม่ผ่านการตรวจสอบ</h3>
                                            <p className="text-red-700 text-sm mt-1">
                                                กรุณาตรวจสอบอีเมลเพื่อดูรายละเอียดเหตุผล และแก้ไขข้อมูลให้ถูกต้องแล้วส่งขอตรวจสอบใหม่
                                            </p>
                                            <Link href="/dashboard/shop/edit">
                                                <Button className="mt-3 bg-red-600 hover:bg-red-700">
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    แก้ไขข้อมูลร้านค้า
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {shop.verification_status === 'verified' && (
                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-green-800">ร้านค้าได้รับการยืนยันแล้ว!</h3>
                                            <p className="text-green-700 text-sm mt-1">
                                                ร้านค้าของคุณแสดงบน RentSafe แล้ว ลูกค้าสามารถค้นหาและดูข้อมูลร้านค้าของคุณได้
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* No Shop - Register CTA */}
                {!shop && (
                    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
                        <CardContent className="pt-6 text-center py-12">
                            <Building2 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">คุณยังไม่มีร้านค้า</h3>
                            <p className="text-gray-600 mb-6">ลงทะเบียนร้านค้าเช่ารถของคุณเพื่อเพิ่มความน่าเชื่อถือและให้ลูกค้าค้นหาเจอ</p>
                            <Link href="/register-shop">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Building2 className="w-4 h-4 mr-2" />
                                    ลงทะเบียนร้านค้า
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
