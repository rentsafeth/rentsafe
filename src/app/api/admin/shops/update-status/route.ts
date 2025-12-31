import { createClient } from '@/lib/supabase/server';
import { sendShopApprovedEmail, sendShopRejectedEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('[API] POST /api/admin/shops/update-status');

    try {
        const body = await request.json();
        const { shopId, status, reason } = body;

        console.log('[API] Request body:', { shopId, status, reason });

        if (!shopId || !status) {
            return NextResponse.json({ error: 'Missing shopId or status' }, { status: 400 });
        }

        if (!['verified', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const supabase = await createClient();

        // RLS policy will check if user is admin
        const { data, error } = await supabase.from('shops').update({
            verification_status: status,
            verified_at: status === 'verified' ? new Date().toISOString() : null
        }).eq('id', shopId).select(`
            *,
            profiles:owner_id (
                email,
                full_name
            )
        `);

        console.log('[API] Update result:', { data, error });

        if (error) {
            console.error('[API] Update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Shop not found or permission denied' }, { status: 403 });
        }

        // If approved, create ad settings and initial stats
        if (status === 'verified') {
            // Create shop_ad_settings
            await supabase
                .from('shop_ad_settings')
                .upsert({ shop_id: shopId }, { onConflict: 'shop_id' });

            // Create initial ad_stats_daily for today
            const today = new Date().toISOString().split('T')[0];
            await supabase
                .from('ad_stats_daily')
                .upsert(
                    { shop_id: shopId, stat_date: today, impressions: 0, clicks: 0, credits_spent: 0 },
                    { onConflict: 'shop_id,stat_date' }
                );
        }

        // Send email notification
        const shop = data[0];
        const ownerEmail = (shop.profiles as { email: string })?.email;

        if (ownerEmail) {
            console.log('[API] Sending email to:', ownerEmail);

            if (status === 'verified') {
                await sendShopApprovedEmail(ownerEmail, shop.name, shop.id);
            } else {
                await sendShopRejectedEmail(ownerEmail, shop.name, reason);
            }
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
