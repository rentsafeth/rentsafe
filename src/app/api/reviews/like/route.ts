import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { reviewId } = await request.json();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get IP
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';

        // Check if already liked by this IP
        const { data: existingLike } = await supabase
            .from('review_likes')
            .select('id')
            .eq('review_id', reviewId)
            .eq('ip_address', ip)
            .single();

        if (existingLike) {
            return NextResponse.json({ error: 'Already liked' }, { status: 400 });
        }

        // Insert Like
        const { error: likeError } = await supabase
            .from('review_likes')
            .insert({
                review_id: reviewId,
                user_id: user?.id, // Optional
                ip_address: ip
            });

        if (likeError) throw likeError;

        // Increment count in reviews table (Atomic update)
        // Note: Supabase doesn't support `increment` directly in JS client easily without RPC, 
        // but we can do a raw query or fetch-update. 
        // Better approach: Create a Database Function `increment_like_count`.
        // For now, let's just fetch and update (optimistic locking not strictly needed for likes).

        // Actually, let's use RPC if possible, or just simple update.
        const { data: review } = await supabase
            .from('reviews')
            .select('like_count')
            .eq('id', reviewId)
            .single();

        const newCount = (review?.like_count || 0) + 1;

        await supabase
            .from('reviews')
            .update({ like_count: newCount })
            .eq('id', reviewId);

        // TODO: Add Karma Credit logic here if needed (e.g. if review gets 10 likes, reviewer gets credit)

        return NextResponse.json({ success: true, newCount });

    } catch (error) {
        console.error('Like Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
