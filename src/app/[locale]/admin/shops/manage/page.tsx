import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Store,
    CheckCircle,
    PauseCircle,
    Trash2,
    ShieldAlert,
    ExternalLink,
    Eye,
    User,
    Building2,
    Phone,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export default async function AdminShopManagePage() {
    const supabase = await createClient();

    // Get only verified/active shops (not pending ones)
    const { data: shops } = await supabase
        .from('shops')
        .select(`
            *,
            profiles:owner_id (
                email,
                full_name
            )
        `)
        .in('verification_status', ['verified', 'rejected'])
        .order('created_at', { ascending: false });

    // Toggle shop active status
    async function toggleActive(shopId: string, currentStatus: boolean) {
        'use server';
        const supabase = await createClient();
        const { error } = await supabase.from('shops').update({
            is_active: !currentStatus
        }).eq('id', shopId);

        if (error) {
            console.error('Toggle active error:', error);
        }

        revalidatePath('/th/admin/shops/manage');
        revalidatePath('/en/admin/shops/manage');
    }

    // Delete shop and all related documents
    async function deleteShop(shopId: string) {
        'use server';
        const supabase = await createClient();

        // Get shop data first to find document URLs
        const { data: shop } = await supabase
            .from('shops')
            .select('id_card_url, business_license_url, bank_book_url')
            .eq('id', shopId)
            .single();

        if (shop) {
            // Delete documents from storage
            const filesToDelete: string[] = [];

            if (shop.id_card_url) {
                const path = shop.id_card_url.split('/verification-docs/')[1];
                if (path) filesToDelete.push(path);
            }
            if (shop.business_license_url) {
                const path = shop.business_license_url.split('/verification-docs/')[1];
                if (path) filesToDelete.push(path);
            }
            if (shop.bank_book_url) {
                const path = shop.bank_book_url.split('/verification-docs/')[1];
                if (path) filesToDelete.push(path);
            }

            if (filesToDelete.length > 0) {
                await supabase.storage.from('verification-docs').remove(filesToDelete);
            }
        }

        // Delete shop from database (CASCADE will delete related records)
        const { error } = await supabase.from('shops').delete().eq('id', shopId);

        if (error) {
            console.error('Delete shop error:', error);
        }

        revalidatePath('/th/admin/shops/manage');
        revalidatePath('/en/admin/shops/manage');
    }

    // Mark shop as fraudulent (create system report)
    async function markAsFraud(shopId: string) {
        'use server';
        const supabase = await createClient();

        // Get shop data
        const { data: shop } = await supabase
            .from('shops')
            .select('name, phone_number, bank_name, bank_account_no, line_id')
            .eq('id', shopId)
            .single();

        if (!shop) return;

        // Create a system report
        const { error: reportError } = await supabase.from('reports').insert({
            shop_id: shopId,
            reporter_id: null, // System report
            manual_shop_name: shop.name,
            manual_shop_contact: shop.phone_number + (shop.line_id ? ` / Line: ${shop.line_id}` : ''),
            manual_bank_account: shop.bank_name ? `${shop.bank_name} - ${shop.bank_account_no}` : shop.bank_account_no,
            description: `ร้านค้านี้ถูกระบุว่าเป็นมิจฉาชีพโดยระบบ RentSafe หลังจากการตรวจสอบโดยทีมงาน`,
            status: 'approved', // Auto-approve system reports
            incident_date: new Date().toISOString().split('T')[0],
        });

        if (reportError) {
            console.error('Create fraud report error:', reportError);
        }

        // Update shop status
        const { error: updateError } = await supabase.from('shops').update({
            verification_status: 'rejected',
            is_active: false,
            verification_notes: 'ถูกระบุเป็นมิจฉาชีพโดยระบบ'
        }).eq('id', shopId);

        if (updateError) {
            console.error('Update shop status error:', updateError);
        }

        revalidatePath('/th/admin/shops/manage');
        revalidatePath('/en/admin/shops/manage');
    }

    // Calculate stats
    const activeCount = shops?.filter(s => s.is_active !== false && s.verification_status === 'verified').length || 0;
    const inactiveCount = shops?.filter(s => s.is_active === false).length || 0;
    const fraudCount = shops?.filter(s => s.verification_notes?.includes('มิจฉาชีพ')).length || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">จัดการร้านค้า</h1>
                    <p className="text-gray-500">จัดการร้านค้าที่ผ่านการยืนยันแล้ว</p>
                </div>
                <Link href="/admin/shops">
                    <Button variant="outline">
                        ← กลับไปหน้าอนุมัติร้านค้า
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Store className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{shops?.length || 0}</p>
                                <p className="text-sm text-gray-500">ร้านค้าทั้งหมด</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeCount}</p>
                                <p className="text-sm text-gray-500">เปิดใช้งาน</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <PauseCircle className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{inactiveCount}</p>
                                <p className="text-sm text-gray-500">ปิดใช้งานชั่วคราว</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <ShieldAlert className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{fraudCount}</p>
                                <p className="text-sm text-gray-500">มิจฉาชีพ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Shops List */}
            <div className="space-y-4">
                {shops?.map((shop) => {
                    const owner = shop.profiles as { email: string; full_name: string } | null;
                    const isActive = shop.is_active !== false;
                    const isFraud = shop.verification_notes?.includes('มิจฉาชีพ');

                    return (
                        <Card
                            key={shop.id}
                            className={
                                isFraud ? 'border-red-300 bg-red-50/50' :
                                    !isActive ? 'border-yellow-200 bg-yellow-50/30' : ''
                            }
                        >
                            <CardContent className="pt-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h3 className="text-lg font-bold">{shop.name}</h3>

                                            {isFraud ? (
                                                <Badge variant="destructive" className="flex items-center gap-1">
                                                    <ShieldAlert className="w-3 h-3" /> มิจฉาชีพ
                                                </Badge>
                                            ) : !isActive ? (
                                                <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                                                    <PauseCircle className="w-3 h-3 mr-1" /> ปิดใช้งานชั่วคราว
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> เปิดใช้งาน
                                                </Badge>
                                            )}

                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                {shop.business_type === 'company' ? (
                                                    <><Building2 className="w-3 h-3" /> นิติบุคคล</>
                                                ) : (
                                                    <><User className="w-3 h-3" /> บุคคลธรรมดา</>
                                                )}
                                            </Badge>
                                        </div>

                                        {owner && (
                                            <p className="text-sm text-gray-500 mb-2">
                                                เจ้าของ: {owner.full_name || 'ไม่ระบุ'} ({owner.email})
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <span className="text-gray-600 flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {shop.phone_number}
                                            </span>
                                            {shop.bank_name && (
                                                <span className="text-gray-600">
                                                    {shop.bank_name} - {shop.bank_account_no}
                                                </span>
                                            )}
                                        </div>

                                        {shop.verification_notes && (
                                            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                {shop.verification_notes}
                                            </p>
                                        )}

                                        <p className="text-xs text-gray-400 mt-2">
                                            ID: {shop.id} | สมัครเมื่อ {new Date(shop.created_at).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {/* View Details */}
                                        <Link href={`/admin/shops/${shop.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-1" /> รายละเอียด
                                            </Button>
                                        </Link>

                                        {/* View Shop Page */}
                                        <Link href={`/shop/${shop.id}`} target="_blank">
                                            <Button variant="ghost" size="sm">
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </Link>

                                        {/* Toggle Active (only for non-fraud shops) */}
                                        {!isFraud && (
                                            <form action={toggleActive.bind(null, shop.id, isActive)}>
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    variant={isActive ? 'outline' : 'default'}
                                                    className={isActive ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50' : 'bg-green-600 hover:bg-green-700'}
                                                >
                                                    {isActive ? (
                                                        <><PauseCircle className="w-4 h-4 mr-1" /> ปิดใช้งาน</>
                                                    ) : (
                                                        <><CheckCircle className="w-4 h-4 mr-1" /> เปิดใช้งาน</>
                                                    )}
                                                </Button>
                                            </form>
                                        )}

                                        {/* Mark as Fraud (only for non-fraud shops) */}
                                        {!isFraud && (
                                            <form action={markAsFraud.bind(null, shop.id)}>
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                                >
                                                    <ShieldAlert className="w-4 h-4 mr-1" /> ระบุเป็นมิจฉาชีพ
                                                </Button>
                                            </form>
                                        )}

                                        {/* Delete Shop */}
                                        <form action={deleteShop.bind(null, shop.id)}>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                variant="destructive"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" /> ลบร้านค้า
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {(!shops || shops.length === 0) && (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-500">
                            <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="font-medium">ยังไม่มีร้านค้าที่ผ่านการยืนยัน</p>
                            <p className="text-sm mt-1">ร้านค้าที่ผ่านการอนุมัติจะแสดงที่นี่</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
