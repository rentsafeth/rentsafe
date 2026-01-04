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

        const body = await request.json();
        const { id_cards } = body; // Array of plain ID cards

        if (!Array.isArray(id_cards) || id_cards.length === 0) {
            return NextResponse.json({ duplicates: [] });
        }

        // 1. Hash all incoming IDs
        const hashedIds = id_cards.map(id => ({ plain: id, hash: hashIdCard(id) }));
        const detailsMap = new Map(); // Store details for matching if needed (optional)

        // 2. Query DB for these hashes
        const adminClient = createAdminClient();
        const { data: found, error } = await adminClient
            .from('customer_blacklist')
            .select('id_card_hash')
            .in('id_card_hash', hashedIds.map(h => h.hash))
            .eq('status', 'approved'); // Only check approved/active blacklists

        if (error) throw error;

        // 3. Match back to plain IDs
        const foundHashes = new Set(found?.map(f => f.id_card_hash));
        const duplicatePlainIds = hashedIds
            .filter(h => foundHashes.has(h.hash))
            .map(h => h.plain);

        return NextResponse.json({ duplicates: duplicatePlainIds });

    } catch (error: any) {
        console.error('Check duplicates error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
