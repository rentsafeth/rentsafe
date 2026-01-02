'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Check, X, MessageSquare, Flag, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [disputes, setDisputes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('reviews');

    const supabase = createClient();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Pending Reviews
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (reviewsError) throw reviewsError;

            let enrichedReviews = reviewsData || [];

            // Manually fetch shop names if we have reviews
            if (enrichedReviews.length > 0) {
                const shopIds = [...new Set(enrichedReviews.map((r: any) => r.shop_id))];
                const { data: shopsData } = await supabase
                    .from('shops')
                    .select('id, name')
                    .in('id', shopIds);

                const shopMap = (shopsData || []).reduce((acc: any, shop: any) => {
                    acc[shop.id] = shop.name;
                    return acc;
                }, {});

                enrichedReviews = enrichedReviews.map((r: any) => ({
                    ...r,
                    shops: { name: shopMap[r.shop_id] || 'Unknown Shop' }
                }));
            }

            setReviews(enrichedReviews);

            // Fetch Pending Disputes
            const { data: disputesData, error: disputesError } = await supabase
                .from('review_disputes')
                .select('*, reviews(*)') // Removed shops(name) join for safety
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (disputesError) throw disputesError;

            let enrichedDisputes = disputesData || [];

            // Manually fetch shop names for disputes
            if (enrichedDisputes.length > 0) {
                const shopIds = [...new Set(enrichedDisputes.map((d: any) => d.shop_id))];
                const { data: shopsData } = await supabase
                    .from('shops')
                    .select('id, name')
                    .in('id', shopIds);

                const shopMap = (shopsData || []).reduce((acc: any, shop: any) => {
                    acc[shop.id] = shop.name;
                    return acc;
                }, {});

                enrichedDisputes = enrichedDisputes.map((d: any) => ({
                    ...d,
                    shops: { name: shopMap[d.shop_id] || 'Unknown Shop' }
                }));
            }

            setDisputes(enrichedDisputes);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApproveReview = async (id: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ status: 'approved' })
                .eq('id', id);

            if (error) throw error;

            toast.success('อนุมัติรีวิวเรียบร้อย');
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการอนุมัติ');
        }
    };

    const handleRejectReview = async (id: string) => {
        if (!confirm('ยืนยันที่จะปฏิเสธรีวิวนี้?')) return;
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (error) throw error;

            toast.success('ปฏิเสธรีวิวเรียบร้อย');
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการปฏิเสธ');
        }
    };

    const handleResolveDispute = async (disputeId: string, action: 'keep_review' | 'delete_review') => {
        if (!confirm(action === 'delete_review' ? 'ยืนยันที่จะลบรีวิวนี้ตามคำร้อง?' : 'ยืนยันที่จะยกคำร้องและคงรีวิวไว้?')) return;

        try {
            if (action === 'delete_review') {
                // 1. Delete the review (or mark as rejected/deleted)
                // Let's mark review as rejected
                const dispute = disputes.find(d => d.id === disputeId);
                if (dispute?.review_id) {
                    await supabase.from('reviews').update({ status: 'rejected' }).eq('id', dispute.review_id);
                }

                // 2. Update dispute status to resolved
                await supabase.from('review_disputes').update({ status: 'resolved' }).eq('id', disputeId);
            } else {
                // Keep review -> just resolve dispute (review remains approved/pending)
                // If review was pending, maybe we should approve it? Or just leave it as is?
                // Usually disputes happen on approved reviews.
                await supabase.from('review_disputes').update({ status: 'dismissed' }).eq('id', disputeId);
            }

            toast.success('ดำเนินการเรียบร้อย');
            setDisputes(prev => prev.filter(d => d.id !== disputeId));
        } catch (error) {
            toast.error('เกิดข้อผิดพลาด');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">จัดการรีวิวและข้อพิพาท</h1>
                <Button variant="outline" onClick={fetchData} size="sm">
                    รีเฟรชข้อมูล
                </Button>
            </div>

            <Tabs defaultValue="reviews" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="reviews" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        รออนุมัติ ({reviews.length})
                    </TabsTrigger>
                    <TabsTrigger value="disputes" className="gap-2">
                        <Flag className="w-4 h-4" />
                        ข้อพิพาท ({disputes.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="reviews" className="space-y-4 mt-4">
                    {reviews.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed text-slate-500">
                            ไม่พบรีวิวที่รออนุมัติ
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <Card key={review.id}>
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{review.shops?.name || 'Unknown Shop'}</Badge>
                                                <span className="text-sm text-slate-500">
                                                    {format(new Date(review.created_at), 'dd MMM yyyy HH:mm', { locale: th })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={i < review.rating ? 'fill-current' : 'text-slate-200'}>★</span>
                                                ))}
                                                <span className="text-slate-700 ml-2 font-medium">{review.rating}/5</span>
                                            </div>
                                            <p className="text-slate-800">{review.comment}</p>

                                            {review.evidence_urls && review.evidence_urls.length > 0 && (
                                                <div className="flex gap-2 mt-2">
                                                    {review.evidence_urls.map((url: string, idx: number) => (
                                                        <div key={idx} className="relative w-16 h-16 rounded border overflow-hidden">
                                                            <Image src={url} alt="Evidence" fill className="object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="text-xs text-slate-400">
                                                Reviewer: {review.reviewer_name} ({review.is_anonymous ? 'Anonymous' : 'Public'})
                                                <br />
                                                IP: {review.ip_address}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Button
                                                onClick={() => handleApproveReview(review.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white w-full"
                                            >
                                                <Check className="w-4 h-4 mr-2" /> อนุมัติ
                                            </Button>
                                            <Button
                                                onClick={() => handleRejectReview(review.id)}
                                                variant="destructive"
                                                className="w-full"
                                            >
                                                <X className="w-4 h-4 mr-2" /> ปฏิเสธ
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="disputes" className="space-y-4 mt-4">
                    {disputes.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed text-slate-500">
                            ไม่พบข้อพิพาทที่รอตรวจสอบ
                        </div>
                    ) : (
                        disputes.map((dispute) => (
                            <Card key={dispute.id} className="border-l-4 border-l-orange-500">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <h3 className="font-bold text-lg flex items-center gap-2">
                                                <Flag className="w-5 h-5 text-orange-500" />
                                                คำร้องจากร้าน: {dispute.shops?.name}
                                            </h3>
                                            <span className="text-sm text-slate-500">
                                                {format(new Date(dispute.created_at), 'dd MMM yyyy HH:mm', { locale: th })}
                                            </span>
                                        </div>

                                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                            <p className="font-medium text-orange-800 mb-1">เหตุผลที่แจ้งลบ:</p>
                                            <p className="text-orange-900">{dispute.reason}</p>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <p className="font-medium text-slate-700 mb-2">รีวิวที่มีปัญหา:</p>
                                            <div className="text-slate-600 italic">"{dispute.reviews?.comment}"</div>
                                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                                <span>Rating: {dispute.reviews?.rating}/5</span>
                                                <span>•</span>
                                                <span>Reviewer: {dispute.reviews?.reviewer_name}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleResolveDispute(dispute.id, 'keep_review')}
                                            >
                                                ยกคำร้อง (คงรีวิวไว้)
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleResolveDispute(dispute.id, 'delete_review')}
                                            >
                                                ลบรีวิว (ตามคำร้อง)
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
