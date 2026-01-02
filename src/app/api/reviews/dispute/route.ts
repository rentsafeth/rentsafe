import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { reviewId, shopId, reason } = await request.json();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify Shop Ownership
        const { data: shop } = await supabase
            .from('shops')
            .select('owner_id')
            .eq('id', shopId)
            .single();

        if (!shop || shop.owner_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Create Dispute
        const { error } = await supabase
            .from('review_disputes')
            .insert({
                review_id: reviewId,
                shop_id: shopId,
                reason,
                status: 'pending'
            });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Dispute Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
