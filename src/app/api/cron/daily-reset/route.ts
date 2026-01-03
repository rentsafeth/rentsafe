import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Use service role for cron jobs (bypasses RLS)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Verify cron secret or Vercel cron header
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        const isVercelCron = request.headers.get('x-vercel-cron') === '1';
        if (!isVercelCron && process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const results = {
            ppc_reset: false,
            boosts_expired: false,
            subscriptions_expired: 0,
            subscriptions_expiring_soon: 0,
            errors: [] as string[]
        };

        // 1. Reset daily PPC spent
        const { error: ppcError } = await supabase.rpc('reset_daily_ppc_spent');
        if (ppcError) {
            console.error('[Cron] Error resetting PPC:', ppcError);
            results.errors.push(`PPC reset: ${ppcError.message}`);
        } else {
            results.ppc_reset = true;
            console.log('[Cron] Successfully reset daily PPC spent');
        }

        // 2. Process Daily Boosts (Activate & Expire)
        const { data: boostResults, error: boostError } = await supabase.rpc('process_daily_boosts');

        if (boostError) {
            console.error('[Cron] Error processing boosts:', boostError);
            results.errors.push(`Boost process: ${boostError.message}`);
        } else {
            // boostResults will be { activated: number, expired: number, ... }
            if (boostResults && (boostResults.activated > 0 || boostResults.expired > 0)) {
                results.boosts_expired = true; // Keep flag name for compatibility or rename if prefer
                console.log(`[Cron] Boosts processed: Activated ${boostResults.activated}, Expired ${boostResults.expired}`);
            } else {
                console.log('[Cron] No boosts needing update');
            }
        }

        // 3. Check and expire subscriptions
        const now = new Date();

        // Find and expire subscriptions that have ended
        const { data: expiredSubs, error: expiredError } = await supabase
            .from('shop_subscriptions')
            .select('*, shop:shops(id, name)')
            .eq('status', 'active')
            .lt('ends_at', now.toISOString());

        if (expiredError) {
            results.errors.push(`Subscription check: ${expiredError.message}`);
        } else if (expiredSubs && expiredSubs.length > 0) {
            for (const sub of expiredSubs) {
                // Update subscription status
                const { error: updateError } = await supabase
                    .from('shop_subscriptions')
                    .update({ status: 'expired' })
                    .eq('id', sub.id);

                if (updateError) {
                    results.errors.push(`Expire sub ${sub.id}: ${updateError.message}`);
                    continue;
                }

                // Update shop's verified status
                await supabase
                    .from('shops')
                    .update({ is_verified_shop: false })
                    .eq('id', sub.shop_id);

                // Send notification
                await supabase
                    .from('notifications')
                    .insert({
                        shop_id: sub.shop_id,
                        type: 'subscription_expired',
                        title: 'สมาชิก "ร้านรับรอง" หมดอายุ',
                        message: 'แพ็คเกจร้านรับรองของคุณหมดอายุแล้ว กรุณาต่ออายุเพื่อรับสิทธิพิเศษต่อ',
                        data: { subscription_id: sub.id, expired_at: sub.ends_at },
                    });

                results.subscriptions_expired++;
            }
            console.log(`[Cron] Expired ${results.subscriptions_expired} subscriptions`);
        }

        // 4. Send reminders for subscriptions expiring in 3 days
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const { data: expiringSubs } = await supabase
            .from('shop_subscriptions')
            .select('*, shop:shops(id, name)')
            .eq('status', 'active')
            .gt('ends_at', now.toISOString())
            .lt('ends_at', threeDaysFromNow.toISOString());

        if (expiringSubs && expiringSubs.length > 0) {
            for (const sub of expiringSubs) {
                // Check if reminder already sent within 24 hours
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('shop_id', sub.shop_id)
                    .eq('type', 'subscription_expiring')
                    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                    .single();

                if (existingNotif) continue;

                const endsAt = new Date(sub.ends_at);
                const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                await supabase
                    .from('notifications')
                    .insert({
                        shop_id: sub.shop_id,
                        type: 'subscription_expiring',
                        title: 'แพ็คเกจกำลังจะหมดอายุ',
                        message: `แพ็คเกจ "ร้านรับรอง" ของคุณจะหมดอายุใน ${daysLeft} วัน กรุณาต่ออายุเพื่อไม่ให้สิทธิพิเศษถูกระงับ`,
                        data: { subscription_id: sub.id, expires_at: sub.ends_at, days_left: daysLeft },
                    });

                results.subscriptions_expiring_soon++;
            }
            console.log(`[Cron] Sent ${results.subscriptions_expiring_soon} expiring reminders`);
        }

        // 5. Send 7-day reminders
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { data: weekExpiringSubs } = await supabase
            .from('shop_subscriptions')
            .select('*, shop:shops(id, name)')
            .eq('status', 'active')
            .gt('ends_at', threeDaysFromNow.toISOString())
            .lt('ends_at', sevenDaysFromNow.toISOString());

        if (weekExpiringSubs && weekExpiringSubs.length > 0) {
            for (const sub of weekExpiringSubs) {
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('shop_id', sub.shop_id)
                    .eq('type', 'subscription_expiring')
                    .containedBy('data', { days_left: 7 })
                    .single();

                if (existingNotif) continue;

                await supabase
                    .from('notifications')
                    .insert({
                        shop_id: sub.shop_id,
                        type: 'subscription_expiring',
                        title: 'แจ้งเตือน: แพ็คเกจจะหมดอายุใน 7 วัน',
                        message: 'แพ็คเกจ "ร้านรับรอง" ของคุณจะหมดอายุใน 7 วัน ต่ออายุวันนี้เพื่อไม่ให้สิทธิพิเศษถูกระงับ',
                        data: { subscription_id: sub.id, expires_at: sub.ends_at, days_left: 7 },
                    });
            }
        }

        const success = results.errors.length === 0;
        console.log('[Cron] Daily reset completed at', new Date().toISOString(), results);

        return NextResponse.json({
            success,
            ...results,
            timestamp: new Date().toISOString()
        }, { status: success ? 200 : 207 });

    } catch (error) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
