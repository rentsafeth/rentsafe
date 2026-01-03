import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// POST - Create a new report with IP tracking
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Get IP address from headers
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const realIP = headersList.get('x-real-ip');
        const reporterIP = forwardedFor?.split(',')[0]?.trim() || realIP || 'unknown';

        // Get User Agent
        const userAgent = headersList.get('user-agent') || 'unknown';

        // Insert report with IP and User Agent
        const { data: report, error } = await supabase.from('reports').insert({
            reporter_id: user.id,
            shop_id: body.shop_id || null,
            manual_shop_name: body.manual_shop_name,
            manual_shop_contact: body.manual_shop_contact,
            manual_facebook_url: body.manual_facebook_url,
            manual_line_id: body.manual_line_id,
            manual_phone_number: body.manual_phone_number,
            manual_bank_account: body.manual_bank_account,
            manual_id_card: body.manual_id_card,
            scam_provinces: Array.isArray(body.scam_provinces) ? body.scam_provinces : [],
            description: body.description,
            evidence_urls: body.evidence_urls || [],
            incident_date: body.incident_date,
            amount_lost: body.amount_lost || 0,
            liability_accepted: body.liability_accepted,
            status: 'pending',
            reporter_ip: reporterIP,
            reporter_user_agent: userAgent,
        }).select().single();

        if (error) {
            console.error('Error creating report:', error);
            return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            report: report,
        });
    } catch (error) {
        console.error('Error in reports API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET - Get user's own submitted reports
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', or null for all

        let query = supabase
            .from('reports')
            .select(`
                *,
                blacklist_entry:blacklist_entry_id (
                    id,
                    shop_names,
                    total_reports,
                    severity
                ),
                deletion_requests:report_deletion_requests(status)
            `)
            .eq('reporter_id', user.id)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: reports, error } = await query;

        if (error) {
            console.error('Error fetching reports:', error);
            return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            reports: reports || [],
        });
    } catch (error) {
        console.error('Error in reports API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
