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

        // Verify admin role from database
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const body = await request.json();
        const {
            report_id,
            id_card_number,
            first_name,
            last_name,
            phone_number,
            reason_type,
            reason_detail,
            severity,
            incident_date,
            status,
            admin_notes,
            rejection_reason,
            evidence_urls
        } = body;

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

        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (phone_number !== undefined) updateData.phone_number = phone_number;
        if (reason_type !== undefined) updateData.reason_type = reason_type;
        if (reason_detail !== undefined) updateData.reason_detail = reason_detail;
        if (severity !== undefined) updateData.severity = severity;
        if (incident_date !== undefined) updateData.incident_date = incident_date;
        if (status !== undefined) updateData.status = status;
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
        if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason;
        if (evidence_urls !== undefined) updateData.evidence_urls = evidence_urls;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: true, message: 'Nothing to update' });
        }

        const { error } = await adminClient
            .from('customer_blacklist')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', report_id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
