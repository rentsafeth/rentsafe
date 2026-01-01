import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cron job to check and expire subscriptions
// Called by Vercel Cron daily at midnight (Thailand time = 17:00 UTC)

export async function GET(request: NextRequest) {
    try {
        // Vercel Cron sends this header
        const isVercelCron = request.headers.get('x-vercel-cron') === '1';

        // Also allow CRON_SECRET for manual/testing
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

        // Block if not from Vercel Cron and no valid secret
        if (!isVercelCron && !hasValidSecret && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();
        const now = new Date();
        const results = {
            expired: 0,
            expiringSoon: 0,
            autoRenewed: 0,
            autoRenewFailed: 0,
            errors: [] as string[],
        };

        // 0. Process auto-renewals first (before expiring)
        try {
            const { data: renewalResults, error: renewalError } = await supabase
                .rpc('process_auto_renewals');

            if (renewalError) {
                results.errors.push(`Auto-renewal error: ${renewalError.message}`);
            } else if (renewalResults && Array.isArray(renewalResults)) {
                for (const result of renewalResults) {
                    if (result.status === 'renewed') {
                        results.autoRenewed++;
                    } else {
                        results.autoRenewFailed++;
                    }
                }
            }
        } catch (autoRenewError) {
            results.errors.push(`Auto-renewal exception: ${autoRenewError}`);
        }

        // 1. Find and expire subscriptions that have ended
        const { data: expiredSubs, error: expiredError } = await supabase
            .from('shop_subscriptions')
            .select('*, shop:shops(id, name)')
            .eq('status', 'active')
            .lt('ends_at', now.toISOString());

        if (expiredError) {
            results.errors.push(`Error fetching expired subs: ${expiredError.message}`);
        } else if (expiredSubs && expiredSubs.length > 0) {
            // Update expired subscriptions
            for (const sub of expiredSubs) {
                const { error: updateError } = await supabase
                    .from('shop_subscriptions')
                    .update({ status: 'expired' })
                    .eq('id', sub.id);

                if (updateError) {
                    results.errors.push(`Error expiring sub ${sub.id}: ${updateError.message}`);
                    continue;
                }

                // Update shop's verified status
                await supabase
                    .from('shops')
                    .update({ is_verified_shop: false })
                    .eq('id', sub.shop_id);

                // Send notification to shop
                await supabase
                    .from('notifications')
                    .insert({
                        shop_id: sub.shop_id,
                        type: 'subscription_expired',
                        title: 'สมาชิก "ร้านรับรอง" หมดอายุ',
                        message: 'แพ็คเกจร้านรับรองของคุณหมดอายุแล้ว กรุณาต่ออายุเพื่อรับสิทธิพิเศษต่อ',
                        data: {
                            subscription_id: sub.id,
                            expired_at: sub.ends_at,
                        },
                    });

                results.expired++;
            }
        }

        // 2. Find subscriptions expiring in 3 days and send reminder
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const { data: expiringSubs, error: expiringError } = await supabase
            .from('shop_subscriptions')
            .select('*, shop:shops(id, name)')
            .eq('status', 'active')
            .gt('ends_at', now.toISOString())
            .lt('ends_at', threeDaysFromNow.toISOString());

        if (expiringError) {
            results.errors.push(`Error fetching expiring subs: ${expiringError.message}`);
        } else if (expiringSubs && expiringSubs.length > 0) {
            for (const sub of expiringSubs) {
                // Check if we already sent a reminder for this subscription
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('shop_id', sub.shop_id)
                    .eq('type', 'subscription_expiring')
                    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                    .single();

                if (existingNotif) {
                    continue; // Already sent reminder within 24 hours
                }

                const endsAt = new Date(sub.ends_at);
                const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                // Send reminder notification
                await supabase
                    .from('notifications')
                    .insert({
                        shop_id: sub.shop_id,
                        type: 'subscription_expiring',
                        title: 'แพ็คเกจกำลังจะหมดอายุ',
                        message: `แพ็คเกจ "ร้านรับรอง" ของคุณจะหมดอายุใน ${daysLeft} วัน กรุณาต่ออายุเพื่อไม่ให้สิทธิพิเศษถูกระงับ`,
                        data: {
                            subscription_id: sub.id,
                            expires_at: sub.ends_at,
                            days_left: daysLeft,
                        },
                    });

                results.expiringSoon++;
            }
        }

        // 3. Find subscriptions expiring in 7 days (first reminder)
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
                // Check if we already sent a 7-day reminder
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('shop_id', sub.shop_id)
                    .eq('type', 'subscription_expiring')
                    .containedBy('data', { days_left: 7 })
                    .single();

                if (existingNotif) {
                    continue;
                }

                await supabase
                    .from('notifications')
                    .insert({
                        shop_id: sub.shop_id,
                        type: 'subscription_expiring',
                        title: 'แจ้งเตือน: แพ็คเกจจะหมดอายุใน 7 วัน',
                        message: 'แพ็คเกจ "ร้านรับรอง" ของคุณจะหมดอายุใน 7 วัน ต่ออายุวันนี้เพื่อไม่ให้สิทธิพิเศษถูกระงับ',
                        data: {
                            subscription_id: sub.id,
                            expires_at: sub.ends_at,
                            days_left: 7,
                        },
                    });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Subscription check completed',
            results,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in subscription cron:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request);
}
