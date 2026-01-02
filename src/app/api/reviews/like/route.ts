import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { reviewId } = await request.json();

        // 1. Auth Check
        const userClient = await createClient();
        const { data: { user } } = await userClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบเพื่อกดถูกใจ' }, { status: 401 });
        }

        // 2. DB Operations with Admin Client (Bypass RLS)
        const supabase = createAdminClient();

        // Check if user is liking their own review
        if (user) {
            const { data: targetReview } = await supabase
                .from('reviews')
                .select('user_id')
                .eq('id', reviewId)
                .single();

            if (targetReview && targetReview.user_id === user.id) {
                return NextResponse.json({ error: 'ไม่สามารถกดถูกใจรีวิวของตัวเองได้' }, { status: 400 });
            }
        }

        // Get IP
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            headersList.get('x-real-ip') ||
            'unknown';

        // Check if already liked by this IP or user
        const { data: existingLike } = await supabase
            .from('review_likes')
            .select('id')
            .eq('review_id', reviewId)
            .or(`ip_address.eq.${ip}${user ? `,user_id.eq.${user.id}` : ''}`)
            .single();

        let action: 'liked' | 'unliked';
        let newCount: number;

        if (existingLike) {
            // Already liked - UNLIKE (toggle off)
            const { error: deleteError } = await supabase
                .from('review_likes')
                .delete()
                .eq('id', existingLike.id);

            if (deleteError) throw deleteError;

            // Decrement count
            const { data: review } = await supabase
                .from('reviews')
                .select('like_count')
                .eq('id', reviewId)
                .single();

            newCount = Math.max((review?.like_count || 1) - 1, 0);

            await supabase
                .from('reviews')
                .update({ like_count: newCount })
                .eq('id', reviewId);

            action = 'unliked';
        } else {
            // Not liked yet - LIKE (toggle on)
            const { error: likeError } = await supabase
                .from('review_likes')
                .insert({
                    review_id: reviewId,
                    user_id: user?.id,
                    ip_address: ip
                });

            if (likeError) throw likeError;

            // Increment count
            const { data: review } = await supabase
                .from('reviews')
                .select('like_count')
                .eq('id', reviewId)
                .single();

            newCount = (review?.like_count || 0) + 1;

            await supabase
                .from('reviews')
                .update({ like_count: newCount })
                .eq('id', reviewId);

            action = 'liked';
        }

        return NextResponse.json({ success: true, action, newCount });

    } catch (error) {
        console.error('Like Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET - Check if user has liked a review
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get('reviewId');

        if (!reviewId) {
            return NextResponse.json({ error: 'reviewId required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            headersList.get('x-real-ip') ||
            'unknown';

        // Check if liked by IP or user
        const { data: existingLike } = await supabase
            .from('review_likes')
            .select('id')
            .eq('review_id', reviewId)
            .or(`ip_address.eq.${ip}${user ? `,user_id.eq.${user.id}` : ''}`)
            .single();

        // Get current count
        const { data: review } = await supabase
            .from('reviews')
            .select('like_count')
            .eq('id', reviewId)
            .single();

        return NextResponse.json({
            success: true,
            hasLiked: !!existingLike,
            likeCount: review?.like_count || 0
        });

    } catch (error) {
        console.error('Like Check Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
