import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to hash ID card number
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

        const adminClient = createAdminClient();
        const body = await request.json();
        const { id_cards, confirm } = body; // confirm = true means execute update

        if (!Array.isArray(id_cards) || id_cards.length === 0) {
            return NextResponse.json({ error: 'No ID cards provided' }, { status: 400 });
        }

        const matches = [];
        const updates = [];
        let successCount = 0;

        for (const idCardWithDash of id_cards) {
            // Clean ID Card just in case
            const rawId = String(idCardWithDash).replace(/\D/g, '');
            if (rawId.length !== 13) continue;

            const idHash = hashIdCard(rawId);

            // Find matching record that doesn't have a full ID yet (or has one but we want to confirm match)
            const { data: existing } = await adminClient
                .from('customer_blacklist')
                .select('id, first_name, last_name, id_card_last4')
                .eq('id_card_hash', idHash)
                .single(); // Assuming unique hash per record usually

            if (existing) {
                matches.push({
                    id: existing.id,
                    first_name: existing.first_name,
                    last_name: existing.last_name,
                    matched_id_card: rawId,
                    current_last4: existing.id_card_last4
                });

                if (confirm) {
                    // Update the record
                    const { error } = await adminClient
                        .from('customer_blacklist')
                        .update({
                            id_card_number: rawId,
                            // Ensure last4 is correct (though it should be)
                            id_card_last4: rawId.slice(-4)
                        })
                        .eq('id', existing.id);

                    if (!error) successCount++;
                }
            }
        }

        return NextResponse.json({
            matchCount: matches.length,
            matches: matches.slice(0, 50), // Return preview of first 50
            totalProcessed: id_cards.length,
            updatedCount: successCount,
            preview: !confirm
        });

    } catch (error) {
        console.error('Smart Match Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
