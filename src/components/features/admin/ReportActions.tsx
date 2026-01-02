'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAlert } from '@/components/ui/alert-modal';
import { useRouter } from 'next/navigation';

interface ReportActionsProps {
    reportId: string;
    onUpdate: (reportId: string, status: 'approved' | 'rejected') => Promise<void>;
}

export default function ReportActions({ reportId, onUpdate }: ReportActionsProps) {
    const { showConfirm, showSuccess, showError } = useAlert();
    const router = useRouter();

    const handleAction = (status: 'approved' | 'rejected') => {
        const title = status === 'approved' ? 'ยืนยันการอนุมัติรายงาน' : 'ยืนยันการปฏิเสธรายงาน';
        const message = status === 'approved'
            ? 'คุณต้องการอนุมัติรายงานนี้ใช่หรือไม่? การอนุมัติจะทำให้ร้านค้านี้ติดประวัติในระบบ'
            : 'คุณต้องการปฏิเสธรายงานนี้ใช่หรือไม่?';

        showConfirm(
            message,
            async () => {
                try {
                    await onUpdate(reportId, status);
                    showSuccess(status === 'approved' ? 'อนุมัติรายงานเรียบร้อย' : 'ปฏิเสธรายงานเรียบร้อย');
                    router.refresh();
                } catch (error) {
                    console.error('Error updating report:', error);
                    showError('เกิดข้อผิดพลาดในการอัปเดตสถานะรายงาน');
                }
            },
            title
        );
    };

    return (
        <div className="flex gap-2">
            <Button
                onClick={() => handleAction('approved')}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
            >
                <CheckCircle className="w-4 h-4 mr-1" /> อนุมัติ
            </Button>
            <Button
                onClick={() => handleAction('rejected')}
                size="sm"
                variant="outline"
            >
                <XCircle className="w-4 h-4 mr-1" /> ปฏิเสธ
            </Button>
        </div>
    );
}
