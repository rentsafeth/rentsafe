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

        // Clean query for different search types (remove hyphens for ID card/Phone)
        const cleanQuery = query.replace(/-/g, '').replace(/\s+/g, ' ').trim();

        // Detect query type
        // Check UUID from original query (must have hyphens)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim());
        const isIdCard = /^\d{13}$/.test(cleanQuery);
        const isPhone = /^\d{9,10}$/.test(cleanQuery);

        let results: any[] = [];
        let searchError: any = null;

        if (isUuid) {
            // Search by UUID (Use original query with hyphens)
            const { data, error } = await supabase
                .from('customer_blacklist')
                .select(`
                    id, id_card_last4, id_card_number, first_name, last_name, phone_number,
                    reason_type, reason_detail, severity, report_count, created_at, evidence_urls
                `)
                .eq('status', 'approved')
                .eq('id', query.trim()); // Use original query
            results = data || [];
            searchError = error;
        } else if (isIdCard) {
            // Search by ID card hash
            const hash = hashIdCard(cleanQuery);
            const { data, error } = await supabase
                .from('customer_blacklist')
                .select(`
                    id, id_card_last4, id_card_number, first_name, last_name, phone_number,
                    reason_type, reason_detail, severity, report_count, created_at, evidence_urls
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
                    id, id_card_last4, id_card_number, first_name, last_name, phone_number,
                    reason_type, reason_detail, severity, report_count, created_at, evidence_urls
                    `)
                .eq('status', 'approved')
                .eq('phone_number', cleanQuery);
            results = data || [];
            searchError = error;
        } else {
            // Search by name (first name or last name)
            const cleanQuery = query.trim();
            const nameParts = cleanQuery.split(' ');
            let nameQuery;

            if (nameParts.length >= 2) {
                // Search by first name AND last name
                nameQuery = supabase
                    .from('customer_blacklist')
                    .select(`
                        id, id_card_last4, id_card_number, first_name, last_name, phone_number,
                    reason_type, reason_detail, severity, report_count, created_at, evidence_urls
                        `)
                    .eq('status', 'approved')
                    .ilike('first_name', `%${nameParts[0]}%`)
                    .ilike('last_name', `%${nameParts.slice(1).join(' ')}%`);
            } else {
                // Search by either first name OR last name
                nameQuery = supabase
                    .from('customer_blacklist')
                    .select(`
                        id, id_card_last4, id_card_number, first_name, last_name, phone_number,
                    reason_type, reason_detail, severity, report_count, created_at, evidence_urls
                    `)
                    .eq('status', 'approved')
                    .or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`);
            }

            const { data: nameResults, error: nameError } = await nameQuery;

            if (nameError) {
                // If name search fails, throw immediately
                throw nameError;
            }

            results = nameResults || [];

            // NEW: Search in 'reason_detail' if query is long enough
            if (cleanQuery.length >= 4) {
                const { data: reasonResults, error: reasonError } = await supabase
                    .from('customer_blacklist')
                    .select(`
                        id, id_card_last4, id_card_number, first_name, last_name, phone_number,
                    reason_type, reason_detail, severity, report_count, created_at, evidence_urls
                    `)
                    .eq('status', 'approved')
                    .ilike('reason_detail', `%${cleanQuery}%`);

                if (!reasonError && reasonResults && reasonResults.length > 0) {
                    // Merge and Deduplicate results
                    const resultMap = new Map();
                    results.forEach(r => resultMap.set(r.id, r));
                    reasonResults.forEach(r => resultMap.set(r.id, r));
                    results = Array.from(resultMap.values());
                }
            }
        }

        if (searchError) {
            console.error('Search error:', searchError);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        // Log the search
        await supabase
            .from('blacklist_search_logs')
            .insert({
                shop_id: shop.id,
                search_query: query,
                search_type: isIdCard ? 'id_card' : isPhone ? 'phone' : 'name',
                result_found: results && results.length > 0,
            });

        // Return full data (No masking as requested)
        const isPro = shop.is_verified_shop;

        // Get new remaining count
        const { data: newRemainingSearches } = await supabase
            .rpc('get_remaining_blacklist_searches', { p_shop_id: shop.id });

        return NextResponse.json({
            results: results || [],
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
            document_type = 'id_card', // Default value
        } = body;

        // Validate required fields
        if (!id_card_number || !first_name || !last_name || !reason_type || !reason_detail) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const cleanIdCard = id_card_number.trim();
        const isNumeric = /^\d+$/.test(cleanIdCard);

        if (document_type === 'driving_license') {
            // Driving License: Must be 8 digits
            if (!/^\d{8}$/.test(cleanIdCard)) {
                return NextResponse.json(
                    { error: 'เลขใบขับขี่ต้องเป็นตัวเลข 8 หลัก' },
                    { status: 400 }
                );
            }
        } else if (document_type === 'passport') {
            // Passport validation: at least 6 chars
            if (cleanIdCard.length < 6) {
                return NextResponse.json(
                    { error: 'เลข Passport ต้องมีอย่างน้อย 6 ตัวอักษร' },
                    { status: 400 }
                );
            }
        } else {
            // Thai ID Card (Default): Must be 13 digits numeric
            if (!/^\d{13}$/.test(cleanIdCard)) {
                return NextResponse.json(
                    { error: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' },
                    { status: 400 }
                );
            }
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
                id_card_number: cleanIdCard, // Save full number
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
