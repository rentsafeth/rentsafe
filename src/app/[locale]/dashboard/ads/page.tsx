'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------- Type Definitions ----------
interface Shop {
    id: string;
    credit_balance: number;
    [key: string]: any;
}

interface SystemSettings {
    daily_boost_price?: string;
    min_ppc_bid?: string;
    max_ppc_bid?: string;
    min_featured_bid?: string;
    [key: string]: any;
}

interface Schedule {
    id: string;
    shop_id: string;
    type: 'boost' | 'ppc';
    start_date: string;
    end_date: string;
    total_days: number;
    total_credits: number;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    ppc_bid?: number;
    ppc_daily_budget?: number;
    created_at: string;
    [key: string]: any;
}

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Zap, MousePointer, TrendingUp, Eye, Coins,
    Clock, BarChart3, ArrowLeft, Loader2, AlertCircle,
    CheckCircle, Info, Calendar, Plus, Trash2, Edit2,
    ChevronDown, ChevronUp
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AdSettings {
    ppc_enabled: boolean;
    ppc_bid: number;
    ppc_daily_budget: number;
    ppc_spent_today: number;
    boost_active: boolean;
    boost_expires_at: string | null;
    featured_bid: number;
    featured_active: boolean;
    featured_expires_at: string | null;
}

interface AdStats {
    impressions: number;
    clicks: number;
    credits_spent: number;
    ctr: number;
}

interface DailyStat {
    stat_date: string;
    impressions: number;
    clicks: number;
    credits_spent: number;
}



