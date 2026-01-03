import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to hash ID card number
function hashIdCard(idCard: string): string {
    return crypto.createHash('sha256').update(idCard).digest('hex');
}

// GET - Search blacklist
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json(
                { error: 'Missing search query' },
                { status: 400 }
            );
        }

        // Get shop
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id, is_verified_shop')
            .eq('owner_id', user.id)
            .single();

        if (shopError || !shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Check rate limit for non-pro shops
        const { data: remainingSearches } = await supabase
            .rpc('get_remaining_blacklist_searches', { p_shop_id: shop.id });

        if (remainingSearches === 0) {
            return NextResponse.json({
                error: 'search_limit_exceeded',
                message: 'คุณใช้สิทธิ์ค้นหาครบ 3 ครั้งแล้ววันนี้',
                upgrade_url: '/pricing',
            }, { status: 429 });
        }

        // Clean query for different search types
        const cleanQuery = query.replace(/-/g, '').replace(/\s+/g, ' ').trim();

        // Detect query type and build appropriate search
        const isIdCard = /^\d{13}$/.test(cleanQuery);
        const isPhone = /^\d{9,10}$/.test(cleanQuery);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

        let results: any[] = [];
        let searchError: any = null;

        if (isUuid) {
            // Search by UUID (Exact Match)
            const { data, error } = await supabase
                .from('customer_blacklist')
                .select(`
                    id, id_card_last4, first_name, last_name, phone_number,
                    reason_type, reason_detail, severity, report_count, created_at
                `)
                .eq('status', 'approved')
                .eq('id', cleanQuery);
            results = data || [];
            searchError = error;
        } else if (isIdCard) {
            // Search by ID card hash
            const hash = hashIdCard(cleanQuery);
            const { data, error } = await supabase
                .from('customer_blacklist')
                .select(`
                    id, id_card_last4, first_name, last_name, phone_number,
                    reason_type, reason_detail, severity, report_count, created_at
                `)
                .eq('status', 'approved')
                .eq('id_card_hash', hash);
            results = data || [];
            searchError = error;
        } else if (isPhone) {
            // Search by phone number
            const { data, error } = await supabase
                .from('customer_blacklist')
                .select(`
                    id, id_card_last4, first_name, last_name, phone_number,
                    reason_type, reason_detail, severity, report_count, created_at
                `)
                .eq('status', 'approved')
                .eq('phone_number', cleanQuery);
            results = data || [];
            searchError = error;
        } else {
            // Search by name (first name or last name)
            const nameParts = query.trim().split(' ');
            let nameQuery;

            if (nameParts.length >= 2) {
                // Search by first name AND last name
                nameQuery = supabase
                    .from('customer_blacklist')
                    .select(`
                        id, id_card_last4, first_name, last_name, phone_number,
                        reason_type, reason_detail, severity, report_count, created_at
                    `)
                    .eq('status', 'approved')
                    .ilike('first_name', `%${nameParts[0]}%`)
                    .ilike('last_name', `%${nameParts.slice(1).join(' ')}%`);
            } else {
                // Search by either first name OR last name
                nameQuery = supabase
                    .from('customer_blacklist')
                    .select(`
                        id, id_card_last4, first_name, last_name, phone_number,
                        reason_type, reason_detail, severity, report_count, created_at
                    `)
                    .eq('status', 'approved')
                    .or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`);
            }

            const { data, error } = await nameQuery;
            results = data || [];
            searchError = error;
        }

        if (searchError) {
            console.error('Search error:', searchError);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        // Determine search type for logging
        const detectedSearchType = isIdCard ? 'id_card' : isPhone ? 'phone' : 'name';

        // Log the search
        await supabase
            .from('blacklist_search_logs')
            .insert({
                shop_id: shop.id,
                search_query: query,
                search_type: detectedSearchType,
                result_found: results && results.length > 0,
            });

        // For non-pro shops, mask some data
        const isPro = shop.is_verified_shop;
        const maskedResults = results?.map(r => ({
            ...r,
            phone_number: isPro ? r.phone_number : r.phone_number?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
            reason_detail: isPro ? r.reason_detail : r.reason_detail?.substring(0, 50) + '...',
        }));

        // Get new remaining count
        const { data: newRemainingSearches } = await supabase
            .rpc('get_remaining_blacklist_searches', { p_shop_id: shop.id });

        return NextResponse.json({
            results: maskedResults || [],
            found: results && results.length > 0,
            remaining_searches: newRemainingSearches,
            is_pro: isPro,
        });
    } catch (error) {
        console.error('Error in blacklist search:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Report customer to blacklist
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            id_card_number,
            first_name,
            last_name,
            phone_number,
            reason_type,
            reason_detail,
            incident_date,
            evidence_urls,
        } = body;

        // Validate required fields
        if (!id_card_number || !first_name || !last_name || !reason_type || !reason_detail) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate ID card format (13 digits)
        const cleanIdCard = id_card_number.replace(/-/g, '');
        if (!/^\d{13}$/.test(cleanIdCard)) {
            return NextResponse.json(
                { error: 'Invalid ID card format' },
                { status: 400 }
            );
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

        // Hash the ID card
        const idCardHash = hashIdCard(cleanIdCard);
        const idCardLast4 = cleanIdCard.slice(-4);

        // Check if already reported by this shop
        const { data: existing } = await supabase
            .from('customer_blacklist')
            .select('id')
            .eq('id_card_hash', idCardHash)
            .eq('reported_by_shop_id', shop.id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'คุณเคยรายงานลูกค้าคนนี้แล้ว' },
                { status: 400 }
            );
        }

        // Determine severity based on reason type
        let severity = 'warning';
        if (['no_return', 'fake_docs'].includes(reason_type)) {
            severity = 'severe';
        } else if (['damage', 'no_pay'].includes(reason_type)) {
            severity = 'moderate';
        }

        // Create blacklist entry
        const { data: newEntry, error: insertError } = await supabase
            .from('customer_blacklist')
            .insert({
                id_card_hash: idCardHash,
                id_card_last4: idCardLast4,
                first_name,
                last_name,
                phone_number: phone_number?.replace(/-/g, '') || null,
                reported_by_shop_id: shop.id,
                reason_type,
                reason_detail,
                incident_date: incident_date || null,
                evidence_urls: evidence_urls || [],
                severity,
                status: 'pending',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'รายงานถูกส่งเรียบร้อยแล้ว รอการตรวจสอบจาก Admin',
            report_id: newEntry.id,
        });
    } catch (error) {
        console.error('Error creating blacklist report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
