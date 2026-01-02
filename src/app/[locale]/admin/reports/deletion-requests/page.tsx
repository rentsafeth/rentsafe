'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    CheckCircle, XCircle,
    Calendar, Loader2, Trash2, MessageSquare, User
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DeletionRequest {
    id: string;
    report_id: string;
    user_id: string;
    reason: string;
    status: string;
    created_at: string;
    report: {
        id: string;
        description: string;
        heart_count: number;
        created_at: string;
        blacklist_entry: {
            shop_names: string[];
        } | null;
    };
    user: {
        email: string;
        first_name: string;
        last_name: string;
    };
}

export default function DeletionRequestsPage() {
    const [requests, setRequests] = useState<DeletionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Reject Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/deletion-requests');
            const data = await res.json();
            if (data.requests) {
                setRequests(data.requests);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (request: DeletionRequest) => {
        if (!confirm(`ยืนยันการลบรายงานนี้? เครดิตจำนวน ${request.report.heart_count} จะถูกหักคืนจากผู้ใช้`)) return;

        setProcessingId(request.id);
        try {
            const res = await fetch('/api/admin/deletion-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: request.id,
                    action: 'approve'
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`ลบรายงานสำเร็จ หักเครดิตคืน ${data.karma_deducted} แต้ม`);
                setRequests(prev => prev.filter(r => r.id !== request.id));
            } else {
                toast.error(data.error || 'Failed to approve');
            }
        } catch (error) {
            toast.error('Error processing request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectReason.trim()) return;

        setProcessingId(selectedRequest.id);
        try {
            const res = await fetch('/api/admin/deletion-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: selectedRequest.id,
                    action: 'reject',
                    admin_notes: rejectReason
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('ปฏิเสธคำขอเรียบร้อย');
                setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
                setRejectModalOpen(false);
                setRejectReason('');
                setSelectedRequest(null);
            } else {
                toast.error(data.error || 'Failed to reject');
            }
        } catch (error) {
            toast.error('Error processing request');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (request: DeletionRequest) => {
        setSelectedRequest(request);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">คำร้องขอลบรายงาน</h1>
                    <p className="text-gray-500">จัดการคำร้องขอลบรายงานจากผู้ใช้</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {requests.length} รายการรอตรวจสอบ
                </Badge>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : requests.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                        <p className="font-medium">ไม่มีรายการคำร้องค้าง</p>
                        <p className="text-sm">จัดการครบหมดแล้ว</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <Card key={request.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Request Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Trash2 className="w-5 h-5 text-red-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">
                                                        คำขอจาก: {request.user.first_name} {request.user.last_name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <User className="w-3 h-3" />
                                                        {request.user.email}
                                                        <span>•</span>
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(request.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <div className="flex items-start gap-2 mb-2">
                                                <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                                                <span className="font-medium text-gray-700">เหตุผลที่ขอลบ:</span>
                                            </div>
                                            <p className="text-gray-600 pl-6">{request.reason}</p>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">รายงานที่เกี่ยวข้อง:</span>
                                            <Link href={`/blacklist/${request.report.blacklist_entry?.shop_names?.[0] ? '' : ''}`} className="font-medium text-blue-600 hover:underline">
                                                {request.report.blacklist_entry?.shop_names?.[0] || 'Unknown Shop'}
                                            </Link>
                                            <Badge variant="secondary" className="ml-2">
                                                {request.report.heart_count} Hearts
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col justify-center gap-3 min-w-[200px] border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-2">
                                            <p className="text-xs text-orange-800 font-medium text-center">
                                                ผลกระทบ: หัก {request.report.heart_count} เครดิต
                                            </p>
                                        </div>

                                        <Button
                                            className="bg-red-600 hover:bg-red-700 w-full"
                                            onClick={() => handleApprove(request)}
                                            disabled={processingId === request.id}
                                        >
                                            {processingId === request.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            อนุมัติลบรายงาน
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => openRejectModal(request)}
                                            disabled={processingId === request.id}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            ปฏิเสธ
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reject Dialog */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ปฏิเสธคำขอลบรายงาน</DialogTitle>
                        <DialogDescription>
                            กรุณาระบุเหตุผลที่ปฏิเสธคำขอ เพื่อแจ้งให้ผู้ใช้ทราบ
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>เหตุผลการปฏิเสธ</Label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="เช่น หลักฐานไม่เพียงพอ, เหตุผลไม่สมเหตุสมผล"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectModalOpen(false)}>ยกเลิก</Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || processingId !== null}
                        >
                            ยืนยันปฏิเสธ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
