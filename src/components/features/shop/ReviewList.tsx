'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, ThumbsUp, Flag, MessageSquare, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface Review {
    id: string;
    rating: number;
    comment: string;
    reviewer_name: string;
    created_at: string;
    evidence_urls: string[] | null;
    like_count: number;
    is_anonymous: boolean;
    status: string;
}

interface ReviewListProps {
    reviews: Review[];
    currentUserId?: string;
    isShopOwner?: boolean;
    shopId: string;
}

export default function ReviewList({ reviews, currentUserId, isShopOwner, shopId }: ReviewListProps) {
    const [localReviews, setLocalReviews] = useState(reviews);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeReviewId, setDisputeReviewId] = useState<string | null>(null);
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

    const supabase = createClient();

    const handleLike = async (reviewId: string) => {
        if (!currentUserId) {
            toast.error('กรุณาเข้าสู่ระบบเพื่อกดถูกใจ');
            return;
        }

        try {
            const response = await fetch('/api/reviews/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to like');
            }

            const { newCount } = await response.json();

            setLocalReviews(prev => prev.map(r =>
                r.id === reviewId ? { ...r, like_count: newCount } : r
            ));

            toast.success('กดถูกใจแล้ว');
        } catch (error: any) {
            toast.error(error.message || 'ไม่สามารถกดถูกใจได้');
        }
    };

    const handleDispute = async () => {
        if (!disputeReviewId || !disputeReason.trim()) return;

        setIsSubmittingDispute(true);
        try {
            const response = await fetch('/api/reviews/dispute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewId: disputeReviewId,
                    shopId,
                    reason: disputeReason
                }),
            });

            if (!response.ok) throw new Error('Failed to submit dispute');

            toast.success('ส่งคำร้องโต้แย้งเรียบร้อยแล้ว รอแอดมินตรวจสอบ');
            setDisputeReviewId(null);
            setDisputeReason('');
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการส่งคำร้อง');
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    if (localReviews.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">ยังไม่มีรีวิวสำหรับร้านนี้</p>
                <p className="text-sm text-slate-400 mt-1">เป็นคนแรกที่รีวิวร้านนี้</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {localReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-slate-200">
                                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                                    {review.reviewer_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-slate-900">
                                        {review.reviewer_name || 'ผู้ใช้งาน'}
                                    </p>
                                    {/* Verified Badge Logic would go here if we had booking data */}
                                    {/* <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-green-50 text-green-700 border-green-200">
                                        เช่าจริง
                                    </Badge> */}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: th })}</span>
                                </div>
                            </div>
                        </div>

                        {isShopOwner && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-red-600"
                                        onClick={() => setDisputeReviewId(review.id)}
                                    >
                                        <Flag className="w-4 h-4 mr-1" />
                                        แจ้งลบ
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>แจ้งลบ/โต้แย้งรีวิว</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <p className="text-sm text-slate-600">
                                            กรุณาระบุเหตุผลที่ต้องการให้ลบรีวิวนี้ (เช่น เป็นรีวิวเท็จ, ใช้คำหยาบคาย)
                                            ทีมงานจะตรวจสอบและดำเนินการภายใน 24 ชม.
                                        </p>
                                        <Textarea
                                            value={disputeReason}
                                            onChange={(e) => setDisputeReason(e.target.value)}
                                            placeholder="ระบุเหตุผล..."
                                            className="min-h-[100px]"
                                        />
                                        <Button
                                            onClick={handleDispute}
                                            disabled={isSubmittingDispute || !disputeReason.trim()}
                                            className="w-full bg-red-600 hover:bg-red-700"
                                        >
                                            ส่งคำร้อง
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <p className="text-slate-700 leading-relaxed mb-4 whitespace-pre-line">
                        {review.comment}
                    </p>

                    {/* Evidence Images */}
                    {review.evidence_urls && review.evidence_urls.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {review.evidence_urls.map((url, idx) => (
                                <div
                                    key={idx}
                                    className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setSelectedImage(url)}
                                >
                                    <Image
                                        src={url}
                                        alt="Evidence"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`text-slate-500 hover:text-blue-600 hover:bg-blue-50 gap-1.5 ${false ? 'text-blue-600 bg-blue-50' : ''}`}
                            onClick={() => handleLike(review.id)}
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span>ถูกใจ ({review.like_count})</span>
                        </Button>
                    </div>
                </div>
            ))}

            {/* Image Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <div className="relative w-full max-w-4xl h-[80vh]">
                        <Image
                            src={selectedImage}
                            alt="Full size evidence"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
