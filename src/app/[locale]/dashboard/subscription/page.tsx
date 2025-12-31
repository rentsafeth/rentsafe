'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Crown,
    Loader2,
    Calendar,
    Clock,
    CheckCircle,
    AlertTriangle,
    Upload,
    CreditCard,
    Shield,
    Search,
    Phone,
    Bell,
    Star,
    ArrowRight,
    X,
    Check
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { StandaloneAlert } from '@/components/ui/alert-modal';

type SubscriptionStatus = {
    hasSubscription: boolean;
    plan: {
        id: string;
        name: string;
        slug: string;
        price: number;
        duration_days: number;
    } | null;
    subscription: {
        id: string;
        status: string;
        starts_at: string;
        ends_at: string;
        auto_renew: boolean;
    } | null;
    daysRemaining: number;
    isExpiringSoon: boolean; // < 7 days
};

type PaymentTransaction = {
    id: string;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
    confirmed_at: string | null;
};

const plans = [
    {
        slug: 'pro_monthly',
        name: 'ร้านรับรอง รายเดือน',
        price: 99,
        period: '/เดือน',
        duration_days: 30,
        features: [
            'ค้นหา Blacklist ไม่จำกัด',
            'Badge "ร้านรับรอง" + มงกุฏ',
            'ปุ่มโทร/LINE ในผลค้นหา',
            'รับประกันมัดจำ ฿1,000',
            'แจ้งเตือน Blacklist ใหม่',
        ],
    },
    {
        slug: 'pro_yearly',
        name: 'ร้านรับรอง รายปี',
        price: 999,
        period: '/ปี',
        duration_days: 365,
        originalPrice: 1188,
        savings: 189,
        features: [
            'ค้นหา Blacklist ไม่จำกัด',
            'Badge "ร้านรับรอง" + มงกุฏ',
            'ปุ่มโทร/LINE ในผลค้นหา',
            'รับประกันมัดจำ ฿1,000',
            'แจ้งเตือน Blacklist ใหม่',
            'ประหยัด ฿189/ปี',
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
    const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
    const [promptpayNumber, setPromptpayNumber] = useState('');
    const [bankAccount, setBankAccount] = useState({
        bank: '',
        accountNo: '',
        accountName: '',
    });

    // Payment flow state
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [slipFile, setSlipFile] = useState<File | null>(null);
    const [slipPreview, setSlipPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

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

            // Get shop
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
                const endsAt = new Date(subscription.ends_at);
                const now = new Date();
                const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                setSubscriptionStatus({
                    hasSubscription: true,
                    plan: subscription.plan,
                    subscription: {
                        id: subscription.id,
                        status: subscription.status,
                        starts_at: subscription.starts_at,
                        ends_at: subscription.ends_at,
                        auto_renew: subscription.auto_renew,
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

            // Get payment history
            const { data: payments } = await supabase
                .from('payment_transactions')
                .select('*')
                .eq('shop_id', shopData.id)
                .order('created_at', { ascending: false })
                .limit(10);

            setPaymentHistory(payments || []);

            // Get payment settings from system_settings
            const { data: settings } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', ['promptpay_number', 'bank_name', 'bank_account_number', 'bank_account_name']);

            if (settings) {
                settings.forEach((s: { key: string; value: string }) => {
                    const val = typeof s.value === 'string' ? s.value.replace(/"/g, '') : s.value;
                    if (s.key === 'promptpay_number') setPromptpayNumber(val);
                    if (s.key === 'bank_name') setBankAccount(prev => ({ ...prev, bank: val }));
                    if (s.key === 'bank_account_number') setBankAccount(prev => ({ ...prev, accountNo: val }));
                    if (s.key === 'bank_account_name') setBankAccount(prev => ({ ...prev, accountName: val }));
                });
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = (planSlug: string) => {
        setSelectedPlan(planSlug);
        setShowPaymentModal(true);
        setSlipFile(null);
        setSlipPreview(null);
    };

    const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showAlert('error', 'ไฟล์ใหญ่เกินไป', 'กรุณาเลือกไฟล์ขนาดไม่เกิน 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showAlert('error', 'ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น');
            return;
        }

        setSlipFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setSlipPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmitPayment = async () => {
        if (!slipFile || !selectedPlan || !shop) return;

        setSubmitting(true);

        try {
            const plan = plans.find(p => p.slug === selectedPlan);
            if (!plan) throw new Error('Plan not found');

            // Upload slip
            const fileExt = slipFile.name.split('.').pop();
            const fileName = `${shop.id}/${Date.now()}_slip.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('payment-slips')
                .upload(fileName, slipFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('payment-slips')
                .getPublicUrl(fileName);

            // Create payment transaction
            const { data: transaction, error: transactionError } = await supabase
                .from('payment_transactions')
                .insert({
                    shop_id: shop.id,
                    plan_slug: selectedPlan,
                    amount: plan.price,
                    payment_method: 'bank_transfer',
                    slip_url: publicUrl,
                    status: 'pending',
                })
                .select()
                .single();

            if (transactionError) throw transactionError;

            showAlert('success', 'ส่งหลักฐานการชำระเงินแล้ว', 'ทีมงานจะตรวจสอบและเปิดใช้งานภายใน 24 ชั่วโมง');
            setShowPaymentModal(false);
            fetchData(); // Refresh data

        } catch (error) {
            console.error('Payment error:', error);
            showAlert('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถส่งหลักฐานการชำระเงินได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
        }).format(amount);
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
                                <div className={`p-4 rounded-lg ${
                                    subscriptionStatus.isExpiringSoon
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
                                            <span className={`font-bold ${
                                                subscriptionStatus.isExpiringSoon ? 'text-orange-600' : 'text-gray-900'
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
                                        รับประกัน ฿1,000
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

                                {/* Renew Button */}
                                {subscriptionStatus.isExpiringSoon && (
                                    <Button
                                        onClick={() => handleSelectPlan(subscriptionStatus.plan!.slug)}
                                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                                    >
                                        <Crown className="w-4 h-4 mr-2" />
                                        ต่ออายุตอนนี้
                                    </Button>
                                )}
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
                    {plans.map((plan) => (
                        <Card
                            key={plan.slug}
                            className={`relative overflow-hidden transition-all hover:shadow-lg ${
                                plan.recommended ? 'border-2 border-yellow-400' : ''
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
                                    <span className="text-3xl font-bold text-gray-900">
                                        ฿{plan.price.toLocaleString()}
                                    </span>
                                    <span className="text-gray-500">{plan.period}</span>
                                    {plan.originalPrice && (
                                        <p className="text-sm text-gray-400 line-through">
                                            ฿{plan.originalPrice.toLocaleString()}/ปี
                                        </p>
                                    )}
                                    {plan.savings && (
                                        <Badge className="mt-1 bg-green-100 text-green-700">
                                            ประหยัด ฿{plan.savings}
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
                                <Button
                                    onClick={() => handleSelectPlan(plan.slug)}
                                    className={`w-full ${
                                        plan.recommended
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                                            : ''
                                    }`}
                                >
                                    เลือกแพ็คเกจนี้
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Payment History */}
                {paymentHistory.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">ประวัติการชำระเงิน</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {paymentHistory.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {formatMoney(payment.amount)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(payment.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={
                                            payment.status === 'confirmed'
                                                ? 'bg-green-100 text-green-700'
                                                : payment.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                        }>
                                            {payment.status === 'confirmed' ? 'สำเร็จ'
                                                : payment.status === 'pending' ? 'รอตรวจสอบ'
                                                : 'ยกเลิก'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">ชำระเงิน</h2>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">สรุปรายการ</h3>
                                <div className="flex justify-between items-center">
                                    <span>{plans.find(p => p.slug === selectedPlan)?.name}</span>
                                    <span className="font-bold text-lg">
                                        ฿{plans.find(p => p.slug === selectedPlan)?.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">วิธีการชำระเงิน</h3>

                                {/* PromptPay */}
                                <div className="border rounded-lg p-4 mb-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">PP</span>
                                        </div>
                                        <span className="font-medium">PromptPay</span>
                                    </div>
                                    <div className="bg-white border-2 border-dashed rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-500 mb-2">สแกน QR Code เพื่อชำระเงิน</p>
                                        {promptpayNumber && (
                                            <img
                                                src={`https://promptpay.io/${promptpayNumber}/${plans.find(p => p.slug === selectedPlan)?.price || 0}`}
                                                alt="PromptPay QR"
                                                className="w-40 h-40 mx-auto mb-2"
                                            />
                                        )}
                                        <p className="text-sm text-gray-600">
                                            เบอร์ PromptPay: <span className="font-mono font-medium">{promptpayNumber}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Bank Transfer */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard className="w-6 h-6 text-green-600" />
                                        <span className="font-medium">โอนเงินผ่านธนาคาร</span>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg text-sm">
                                        <p><strong>ธนาคาร:</strong> {bankAccount.bank}</p>
                                        <p><strong>เลขบัญชี:</strong> {bankAccount.accountNo}</p>
                                        <p><strong>ชื่อบัญชี:</strong> {bankAccount.accountName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Slip */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    อัพโหลดหลักฐานการชำระเงิน <span className="text-red-500">*</span>
                                </h3>

                                {slipPreview ? (
                                    <div className="relative border-2 border-green-500 rounded-lg p-4 bg-green-50">
                                        <button
                                            onClick={() => {
                                                setSlipFile(null);
                                                setSlipPreview(null);
                                            }}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <img
                                            src={slipPreview}
                                            alt="Payment slip"
                                            className="max-h-48 mx-auto rounded-lg"
                                        />
                                        <p className="text-center text-sm text-green-700 mt-2 flex items-center justify-center gap-1">
                                            <Check className="w-4 h-4" />
                                            {slipFile?.name}
                                        </p>
                                    </div>
                                ) : (
                                    <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleSlipChange}
                                            className="hidden"
                                        />
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600">คลิกเพื่ออัพโหลดสลิป</p>
                                        <p className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG (ไม่เกิน 5MB)</p>
                                    </label>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={handleSubmitPayment}
                                disabled={!slipFile || submitting}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4 mr-2" />
                                )}
                                {submitting ? 'กำลังส่ง...' : 'ยืนยันการชำระเงิน'}
                            </Button>

                            <p className="text-xs text-gray-500 text-center">
                                หลังจากส่งหลักฐานแล้ว ทีมงานจะตรวจสอบและเปิดใช้งานภายใน 24 ชั่วโมง
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
