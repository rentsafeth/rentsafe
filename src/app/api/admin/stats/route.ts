import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // 1. Check Auth
        const userClient = await createClient();
        const { data: { user } } = await userClient.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Check Admin Role
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 3. Fetch Counts in Parallel
        const [
            { count: pendingShops },
            { count: pendingReports },
            { count: pendingDeletions },
            { count: pendingReviews },
            { count: pendingCredits },
            { count: pendingTickets }
        ] = await Promise.all([
            adminClient.from('shops').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
            adminClient.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            adminClient.from('report_deletion_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            adminClient.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            adminClient.from('credit_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            adminClient.from('contact_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        return NextResponse.json({
            pendingShops: pendingShops || 0,
            pendingReports: pendingReports || 0,
            pendingDeletions: pendingDeletions || 0,
            pendingReviews: pendingReviews || 0,
            pendingCredits: pendingCredits || 0,
            pendingTickets: pendingTickets || 0
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
