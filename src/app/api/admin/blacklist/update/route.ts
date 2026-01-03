import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to hash ID card
function hashIdCard(idCard: string): string {
    return crypto.createHash('sha256').update(idCard).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin
        const admins = ['admin@rentsafe.th', 'support@rentsafe.th'];
        if (!admins.includes(user.email || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { report_id, id_card_number, first_name, last_name } = body;

        if (!report_id) {
            return NextResponse.json({ error: 'Missing report_id' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        const updateData: any = {};

        // If updating ID Card
        if (id_card_number) {
            const cleanId = id_card_number.toString().replace(/\D/g, '');
            if (cleanId.length === 13) {
                updateData.id_card_number = cleanId;
                updateData.id_card_last4 = cleanId.slice(-4);
                updateData.id_card_hash = hashIdCard(cleanId);
            }
        }

        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: true, message: 'Nothing to update' });
        }

        const { error } = await adminClient
            .from('customer_blacklist')
            .update(updateData)
            .eq('id', report_id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
