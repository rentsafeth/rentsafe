'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Crown,
    Loader2,
    Calendar,
    Clock,
    CheckCircle,
    AlertTriangle,
    CreditCard,
    Shield,
    Search,
    Phone,
    Bell,
    Star,
    ArrowRight,
    Coins,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { StandaloneAlert } from '@/components/ui/alert-modal';

type SubscriptionStatus = {
    hasSubscription: boolean;
    plan: {
        id: string;
        name: string;
        slug: string;
        price: number;
        credits_price: number;
        duration_days: number;
    } | null;
    subscription: {
        id: string;
        status: string;
        starts_at: string;
        ends_at: string;
        auto_renew_enabled: boolean;
    } | null;
    daysRemaining: number;
    isExpiringSoon: boolean;
};

const plans = [
    {
        slug: 'pro_monthly',
        name: 'ร้านรับรอง รายเดือน',
        credits_price: 99,
        period: '/เดือน',
        duration_days: 30,
        features: [
            'ค้นหา Blacklist ไม่จำกัด',
            'Badge "ร้านรับรอง" + มงกุฏ',
            'ปุ่มโทร/LINE ในผลค้นหา',
            'แสดงอันดับต้นในผลค้นหา',
            'รับประกันมัดจำ 1,000 บาท',
            'แจ้งเตือน Blacklist ใหม่',
        ],
    },
    {
        slug: 'pro_yearly',
        name: 'ร้านรับรอง รายปี',
        credits_price: 999,
        period: '/ปี',
        duration_days: 365,
        originalPrice: 1188,
        savings: 189,
        features: [
            'ค้นหา Blacklist ไม่จำกัด',
            'Badge "ร้านรับรอง" + มงกุฏ',
            'ปุ่มโทร/LINE ในผลค้นหา',
            'แสดงอันดับต้นในผลค้นหา',
            'รับประกันมัดจำ 1,000 บาท',
            'แจ้งเตือน Blacklist ใหม่',
            'ประหยัด 189 เครดิต/ปี',
        ],
        recommended: true,
    },
];

