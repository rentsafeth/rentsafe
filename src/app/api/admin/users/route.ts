import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '';
        const role = searchParams.get('role') || 'all';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let dbQuery = supabase
            .from('profiles')
            .select('*', { count: 'exact' });

        // Filter by role
        if (role !== 'all') {
            dbQuery = dbQuery.eq('role', role);
        }

        // Search
        if (query) {
            dbQuery = dbQuery.or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
        }

        // Pagination
        dbQuery = dbQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await dbQuery;

        if (error) throw error;

        return NextResponse.json({
            users: data,
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
