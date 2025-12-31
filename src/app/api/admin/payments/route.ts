import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get pending payments for admin review
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        // Get payments with shop info
        const { data: payments, error } = await supabase
            .from('payment_transactions')
            .select(`
                *,
                shop:shops(id, name, phone_number, owner_id)
            `)
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json({ payments });

    } catch (error) {
        console.error('Get payments error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
