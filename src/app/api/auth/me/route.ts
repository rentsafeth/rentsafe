import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ user: null, role: null }, { status: 200 })
        }

        // Fetch role from profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
            },
            role: profile?.role || 'user'
        })
    } catch (error) {
        console.error('API /auth/me error:', error)
        return NextResponse.json({ user: null, role: null, error: 'Server error' }, { status: 500 })
    }
}
