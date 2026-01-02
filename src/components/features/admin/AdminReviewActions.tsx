'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAlert } from '@/components/ui/alert-modal';
import { updateReviewStatus, handleDisputeAction } from '@/app/[locale]/admin/reviews/actions';

interface AdminReviewActionsProps {
    reviewId: string;
    type: 'review' | 'dispute';
    relatedReviewId?: string;
}

export default function AdminReviewActions({ reviewId, type, relatedReviewId }: AdminReviewActionsProps) {
    const { showConfirm, showError, showSuccess } = useAlert();

    const handleApprove = async () => {
        showConfirm(
            'คุณยืนยันที่จะอนุมัติรีวิวนี้ใช่หรือไม่? รีวิวจะถูกแสดงต่อสาธารณะทันที',
            async () => {
                try {
                    await updateReviewStatus(reviewId, 'approved');
                    showSuccess('อนุมัติรีวิวเรียบร้อย');
                } catch (error) {
                    console.error(error);
                    showError('เกิดข้อผิดพลาดในการอนุมัติ');
                }
            },
            'ยืนยันการอนุมัติ'
        );
    };

    const handleReject = async () => {
        showConfirm(
            'คุณยืนยันที่จะปฏิเสธรีวิวนี้ใช่หรือไม่? รีวิวนี้จะไม่ถูกแสดงในหน้าเว็บบอร์ด',
            async () => {
                try {
                    await updateReviewStatus(reviewId, 'rejected');
                    showSuccess('ปฏิเสธรีวิวเรียบร้อย');
                } catch (error) {
                    console.error(error);
                    showError('เกิดข้อผิดพลาดในการปฏิเสธ');
                }
            },
            'ยืนยันการปฏิเสธ'
        );
    };

    const handleKeepReview = async () => {
        showConfirm(
            'คุณยืนยันที่จะยกคำร้องและคงรีวิวนี้ไว้ใช่หรือไม่?',
            async () => {
                try {
                    await handleDisputeAction(reviewId, 'keep_review');
                    showSuccess('ยกคำร้องเรียบร้อย');
                } catch (error) {
                    console.error(error);
                    showError('เกิดข้อผิดพลาด');
                }
            },
            'ยืนยันการยกคำร้อง'
        );
    };

    const handleDeleteReview = async () => {
        showConfirm(
            'คุณยืนยันที่จะลบรีวิวนี้ตามคำร้องใช่หรือไม่? รีวิวจะถูกเปลี่ยนสถานะเป็นถูกปฏิเสธ',
            async () => {
                try {
                    await handleDisputeAction(reviewId, 'delete_review', relatedReviewId);
                    showSuccess('ลบรีวิวเรียบร้อย');
                } catch (error) {
                    console.error(error);
                    showError('เกิดข้อผิดพลาด');
                }
            },
            'ยืนยันการลบรีวิว'
        );
    };

    if (type === 'review') {
        return (
            <div className="flex flex-col gap-2">
                <Button
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                >
                    <Check className="w-4 h-4 mr-2" /> อนุมัติ
                </Button>
                <Button
                    onClick={handleReject}
                    variant="destructive"
                    className="w-full"
                >
                    <X className="w-4 h-4 mr-2" /> ปฏิเสธ
                </Button>
            </div>
        );
    }

    return (
        <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleKeepReview}>
                ยกคำร้อง (คงรีวิวไว้)
            </Button>
            <Button variant="destructive" onClick={handleDeleteReview}>
                ลบรีวิว (ตามคำร้อง)
            </Button>
        </div>
    );
}
