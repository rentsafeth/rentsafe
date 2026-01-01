import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, MapPin, Star, ChevronLeft, Bookmark, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PROVINCES } from '@/lib/constants/provinces';
import SaveShopButton from '@/components/features/shop/SaveShopButton';

export default async function SavedShopsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get saved shops with shop details
    const { data: savedShops } = await supabase
        .from('saved_shops')
        .select(`
            id,
            created_at,
            shop:shops (
                id,
                name,
                description,
                logo_url,
                service_provinces,
                verification_status,
                rating_average,
                review_count
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const getProvinceLabel = (value: string) => {
        return PROVINCES.find(p => p.value === value)?.label || value;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        กลับไปหน้า Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Bookmark className="w-7 h-7 text-blue-600" />
                        ร้านที่บันทึกไว้
                    </h1>
                    <p className="text-gray-600 mt-2">
                        รายการร้านเช่ารถที่คุณบันทึกไว้ ({savedShops?.length || 0} ร้าน)
                    </p>
                </div>

                {/* Saved Shops List */}
                {savedShops && savedShops.length > 0 ? (
                    <div className="space-y-4">
                        {savedShops.map((saved) => {
                            const shop = saved.shop as any;
                            if (!shop) return null;

                            return (
                                <Card key={saved.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col sm:flex-row">
                                            {/* Shop Logo */}
                                            <div className="sm:w-32 sm:h-32 h-24 bg-slate-100 flex-shrink-0 relative">
                                                {shop.logo_url ? (
                                                    <Image
                                                        src={shop.logo_url}
                                                        alt={shop.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Building2 className="w-10 h-10 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Shop Info */}
                                            <div className="flex-1 p-4 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Link href={`/shop/${shop.id}`} className="hover:underline">
                                                                    <h3 className="font-semibold text-gray-900 text-lg">
                                                                        {shop.name}
                                                                    </h3>
                                                                </Link>
                                                                {shop.verification_status === 'verified' && (
                                                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                                                        ยืนยันแล้ว
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {shop.description && (
                                                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                                                    {shop.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <SaveShopButton shopId={shop.id} variant="icon" />
                                                    </div>

                                                    {/* Provinces */}
                                                    {shop.service_provinces && shop.service_provinces.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {shop.service_provinces.slice(0, 3).map((province: string) => (
                                                                <Badge
                                                                    key={province}
                                                                    variant="secondary"
                                                                    className="text-xs font-normal"
                                                                >
                                                                    <MapPin className="w-2.5 h-2.5 mr-1" />
                                                                    {getProvinceLabel(province)}
                                                                </Badge>
                                                            ))}
                                                            {shop.service_provinces.length > 3 && (
                                                                <Badge variant="secondary" className="text-xs font-normal">
                                                                    +{shop.service_provinces.length - 3}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                                        <Star className="w-4 h-4 text-yellow-500" />
                                                        <span className="font-medium">
                                                            {shop.rating_average?.toFixed(1) || '-'}
                                                        </span>
                                                        <span className="text-gray-400">
                                                            ({shop.review_count || 0} รีวิว)
                                                        </span>
                                                    </div>
                                                    <Link href={`/shop/${shop.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            ดูข้อมูลร้าน
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="bg-slate-50 border-dashed">
                        <CardContent className="py-16 text-center">
                            <Bookmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                ยังไม่มีร้านที่บันทึกไว้
                            </h3>
                            <p className="text-gray-600 mb-6">
                                เริ่มค้นหาร้านเช่ารถและกดบันทึกร้านที่สนใจไว้ดูภายหลัง
                            </p>
                            <Link href="/search?type=rental">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    ค้นหาร้านเช่ารถ
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
