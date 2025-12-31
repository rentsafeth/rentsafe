'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Coins, Upload, Loader2, CheckCircle, Clock, XCircle,
    CreditCard, History, Gift, AlertCircle, QrCode
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CreditPackage {
    id: string;
    name: string;
    description: string;
    price: number;
    credits: number;
    bonus_credits: number;
}

interface CreditOrder {
    id: string;
    reference_code: string;
    amount: number;
    credits_to_add: number;
    status: string;
    slip_url: string | null;
    created_at: string;
    credit_packages: {
        name: string;
    } | null;
}

interface CreditTransaction {
    id: string;
    amount: number;
    type: string;
    description: string;
    balance_after: number;
    created_at: string;
}

export default function CreditsPage() {
    const router = useRouter();
    const supabase = createClient();

    const [shop, setShop] = useState<any>(null);
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [orders, setOrders] = useState<CreditOrder[]>([]);
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [topupEnabled, setTopupEnabled] = useState(false);
    const [promptpayNumber, setPromptpayNumber] = useState('');

    const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
    const [currentOrder, setCurrentOrder] = useState<CreditOrder | null>(null);
    const [uploadingSlip, setUploadingSlip] = useState(false);
    const [creatingOrder, setCreatingOrder] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);

        // Get current user
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
            router.push('/dashboard');
            return;
        }
        setShop(shopData);

        // Get system settings
        const { data: settings } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', ['credit_topup_enabled', 'promptpay_number']);

        settings?.forEach(s => {
            if (s.key === 'credit_topup_enabled') {
                setTopupEnabled(s.value === true || s.value === 'true');
            }
            if (s.key === 'promptpay_number') {
                setPromptpayNumber(typeof s.value === 'string' ? s.value.replace(/"/g, '') : s.value);
            }
        });

        // Get packages
        const { data: packagesData } = await supabase
            .from('credit_packages')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        setPackages(packagesData || []);

        // Get recent orders
        const { data: ordersData } = await supabase
            .from('credit_orders')
            .select('*, credit_packages(name)')
            .eq('shop_id', shopData.id)
            .order('created_at', { ascending: false })
            .limit(10);

        setOrders(ordersData || []);

        // Check for pending order without slip
        const pendingOrder = ordersData?.find(o => o.status === 'pending' && !o.slip_url);
        if (pendingOrder) {
            setCurrentOrder(pendingOrder);
            setSelectedPackage(packages.find(p => p.id === pendingOrder.package_id) || null);
        }

        // Get recent transactions
        const { data: transactionsData } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('shop_id', shopData.id)
            .order('created_at', { ascending: false })
            .limit(20);

        setTransactions(transactionsData || []);

        setLoading(false);
    };

    const createOrder = async (pkg: CreditPackage) => {
        if (!shop) return;
        setCreatingOrder(true);

        try {
            // Generate reference code
            const refCode = `RS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            const { data, error } = await supabase
                .from('credit_orders')
                .insert({
                    shop_id: shop.id,
                    package_id: pkg.id,
                    reference_code: refCode,
                    amount: pkg.price,
                    credits_to_add: pkg.credits + pkg.bonus_credits,
                })
                .select('*, credit_packages(name)')
                .single();

            if (error) throw error;

            setCurrentOrder(data);
            setSelectedPackage(pkg);
            setOrders(prev => [data, ...prev]);
        } catch (error) {
            console.error('Error creating order:', error);
            alert('เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
        } finally {
            setCreatingOrder(false);
        }
    };

    const uploadSlip = async (file: File) => {
        if (!currentOrder || !shop) return;
        setUploadingSlip(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${shop.id}/${currentOrder.id}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('payment-slips')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('payment-slips')
                .getPublicUrl(fileName);

            // Update order with slip URL
            const { error: updateError } = await supabase
                .from('credit_orders')
                .update({ slip_url: publicUrl })
                .eq('id', currentOrder.id);

            if (updateError) throw updateError;

            // Update local state
            setCurrentOrder(prev => prev ? { ...prev, slip_url: publicUrl } : null);
            setOrders(prev => prev.map(o =>
                o.id === currentOrder.id ? { ...o, slip_url: publicUrl } : o
            ));

            alert('อัพโหลดสลิปสำเร็จ! รอการตรวจสอบจากแอดมิน');
        } catch (error) {
            console.error('Upload error:', error);
            alert('เกิดข้อผิดพลาดในการอัพโหลดสลิป');
        } finally {
            setUploadingSlip(false);
        }
    };

    const cancelOrder = async () => {
        if (!currentOrder) return;

        const { error } = await supabase
            .from('credit_orders')
            .delete()
            .eq('id', currentOrder.id)
            .eq('status', 'pending');

        if (!error) {
            setCurrentOrder(null);
            setSelectedPackage(null);
            setOrders(prev => prev.filter(o => o.id !== currentOrder.id));
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />อนุมัติแล้ว</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />รอตรวจสอบ</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />ไม่อนุมัติ</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'welcome_bonus':
                return <Gift className="w-4 h-4 text-green-600" />;
            case 'topup':
                return <CreditCard className="w-4 h-4 text-blue-600" />;
            case 'ad_click':
            case 'ad_impression':
                return <Coins className="w-4 h-4 text-orange-600" />;
            default:
                return <History className="w-4 h-4 text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-2xl font-bold mb-6">เครดิตของฉัน</h1>

            {/* Credit Balance Card */}
            <Card className="mb-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 mb-1">เครดิตคงเหลือ</p>
                            <p className="text-4xl font-bold">{(shop?.credit_balance || 0).toLocaleString()}</p>
                            <p className="text-blue-100 text-sm mt-1">เครดิต</p>
                        </div>
                        <Coins className="w-16 h-16 text-blue-200" />
                    </div>
                </CardContent>
            </Card>

            {/* Top-up Section */}
            {topupEnabled ? (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            เติมเครดิต
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentOrder && !currentOrder.slip_url ? (
                            // Show QR and upload section
                            <div className="space-y-6">
                                <div className="text-center p-6 bg-slate-50 rounded-xl">
                                    <h3 className="font-semibold mb-2">
                                        แพ็คเกจ: {selectedPackage?.name}
                                    </h3>
                                    <p className="text-2xl font-bold text-blue-600 mb-4">
                                        {selectedPackage?.price.toLocaleString()} บาท
                                    </p>

                                    {/* QR Code */}
                                    <div className="inline-block p-4 bg-white rounded-xl shadow-sm mb-4">
                                        <Image
                                            src={`https://promptpay.io/${promptpayNumber}/${selectedPackage?.price}`}
                                            alt="PromptPay QR"
                                            width={200}
                                            height={200}
                                            className="mx-auto"
                                        />
                                    </div>

                                    <p className="text-sm text-gray-600 mb-2">
                                        Reference: <span className="font-mono font-bold">{currentOrder.reference_code}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        กรุณาระบุ Reference ในช่องหมายเหตุการโอน
                                    </p>
                                </div>

                                {/* Upload Slip */}
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 mb-3">อัพโหลดสลิปการโอนเงิน</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="slip-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) uploadSlip(file);
                                        }}
                                    />
                                    <label htmlFor="slip-upload">
                                        <Button asChild disabled={uploadingSlip}>
                                            <span>
                                                {uploadingSlip ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4 mr-2" />
                                                )}
                                                เลือกไฟล์
                                            </span>
                                        </Button>
                                    </label>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={cancelOrder}
                                    className="w-full"
                                >
                                    ยกเลิก
                                </Button>
                            </div>
                        ) : currentOrder && currentOrder.slip_url ? (
                            // Show waiting for approval
                            <div className="text-center py-8">
                                <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">รอการตรวจสอบ</h3>
                                <p className="text-gray-600 mb-4">
                                    คำสั่งซื้อ {currentOrder.reference_code} กำลังรอการตรวจสอบจากแอดมิน
                                </p>
                                <Button variant="outline" onClick={() => setCurrentOrder(null)}>
                                    ซื้อแพ็คเกจอื่น
                                </Button>
                            </div>
                        ) : (
                            // Show packages
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {packages.map((pkg) => (
                                    <button
                                        key={pkg.id}
                                        onClick={() => createOrder(pkg)}
                                        disabled={creatingOrder}
                                        className="p-4 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center relative"
                                    >
                                        {pkg.bonus_credits > 0 && (
                                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                +{Math.round(pkg.bonus_credits / pkg.credits * 100)}%
                                            </div>
                                        )}
                                        <p className="text-2xl font-bold text-blue-600">
                                            {pkg.price.toLocaleString()}฿
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {(pkg.credits + pkg.bonus_credits).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-500">เครดิต</p>
                                        {pkg.bonus_credits > 0 && (
                                            <p className="text-xs text-green-600 mt-1">
                                                รวมโบนัส {pkg.bonus_credits.toLocaleString()}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="mb-6 bg-gray-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 text-gray-600">
                            <AlertCircle className="w-5 h-5" />
                            <p>ระบบเติมเครดิตยังไม่เปิดให้บริการในขณะนี้</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Orders */}
            {orders.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5 text-gray-600" />
                            ประวัติการเติมเครดิต
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{order.credit_packages?.name || 'แพ็คเกจ'}</p>
                                        <p className="text-sm text-gray-500">
                                            {order.reference_code} • {new Date(order.created_at).toLocaleDateString('th-TH')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-blue-600">
                                            +{order.credits_to_add.toLocaleString()} เครดิต
                                        </p>
                                        {getStatusBadge(order.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Transaction History */}
            {transactions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-orange-600" />
                            ประวัติการใช้เครดิต
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-3 border-b last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        {getTransactionIcon(tx.type)}
                                        <div>
                                            <p className="font-medium text-sm">{tx.description || tx.type}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(tx.created_at).toLocaleString('th-TH')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            คงเหลือ {tx.balance_after.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
