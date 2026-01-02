import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Create a deletion request
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { report_id, reason } = body;

        if (!report_id || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify ownership
        const { data: report } = await supabase
            .from('reports')
            .select('id')
            .eq('id', report_id)
            .eq('reporter_id', user.id)
            .single();

        if (!report) {
            return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 });
        }

        // Check if request already exists
        const { data: existing } = await supabase
            .from('report_deletion_requests')
            .select('id')
            .eq('report_id', report_id)
            .eq('status', 'pending')
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
        }

        // Create request
        const { error } = await supabase
            .from('report_deletion_requests')
            .insert({
                report_id,
                user_id: user.id,
                reason,
                status: 'pending'
            });

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error creating deletion request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
