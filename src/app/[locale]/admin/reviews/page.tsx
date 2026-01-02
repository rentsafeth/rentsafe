import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Image from 'next/image';
import AdminReviewActions from '@/components/features/admin/AdminReviewActions';

export default async function AdminReviewsPage() {
    const supabase = await createClient();

    // Fetch Pending Reviews
    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (reviewsError) {
        console.error('Reviews Error:', reviewsError);
    }

    // Fetch shop names
    let enrichedReviews = reviews || [];
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
            shopName: shopMap[r.shop_id] || 'Unknown Shop'
        }));
    }

    // Fetch Pending Disputes
    const { data: disputes, error: disputesError } = await supabase
        .from('review_disputes')
        .select('*, reviews(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (disputesError) {
        console.error('Disputes Error:', disputesError);
    }

    let enrichedDisputes = disputes || [];
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
            shopName: shopMap[d.shop_id] || 'Unknown Shop'
        }));
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">จัดการรีวิวและข้อพิพาท</h1>
            </div>

            {/* Reviews Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    รออนุมัติ ({enrichedReviews.length})
                </h2>

                {enrichedReviews.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed text-slate-500">
                        ไม่พบรีวิวที่รออนุมัติ
                    </div>
                ) : (
                    enrichedReviews.map((review: any) => (
                        <Card key={review.id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{review.shopName}</Badge>
                                            <span className="text-sm text-slate-500">
                                                {format(new Date(review.created_at), 'dd MMM yyyy HH:mm', { locale: th })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < review.rating ? '' : 'text-slate-200'}>★</span>
                                            ))}
                                            <span className="text-slate-700 ml-2 font-medium">{review.rating}/5</span>
                                        </div>
                                        <p className="text-slate-800">{review.comment}</p>

                                        {review.evidence_urls && review.evidence_urls.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {review.evidence_urls.map((url: string, idx: number) => (
                                                    <a
                                                        key={idx}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="relative w-16 h-16 rounded border overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                                                    >
                                                        <Image src={url} alt="Evidence" fill className="object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        <div className="text-xs text-slate-400">
                                            Reviewer: {review.reviewer_name} ({review.is_anonymous ? 'Anonymous' : 'Public'})
                                            <br />
                                            IP: {review.ip_address}
                                        </div>
                                    </div>

                                    <AdminReviewActions reviewId={review.id} type="review" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Disputes Section */}
            <div className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Flag className="w-5 h-5 text-orange-500" />
                    ข้อพิพาท ({enrichedDisputes.length})
                </h2>

                {enrichedDisputes.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed text-slate-500">
                        ไม่พบข้อพิพาทที่รอตรวจสอบ
                    </div>
                ) : (
                    enrichedDisputes.map((dispute: any) => (
                        <Card key={dispute.id} className="border-l-4 border-l-orange-500">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <Flag className="w-5 h-5 text-orange-500" />
                                            คำร้องจากร้าน: {dispute.shopName}
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
                                        <div className="text-slate-600 italic">&quot;{dispute.reviews?.comment}&quot;</div>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                            <span>Rating: {dispute.reviews?.rating}/5</span>
                                            <span>•</span>
                                            <span>Reviewer: {dispute.reviews?.reviewer_name}</span>
                                        </div>
                                    </div>

                                    <AdminReviewActions reviewId={dispute.id} type="dispute" relatedReviewId={dispute.review_id} />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
