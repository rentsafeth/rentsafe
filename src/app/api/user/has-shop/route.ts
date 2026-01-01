import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ hasShop: false, authenticated: false })
        }

        // Check if user already has a shop (using service role bypasses RLS)
        const { data: shop, error } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is fine
            console.error('Error checking shop:', error)
        }

        return NextResponse.json({
            hasShop: !!shop,
            authenticated: true,
            userId: user.id,
            email: user.email
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json({ hasShop: false, authenticated: false, error: 'Server error' }, { status: 500 })
    }
}