export default function AdsPage() {
    const router = useRouter();
    const locale = useLocale();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('boost');
    const [shop, setShop] = useState<Shop | null>(null);
    const [adSettings, setAdSettings] = useState<AdSettings>({
        ppc_enabled: false,
        ppc_bid: 5,
        ppc_daily_budget: 0,
        ppc_spent_today: 0,
        boost_active: false,
        boost_expires_at: null,
        featured_bid: 0,
        featured_active: false,
        featured_expires_at: null,
    });
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({} as SystemSettings);
    const [todayStats, setTodayStats] = useState<AdStats>({
        impressions: 0,
        clicks: 0,
        credits_spent: 0,
        ctr: 0,
    });
    const [weeklyStats, setWeeklyStats] = useState<DailyStat[]>([]);
    const [showFormula, setShowFormula] = useState(false);

    // Schedules (both boost and ppc)
    const [boostSchedules, setBoostSchedules] = useState<Schedule[]>([]);
    const [ppcSchedules, setPpcSchedules] = useState<Schedule[]>([]);

    // Schedule dialog
    const [scheduleDialog, setScheduleDialog] = useState<'boost' | 'ppc' | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [scheduleForm, setScheduleForm] = useState({
        startDate: '',
        endDate: '',
        ppcBid: 5,
        ppcDailyBudget: 100,
    });
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ id: string; type: 'boost' | 'ppc' } | null>(null);
    const [deletingSchedule, setDeletingSchedule] = useState(false);

    // Instant boost
    const [boostDialog, setBoostDialog] = useState(false);
    const [buyingBoost, setBuyingBoost] = useState(false);

    // Toast/notification modal state
    const [toastModal, setToastModal] = useState<{
        open: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
    }>({ open: false, type: 'success', title: '', message: '' });

    const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
        setToastModal({ open: true, type, title, message });
    };

    const loadData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            const { data: shopData } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', user.id)
                .single();
            if (!shopData) {
                router.push('/dashboard');
                return;
            }
            setShop(shopData);
            const { data: settings } = await supabase
                .from('shop_ad_settings')
                .select('*')
                .eq('shop_id', shopData.id)
                .single();
            if (settings) {
                setAdSettings(settings);
            }
            const { data: sysSettings } = await supabase
                .from('system_settings')
                .select('*')
                .in('key', ['daily_boost_price', 'min_ppc_bid', 'max_ppc_bid', 'min_featured_bid']);
            const settingsMap: Record<string, any> = {};
            sysSettings?.forEach(s => {
                settingsMap[s.key] = typeof s.value === 'string'
                    ? (s.value.startsWith('"') ? s.value.replace(/"/g, '') : s.value)
                    : s.value;
            });
            setSystemSettings(settingsMap as SystemSettings);
            const today = new Date().toISOString().split('T')[0];
            const { data: dailyStats } = await supabase
                .from('ad_stats_daily')
                .select('*')
                .eq('shop_id', shopData.id)
                .eq('stat_date', today)
                .single();
            if (dailyStats) {
                setTodayStats({
                    impressions: dailyStats.impressions || 0,
                    clicks: dailyStats.clicks || 0,
                    credits_spent: dailyStats.credits_spent || 0,
                    ctr: dailyStats.impressions > 0
                        ? ((dailyStats.clicks / dailyStats.impressions) * 100)
                        : 0,
                });
            }
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { data: weekly } = await supabase
                .from('ad_stats_daily')
                .select('*')
                .eq('shop_id', shopData.id)
                .gte('stat_date', weekAgo.toISOString().split('T')[0])
                .order('stat_date', { ascending: true });
            setWeeklyStats(weekly || []);
            const { data: schedules } = await supabase
                .from('ad_schedules')
                .select('*')
                .eq('shop_id', shopData.id)
                .neq('status', 'cancelled')
                .order('start_date', { ascending: true });
            if (schedules) {
                setBoostSchedules(schedules.filter(s => s.type === 'boost'));
                setPpcSchedules(schedules.filter(s => s.type === 'ppc'));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [supabase, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);



    const savePPCSettings = async () => {
        if (!shop) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('shop_ad_settings')
                .upsert({
                    shop_id: shop.id,
                    ppc_enabled: adSettings.ppc_enabled,
                    ppc_bid: adSettings.ppc_bid,
                    ppc_daily_budget: adSettings.ppc_daily_budget,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'shop_id' });

            if (error) throw error;
            showToast('success', 'สำเร็จ', 'บันทึกการตั้งค่า PPC สำเร็จ');
        } catch (error) {
            console.error('Error saving PPC settings:', error);
            showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
        } finally {
            setSaving(false);
        }
    };

    const purchaseBoost = async () => {
        if (!shop) return;
        setBuyingBoost(true);

        try {
            const { data, error } = await supabase.rpc('purchase_daily_boost', {
                p_shop_id: shop.id
            });

            if (error) throw error;

            if (data?.success) {
                setAdSettings(prev => ({
                    ...prev,
                    boost_active: true,
                    boost_expires_at: data.expires_at,
                }));
                setShop((prev) => ({
                    ...prev as Shop,
                    credit_balance: data.new_balance,
                }));
                setBoostDialog(false);
                showToast('success', 'สำเร็จ', 'ซื้อ Daily Boost สำเร็จ! ร้านของคุณจะแสดงผลก่อนร้านอื่นเป็นเวลา 24 ชั่วโมง');
            } else {
                showToast('error', 'ไม่สามารถซื้อได้',
                    data?.error === 'insufficient_credits'
                        ? 'เครดิตไม่เพียงพอ กรุณาเติมเครดิตก่อน'
                        : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
            }
        } catch (error) {
            console.error('Error purchasing boost:', error);
            showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถซื้อ Daily Boost ได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setBuyingBoost(false);
        }
    };

    // Schedule functions
    const openScheduleDialog = (type: 'boost' | 'ppc', schedule?: Schedule) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setScheduleForm({
                startDate: schedule.start_date,
                endDate: schedule.end_date,
                ppcBid: schedule.ppc_bid || 5,
                ppcDailyBudget: schedule.ppc_daily_budget || 100,
            });
        } else {
            setEditingSchedule(null);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setScheduleForm({
                startDate: tomorrow.toISOString().split('T')[0],
                endDate: tomorrow.toISOString().split('T')[0],
                ppcBid: adSettings.ppc_bid || 5,
                ppcDailyBudget: adSettings.ppc_daily_budget || 100,
            });
        }
        setScheduleDialog(type);
    };

    const calculateScheduleCost = (type: 'boost' | 'ppc') => {
        if (!scheduleForm.startDate || !scheduleForm.endDate) return 0;
        const days = calculateDays();
        if (type === 'boost') {
            return days * boostPrice;
        } else {
            // PPC: estimate based on daily budget
            return days * scheduleForm.ppcDailyBudget;
        }
    };

    const calculateDays = () => {
        if (!scheduleForm.startDate || !scheduleForm.endDate) return 0;
        const start = new Date(scheduleForm.startDate);
        const end = new Date(scheduleForm.endDate);
        return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    };

    const saveSchedule = async () => {
        if (!shop || !scheduleForm.startDate || !scheduleForm.endDate || !scheduleDialog) return;

        const type = scheduleDialog;
        const totalCredits = calculateScheduleCost(type);
        const days = calculateDays();
        const schedulesList = type === 'boost' ? boostSchedules : ppcSchedules;

        // Check credit balance (only for boost, PPC uses budget limit)
        if (type === 'boost' && !editingSchedule && totalCredits > shop.credit_balance) {
            showToast('warning', 'เครดิตไม่เพียงพอ', 'กรุณาเติมเครดิตก่อนทำการจอง');
            return;
        }

        // Validate dates
        const today = new Date().toISOString().split('T')[0];
        if (scheduleForm.startDate < today && !editingSchedule) {
            showToast('warning', 'วันที่ไม่ถูกต้อง', 'วันเริ่มต้นต้องเป็นวันนี้หรือหลังจากนี้');
            return;
        }

        if (scheduleForm.endDate < scheduleForm.startDate) {
            showToast('warning', 'วันที่ไม่ถูกต้อง', 'วันสิ้นสุดต้องมากกว่าหรือเท่ากับวันเริ่มต้น');
            return;
        }

        // Check overlapping schedules
        const overlapping = schedulesList.find(s => {
            if (editingSchedule && s.id === editingSchedule.id) return false;
            const sStart = new Date(s.start_date);
            const sEnd = new Date(s.end_date);
            const newStart = new Date(scheduleForm.startDate);
            const newEnd = new Date(scheduleForm.endDate);
            return (newStart <= sEnd && newEnd >= sStart);
        });

        if (overlapping) {
            showToast('warning', 'วันที่ทับซ้อน', 'มีการจองที่ทับซ้อนกัน กรุณาเลือกวันอื่น');
            return;
        }

        setSavingSchedule(true);

        try {
            const scheduleData: Partial<Schedule> = {
                shop_id: shop.id,
                type,
                start_date: scheduleForm.startDate,
                end_date: scheduleForm.endDate,
                total_days: days,
                total_credits: type === 'boost' ? totalCredits : 0, // PPC doesn't pre-charge
                status: 'pending',
            };

            if (type === 'ppc') {
                scheduleData.ppc_bid = scheduleForm.ppcBid;
                scheduleData.ppc_daily_budget = scheduleForm.ppcDailyBudget;
            }

            if (editingSchedule) {
                const { error } = await supabase
                    .from('ad_schedules')
                    .update({
                        ...scheduleData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingSchedule.id);

                if (error) throw error;
            } else {
                const { error: insertError } = await supabase
                    .from('ad_schedules')
                    .insert(scheduleData);

                if (insertError) throw insertError;

                // Deduct credits only for boost
                if (type === 'boost') {
                    const { error: creditError } = await supabase
                        .from('shops')
                        .update({ credit_balance: shop.credit_balance - totalCredits })
                        .eq('id', shop.id);

                    if (creditError) throw creditError;

                    await supabase
                        .from('credit_transactions')
                        .insert({
                            shop_id: shop.id,
                            amount: -totalCredits,
                            type: 'daily_boost',
                            description: `จอง Daily Boost ${days} วัน (${scheduleForm.startDate} ถึง ${scheduleForm.endDate})`,
                            balance_after: shop.credit_balance - totalCredits,
                        });

                    setShop((prev: any) => ({
                        ...prev,
                        credit_balance: prev.credit_balance - totalCredits,
                    }));
                }
            }

            setScheduleDialog(null);
            loadData();
            showToast('success', 'สำเร็จ', editingSchedule ? 'แก้ไขการจองสำเร็จ' : 'จองล่วงหน้าสำเร็จ');
        } catch (error) {
            console.error('Error saving schedule:', error);
            showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการจองได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setSavingSchedule(false);
        }
    };

    const cancelSchedule = async () => {
        if (!deleteDialog || !shop) return;
        setDeletingSchedule(true);

        try {
            const schedulesList = deleteDialog.type === 'boost' ? boostSchedules : ppcSchedules;
            const schedule = schedulesList.find(s => s.id === deleteDialog.id);
            if (!schedule) return;

            // Update schedule status
            const { error: updateError } = await supabase
                .from('ad_schedules')
                .update({ status: 'cancelled' })
                .eq('id', deleteDialog.id);

            if (updateError) throw updateError;

            // Only refund boost schedules that are pending
            if (deleteDialog.type === 'boost' && schedule.status === 'pending' && schedule.total_credits > 0) {
                const { error: creditError } = await supabase
                    .from('shops')
                    .update({ credit_balance: shop.credit_balance + schedule.total_credits })
                    .eq('id', shop.id);

                if (creditError) throw creditError;

                await supabase
                    .from('credit_transactions')
                    .insert({
                        shop_id: shop.id,
                        amount: schedule.total_credits,
                        type: 'refund',
                        description: `คืนเครดิตจากการยกเลิกจอง Boost (${schedule.start_date} ถึง ${schedule.end_date})`,
                        balance_after: shop.credit_balance + schedule.total_credits,
                    });

                setShop((prev: any) => ({
                    ...prev,
                    credit_balance: prev.credit_balance + schedule.total_credits,
                }));
            }

            setDeleteDialog(null);
            loadData();
            showToast('success', 'สำเร็จ', 'ยกเลิกการจองสำเร็จ เครดิตได้ถูกคืนกลับแล้ว');
        } catch (error) {
            console.error('Error cancelling schedule:', error);
            showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถยกเลิกการจองได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setDeletingSchedule(false);
        }
    };

    const boostPrice = parseInt(systemSettings?.daily_boost_price || '50');
    const minPPC = parseInt(systemSettings?.min_ppc_bid || '1');
    const maxPPC = parseInt(systemSettings?.max_ppc_bid || '100');

    const isBoostActive = adSettings.boost_active &&
        adSettings.boost_expires_at &&
        new Date(adSettings.boost_expires_at) > new Date();

    const boostTimeRemaining = isBoostActive && adSettings.boost_expires_at
        ? Math.max(0, Math.floor((new Date(adSettings.boost_expires_at).getTime() - Date.now()) / 1000 / 60 / 60))
        : 0;

    const getScheduleStatus = (schedule: Schedule) => {
        const today = new Date().toISOString().split('T')[0];
        if (schedule.status === 'cancelled') return 'cancelled';
        if (schedule.status === 'completed') return 'completed';
        if (schedule.start_date <= today && schedule.end_date >= today) return 'active';
        if (schedule.start_date > today) return 'pending';
        return 'completed';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500 text-white">กำลังใช้งาน</Badge>;
            case 'pending':
                return <Badge className="bg-blue-500 text-white">รอดำเนินการ</Badge>;
            case 'completed':
                return <Badge className="bg-gray-400 text-white">เสร็จสิ้น</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-500 text-white">ยกเลิกแล้ว</Badge>;
            default:
                return null;
        }
    };

    const renderScheduleList = (schedules: Schedule[], type: 'boost' | 'ppc') => {
        if (schedules.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มีการจองล่วงหน้า</p>
                    <p className="text-sm">กดปุ่ม "จองใหม่" เพื่อเริ่มต้น</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {schedules.map(schedule => {
                    const status = getScheduleStatus(schedule);
                    const canEdit = status === 'pending';

                    return (
                        <div
                            key={schedule.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${status === 'active'
                                ? 'bg-green-50 border-green-200'
                                : status === 'pending'
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${status === 'active'
                                    ? 'bg-green-100'
                                    : status === 'pending'
                                        ? 'bg-blue-100'
                                        : 'bg-gray-100'
                                    }`}>
                                    {type === 'boost' ? (
                                        <Zap className={`w-5 h-5 ${status === 'active' ? 'text-green-600' : status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                                            }`} />
                                    ) : (
                                        <MousePointer className={`w-5 h-5 ${status === 'active' ? 'text-green-600' : status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                                            }`} />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">
                                            {new Date(schedule.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {schedule.start_date !== schedule.end_date && (
                                                <> - {new Date(schedule.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                                            )}
                                        </span>
                                        {getStatusBadge(status)}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {schedule.total_days} วัน
                                        {type === 'boost' && <> • {schedule.total_credits} เครดิต</>}
                                        {type === 'ppc' && <> • Bid: {schedule.ppc_bid} • งบ/วัน: {schedule.ppc_daily_budget}</>}
                                    </p>
                                </div>
                            </div>
                            {canEdit && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openScheduleDialog(type, schedule)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setDeleteDialog({ id: schedule.id, type })}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">จัดการโฆษณา</h1>
                        <p className="text-gray-500">เพิ่มการมองเห็นร้านของคุณ</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-lg">
                        {(shop?.credit_balance || 0).toLocaleString()} เครดิต
                    </span>
                    <Link href={`/${locale}/dashboard/credits`}>
                        <Button variant="outline" size="sm">เติมเครดิต</Button>
                    </Link>
                </div>
            </div>

            {/* Search Ranking Formula */}
            <Card className="mb-6 border-2 border-emerald-200">
                <CardHeader
                    className="bg-gradient-to-r from-emerald-50 to-teal-50 cursor-pointer transition-colors hover:bg-emerald-100/50"
                    onClick={() => setShowFormula(!showFormula)}
                >
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            สูตรคำนวณคะแนนอันดับการค้นหา
                        </div>
                        {showFormula ? (
                            <ChevronUp className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-emerald-600" />
                        )}
                    </CardTitle>
                </CardHeader>
                {showFormula && (
                    <CardContent className="pt-6">
                        {/* Formula Display */}
                        <div className="bg-slate-900 text-white rounded-lg p-4 mb-6 overflow-x-auto">
                            <code className="text-sm sm:text-base">
                                <span className="text-emerald-400">คะแนนรวม</span> = (
                                <span className="text-yellow-400">Boost × 1000</span>) + (
                                <span className="text-blue-400">PPC_Bid × 10</span>) + (
                                <span className="text-purple-400">Rating × 20</span>) + (
                                <span className="text-pink-400">รีวิว × 2</span>) + (
                                <span className="text-orange-400">Verified × 50</span>)
                            </code>
                        </div>

                        {/* Factor Explanation */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap className="w-4 h-4 text-yellow-600" />
                                    <span className="font-medium text-yellow-800">Daily Boost</span>
                                </div>
                                <p className="text-sm text-yellow-700">+1,000 คะแนน เมื่อเปิดใช้งาน</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <MousePointer className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">PPC Bid</span>
                                </div>
                                <p className="text-sm text-blue-700">Bid × 10 คะแนน (เช่น Bid 5 = +50)</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Eye className="w-4 h-4 text-purple-600" />
                                    <span className="font-medium text-purple-800">Rating เฉลี่ย</span>
                                </div>
                                <p className="text-sm text-purple-700">Rating × 20 คะแนน (เช่น 4.5 = +90)</p>
                            </div>
                            <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <BarChart3 className="w-4 h-4 text-pink-600" />
                                    <span className="font-medium text-pink-800">จำนวนรีวิว</span>
                                </div>
                                <p className="text-sm text-pink-700">รีวิว × 2 คะแนน (เช่น 25 รีวิว = +50)</p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-orange-600" />
                                    <span className="font-medium text-orange-800">ร้านรับรอง</span>
                                </div>
                                <p className="text-sm text-orange-700">+50 คะแนน (เฉพาะแพ็คเกจ Pro)</p>
                            </div>
                        </div>

                        {/* Example Calculation */}
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                            <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                ตัวอย่างการคำนวณ
                            </h4>
                            <div className="space-y-3 text-sm">
                                {/* Shop A */}
                                <div className="bg-white rounded-lg p-3">
                                    <p className="font-medium text-gray-800 mb-2">ร้าน A (เปิด Boost + PPC)</p>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Boost: +1,000</span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">PPC(10): +100</span>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Rating(4.8): +96</span>
                                        <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded">รีวิว(30): +60</span>
                                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Verified: +50</span>
                                    </div>
                                    <p className="mt-2 font-bold text-emerald-600">รวม = 1,306 คะแนน</p>
                                </div>
                                {/* Shop B */}
                                <div className="bg-white rounded-lg p-3">
                                    <p className="font-medium text-gray-800 mb-2">ร้าน B (ร้านธรรมดา)</p>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">Boost: 0</span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">PPC: 0</span>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Rating(4.2): +84</span>
                                        <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded">รีวิว(10): +20</span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">ไม่ Verified: 0</span>
                                    </div>
                                    <p className="mt-2 font-bold text-gray-600">รวม = 104 คะแนน</p>
                                </div>
                                <p className="text-emerald-700 text-xs mt-2">
                                    * ร้าน A จะแสดงก่อนร้าน B เพราะมีคะแนนรวมสูงกว่า
                                </p>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Stats Overview */}
            <Card className="mb-6 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 pb-3">
                    <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        สถิติวันนี้
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
                        <div className="p-4 sm:p-6 hover:bg-blue-50/50 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <div className="p-1.5 rounded-full bg-blue-100">
                                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <span className="text-xs sm:text-sm">การแสดงผล</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{todayStats.impressions.toLocaleString()}</p>
                        </div>
                        <div className="p-4 sm:p-6 hover:bg-green-50/50 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <div className="p-1.5 rounded-full bg-green-100">
                                    <MousePointer className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                <span className="text-xs sm:text-sm">คลิก</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{todayStats.clicks.toLocaleString()}</p>
                        </div>
                        <div className="p-4 sm:p-6 hover:bg-purple-50/50 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <div className="p-1.5 rounded-full bg-purple-100">
                                    <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                                </div>
                                <span className="text-xs sm:text-sm">CTR</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{todayStats.ctr.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 sm:p-6 hover:bg-red-50/50 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <div className="p-1.5 rounded-full bg-red-100">
                                    <Coins className="w-3.5 h-3.5 text-red-600" />
                                </div>
                                <span className="text-xs sm:text-sm">ใช้ไป</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-red-600">-{todayStats.credits_spent.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-gray-100">
                    <TabsTrigger
                        value="boost"
                        className={`flex items-center gap-2 h-full transition-all ${activeTab === 'boost'
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg'
                            : 'hover:bg-gray-200'
                            }`}
                    >
                        <Zap className="w-4 h-4" />
                        Daily Boost
                    </TabsTrigger>
                    <TabsTrigger
                        value="ppc"
                        className={`flex items-center gap-2 h-full transition-all ${activeTab === 'ppc'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                            : 'hover:bg-gray-200'
                            }`}
                    >
                        <MousePointer className="w-4 h-4" />
                        Pay Per Click
                    </TabsTrigger>
                    <TabsTrigger
                        value="stats"
                        className={`flex items-center gap-2 h-full transition-all ${activeTab === 'stats'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                            : 'hover:bg-gray-200'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        สถิติ
                    </TabsTrigger>
                </TabsList>

                {/* Daily Boost Tab */}
                <TabsContent value="boost">
                    <div className="space-y-6">
                        {/* Instant Boost Card */}
                        <Card className="border-2 border-yellow-200">
                            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Daily Boost ทันที
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <ul className="space-y-2 text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                แสดงผลก่อนร้านอื่นในผลค้นหา
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                ใช้งานได้ 24 ชั่วโมง
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                มี Badge พิเศษแสดงว่าเป็นร้านแนะนำ
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <p className="text-4xl font-bold text-orange-600">{boostPrice}</p>
                                        <p className="text-gray-500">เครดิต/วัน</p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t">
                                    {isBoostActive ? (
                                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-green-500 text-white">
                                                    <Zap className="w-3 h-3 mr-1" />
                                                    กำลังใช้งาน
                                                </Badge>
                                                <span className="text-gray-600">เหลืออีก {boostTimeRemaining} ชั่วโมง</span>
                                            </div>
                                            <Clock className="w-5 h-5 text-green-500" />
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full h-12 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                                            onClick={() => setBoostDialog(true)}
                                            disabled={shop?.credit_balance < boostPrice}
                                        >
                                            <Zap className="w-5 h-5 mr-2" />
                                            ซื้อ Daily Boost ทันที
                                        </Button>
                                    )}
                                </div>

                                {shop?.credit_balance < boostPrice && !isBoostActive && (
                                    <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-4 rounded-lg mt-4">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>เครดิตไม่เพียงพอ กรุณาเติมเครดิตก่อน</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Schedule Boost Card */}
                        <Card className="border-2 border-blue-200">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                        จอง Boost ล่วงหน้า
                                    </CardTitle>
                                    <Button onClick={() => openScheduleDialog('boost')} className="bg-blue-500 hover:bg-blue-600">
                                        <Plus className="w-4 h-4 mr-2" />
                                        จองใหม่
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">จองล่วงหน้าคืออะไร?</p>
                                            <p>วางแผนการโฆษณาล่วงหน้า สามารถเลือกช่วงวันที่ต้องการได้ ระบบจะเปิดใช้งาน Boost อัตโนมัติตามวันที่กำหนด</p>
                                        </div>
                                    </div>
                                </div>
                                {renderScheduleList(boostSchedules, 'boost')}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* PPC Tab */}
                <TabsContent value="ppc">
                    <div className="space-y-6">
                        {/* Current PPC Settings */}
                        <Card className="border-2 border-blue-200">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <CardTitle className="flex items-center gap-2">
                                    <MousePointer className="w-5 h-5 text-blue-500" />
                                    ตั้งค่า PPC ปัจจุบัน
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">PPC คืออะไร?</p>
                                            <p>จ่ายเครดิตเมื่อมีคนคลิกเข้าดูร้านของคุณ ยิ่งตั้งราคาสูง ยิ่งแสดงผลก่อนร้านอื่น</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${adSettings.ppc_enabled ? 'bg-green-50 border border-green-200 shadow-sm' : 'bg-gray-50 border border-transparent'}`}>
                                    <div>
                                        <Label className={`text-base font-bold transition-colors ${adSettings.ppc_enabled ? 'text-green-800' : 'text-gray-700'}`}>เปิดใช้งาน PPC</Label>
                                        <p className={`text-sm transition-colors ${adSettings.ppc_enabled ? 'text-green-600' : 'text-gray-500'}`}>เมื่อเปิด จะหักเครดิตอัตโนมัติเมื่อมีคนคลิก</p>
                                    </div>
                                    <Switch
                                        checked={adSettings.ppc_enabled}
                                        onCheckedChange={(checked) =>
                                            setAdSettings(prev => ({ ...prev, ppc_enabled: checked }))
                                        }
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="ppc_bid">ราคาต่อคลิก (เครดิต)</Label>
                                        <Input
                                            id="ppc_bid"
                                            type="number"
                                            min={minPPC}
                                            max={maxPPC}
                                            value={adSettings.ppc_bid}
                                            onChange={(e) =>
                                                setAdSettings(prev => ({
                                                    ...prev,
                                                    ppc_bid: parseInt(e.target.value) || minPPC
                                                }))
                                            }
                                        />
                                        <p className="text-xs text-gray-500">ขั้นต่ำ {minPPC} - สูงสุด {maxPPC} เครดิต</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ppc_budget">งบประมาณต่อวัน (เครดิต)</Label>
                                        <Input
                                            id="ppc_budget"
                                            type="number"
                                            min={0}
                                            value={adSettings.ppc_daily_budget}
                                            onChange={(e) =>
                                                setAdSettings(prev => ({
                                                    ...prev,
                                                    ppc_daily_budget: parseInt(e.target.value) || 0
                                                }))
                                            }
                                        />
                                        <p className="text-xs text-gray-500">0 = ไม่จำกัด (ใช้เครดิตจนหมด)</p>
                                    </div>
                                </div>

                                {adSettings.ppc_enabled && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">ใช้ไปวันนี้</span>
                                            <span className="font-semibold">
                                                {adSettings.ppc_spent_today} / {adSettings.ppc_daily_budget || '∞'} เครดิต
                                            </span>
                                        </div>
                                        {adSettings.ppc_daily_budget > 0 && (
                                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{
                                                        width: `${Math.min(100, (adSettings.ppc_spent_today / adSettings.ppc_daily_budget) * 100)}%`
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Button
                                    onClick={savePPCSettings}
                                    disabled={saving}
                                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-300"
                                >
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    บันทึกการตั้งค่า PPC
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Schedule PPC Card */}
                        <Card className="border-2 border-indigo-200">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-indigo-500" />
                                        จอง PPC ล่วงหน้า
                                    </CardTitle>
                                    <Button onClick={() => openScheduleDialog('ppc')} className="bg-indigo-500 hover:bg-indigo-600">
                                        <Plus className="w-4 h-4 mr-2" />
                                        จองใหม่
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-5 h-5 text-indigo-500 mt-0.5" />
                                        <div className="text-sm text-indigo-800">
                                            <p className="font-medium mb-1">จอง PPC ล่วงหน้าคืออะไร?</p>
                                            <p>ตั้งค่า PPC ให้ทำงานอัตโนมัติในช่วงวันที่กำหนด พร้อมกำหนด Bid และงบประมาณต่อวันได้</p>
                                        </div>
                                    </div>
                                </div>
                                {renderScheduleList(ppcSchedules, 'ppc')}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats">
                    <Card className="border-2 border-purple-200">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-purple-500" />
                                สถิติ 7 วันล่าสุด
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {weeklyStats.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>ยังไม่มีข้อมูลสถิติ</p>
                                    <p className="text-sm">เริ่มใช้โฆษณาเพื่อดูสถิติ</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        {weeklyStats.map((stat) => {
                                            const maxImpressions = Math.max(...weeklyStats.map(s => s.impressions), 1);
                                            const date = new Date(stat.stat_date);
                                            const dayName = date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' });

                                            return (
                                                <div key={stat.stat_date} className="flex items-center gap-4">
                                                    <span className="w-16 text-sm text-gray-500">{dayName}</span>
                                                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                                                            style={{ width: `${(stat.impressions / maxImpressions) * 100}%` }}
                                                        />
                                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                                            {stat.impressions} views / {stat.clicks} clicks
                                                        </span>
                                                    </div>
                                                    <span className="w-20 text-right text-sm text-red-600">-{stat.credits_spent}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t mt-6">
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-600">
                                                {weeklyStats.reduce((sum, s) => sum + s.impressions, 0).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-500">การแสดงผลรวม</p>
                                        </div>
                                        <div className="text-center p-4 bg-pink-50 rounded-lg">
                                            <p className="text-2xl font-bold text-pink-600">
                                                {weeklyStats.reduce((sum, s) => sum + s.clicks, 0).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-500">คลิกรวม</p>
                                        </div>
                                        <div className="text-center p-4 bg-red-50 rounded-lg">
                                            <p className="text-2xl font-bold text-red-600">
                                                -{weeklyStats.reduce((sum, s) => sum + s.credits_spent, 0).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-500">เครดิตที่ใช้</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Instant Boost Purchase Dialog */}
            <AlertDialog open={boostDialog} onOpenChange={setBoostDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            ยืนยันซื้อ Daily Boost?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>ร้านของคุณจะแสดงผลก่อนร้านอื่นในผลค้นหาเป็นเวลา 24 ชั่วโมง</p>
                            <div className="bg-gray-50 rounded-lg p-4 mt-4">
                                <div className="flex justify-between">
                                    <span>ค่าใช้จ่าย</span>
                                    <span className="font-semibold">{boostPrice} เครดิต</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>เครดิตคงเหลือ</span>
                                    <span>{(shop?.credit_balance || 0).toLocaleString()} เครดิต</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t mt-2 font-medium">
                                    <span>หลังซื้อ</span>
                                    <span>{((shop?.credit_balance || 0) - boostPrice).toLocaleString()} เครดิต</span>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={buyingBoost}>ยกเลิก</AlertDialogCancel>
                        <Button
                            onClick={purchaseBoost}
                            disabled={buyingBoost}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500"
                        >
                            {buyingBoost && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            ยืนยันซื้อ
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Schedule Dialog (for both Boost and PPC) */}
            <Dialog open={!!scheduleDialog} onOpenChange={() => setScheduleDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {scheduleDialog === 'boost' ? (
                                <Zap className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <MousePointer className="w-5 h-5 text-blue-500" />
                            )}
                            {editingSchedule ? 'แก้ไขการจอง' : `จอง ${scheduleDialog === 'boost' ? 'Boost' : 'PPC'} ล่วงหน้า`}
                        </DialogTitle>
                        <DialogDescription>
                            เลือกช่วงวันที่ต้องการให้ {scheduleDialog === 'boost' ? 'Boost' : 'PPC'} ทำงาน
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">วันเริ่มต้น</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={scheduleForm.startDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setScheduleForm(prev => ({
                                        ...prev,
                                        startDate: e.target.value,
                                        endDate: prev.endDate < e.target.value ? e.target.value : prev.endDate
                                    }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">วันสิ้นสุด</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={scheduleForm.endDate}
                                    min={scheduleForm.startDate}
                                    onChange={(e) => setScheduleForm(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* PPC specific fields */}
                        {scheduleDialog === 'ppc' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ppcBid">ราคาต่อคลิก</Label>
                                    <Input
                                        id="ppcBid"
                                        type="number"
                                        min={minPPC}
                                        max={maxPPC}
                                        value={scheduleForm.ppcBid}
                                        onChange={(e) => setScheduleForm(prev => ({
                                            ...prev,
                                            ppcBid: parseInt(e.target.value) || minPPC
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ppcDailyBudget">งบประมาณต่อวัน</Label>
                                    <Input
                                        id="ppcDailyBudget"
                                        type="number"
                                        min={10}
                                        value={scheduleForm.ppcDailyBudget}
                                        onChange={(e) => setScheduleForm(prev => ({
                                            ...prev,
                                            ppcDailyBudget: parseInt(e.target.value) || 100
                                        }))}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                                <span>จำนวนวัน</span>
                                <span className="font-semibold">{calculateDays()} วัน</span>
                            </div>
                            {scheduleDialog === 'boost' && (
                                <>
                                    <div className="flex justify-between">
                                        <span>ราคาต่อวัน</span>
                                        <span>{boostPrice} เครดิต</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t font-medium text-lg">
                                        <span>รวมทั้งหมด</span>
                                        <span className="text-orange-600">{calculateScheduleCost('boost')} เครดิต</span>
                                    </div>
                                    {!editingSchedule && (
                                        <>
                                            <div className="flex justify-between text-gray-500 text-sm">
                                                <span>เครดิตคงเหลือ</span>
                                                <span>{(shop?.credit_balance || 0).toLocaleString()} เครดิต</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>หลังจอง</span>
                                                <span className={calculateScheduleCost('boost') > shop?.credit_balance ? 'text-red-600' : ''}>
                                                    {((shop?.credit_balance || 0) - calculateScheduleCost('boost')).toLocaleString()} เครดิต
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                            {scheduleDialog === 'ppc' && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Bid ต่อคลิก</span>
                                        <span>{scheduleForm.ppcBid} เครดิต</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>งบประมาณต่อวัน</span>
                                        <span>{scheduleForm.ppcDailyBudget} เครดิต</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t font-medium">
                                        <span>งบประมาณสูงสุด</span>
                                        <span className="text-blue-600">{calculateScheduleCost('ppc')} เครดิต</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        * PPC จะหักเครดิตตามจริงเมื่อมีคลิก ไม่ใช่หักล่วงหน้า
                                    </p>
                                </>
                            )}
                        </div>

                        {scheduleDialog === 'boost' && !editingSchedule && calculateScheduleCost('boost') > shop?.credit_balance && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">เครดิตไม่เพียงพอ</span>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduleDialog(null)} disabled={savingSchedule}>
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={saveSchedule}
                            disabled={savingSchedule || (scheduleDialog === 'boost' && !editingSchedule && calculateScheduleCost('boost') > shop?.credit_balance)}
                            className={scheduleDialog === 'boost' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'}
                        >
                            {savingSchedule && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingSchedule ? 'บันทึกการแก้ไข' : 'ยืนยันการจอง'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Schedule Dialog */}
            <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            ยืนยันยกเลิกการจอง?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteDialog?.type === 'boost' ? (
                                <>
                                    <p>เครดิตที่ชำระไว้จะถูกคืนกลับเข้าบัญชีของคุณ</p>
                                    {deleteDialog && boostSchedules.find(s => s.id === deleteDialog.id) && (
                                        <div className="bg-gray-50 rounded-lg p-4 mt-4">
                                            <div className="flex justify-between">
                                                <span>เครดิตที่จะได้คืน</span>
                                                <span className="font-semibold text-green-600">
                                                    +{boostSchedules.find(s => s.id === deleteDialog.id)?.total_credits} เครดิต
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p>การจอง PPC จะถูกยกเลิก</p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingSchedule}>ไม่ยกเลิก</AlertDialogCancel>
                        <Button variant="destructive" onClick={cancelSchedule} disabled={deletingSchedule}>
                            {deletingSchedule && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            ยืนยันยกเลิก
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Toast/Notification Modal */}
            <AlertDialog open={toastModal.open} onOpenChange={(open) => setToastModal(prev => ({ ...prev, open }))}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className={`flex items-center gap-2 ${toastModal.type === 'success' ? 'text-green-600' :
                            toastModal.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                            {toastModal.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {toastModal.type === 'error' && <AlertCircle className="w-5 h-5" />}
                            {toastModal.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                            {toastModal.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {toastModal.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            onClick={() => setToastModal(prev => ({ ...prev, open: false }))}
                            className={
                                toastModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                                    toastModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
                            }
                        >
                            ตกลง
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
