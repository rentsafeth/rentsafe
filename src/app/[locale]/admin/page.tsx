import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ShieldAlert, Users, CheckCircle } from 'lucide-react';
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

    const { count: totalShops } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true });

    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/admin/shops">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                            <Store className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingShops || 0}</div>
                            <p className="text-xs text-muted-foreground">Shops waiting for approval</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/reports">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingReports || 0}</div>
                            <p className="text-xs text-muted-foreground">Reports waiting for moderation</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/shops/manage">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalShops || 0}</div>
                            <p className="text-xs text-muted-foreground">Registered rental shops</p>
                        </CardContent>
                    </Card>
                </Link>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">Registered accounts</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
