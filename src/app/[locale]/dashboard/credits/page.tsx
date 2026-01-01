'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Coins, Upload, Loader2, CheckCircle, Clock, XCircle,
    CreditCard, History, Gift, AlertCircle, QrCode, Filter,
    Calendar, Crown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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
    package_id: string;
    amount: number;
    credits_to_add: number;
    status: string;
    slip_url: string | null;
    transfer_datetime: string | null;
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

type TransactionFilter = 'all' | 'topup' | 'ads' | 'subscription';

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

    // New states for enhanced features
    const [transferDateTime, setTransferDateTime] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');
    const [slipFile, setSlipFile] = useState<File | null>(null);
    const [slipPreview, setSlipPreview] = useState<string | null>(null);

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
                // Format phone number with dashes for promptpay.io (xxx-xxx-xxxx)
                let num = typeof s.value === 'string' ? s.value.replace(/"/g, '').replace(/-/g, '') : String(s.value);
                if (num.length === 10) {
                    num = `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
                }
                setPromptpayNumber(num);
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

        // Note: We no longer auto-load pending orders
        // User must explicitly select a package to create/continue an order
        // This prevents confusion when navigating from other pages

        // Get recent transactions
        const { data: transactionsData } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('shop_id', shopData.id)
            .order('created_at', { ascending: false })
            .limit(50);

        setTransactions(transactionsData || []);

        setLoading(false);
    };

    // Just select package, don't create order yet
    const selectPackage = (pkg: CreditPackage) => {
        setSelectedPackage(pkg);
        // Reset form
        setSlipFile(null);
        setSlipPreview(null);
        setTransferDateTime('');
        setTermsAccepted(false);
    };

    // Calculate file hash for duplicate detection
    const calculateFileHash = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleSlipSelect = (file: File) => {
        setSlipFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setSlipPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const submitTopup = async () => {
        if (!selectedPackage || !shop || !slipFile) return;
        if (!transferDateTime) {
            alert('กรุณาระบุวันเวลาที่โอนเงิน');
            return;
        }
        if (!termsAccepted) {
            alert('กรุณายอมรับเงื่อนไขการใช้เครดิต');
            return;
        }

        setUploadingSlip(true);

        try {
            // Calculate file hash
            const slipHash = await calculateFileHash(slipFile);

            // Check for duplicate slip
            const { data: existingSlip } = await supabase
                .rpc('check_duplicate_slip', { p_slip_hash: slipHash });

            if (existingSlip) {
                alert('สลิปนี้เคยถูกใช้แล้ว กรุณาอัพโหลดสลิปที่ถูกต้อง');
                setUploadingSlip(false);
                return;
            }

            // Generate reference code
            const refCode = `RS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            // Create order first
            const { data: orderData, error: orderError } = await supabase
                .from('credit_orders')
                .insert({
                    shop_id: shop.id,
                    package_id: selectedPackage.id,
                    reference_code: refCode,
                    amount: selectedPackage.price,
                    credits_to_add: selectedPackage.credits + selectedPackage.bonus_credits,
                    transfer_datetime: transferDateTime,
                    slip_hash: slipHash
                })
                .select('*, credit_packages(name)')
                .single();

            if (orderError) throw orderError;

            // Upload slip to storage
            const fileExt = slipFile.name.split('.').pop();
            const fileName = `${shop.id}/${orderData.id}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('payment-slips')
                .upload(fileName, slipFile, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('payment-slips')
                .getPublicUrl(fileName);

            // Update order with slip URL
            const { error: updateError } = await supabase
                .from('credit_orders')
                .update({ slip_url: publicUrl })
                .eq('id', orderData.id);

            if (updateError) throw updateError;

            // Update local state
            const finalOrder = { ...orderData, slip_url: publicUrl };
            setOrders(prev => [finalOrder, ...prev]);

            // Reset form
            setSelectedPackage(null);
            setSlipFile(null);
            setSlipPreview(null);
            setTransferDateTime('');
            setTermsAccepted(false);

            alert('ส่งคำขอเติมเครดิตสำเร็จ! รอการตรวจสอบจากแอดมิน');
        } catch (error) {
            console.error('Submit error:', error);
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setUploadingSlip(false);
        }
    };

    // For continuing pending orders (legacy support)
    const uploadSlipForOrder = async () => {
        if (!currentOrder || !shop || !slipFile) return;
        if (!transferDateTime) {
            alert('กรุณาระบุวันเวลาที่โอนเงิน');
            return;
        }
        if (!termsAccepted) {
            alert('กรุณายอมรับเงื่อนไขการใช้เครดิต');
            return;
        }

        setUploadingSlip(true);

        try {
            // Calculate file hash
            const slipHash = await calculateFileHash(slipFile);

            // Check for duplicate slip
            const { data: existingSlip } = await supabase
                .rpc('check_duplicate_slip', { p_slip_hash: slipHash });

            if (existingSlip) {
                alert('สลิปนี้เคยถูกใช้แล้ว กรุณาอัพโหลดสลิปที่ถูกต้อง');
                setUploadingSlip(false);
                return;
            }

            const fileExt = slipFile.name.split('.').pop();
            const fileName = `${shop.id}/${currentOrder.id}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('payment-slips')
                .upload(fileName, slipFile, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('payment-slips')
                .getPublicUrl(fileName);

            // Update order with slip URL, transfer datetime, and hash
            const { error: updateError } = await supabase
                .from('credit_orders')
                .update({
                    slip_url: publicUrl,
                    transfer_datetime: transferDateTime,
                    slip_hash: slipHash
                })
                .eq('id', currentOrder.id);

            if (updateError) throw updateError;

            // Update local state
            setCurrentOrder(null);
            setSelectedPackage(null);
            setOrders(prev => prev.map(o =>
                o.id === currentOrder.id ? { ...o, slip_url: publicUrl, transfer_datetime: transferDateTime } : o
            ));

            // Reset form
            setSlipFile(null);
            setSlipPreview(null);
            setTransferDateTime('');
            setTermsAccepted(false);

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
            setSlipFile(null);
            setSlipPreview(null);
            setTransferDateTime('');
            setTermsAccepted(false);
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
            case 'daily_boost':
                return <Coins className="w-4 h-4 text-orange-600" />;
            case 'subscription_purchase':
            case 'subscription_renewal':
                return <Crown className="w-4 h-4 text-purple-600" />;
            default:
                return <History className="w-4 h-4 text-gray-600" />;
        }
    };

    const getTransactionTypeName = (type: string): string => {
        switch (type) {
            case 'welcome_bonus': return 'โบนัสต้อนรับ';
            case 'topup': return 'เติมเครดิต';
            case 'ad_click': return 'คลิกโฆษณา';
            case 'ad_impression': return 'แสดงโฆษณา';
            case 'daily_boost': return 'บูสต์รายวัน';
            case 'subscription_purchase': return 'ซื้อแพ็คเกจ';
            case 'subscription_renewal': return 'ต่ออายุแพ็คเกจ';
            case 'refund': return 'คืนเครดิต';
            case 'admin_adjustment': return 'ปรับปรุงโดยแอดมิน';
            default: return type;
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        if (transactionFilter === 'all') return true;
        if (transactionFilter === 'topup') return ['topup', 'welcome_bonus'].includes(tx.type);
        if (transactionFilter === 'ads') return ['ad_click', 'ad_impression', 'daily_boost'].includes(tx.type);
        if (transactionFilter === 'subscription') return ['subscription_purchase', 'subscription_renewal'].includes(tx.type);
        return true;
    });

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
                    <div className="mt-4 pt-4 border-t border-blue-400/30">
                        <Link href="/dashboard/subscription">
                            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-none">
                                <Crown className="w-4 h-4 mr-2" />
                                ซื้อแพ็คเกจร้านรับรอง (99-999 เครดิต)
                            </Button>
                        </Link>
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
                            // Continue pending order (legacy support)
                            <div className="space-y-6">
                                <div className="text-center p-6 bg-slate-50 rounded-xl">
                                    <p className="text-sm text-orange-600 mb-2">ดำเนินการต่อคำสั่งซื้อที่ค้างไว้</p>
                                    <h3 className="font-semibold mb-2">
                                        แพ็คเกจ: {selectedPackage?.name || currentOrder.credit_packages?.name}
                                    </h3>
                                    <p className="text-2xl font-bold text-blue-600 mb-4">
                                        {currentOrder.amount?.toLocaleString()} บาท
                                    </p>

                                    {/* QR Code */}
                                    <div className="inline-block p-4 bg-white rounded-xl shadow-sm mb-4">
                                        <Image
                                            src={`https://promptpay.io/${promptpayNumber}/${currentOrder.amount}`}
                                            alt="PromptPay QR"
                                            width={200}
                                            height={200}
                                            className="mx-auto"
                                        />
                                    </div>

                                    <p className="text-sm text-gray-600 mb-2">
                                        Reference: <span className="font-mono font-bold">{currentOrder.reference_code}</span>
                                    </p>
                                </div>

                                {/* Transfer DateTime */}
                                <div className="space-y-2">
                                    <Label htmlFor="transfer-datetime" className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        วันเวลาที่โอนเงิน *
                                    </Label>
                                    <Input
                                        id="transfer-datetime"
                                        type="datetime-local"
                                        value={transferDateTime}
                                        onChange={(e) => setTransferDateTime(e.target.value)}
                                        max={new Date().toISOString().slice(0, 16)}
                                        className="max-w-xs"
                                    />
                                </div>

                                {/* Upload Slip */}
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                                    {slipPreview ? (
                                        <div className="space-y-4">
                                            <Image
                                                src={slipPreview}
                                                alt="Slip preview"
                                                width={200}
                                                height={300}
                                                className="mx-auto rounded-lg object-contain max-h-64"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSlipFile(null);
                                                    setSlipPreview(null);
                                                }}
                                            >
                                                เปลี่ยนรูป
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600 mb-3">อัพโหลดสลิปการโอนเงิน</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="slip-upload-legacy"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleSlipSelect(file);
                                                }}
                                            />
                                            <label htmlFor="slip-upload-legacy">
                                                <Button asChild variant="outline">
                                                    <span>
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        เลือกไฟล์
                                                    </span>
                                                </Button>
                                            </label>
                                        </>
                                    )}
                                </div>

                                {/* Terms Checkbox */}
                                <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <Checkbox
                                        id="terms-legacy"
                                        checked={termsAccepted}
                                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                    />
                                    <Label htmlFor="terms-legacy" className="text-sm text-amber-800 cursor-pointer leading-relaxed">
                                        ข้าพเจ้ายอมรับว่าเครดิตใช้สำหรับทำธุรกรรมในเว็บไซต์เท่านั้น
                                        ไม่สามารถถอน/โอนออกเป็นเงินสดได้ และเครดิตไม่มีวันหมดอายุ
                                    </Label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    onClick={uploadSlipForOrder}
                                    disabled={uploadingSlip || !slipFile || !transferDateTime || !termsAccepted}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {uploadingSlip ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    ยืนยันการชำระเงิน
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={cancelOrder}
                                    className="w-full"
                                >
                                    ยกเลิกคำสั่งซื้อนี้
                                </Button>
                            </div>
                        ) : selectedPackage && !currentOrder ? (
                            // New flow: Show QR and upload form (order not created yet)
                            <div className="space-y-6">
                                <div className="text-center p-6 bg-slate-50 rounded-xl">
                                    <h3 className="font-semibold mb-2">
                                        แพ็คเกจ: {selectedPackage.name}
                                    </h3>
                                    <p className="text-2xl font-bold text-blue-600 mb-4">
                                        {selectedPackage.price.toLocaleString()} บาท
                                    </p>

                                    {/* QR Code */}
                                    <div className="inline-block p-4 bg-white rounded-xl shadow-sm mb-4">
                                        <Image
                                            src={`https://promptpay.io/${promptpayNumber}/${selectedPackage.price}`}
                                            alt="PromptPay QR"
                                            width={200}
                                            height={200}
                                            className="mx-auto"
                                        />
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        สแกน QR Code เพื่อโอนเงินผ่าน PromptPay
                                    </p>
                                </div>

                                {/* Transfer DateTime */}
                                <div className="space-y-2">
                                    <Label htmlFor="transfer-datetime" className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        วันเวลาที่โอนเงิน *
                                    </Label>
                                    <Input
                                        id="transfer-datetime"
                                        type="datetime-local"
                                        value={transferDateTime}
                                        onChange={(e) => setTransferDateTime(e.target.value)}
                                        max={new Date().toISOString().slice(0, 16)}
                                        className="max-w-xs"
                                    />
                                </div>

                                {/* Upload Slip */}
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                                    {slipPreview ? (
                                        <div className="space-y-4">
                                            <Image
                                                src={slipPreview}
                                                alt="Slip preview"
                                                width={200}
                                                height={300}
                                                className="mx-auto rounded-lg object-contain max-h-64"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSlipFile(null);
                                                    setSlipPreview(null);
                                                }}
                                            >
                                                เปลี่ยนรูป
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600 mb-3">อัพโหลดสลิปการโอนเงิน</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="slip-upload"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleSlipSelect(file);
                                                }}
                                            />
                                            <label htmlFor="slip-upload">
                                                <Button asChild variant="outline">
                                                    <span>
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        เลือกไฟล์
                                                    </span>
                                                </Button>
                                            </label>
                                        </>
                                    )}
                                </div>

                                {/* Terms Checkbox */}
                                <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <Checkbox
                                        id="terms"
                                        checked={termsAccepted}
                                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                    />
                                    <Label htmlFor="terms" className="text-sm text-amber-800 cursor-pointer leading-relaxed">
                                        ข้าพเจ้ายอมรับว่าเครดิตใช้สำหรับทำธุรกรรมในเว็บไซต์เท่านั้น
                                        ไม่สามารถถอน/โอนออกเป็นเงินสดได้ และเครดิตไม่มีวันหมดอายุ
                                    </Label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    onClick={submitTopup}
                                    disabled={uploadingSlip || !slipFile || !transferDateTime || !termsAccepted}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {uploadingSlip ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    ยืนยันการชำระเงิน
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedPackage(null);
                                        setSlipFile(null);
                                        setSlipPreview(null);
                                        setTransferDateTime('');
                                        setTermsAccepted(false);
                                    }}
                                    className="w-full"
                                >
                                    เลือกแพ็คเกจอื่น
                                </Button>
                            </div>
                        ) : (
                            // Show packages
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {packages.map((pkg) => (
                                    <button
                                        key={pkg.id}
                                        onClick={() => selectPackage(pkg)}
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
                                            {order.reference_code} • {new Date(order.created_at).toLocaleString('th-TH')}
                                        </p>
                                        {order.transfer_datetime && (
                                            <p className="text-xs text-gray-400">
                                                โอนเมื่อ: {new Date(order.transfer_datetime).toLocaleString('th-TH')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        <div>
                                            <p className={`font-semibold ${order.status === 'approved' ? 'text-green-600' : order.status === 'pending' ? 'text-yellow-600' : 'text-gray-400'}`}>
                                                {order.status === 'approved' ? '+' : ''}{order.credits_to_add.toLocaleString()} เครดิต
                                            </p>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        {/* Show continue button for pending orders without slip */}
                                        {order.status === 'pending' && !order.slip_url && !currentOrder && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setCurrentOrder(order);
                                                    setSelectedPackage(packages.find(p => p.id === order.package_id) || null);
                                                }}
                                            >
                                                ดำเนินการต่อ
                                            </Button>
                                        )}
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
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <Coins className="w-5 h-5 text-orange-600" />
                                ประวัติการใช้เครดิต
                            </CardTitle>
                            {/* Filter Buttons */}
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <div className="flex gap-1">
                                    {[
                                        { value: 'all', label: 'ทั้งหมด' },
                                        { value: 'topup', label: 'เติมเครดิต' },
                                        { value: 'ads', label: 'โฆษณา' },
                                        { value: 'subscription', label: 'ร้านรับรอง' },
                                    ].map((filter) => (
                                        <Button
                                            key={filter.value}
                                            variant={transactionFilter === filter.value ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setTransactionFilter(filter.value as TransactionFilter)}
                                            className={transactionFilter === filter.value ? 'bg-blue-600' : ''}
                                        >
                                            {filter.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-3 border-b last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getTransactionIcon(tx.type)}
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {tx.description || getTransactionTypeName(tx.type)}
                                                </p>
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
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">
                                    ไม่พบรายการในหมวดนี้
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
