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
                // UPDATE MODE: If 'id' is provided, update existing record
                if (item.id) {
                    const updateData: any = {};

                    // Update ID Card info if provided
                    if (item.id_card && item.id_card.length === 13) {
                        updateData.id_card_number = item.id_card;
                        updateData.id_card_hash = hashIdCard(item.id_card);
                        updateData.id_card_last4 = item.id_card.slice(-4);
                    }

                    // Update Names if provided
                    if (item.first_name) updateData.first_name = item.first_name;
                    if (item.last_name) updateData.last_name = item.last_name;
                    if (item.phone_number) updateData.phone_number = item.phone_number;

                    if (Object.keys(updateData).length > 0) {
                        const { error } = await adminClient
                            .from('customer_blacklist')
                            .update(updateData)
                            .eq('id', item.id);

                        if (error) throw error;
                        successCount++;
                    }
                    continue; // Skip the insert logic
                }

                // INSERT MODE: Create new record (Existing Logic)
                const idHash = hashIdCard(item.id_card);
                const idLast4 = item.id_card.slice(-4);

                // Check existing
                const { data: existing } = await adminClient
                    .from('customer_blacklist')
                    .select('id')
                    .eq('id_card_hash', idHash)
                    .eq('status', 'approved')
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
                        id_card_number: item.id_card.length === 13 ? item.id_card : null, // Store full ID if new import has it
                        first_name: item.first_name,
                        last_name: item.last_name,
                        phone_number: item.phone_number || null,
                        reason_type: item.reason_type,
                        reason_detail: item.reason_detail,
                        incident_date: item.incident_date || null,
                        severity: 'moderate',
                        status: 'approved',
                        reported_by_shop_id: null,
                        created_at: new Date().toISOString(),
                        admin_notes: 'Imported via JSON',
                    });

                if (error) throw error;
                successCount++;

            } catch (err: any) {
                console.error('Processing error:', err);
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
