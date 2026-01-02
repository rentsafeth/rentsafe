'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/components/ui/alert-modal';

interface AdminReviewActionsProps {
    reviewId: string;
    type: 'review' | 'dispute';
    relatedReviewId?: string;
}

export default function AdminReviewActions({ reviewId, type, relatedReviewId }: AdminReviewActionsProps) {
    const supabase = createClient();
    const router = useRouter();
    const { showConfirm } = useAlert();

    const handleApprove = async () => {
        showConfirm(
            'คุณยืนยันที่จะอนุมัติรีวิวนี้ใช่หรือไม่? รีวิวจะถูกแสดงต่อสาธารณะทันที',
            async () => {
                try {
                    const { error } = await supabase
                        .from('reviews')
                        .update({ status: 'approved' })
                        .eq('id', reviewId);

                    if (error) throw error;

                    toast.success('อนุมัติรีวิวเรียบร้อย');
                    router.refresh();
                } catch (error) {
                    console.error(error);
                    toast.error('เกิดข้อผิดพลาดในการอนุมัติ');
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
                    const { error } = await supabase
                        .from('reviews')
                        .update({ status: 'rejected' })
                        .eq('id', reviewId);

                    if (error) throw error;

                    toast.success('ปฏิเสธรีวิวเรียบร้อย');
                    router.refresh();
                } catch (error) {
                    console.error(error);
                    toast.error('เกิดข้อผิดพลาดในการปฏิเสธ');
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
                    const { error } = await supabase
                        .from('review_disputes')
                        .update({ status: 'dismissed' })
                        .eq('id', reviewId);

                    if (error) throw error;

                    toast.success('ยกคำร้องเรียบร้อย');
                    router.refresh();
                } catch (error) {
                    console.error(error);
                    toast.error('เกิดข้อผิดพลาด');
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
                    if (relatedReviewId) {
                        const { error: reviewError } = await supabase
                            .from('reviews')
                            .update({ status: 'rejected' })
                            .eq('id', relatedReviewId);
                        if (reviewError) throw reviewError;
                    }

                    const { error: disputeError } = await supabase
                        .from('review_disputes')
                        .update({ status: 'resolved' })
                        .eq('id', reviewId);
                    if (disputeError) throw disputeError;

                    toast.success('ลบรีวิวเรียบร้อย');
                    router.refresh();
                } catch (error) {
                    console.error(error);
                    toast.error('เกิดข้อผิดพลาด');
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
