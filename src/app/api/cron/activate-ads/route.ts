import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role for cron jobs (bypasses RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow Vercel cron (they send special header)
        const isVercelCron = request.headers.get('x-vercel-cron') === '1';
        if (!isVercelCron && process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        // Call the activate_scheduled_ads function
        const { error } = await supabase.rpc('activate_scheduled_ads');

        if (error) {
            console.error('[Cron] Error activating scheduled ads:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('[Cron] Successfully activated scheduled ads at', new Date().toISOString());
        return NextResponse.json({
            success: true,
            message: 'Scheduled ads activated',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
