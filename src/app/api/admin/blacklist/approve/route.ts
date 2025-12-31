import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Approve a blacklist report
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
        const { report_id, admin_notes } = body;

        if (!report_id) {
            return NextResponse.json({ error: 'Missing report_id' }, { status: 400 });
        }

        // Get the report to check if it exists and get shop info
        const { data: report, error: reportError } = await supabase
            .from('customer_blacklist')
            .select('*, reported_by_shop:shops!reported_by_shop_id(id, name)')
            .eq('id', report_id)
            .single();

        if (reportError || !report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        if (report.status !== 'pending') {
            return NextResponse.json({ error: 'Report has already been reviewed' }, { status: 400 });
        }

        // Check if this person already exists in blacklist (by same id_card_hash)
        const { data: existing } = await supabase
            .from('customer_blacklist')
            .select('id, report_count')
            .eq('id_card_hash', report.id_card_hash)
            .eq('status', 'approved')
            .neq('id', report_id)
            .single();

        // Update the report status
        const { error: updateError } = await supabase
            .from('customer_blacklist')
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id,
                admin_notes: admin_notes || null,
                report_count: existing ? existing.report_count + 1 : 1,
            })
            .eq('id', report_id);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ error: 'Failed to approve report' }, { status: 500 });
        }

        // If there was an existing approved report, update its report_count too
        if (existing) {
            await supabase
                .from('customer_blacklist')
                .update({ report_count: existing.report_count + 1 })
                .eq('id', existing.id);
        }

        // Notify all verified shops about new blacklist entry
        const { data: verifiedShops } = await supabase
            .from('shops')
            .select('id')
            .eq('is_verified_shop', true);

        if (verifiedShops && verifiedShops.length > 0) {
            const notifications = verifiedShops.map(shop => ({
                shop_id: shop.id,
                type: 'blacklist_new',
                title: 'ลูกค้า Blacklist ใหม่',
                message: `มีลูกค้าถูกเพิ่มใน Blacklist: ${report.first_name} ${report.last_name} (${report.id_card_last4})`,
                data: {
                    blacklist_id: report_id,
                    customer_name: `${report.first_name} ${report.last_name}`,
                    reason_type: report.reason_type,
                },
            }));

            await supabase.from('notifications').insert(notifications);
        }

        // Notify the shop that submitted the report
        await supabase.from('notifications').insert({
            shop_id: report.reported_by_shop_id,
            type: 'blacklist_approved',
            title: 'รายงาน Blacklist ได้รับการอนุมัติ',
            message: `รายงานลูกค้า ${report.first_name} ${report.last_name} ได้รับการอนุมัติแล้ว`,
            data: {
                blacklist_id: report_id,
                customer_name: `${report.first_name} ${report.last_name}`,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Report approved successfully',
        });
    } catch (error) {
        console.error('Error approving blacklist report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
