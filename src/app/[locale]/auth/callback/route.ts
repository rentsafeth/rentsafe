import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type') // 'shop' for shop registration, 'user' for regular user
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Determine redirect URL based on registration type
            let redirectUrl = next

            // If this is a shop registration, redirect to pending page
            if (type === 'shop') {
                redirectUrl = '/register/shop/pending'
            } else if (type === 'user') {
                redirectUrl = '/dashboard'
            }

            // Redirect to the appropriate page
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${redirectUrl}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
            } else {
                return NextResponse.redirect(`${origin}${redirectUrl}`)
            }
        }
    }

    // Return the user to login page with error
    return NextResponse.redirect(`${origin}/login?error=auth`)
}