export default function SubscriptionPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState<any>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [creditBalance, setCreditBalance] = useState(0);

    // Purchase state
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);

    // Alert state
    const [alertState, setAlertState] = useState({
        isOpen: false,
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        title: '',
        message: '',
    });

    const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        setAlertState({ isOpen: true, type, title, message });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Get shop with credit balance
            const { data: shopData } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (!shopData) {
                router.push('/register/shop');
                return;
            }

            setShop(shopData);
            setCreditBalance(shopData.credit_balance || 0);

            // Get subscription status
            const { data: subscription } = await supabase
                .from('shop_subscriptions')
                .select(`
                    *,
                    plan:subscription_plans(*)
                `)
                .eq('shop_id', shopData.id)
                .eq('status', 'active')
                .single();

            if (subscription) {
                const endsAt = new Date(subscription.expires_at || subscription.ends_at);
                const now = new Date();
                const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                setSubscriptionStatus({
                    hasSubscription: true,
                    plan: subscription.plan,
                    subscription: {
                        id: subscription.id,
                        status: subscription.status,
                        starts_at: subscription.started_at,
                        ends_at: subscription.expires_at || subscription.ends_at,
                        auto_renew_enabled: subscription.auto_renew_enabled || false,
                    },
                    daysRemaining: Math.max(0, daysRemaining),
                    isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
                });
            } else {
                setSubscriptionStatus({
                    hasSubscription: false,
                    plan: null,
                    subscription: null,
                    daysRemaining: 0,
                    isExpiringSoon: false,
                });
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchaseWithCredits = async (planSlug: string) => {
        const plan = plans.find(p => p.slug === planSlug);
        if (!plan || !shop) return;

        // Check credit balance
        if (creditBalance < plan.credits_price) {
            showAlert('warning', 'เครดิตไม่พอ', `ต้องการ ${plan.credits_price} เครดิต แต่มีเพียง ${creditBalance} เครดิต`);
            return;
        }

        setPurchasing(planSlug);

        try {
            const response = await fetch('/api/subscription/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_slug: planSlug }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error || 'Purchase failed');
            }

            showAlert('success', 'ซื้อแพ็คเกจสำเร็จ!', `หักเครดิต ${plan.credits_price} เครดิต ยอดคงเหลือ ${result.new_balance} เครดิต`);
            setCreditBalance(result.new_balance);
            fetchData(); // Refresh subscription status

        } catch (error: any) {
            console.error('Purchase error:', error);
            showAlert('error', 'เกิดข้อผิดพลาด', error.message || 'ไม่สามารถซื้อแพ็คเกจได้ กรุณาลองใหม่');
        } finally {
            setPurchasing(null);
        }
    };

    const handleToggleAutoRenew = async (enabled: boolean) => {
        setTogglingAutoRenew(true);

        try {
            const response = await fetch('/api/subscription/auto-renew', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error);
            }

            // Update local state
            setSubscriptionStatus(prev => prev ? {
                ...prev,
                subscription: prev.subscription ? {
                    ...prev.subscription,
                    auto_renew_enabled: enabled
                } : null
            } : null);

            showAlert('success', enabled ? 'เปิดต่ออายุอัตโนมัติ' : 'ปิดต่ออายุอัตโนมัติ', result.message);

        } catch (error: any) {
            console.error('Auto-renew toggle error:', error);
            showAlert('error', 'เกิดข้อผิดพลาด', error.message || 'ไม่สามารถอัพเดทได้');
        } finally {
            setTogglingAutoRenew(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-500" />
                    แพ็คเกจร้านรับรอง
                </h1>

                {/* Credit Balance Card */}
                <Card className="mb-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Coins className="w-10 h-10 text-blue-200" />
                                <div>
                                    <p className="text-blue-100 text-sm">เครดิตคงเหลือ</p>
                                    <p className="text-2xl font-bold">{creditBalance.toLocaleString()} เครดิต</p>
                                </div>
                            </div>
                            <Link href="/dashboard/credits">
                                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-none">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    เติมเครดิต
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Current Status Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-lg">สถานะปัจจุบัน</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {subscriptionStatus?.hasSubscription ? (
                            <div className="space-y-4">
                                {/* Active Subscription */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full">
                                        <Crown className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {subscriptionStatus.plan?.name}
                                            </h3>
                                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                                        </div>
                                        <p className="text-gray-500">
                                            คุณได้รับสิทธิพิเศษทั้งหมดของร้านรับรอง
                                        </p>
                                    </div>
                                </div>

                                {/* Expiry Info */}
                                <div className={`p-4 rounded-lg ${subscriptionStatus.isExpiringSoon
                                        ? 'bg-orange-50 border border-orange-200'
                                        : 'bg-gray-50'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {subscriptionStatus.isExpiringSoon ? (
                                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                            ) : (
                                                <Calendar className="w-5 h-5 text-gray-500" />
                                            )}
                                            <span className={subscriptionStatus.isExpiringSoon ? 'text-orange-700 font-medium' : 'text-gray-600'}>
                                                หมดอายุวันที่ {formatDate(subscriptionStatus.subscription!.ends_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                            <span className={`font-bold ${subscriptionStatus.isExpiringSoon ? 'text-orange-600' : 'text-gray-900'
                                                }`}>
                                                เหลืออีก {subscriptionStatus.daysRemaining} วัน
                                            </span>
                                        </div>
                                    </div>

                                    {subscriptionStatus.isExpiringSoon && (
                                        <p className="mt-2 text-sm text-orange-600">
                                            แพ็คเกจใกล้หมดอายุ กรุณาต่ออายุเพื่อไม่ให้สิทธิพิเศษหายไป
                                        </p>
                                    )}
                                </div>

                                {/* Auto Renew Toggle */}
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <Label htmlFor="auto-renew" className="font-medium text-gray-900 cursor-pointer">
                                                ต่ออายุอัตโนมัติ
                                            </Label>
                                            <p className="text-sm text-gray-500">
                                                ระบบจะหักเครดิตและต่ออายุให้อัตโนมัติเมื่อใกล้หมดอายุ
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="auto-renew"
                                        checked={subscriptionStatus.subscription?.auto_renew_enabled || false}
                                        onCheckedChange={handleToggleAutoRenew}
                                        disabled={togglingAutoRenew}
                                    />
                                </div>

                                {/* Benefits */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Search className="w-4 h-4 text-green-500" />
                                        ค้นหาไม่จำกัด
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Crown className="w-4 h-4 text-yellow-500" />
                                        Badge ร้านรับรอง
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="w-4 h-4 text-blue-500" />
                                        ปุ่มโทร/LINE
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Shield className="w-4 h-4 text-emerald-500" />
                                        รับประกัน 1,000 บาท
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Bell className="w-4 h-4 text-purple-500" />
                                        แจ้งเตือน Blacklist
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Star className="w-4 h-4 text-orange-500" />
                                        แสดงอันดับต้น
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <Crown className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    คุณยังไม่ได้เป็น "ร้านรับรอง"
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    อัพเกรดเพื่อรับสิทธิพิเศษมากมาย เช่น ค้นหา Blacklist ไม่จำกัด และ Badge ร้านรับรอง
                                </p>
                                <div className="text-sm text-gray-500">
                                    ค้นหา Blacklist ได้: <span className="font-medium text-gray-900">3 ครั้ง/วัน</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Plans Section */}
                <h2 className="text-xl font-bold mb-4">
                    {subscriptionStatus?.hasSubscription ? 'ต่ออายุ / เปลี่ยนแพ็คเกจ' : 'เลือกแพ็คเกจ'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {plans.map((plan) => {
                        const canAfford = creditBalance >= plan.credits_price;

                        return (
                            <Card
                                key={plan.slug}
                                className={`relative overflow-hidden transition-all hover:shadow-lg ${plan.recommended ? 'border-2 border-yellow-400' : ''
                                    }`}
                            >
                                {plan.recommended && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-1 text-sm font-semibold">
                                        แนะนำ
                                    </div>
                                )}
                                <CardHeader className={plan.recommended ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : ''}>
                                    <div className="flex items-center gap-2">
                                        <Crown className="w-5 h-5 text-yellow-500" />
                                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex items-baseline gap-1">
                                            <Coins className="w-5 h-5 text-blue-600" />
                                            <span className="text-3xl font-bold text-gray-900">
                                                {plan.credits_price.toLocaleString()}
                                            </span>
                                            <span className="text-gray-500">เครดิต{plan.period}</span>
                                        </div>
                                        {plan.originalPrice && (
                                            <p className="text-sm text-gray-400 line-through">
                                                {plan.originalPrice.toLocaleString()} เครดิต/ปี
                                            </p>
                                        )}
                                        {plan.savings && (
                                            <Badge className="mt-1 bg-green-100 text-green-700">
                                                ประหยัด {plan.savings} เครดิต
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <ul className="space-y-2 mb-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Credit status */}
                                    {!canAfford && (
                                        <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-700">
                                            <AlertCircle className="w-4 h-4" />
                                            ต้องการอีก {(plan.credits_price - creditBalance).toLocaleString()} เครดิต
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Button
                                            onClick={() => handlePurchaseWithCredits(plan.slug)}
                                            disabled={!canAfford || purchasing !== null}
                                            className={`w-full ${plan.recommended && canAfford
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                                                    : canAfford
                                                        ? 'bg-blue-600 hover:bg-blue-700'
                                                        : 'bg-gray-300'
                                                }`}
                                        >
                                            {purchasing === plan.slug ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Coins className="w-4 h-4 mr-2" />
                                            )}
                                            {purchasing === plan.slug
                                                ? 'กำลังดำเนินการ...'
                                                : canAfford
                                                    ? 'ซื้อด้วยเครดิต'
                                                    : 'เครดิตไม่พอ'}
                                        </Button>

                                        {!canAfford && (
                                            <Link href="/dashboard/credits" className="block">
                                                <Button variant="outline" className="w-full">
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                    เติมเครดิต
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Info Section */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">หมายเหตุ</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>เครดิตจะถูกหักทันทีเมื่อซื้อแพ็คเกจ</li>
                                    <li>หากมี subscription อยู่แล้ว ระบบจะต่ออายุจากวันหมดอายุเดิม</li>
                                    <li>เครดิตไม่มีวันหมดอายุ สามารถใช้ได้ตลอด</li>
                                    <li>ไม่สามารถยกเลิกหรือขอคืนเครดิตได้หลังซื้อแพ็คเกจ</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alert Modal */}
            <StandaloneAlert
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
            />
        </div>
    );
}
