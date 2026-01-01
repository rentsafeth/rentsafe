import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - ซื้อ subscription ด้วยเครดิต (หักทันที ไม่ต้องรอ admin)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan_slug } = body;

        if (!plan_slug) {
            return NextResponse.json(
                { error: 'Missing required field: plan_slug' },
                { status: 400 }
            );
        }

        // Validate plan_slug
        if (!['pro_monthly', 'pro_yearly'].includes(plan_slug)) {
            return NextResponse.json(
                { error: 'Invalid plan_slug. Must be pro_monthly or pro_yearly' },
                { status: 400 }
            );
        }

        // Get shop
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id, credit_balance')
            .eq('owner_id', user.id)
            .single();

        if (shopError || !shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Get plan to check price
        const { data: plan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('slug', plan_slug)
            .eq('is_active', true)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        const creditsPrice = plan.credits_price || (plan_slug === 'pro_yearly' ? 999 : 99);

        // Check credit balance
        if (shop.credit_balance < creditsPrice) {
            return NextResponse.json({
                error: 'insufficient_credits',
                message: 'ยอดเครดิตไม่เพียงพอ',
                current_balance: shop.credit_balance,
                required_credits: creditsPrice,
            }, { status: 400 });
        }

        // Call the purchase function
        const { data: result, error: purchaseError } = await supabase
            .rpc('purchase_subscription_with_credits', {
                p_shop_id: shop.id,
                p_plan_slug: plan_slug,
                p_credits_amount: creditsPrice
            });

        if (purchaseError) {
            console.error('Purchase error:', purchaseError);
            return NextResponse.json({
                error: 'purchase_failed',
                message: 'ไม่สามารถทำรายการได้ กรุณาลองใหม่',
                details: purchaseError.message
            }, { status: 500 });
        }

        // Check result from function
        if (!result?.success) {
            return NextResponse.json({
                error: result?.error || 'unknown_error',
                message: getErrorMessage(result?.error),
                current_balance: result?.current_balance
            }, { status: 400 });
        }

        // Send success notification
        await supabase
            .from('notifications')
            .insert({
                target_type: 'shop',
                target_id: shop.id,
                title: 'ซื้อแพ็คเกจร้านรับรองสำเร็จ',
                message: `คุณได้ซื้อ ${plan.name} สำเร็จ หักเครดิต ${creditsPrice} เครดิต ยอดคงเหลือ ${result.new_balance} เครดิต`,
                type: 'subscription',
                severity: 'success',
                action_url: '/dashboard/subscription'
            });

        return NextResponse.json({
            success: true,
            message: 'ซื้อแพ็คเกจสำเร็จ',
            subscription_id: result.subscription_id,
            new_balance: result.new_balance,
            ends_at: result.ends_at,
            plan_name: result.plan_name,
            credits_deducted: creditsPrice
        });
    } catch (error) {
        console.error('Error purchasing subscription:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function getErrorMessage(errorCode: string | undefined): string {
    switch (errorCode) {
        case 'insufficient_credits':
            return 'ยอดเครดิตไม่เพียงพอ';
        case 'shop_not_found':
            return 'ไม่พบข้อมูลร้านค้า';
        case 'plan_not_found':
            return 'ไม่พบแพ็คเกจที่เลือก';
        default:
            return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
    }
}
