import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Cron job to check low credit shops and send notifications
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret (optional but recommended)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();

        // Call the function to send low credit notifications
        const { data: notificationCount, error } = await supabase
            .rpc('send_low_credit_notifications', { p_threshold: 100 });

        if (error) {
            console.error('Error sending low credit notifications:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        // Get list of low credit shops for logging
        const { data: lowCreditShops } = await supabase
            .rpc('get_low_credit_shops', { p_threshold: 100 });

        return NextResponse.json({
            success: true,
            notifications_sent: notificationCount || 0,
            low_credit_shops_count: lowCreditShops?.length || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in check-credits cron:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
