import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role for cron jobs (bypasses RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
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

        // 2. Expire old boosts
        const { error: boostError } = await supabase.rpc('expire_boosts');
        if (boostError) {
            console.error('[Cron] Error expiring boosts:', boostError);
            results.errors.push(`Boost expire: ${boostError.message}`);
        } else {
            results.boosts_expired = true;
            console.log('[Cron] Successfully expired old boosts');
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
