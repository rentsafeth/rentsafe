import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List pending requests
export async function GET(request: NextRequest) {
    try {
        // 1. Verify User Authentication
        const userClient = await createClient();
        const { data: { user } } = await userClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify Admin Role (using Admin Client to bypass RLS on profiles if needed)
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Fetch Requests using Admin Client (Bypass RLS)
        const { data: requests, error } = await adminClient
            .from('report_deletion_requests')
            .select(`
                *,
                report:reports (
                    id,
                    description,
                    heart_count,
                    created_at,
                    blacklist_entry:blacklist_entry_id (
                        shop_names
                    )
                ),
                user:profiles!user_id (
                    email,
                    first_name,
                    last_name
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ requests });

    } catch (error) {
        console.error('Error fetching requests:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Approve/Reject request
export async function POST(request: NextRequest) {
    try {
        // 1. Verify User Authentication
        const userClient = await createClient();
        const { data: { user } } = await userClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify Admin Role
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { request_id, action, admin_notes } = body; // action: 'approve' | 'reject'

        if (action === 'approve') {
            // Use Admin Client for RPC to ensure permissions
            const { data, error } = await adminClient.rpc('approve_report_deletion', {
                p_request_id: request_id,
                p_admin_id: user.id
            });

            if (error) throw error;
            return NextResponse.json(data);

        } else if (action === 'reject') {
            const { error } = await adminClient
                .from('report_deletion_requests')
                .update({
                    status: 'rejected',
                    admin_notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', request_id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
