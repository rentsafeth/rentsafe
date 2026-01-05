'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    CheckCircle, XCircle, Clock, Loader2, Settings,
    CreditCard, History, ExternalLink, Image as ImageIcon
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
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CreditOrder {
    id: string;
    shop_id: string;
    reference_code: string;
    amount: number;
    credits_to_add: number;
    slip_url: string | null;
    status: string;
    created_at: string;
    shops: {
        id: string;
        name: string;
        owner_id?: string;
    } | null;
    credit_packages: {
        name: string;
        credits?: number;
        bonus_credits?: number;
    } | null;
}

interface Props {
    pendingOrders: CreditOrder[];
    processedOrders: CreditOrder[];
    settings: Record<string, any>;
}

export default function CreditOrdersList({ pendingOrders, processedOrders, settings }: Props) {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);

    // Settings state
    const [topupEnabled, setTopupEnabled] = useState(
        settings.credit_topup_enabled === true || settings.credit_topup_enabled === 'true'
    );
    const [promptpayNumber, setPromptpayNumber] = useState(
        typeof settings.promptpay_number === 'string'
            ? settings.promptpay_number.replace(/"/g, '')
            : settings.promptpay_number || ''
    );
    const [welcomeCredits, setWelcomeCredits] = useState(
        parseInt(settings.welcome_credits) || 1000
    );

    // Dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        order: CreditOrder | null;
        action: 'approve' | 'reject';
    }>({ open: false, order: null, action: 'approve' });

    const [slipPreview, setSlipPreview] = useState<string | null>(null);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

    const getSignedUrl = async (url: string | null) => {
        if (!url) return null;
        if (!url.includes('/payment-slips/')) return url;
        const path = url.split('/payment-slips/')[1];
        if (!path) return url;
        const { data } = await supabase.storage.from('payment-slips').createSignedUrl(path, 3600);
        return data?.signedUrl || url;
    };

    // Pre-generate signed URLs for all pending orders
    useEffect(() => {
        const loadSignedUrls = async () => {
            const urls: Record<string, string> = {};
            for (const order of pendingOrders) {
                if (order.slip_url) {
                    const signed = await getSignedUrl(order.slip_url);
                    if (signed) urls[order.id] = signed;
                }
            }
            setSignedUrls(urls);
        };
        loadSignedUrls();
    }, [pendingOrders]);

    const handleAction = async () => {
        if (!confirmDialog.order) return;
        setLoading(true);

        try {
            const order = confirmDialog.order;

            if (confirmDialog.action === 'approve') {
                // Call function to add credits
                const { error: rpcError } = await supabase.rpc('add_shop_credits', {
                    p_shop_id: order.shop_id,
                    p_amount: order.credits_to_add,
                    p_type: 'topup',
                    p_description: `เติมเครดิต ${order.credit_packages?.name || ''} (${order.reference_code})`,
                    p_reference_id: order.id
                });

                if (rpcError) {
                    // Fallback: update manually
                    console.error('RPC error:', rpcError);

                    // Update shop balance
                    const { data: shop } = await supabase
                        .from('shops')
                        .select('credit_balance')
                        .eq('id', order.shop_id)
                        .single();

                    const newBalance = (shop?.credit_balance || 0) + order.credits_to_add;

                    await supabase
                        .from('shops')
                        .update({ credit_balance: newBalance })
                        .eq('id', order.shop_id);

                    // Log transaction
                    await supabase
                        .from('credit_transactions')
                        .insert({
                            shop_id: order.shop_id,
                            amount: order.credits_to_add,
                            type: 'topup',
                            description: `เติมเครดิต ${order.credit_packages?.name || ''} (${order.reference_code})`,
                            reference_id: order.id,
                            balance_after: newBalance
                        });
                }

                // Update order status
                await supabase
                    .from('credit_orders')
                    .update({
                        status: 'approved',
                        approved_at: new Date().toISOString()
                    })
                    .eq('id', order.id);

            } else {
                // Reject order
                await supabase
                    .from('credit_orders')
                    .update({
                        status: 'rejected',
                        rejection_reason: 'สลิปไม่ถูกต้องหรือยอดเงินไม่ตรง'
                    })
                    .eq('id', order.id);
            }

            setConfirmDialog({ open: false, order: null, action: 'approve' });
            router.refresh();
        } catch (error) {
            console.error('Error:', error);
            alert('เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSavingSettings(true);

        try {
            const updates = [
                { key: 'credit_topup_enabled', value: topupEnabled },
                { key: 'promptpay_number', value: promptpayNumber },
                { key: 'welcome_credits', value: welcomeCredits.toString() }
            ];

            for (const update of updates) {
                await supabase
                    .from('system_settings')
                    .update({ value: update.value, updated_at: new Date().toISOString() })
                    .eq('key', update.key);
            }

            alert('บันทึกการตั้งค่าสำเร็จ');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('เกิดข้อผิดพลาด');
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        ตั้งค่าระบบเครดิต
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>เปิดระบบเติมเครดิต</Label>
                            <p className="text-sm text-gray-500">
                                เมื่อปิด ร้านค้าจะไม่สามารถเติมเครดิตได้
                            </p>
                        </div>
                        <Switch
                            checked={topupEnabled}
                            onCheckedChange={setTopupEnabled}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="promptpay">เบอร์ PromptPay</Label>
                            <Input
                                id="promptpay"
                                value={promptpayNumber}
                                onChange={(e) => setPromptpayNumber(e.target.value)}
                                placeholder="0838068396"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="welcome">เครดิตต้อนรับ (ร้านใหม่)</Label>
                            <Input
                                id="welcome"
                                type="number"
                                value={welcomeCredits}
                                onChange={(e) => setWelcomeCredits(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <Button onClick={saveSettings} disabled={savingSettings}>
                        {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        บันทึกการตั้งค่า
                    </Button>
                </CardContent>
            </Card>

            {/* Pending Orders */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        รอตรวจสอบ ({pendingOrders.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingOrders.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">ไม่มีคำสั่งซื้อที่รอตรวจสอบ</p>
                    ) : (
                        <div className="space-y-4">
                            {pendingOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="border rounded-lg p-4 flex flex-col md:flex-row gap-4"
                                >
                                    {/* Slip Preview */}
                                    {order.slip_url && (
                                        <div
                                            className="w-full md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative"
                                            onClick={() => setSlipPreview(signedUrls[order.id] || order.slip_url)}
                                        >
                                            <Image
                                                src={signedUrls[order.id] || order.slip_url || ''}
                                                alt="Slip"
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Order Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold">{order.shops?.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {order.reference_code}
                                                </p>
                                            </div>
                                            <Badge className="bg-yellow-100 text-yellow-700">
                                                <Clock className="w-3 h-3 mr-1" />
                                                รอตรวจสอบ
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                            <div>
                                                <span className="text-gray-500">แพ็คเกจ:</span>
                                                <span className="ml-2 font-medium">{order.credit_packages?.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">ยอดโอน:</span>
                                                <span className="ml-2 font-medium text-blue-600">
                                                    {order.amount.toLocaleString()} บาท
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">เครดิตที่จะได้:</span>
                                                <span className="ml-2 font-medium text-green-600">
                                                    +{order.credits_to_add.toLocaleString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">วันที่:</span>
                                                <span className="ml-2">
                                                    {new Date(order.created_at).toLocaleString('th-TH')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => setConfirmDialog({
                                                    open: true,
                                                    order,
                                                    action: 'approve'
                                                })}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                อนุมัติ
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => setConfirmDialog({
                                                    open: true,
                                                    order,
                                                    action: 'reject'
                                                })}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                ปฏิเสธ
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Processed Orders */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-600" />
                        ประวัติการดำเนินการ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {processedOrders.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">ยังไม่มีประวัติ</p>
                    ) : (
                        <div className="space-y-2">
                            {processedOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{order.shops?.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {order.reference_code} • {order.credit_packages?.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">
                                            {order.amount.toLocaleString()} บาท
                                        </p>
                                        {order.status === 'approved' ? (
                                            <Badge className="bg-green-100 text-green-700">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                อนุมัติแล้ว
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-red-100 text-red-700">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                ปฏิเสธ
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirm Dialog */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) =>
                setConfirmDialog(prev => ({ ...prev, open }))
            }>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog.action === 'approve' ? 'อนุมัติการเติมเครดิต?' : 'ปฏิเสธการเติมเครดิต?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.action === 'approve' ? (
                                <>
                                    ร้าน <strong>{confirmDialog.order?.shops?.name}</strong> จะได้รับ{' '}
                                    <strong className="text-green-600">
                                        {confirmDialog.order?.credits_to_add.toLocaleString()} เครดิต
                                    </strong>
                                </>
                            ) : (
                                <>
                                    คำสั่งซื้อของร้าน <strong>{confirmDialog.order?.shops?.name}</strong> จะถูกปฏิเสธ
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
                        <Button
                            onClick={handleAction}
                            disabled={loading}
                            className={confirmDialog.action === 'approve'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                            }
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {confirmDialog.action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Slip Preview Dialog */}
            <AlertDialog open={!!slipPreview} onOpenChange={() => setSlipPreview(null)}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>สลิปการโอนเงิน</AlertDialogTitle>
                    </AlertDialogHeader>
                    {slipPreview && (
                        <div className="relative w-full h-[500px]">
                            <Image
                                src={slipPreview}
                                alt="Payment Slip"
                                fill
                                unoptimized
                                className="object-contain"
                            />
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>ปิด</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
