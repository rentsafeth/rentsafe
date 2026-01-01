import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH - Toggle auto-renew setting
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { enabled } = body;

        if (typeof enabled !== 'boolean') {
            return NextResponse.json(
                { error: 'Missing required field: enabled (boolean)' },
                { status: 400 }
            );
        }

        // Get shop
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (shopError || !shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Get current subscription
        const { data: subscription, error: subError } = await supabase
            .from('shop_subscriptions')
            .select('id, status')
            .eq('shop_id', shop.id)
            .eq('status', 'active')
            .single();

        if (subError || !subscription) {
            return NextResponse.json({
                error: 'no_active_subscription',
                message: 'ไม่มี subscription ที่ใช้งานอยู่'
            }, { status: 404 });
        }

        // Update auto_renew_enabled
        const { error: updateError } = await supabase
            .from('shop_subscriptions')
            .update({
                auto_renew_enabled: enabled,
                updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({
                error: 'update_failed',
                message: 'ไม่สามารถอัพเดทได้'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            auto_renew_enabled: enabled,
            message: enabled
                ? 'เปิดการต่ออายุอัตโนมัติแล้ว'
                : 'ปิดการต่ออายุอัตโนมัติแล้ว'
        });
    } catch (error) {
        console.error('Error updating auto-renew:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET - Get auto-renew status
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get shop
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (shopError || !shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Get subscription with auto_renew status
        const { data: subscription, error: subError } = await supabase
            .from('shop_subscriptions')
            .select('id, auto_renew_enabled, expires_at, status')
            .eq('shop_id', shop.id)
            .eq('status', 'active')
            .single();

        if (subError || !subscription) {
            return NextResponse.json({
                has_subscription: false,
                auto_renew_enabled: false
            });
        }

        return NextResponse.json({
            has_subscription: true,
            auto_renew_enabled: subscription.auto_renew_enabled || false,
            expires_at: subscription.expires_at
        });
    } catch (error) {
        console.error('Error getting auto-renew status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
