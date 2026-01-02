import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ShieldAlert, Users, CheckCircle, MessageSquare, Flag } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch stats
    const { count: pendingShops } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

    const { count: pendingReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    const { count: pendingReviews } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    const { count: pendingDisputes } = await supabase
        .from('review_disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    const { count: totalShops } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true });

    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">ภาพรวมระบบ</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/admin/shops">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">รอตรวจสอบร้านค้า</CardTitle>
                            <Store className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingShops || 0}</div>
                            <p className="text-xs text-muted-foreground">ร้านค้าที่รอการอนุมัติ</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/reports">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">รอตรวจสอบรายงาน</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingReports || 0}</div>
                            <p className="text-xs text-muted-foreground">รายงานที่รอการตรวจสอบ</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/reviews">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">รออนุมัติรีวิว</CardTitle>
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingReviews || 0}</div>
                            <p className="text-xs text-muted-foreground">รีวิวใหม่ที่รอตรวจสอบ</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/reviews?tab=disputes">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">ข้อพิพาทรีวิว</CardTitle>
                            <Flag className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingDisputes || 0}</div>
                            <p className="text-xs text-muted-foreground">คำร้องแจ้งลบรีวิว</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/shops/manage">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">ร้านค้าทั้งหมด</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalShops || 0}</div>
                            <p className="text-xs text-muted-foreground">ร้านเช่ารถที่ลงทะเบียน</p>
                        </CardContent>
                    </Card>
                </Link>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ผู้ใช้งานทั้งหมด</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">บัญชีผู้ใช้ในระบบ</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
