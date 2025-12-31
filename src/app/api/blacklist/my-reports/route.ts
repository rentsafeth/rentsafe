import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get shop's own blacklist reports
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get shop
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (shopError || !shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Get reports
        const { data: reports, error: reportsError } = await supabase
            .from('customer_blacklist')
            .select('*')
            .eq('reported_by_shop_id', shop.id)
            .order('created_at', { ascending: false });

        if (reportsError) {
            console.error('Error fetching reports:', reportsError);
            return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
        }

        return NextResponse.json({
            reports: reports || [],
        });
    } catch (error) {
        console.error('Error in my-reports:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
