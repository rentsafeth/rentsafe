import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/karma/heart - Toggle heart on a report
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'not_authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { report_id } = body;

        if (!report_id) {
            return NextResponse.json(
                { success: false, error: 'report_id_required' },
                { status: 400 }
            );
        }

        // Extract client IP for anti-abuse protection
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || null;

        // Call the database function with IP
        const { data, error } = await supabase.rpc('toggle_report_heart', {
            p_report_id: report_id,
            p_ip_address: clientIp
        });

        if (error) {
            console.error('Error toggling heart:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Heart API error:', error);
        return NextResponse.json(
            { success: false, error: 'server_error' },
            { status: 500 }
        );
    }
}

// GET /api/karma/heart?report_id=xxx - Check if user has hearted a report
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { hasHearted: false, heartCount: 0 }
            );
        }

        const { searchParams } = new URL(request.url);
        const reportId = searchParams.get('report_id');

        if (!reportId) {
            return NextResponse.json(
                { success: false, error: 'report_id_required' },
                { status: 400 }
            );
        }

        // Check if user has hearted this report
        const { data: heart, error: heartError } = await supabase
            .from('report_hearts')
            .select('id')
            .eq('report_id', reportId)
            .eq('user_id', user.id)
            .single();

        // Get total heart count
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('heart_count')
            .eq('id', reportId)
            .single();

        return NextResponse.json({
            success: true,
            hasHearted: !!heart,
            heartCount: report?.heart_count || 0
        });

    } catch (error) {
        console.error('Heart check API error:', error);
        return NextResponse.json(
            { success: false, error: 'server_error' },
            { status: 500 }
        );
    }
}
