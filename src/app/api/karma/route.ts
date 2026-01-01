import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/karma - Get user's karma credits
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'not_authenticated' },
                { status: 401 }
            );
        }

        // Call the database function
        const { data, error } = await supabase.rpc('get_user_karma');

        if (error) {
            console.error('Error getting karma:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Karma API error:', error);
        return NextResponse.json(
            { success: false, error: 'server_error' },
            { status: 500 }
        );
    }
}
