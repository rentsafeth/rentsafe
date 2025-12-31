import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Reject a blacklist report
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { report_id, admin_notes, rejection_reason } = body;

        if (!report_id) {
            return NextResponse.json({ error: 'Missing report_id' }, { status: 400 });
        }

        if (!rejection_reason) {
            return NextResponse.json({ error: 'Missing rejection_reason' }, { status: 400 });
        }

        // Get the report
        const { data: report, error: reportError } = await supabase
            .from('customer_blacklist')
            .select('*')
            .eq('id', report_id)
            .single();

        if (reportError || !report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        if (report.status !== 'pending') {
            return NextResponse.json({ error: 'Report has already been reviewed' }, { status: 400 });
        }

        // Update the report status
        const { error: updateError } = await supabase
            .from('customer_blacklist')
            .update({
                status: 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id,
                admin_notes: admin_notes || rejection_reason,
            })
            .eq('id', report_id);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ error: 'Failed to reject report' }, { status: 500 });
        }

        // Notify the shop that submitted the report
        await supabase.from('notifications').insert({
            shop_id: report.reported_by_shop_id,
            type: 'blacklist_rejected',
            title: 'รายงาน Blacklist ถูกปฏิเสธ',
            message: `รายงานลูกค้า ${report.first_name} ${report.last_name} ถูกปฏิเสธ: ${rejection_reason}`,
            data: {
                blacklist_id: report_id,
                customer_name: `${report.first_name} ${report.last_name}`,
                rejection_reason,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Report rejected successfully',
        });
    } catch (error) {
        console.error('Error rejecting blacklist report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
