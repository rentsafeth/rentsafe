'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StandaloneAlert } from '@/components/ui/alert-modal';
import {
    CreditCard,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Eye,
    Store,
    Calendar,
    DollarSign,
    X,
    Image as ImageIcon,
    ExternalLink,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface Payment {
    id: string;
    shop_id: string;
    plan_slug: string;
    amount: number;
    payment_method: string;
    slip_url: string | null;
    status: string;
    created_at: string;
    confirmed_at: string | null;
    shop: {
        id: string;
        name: string;
        phone_number: string | null;
        owner_id: string;
    };
}

const STATUS_CONFIG = {
    pending: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    confirmed: { label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const PLAN_LABELS: Record<string, string> = {
    'verified-monthly': 'รายเดือน (30 วัน)',
    'verified-quarterly': 'รายไตรมาส (90 วัน)',
    'verified-yearly': 'รายปี (365 วัน)',
};

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'confirmed' | 'rejected' | 'all'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [processing, setProcessing] = useState(false);

    // Alert state
    const [alertState, setAlertState] = useState({
        isOpen: false,
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        title: '',
        message: '',
    });

    useEffect(() => {
        loadPayments();
    }, [statusFilter]);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const statusParam = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
            const response = await fetch(`/api/admin/payments${statusParam}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load payments');
            }

            setPayments(data.payments || []);
        } catch (error) {
            console.error('Error loading payments:', error);
            setAlertState({
                isOpen: true,
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: 'ไม่สามารถโหลดข้อมูลได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'confirm' | 'reject') => {
        if (!selectedPayment) return;

        setProcessing(true);
        try {
            const response = await fetch('/api/admin/payments/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: selectedPayment.id,
                    action,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process');
            }

            setAlertState({
                isOpen: true,
                type: 'success',
                title: 'สำเร็จ',
                message: action === 'confirm' ? 'ยืนยันการชำระเงินและเปิดใช้งาน subscription แล้ว' : 'ปฏิเสธการชำระเงินแล้ว',
            });

            setSelectedPayment(null);
            loadPayments();
        } catch (error: any) {
            setAlertState({
                isOpen: true,
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: error.message,
            });
        } finally {
            setProcessing(false);
        }
    };

    const filteredPayments = payments.filter(payment => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            payment.shop.name.toLowerCase().includes(query) ||
            payment.shop.phone_number?.includes(query) ||
            payment.plan_slug.toLowerCase().includes(query)
        );
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-8 h-8 text-green-600" />
                        <h1 className="text-2xl font-bold text-gray-900">จัดการการชำระเงิน</h1>
                    </div>
                    <p className="text-gray-600">ตรวจสอบและยืนยันการชำระเงิน subscription</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card
                        className={`cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">รอตรวจสอบ</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {payments.filter(p => p.status === 'pending').length}
                                    </p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-all ${statusFilter === 'confirmed' ? 'ring-2 ring-green-500' : ''}`}
                        onClick={() => setStatusFilter('confirmed')}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">ยืนยันแล้ว</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {payments.filter(p => p.status === 'confirmed').length}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-all ${statusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
                        onClick={() => setStatusFilter('rejected')}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">ปฏิเสธ</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {payments.filter(p => p.status === 'rejected').length}
                                    </p>
                                </div>
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-all ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">ทั้งหมด</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {payments.length}
                                    </p>
                                </div>
                                <CreditCard className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="ค้นหาตามชื่อร้าน หรือเบอร์โทร..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Payments List */}
                <Card>
                    <CardHeader>
                        <CardTitle>รายการชำระเงิน</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>ไม่มีรายการชำระเงิน</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPayments.map((payment) => {
                                    const statusConfig = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG];
                                    const StatusIcon = statusConfig?.icon || Clock;

                                    return (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border">
                                                    <Store className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {payment.shop.name}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                                        <span>{PLAN_LABELS[payment.plan_slug] || payment.plan_slug}</span>
                                                        <span>|</span>
                                                        <span className="font-medium text-green-600">
                                                            {formatAmount(payment.amount)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDate(payment.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className={statusConfig?.color || ''}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {statusConfig?.label || payment.status}
                                                </Badge>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedPayment(payment)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    ดูรายละเอียด
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Payment Detail Modal */}
            <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>รายละเอียดการชำระเงิน</DialogTitle>
                        <DialogDescription>
                            ตรวจสอบข้อมูลและหลักฐานการชำระเงิน
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPayment && (
                        <div className="space-y-4 mt-4">
                            {/* Shop Info */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <Store className="w-5 h-5 text-gray-400" />
                                    <span className="font-semibold">{selectedPayment.shop.name}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">เบอร์โทร</p>
                                        <p className="font-medium">{selectedPayment.shop.phone_number || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">วิธีชำระเงิน</p>
                                        <p className="font-medium">{selectedPayment.payment_method}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Plan & Amount */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">แพ็คเกจ</span>
                                    </div>
                                    <p className="font-semibold">
                                        {PLAN_LABELS[selectedPayment.plan_slug] || selectedPayment.plan_slug}
                                    </p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-600 mb-1">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="text-sm">ยอดชำระ</span>
                                    </div>
                                    <p className="font-semibold text-lg">
                                        {formatAmount(selectedPayment.amount)}
                                    </p>
                                </div>
                            </div>

                            {/* Slip */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">หลักฐานการชำระเงิน</p>
                                {selectedPayment.slip_url ? (
                                    <div className="relative">
                                        <img
                                            src={selectedPayment.slip_url}
                                            alt="Slip"
                                            className="w-full max-h-64 object-contain rounded-lg border bg-gray-100"
                                        />
                                        <a
                                            href={selectedPayment.slip_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-gray-100 rounded-lg border border-dashed">
                                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">ไม่มีหลักฐานการชำระเงิน</p>
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">สถานะ</span>
                                <Badge className={STATUS_CONFIG[selectedPayment.status as keyof typeof STATUS_CONFIG]?.color || ''}>
                                    {STATUS_CONFIG[selectedPayment.status as keyof typeof STATUS_CONFIG]?.label || selectedPayment.status}
                                </Badge>
                            </div>

                            {/* Actions */}
                            {selectedPayment.status === 'pending' && (
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={() => handleAction('reject')}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <XCircle className="w-4 h-4 mr-2" />
                                        )}
                                        ปฏิเสธ
                                    </Button>
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleAction('confirm')}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                        )}
                                        ยืนยันและเปิดใช้งาน
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
