'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AdminReviewActionsProps {
    reviewId: string;
    type: 'review' | 'dispute';
    relatedReviewId?: string;
}

export default function AdminReviewActions({ reviewId, type, relatedReviewId }: AdminReviewActionsProps) {
    const supabase = createClient();
    const router = useRouter();

    const handleApprove = async () => {
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
    };

    const handleReject = async () => {
        if (!confirm('ยืนยันที่จะปฏิเสธรีวิวนี้?')) return;
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
    };

    const handleKeepReview = async () => {
        if (!confirm('ยืนยันที่จะยกคำร้องและคงรีวิวไว้?')) return;
        try {
            await supabase.from('review_disputes').update({ status: 'dismissed' }).eq('id', reviewId);
            toast.success('ยกคำร้องเรียบร้อย');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาด');
        }
    };

    const handleDeleteReview = async () => {
        if (!confirm('ยืนยันที่จะลบรีวิวนี้ตามคำร้อง?')) return;
        try {
            if (relatedReviewId) {
                await supabase.from('reviews').update({ status: 'rejected' }).eq('id', relatedReviewId);
            }
            await supabase.from('review_disputes').update({ status: 'resolved' }).eq('id', reviewId);
            toast.success('ลบรีวิวเรียบร้อย');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาด');
        }
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
