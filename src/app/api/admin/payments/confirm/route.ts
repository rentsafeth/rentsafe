import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Admin confirms a payment and activates subscription
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { transaction_id, action } = await request.json();

        if (!transaction_id || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get transaction
        const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('id', transaction_id)
            .single();

        if (txError || !transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        if (transaction.status !== 'pending') {
            return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
        }

        if (action === 'confirm') {
            // Get plan details
            const planSlug = transaction.plan_slug;
            const { data: plan } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('slug', planSlug)
                .single();

            if (!plan) {
                return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
            }

            // Calculate subscription dates
            const startsAt = new Date();
            const endsAt = new Date();
            endsAt.setDate(endsAt.getDate() + plan.duration_days);

            // Check if shop has existing subscription
            const { data: existingSub } = await supabase
                .from('shop_subscriptions')
                .select('*')
                .eq('shop_id', transaction.shop_id)
                .eq('status', 'active')
                .single();

            if (existingSub) {
                // Extend existing subscription
                const currentEnd = new Date(existingSub.ends_at);
                const newEnd = new Date(Math.max(currentEnd.getTime(), startsAt.getTime()));
                newEnd.setDate(newEnd.getDate() + plan.duration_days);

                await supabase
                    .from('shop_subscriptions')
                    .update({
                        plan_id: plan.id,
                        ends_at: newEnd.toISOString(),
                    })
                    .eq('id', existingSub.id);
            } else {
                // Create new subscription
                await supabase
                    .from('shop_subscriptions')
                    .insert({
                        shop_id: transaction.shop_id,
                        plan_id: plan.id,
                        status: 'active',
                        starts_at: startsAt.toISOString(),
                        ends_at: endsAt.toISOString(),
                    });
            }

            // Update transaction status
            await supabase
                .from('payment_transactions')
                .update({
                    status: 'confirmed',
                    confirmed_at: new Date().toISOString(),
                    confirmed_by: user.id,
                })
                .eq('id', transaction_id);

            // Send notification to shop
            await supabase
                .from('notifications')
                .insert({
                    shop_id: transaction.shop_id,
                    type: 'subscription',
                    title: 'เปิดใช้งาน "ร้านรับรอง" สำเร็จ!',
                    message: `แพ็คเกจ ${plan.name} ของคุณพร้อมใช้งานแล้ว หมดอายุวันที่ ${endsAt.toLocaleDateString('th-TH')}`,
                });

            return NextResponse.json({
                success: true,
                message: 'Payment confirmed and subscription activated',
            });

        } else if (action === 'reject') {
            // Reject payment
            await supabase
                .from('payment_transactions')
                .update({
                    status: 'rejected',
                    confirmed_at: new Date().toISOString(),
                    confirmed_by: user.id,
                })
                .eq('id', transaction_id);

            // Send notification to shop
            await supabase
                .from('notifications')
                .insert({
                    shop_id: transaction.shop_id,
                    type: 'warning',
                    title: 'การชำระเงินถูกปฏิเสธ',
                    message: 'หลักฐานการชำระเงินไม่ถูกต้อง กรุณาติดต่อทีมงานหรือส่งหลักฐานใหม่',
                });

            return NextResponse.json({
                success: true,
                message: 'Payment rejected',
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Confirm payment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
