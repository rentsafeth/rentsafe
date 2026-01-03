'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Megaphone, TrendingUp, DollarSign, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AdSettings {
    daily_boost_price: number;
    ppc_min_bid: number;
    ppc_enabled: boolean;
}

export default function AdminAdsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AdSettings>({
        daily_boost_price: 50,
        ppc_min_bid: 1,
        ppc_enabled: true
    });

    // Stats
    const [stats, setStats] = useState({
        activeBoosts: 0,
        activePPC: 0,
        totalRevenue: 0 // Placeholder for now
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Settings
            const { data: configData } = await supabase
                .from('system_configs')
                .select('value')
                .eq('key', 'ads_settings')
                .single();

            if (configData) {
                setSettings(configData.value);
            }

            // Fetch Stats (Mockup logic for now, real logic would query transactions)
            const { count: boostCount } = await supabase
                .from('shop_ad_settings')
                .select('*', { count: 'exact', head: true })
                .gt('boost_expires_at', new Date().toISOString());

            const { count: ppcCount } = await supabase
                .from('shop_ad_settings')
                .select('*', { count: 'exact', head: true })
                .eq('ppc_enabled', true);

            setStats({
                activeBoosts: boostCount || 0,
                activePPC: ppcCount || 0,
                totalRevenue: 0
            });

        } catch (error) {
            console.error('Error fetching ads data:', error);
            toast.error('ไม่สามารถดึงข้อมูลโฆษณาได้');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('system_configs')
                .upsert({
                    key: 'ads_settings',
                    value: settings,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">จัดการโฆษณา (Ads Management)</h1>
                    <p className="text-gray-500">ควบคุมราคาและตั้งค่าระบบโฆษณา</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Boosts</CardTitle>
                        <Megaphone className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeBoosts}</div>
                        <p className="text-xs text-muted-foreground">ร้านค้าที่กำลังโปรโมทรายวัน</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active PPC</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activePPC}</div>
                        <p className="text-xs text-muted-foreground">ร้านค้าที่เปิดระบบประมูลคลิก</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (Est.)</CardTitle>
                        <DollarSign className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">N/A</div>
                        <p className="text-xs text-muted-foreground">รายได้รวมจากโฆษณา (Coming Soon)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Settings Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" /> ตั้งค่าราคา (Pricing Configuration)
                    </CardTitle>
                    <CardDescription>กำหนดราคามาตรฐานสำหรับบริการโฆษณาต่างๆ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="daily-boost" className="font-semibold">Daily Boost Price</Label>
                                <Badge variant="secondary">Credits / Day</Badge>
                            </div>
                            <p className="text-sm text-gray-500">ราคาสำหรับการโปรโมทรายวัน เพื่อดันร้านค้าขึ้นสู่ตำแหน่งแนะนำ</p>
                            <Input
                                id="daily-boost"
                                type="number"
                                value={settings.daily_boost_price}
                                onChange={(e) => setSettings({ ...settings, daily_boost_price: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="ppc-bid" className="font-semibold">PPC Minimum Bid</Label>
                                <Badge variant="secondary">Credits / Click</Badge>
                            </div>
                            <p className="text-sm text-gray-500">ราคาประมูลขั้นต่ำต่อการคลิก 1 ครั้ง (Pay Per Click)</p>
                            <Input
                                id="ppc-bid"
                                type="number"
                                value={settings.ppc_min_bid}
                                onChange={(e) => setSettings({ ...settings, ppc_min_bid: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-4 border-t">
                        <Switch
                            id="ppc-enabled"
                            checked={settings.ppc_enabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, ppc_enabled: checked })}
                        />
                        <Label htmlFor="ppc-enabled">เปิดใช้งานระบบ PPC (Pay Per Click)</Label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            บันทึกการตั้งค่า
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
