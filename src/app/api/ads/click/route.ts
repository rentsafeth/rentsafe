import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { shop_id, impression_id, source = 'search' } = body;

        if (!shop_id) {
            return NextResponse.json(
                { error: 'shop_id is required' },
                { status: 400 }
            );
        }

        // Get current user (optional)
        const { data: { user } } = await supabase.auth.getUser();

        // Hash IP for fraud detection
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
        const ipHash = crypto.createHash('sha256').update(ip + shop_id).digest('hex').substring(0, 16);

        // Check for duplicate clicks (same IP + shop within 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recentClick } = await supabase
            .from('ad_clicks')
            .select('id')
            .eq('shop_id', shop_id)
            .eq('ip_hash', ipHash)
            .gte('created_at', oneHourAgo)
            .limit(1)
            .single();

        if (recentClick) {
            // Already clicked recently, don't charge again
            return NextResponse.json({
                success: true,
                charged: false,
                message: 'Duplicate click ignored'
            });
        }

        // Record click via RPC function
        const { data, error } = await supabase.rpc('record_ad_click', {
            p_shop_id: shop_id,
            p_impression_id: impression_id || null,
            p_viewer_id: user?.id || null,
            p_source: source,
            p_ip_hash: ipHash
        });

        if (error) {
            console.error('Error recording click:', error);
            return NextResponse.json(
                { error: 'Failed to record click' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            charged: data?.credits_charged > 0,
            credits_charged: data?.credits_charged || 0
        });

    } catch (error) {
        console.error('Click API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
