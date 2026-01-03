import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to hash ID card number
function hashIdCard(idCard: string): string {
    return crypto.createHash('sha256').update(idCard).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use Admin Client for DB operations to bypass RLS
        const adminClient = createAdminClient();

        const body = await request.json();
        const { reports } = body;

        if (!Array.isArray(reports) || reports.length === 0) {
            return NextResponse.json({ error: 'No reports to import' }, { status: 400 });
        }

        let successCount = 0;
        let errors = [];

        // Note: For now, we set reported_by_shop_id to NULL for imported data
        // If the DB schema requires it, this will fail and we'll see the error.

        for (const item of reports) {
            try {
                // Hash ID Card
                const idHash = hashIdCard(item.id_card);
                const idLast4 = item.id_card.slice(-4);

                // Check existing
                const { data: existing } = await adminClient
                    .from('customer_blacklist')
                    .select('id')
                    .eq('id_card_hash', idHash)
                    .eq('status', 'approved') // Check if already approved/blacklisted
                    .single();

                if (existing) {
                    continue; // Skip existing approved entries
                }

                // Insert
                const { error } = await adminClient
                    .from('customer_blacklist')
                    .insert({
                        id_card_hash: idHash,
                        id_card_last4: idLast4,
                        first_name: item.first_name,
                        last_name: item.last_name,
                        reason_type: item.reason_type,
                        reason_detail: item.reason_detail,
                        incident_date: item.incident_date || null,
                        severity: 'moderate', // Default severity for imported
                        status: 'approved',
                        reported_by_shop_id: null, // Assuming DB allows null for imports
                        created_at: new Date().toISOString(),
                        admin_notes: 'Imported via JSON',
                    });

                if (error) {
                    console.error('Import insert error:', error);
                    errors.push({ name: `${item.first_name} ${item.last_name}`, error: error.message });
                } else {
                    successCount++;
                }

            } catch (err: any) {
                console.error('Import processing error:', err);
                errors.push({ name: `${item.first_name} ${item.last_name}`, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            count: successCount,
            errors,
        });

    } catch (error) {
        console.error('Import API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
