import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get shop's current subscription status
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
            .select('id, name, is_verified_shop')
            .eq('owner_id', user.id)
            .single();

        if (shopError || !shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Get subscription
        const { data: subscription, error: subError } = await supabase
            .from('shop_subscriptions')
            .select(`
                *,
                plan:subscription_plans(*)
            `)
            .eq('shop_id', shop.id)
            .eq('status', 'active')
            .single();

        // Get remaining blacklist searches
        const { data: remainingSearches } = await supabase
            .rpc('get_remaining_blacklist_searches', { p_shop_id: shop.id });

        return NextResponse.json({
            shop: {
                id: shop.id,
                name: shop.name,
                is_verified_shop: shop.is_verified_shop,
            },
            subscription: subscription || null,
            is_pro: !!subscription && subscription.plan?.slug?.includes('pro'),
            remaining_blacklist_searches: remainingSearches ?? 3,
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create/upgrade subscription
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan_slug, payment_method } = body;

        if (!plan_slug || !payment_method) {
            return NextResponse.json(
                { error: 'Missing required fields: plan_slug, payment_method' },
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

        // Get plan
        const { data: plan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('slug', plan_slug)
            .eq('is_active', true)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Calculate expiry date
        const now = new Date();
        let expiresAt: Date | null = null;

        if (plan_slug === 'pro_monthly') {
            expiresAt = new Date(now.setMonth(now.getMonth() + 1));
        } else if (plan_slug === 'pro_yearly') {
            expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
        }

        // Calculate amount
        const amount = plan_slug === 'pro_yearly' ? plan.price_yearly : plan.price_monthly;

        // Create payment transaction (pending)
        const { data: transaction, error: transError } = await supabase
            .from('payment_transactions')
            .insert({
                shop_id: shop.id,
                amount,
                payment_method,
                status: 'pending',
            })
            .select()
            .single();

        if (transError) {
            console.error('Error creating transaction:', transError);
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        // For PromptPay, generate QR code info
        let qrInfo = null;
        if (payment_method === 'promptpay') {
            // Get PromptPay number from system settings
            const { data: settings } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'promptpay_number')
                .single();

            const promptpayNumber = settings?.value
                ? (typeof settings.value === 'string' ? settings.value.replace(/"/g, '') : settings.value)
                : '';

            qrInfo = {
                transaction_id: transaction.id,
                amount,
                promptpay_id: promptpayNumber,
                expires_in_minutes: 30,
            };
        }

        return NextResponse.json({
            success: true,
            transaction_id: transaction.id,
            plan,
            amount,
            expires_at: expiresAt?.toISOString(),
            qr_info: qrInfo,
            message: payment_method === 'promptpay'
                ? 'กรุณาชำระเงินและอัพโหลดสลิป'
                : 'รอการชำระเงิน',
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
