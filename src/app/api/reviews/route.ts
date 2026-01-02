import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { shopId, rating, comment, evidenceUrls, isAnonymous, reviewerName } = body;

        // 1. Get User from Session (Secure)
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Check if User is Shop Owner
        const { data: shop } = await supabase
            .from('shops')
            .select('owner_id')
            .eq('id', shopId)
            .single();

        if (shop && shop.owner_id === user.id) {
            return NextResponse.json({ error: 'You cannot review your own shop' }, { status: 403 });
        }

        // 3. Get IP Address
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';

        // 3. Insert Review
        const { data, error } = await supabase
            .from('reviews')
            .insert({
                shop_id: shopId,
                user_id: user.id,
                rating,
                comment,
                status: 'pending', // Always pending
                evidence_urls: evidenceUrls,
                is_anonymous: isAnonymous,
                reviewer_name: reviewerName,
                ip_address: ip,
            })
            .select()
            .single();

        if (error) {
            console.error('Database Error:', error);
            return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
        }

        return NextResponse.json({ success: true, review: data });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
