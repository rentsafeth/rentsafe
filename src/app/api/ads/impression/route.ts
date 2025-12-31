import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const {
            shop_ids,
            source = 'search',
            search_query,
            province
        } = body;

        if (!shop_ids || !Array.isArray(shop_ids) || shop_ids.length === 0) {
            return NextResponse.json(
                { error: 'shop_ids array is required' },
                { status: 400 }
            );
        }

        // Get current user (optional)
        const { data: { user } } = await supabase.auth.getUser();

        // Get ad settings for all shops to determine boost/ppc status
        const { data: adSettings } = await supabase
            .from('shop_ad_settings')
            .select('shop_id, boost_active, boost_expires_at, ppc_enabled')
            .in('shop_id', shop_ids);

        const settingsMap: Record<string, any> = {};
        adSettings?.forEach(s => {
            settingsMap[s.shop_id] = s;
        });

        // Record impressions for each shop
        const impressionIds: Record<string, string> = {};

        for (let i = 0; i < shop_ids.length; i++) {
            const shopId = shop_ids[i];
            const settings = settingsMap[shopId];

            const isBoosted = settings?.boost_active &&
                settings?.boost_expires_at &&
                new Date(settings.boost_expires_at) > new Date();
            const isPPC = settings?.ppc_enabled || false;

            const { data } = await supabase.rpc('record_ad_impression', {
                p_shop_id: shopId,
                p_viewer_id: user?.id || null,
                p_source: source,
                p_search_query: search_query || null,
                p_province: province || null,
                p_position: i + 1,
                p_is_boosted: isBoosted,
                p_is_ppc: isPPC
            });

            if (data) {
                impressionIds[shopId] = data;
            }
        }

        return NextResponse.json({
            success: true,
            impression_ids: impressionIds
        });

    } catch (error) {
        console.error('Impression API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
