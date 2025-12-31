import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Store, Clock } from 'lucide-react';
import ShopsList from './ShopsList';

export default async function AdminShopsPage() {
    const supabase = await createClient();

    const { data: shops } = await supabase
        .from('shops')
        .select(`
            *,
            profiles:owner_id (
                email,
                full_name
            )
        `)
        .order('created_at', { ascending: false });

    // Count pending shops
    const pendingCount = shops?.filter(s => s.verification_status === 'pending').length || 0;
    const verifiedCount = shops?.filter(s => s.verification_status === 'verified').length || 0;
    const rejectedCount = shops?.filter(s => s.verification_status === 'rejected').length || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">จัดการร้านค้า</h1>
                    <p className="text-gray-500">ตรวจสอบและยืนยันร้านค้าที่ลงทะเบียน</p>
                </div>
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
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingCount}</p>
                                <p className="text-sm text-gray-500">รอตรวจสอบ</p>
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
                                <p className="text-2xl font-bold">{verifiedCount}</p>
                                <p className="text-sm text-gray-500">ยืนยันแล้ว</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{rejectedCount}</p>
                                <p className="text-sm text-gray-500">ถูกปฏิเสธ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Shops List - Client Component */}
            <ShopsList shops={shops || []} />
        </div>
    );
}
