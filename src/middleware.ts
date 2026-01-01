import { type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { updateSession } from '@/lib/supabase/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
    // Update Supabase auth session
    const supabaseResponse = await updateSession(request)

    // Apply internationalization
    const intlResponse = intlMiddleware(request)

    // Merge cookies from supabase response
    supabaseResponse.cookies.getAll().forEach(cookie => {
        intlResponse.cookies.set(cookie.name, cookie.value)
    })

    return intlResponse
}

export const config = {
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /.*\\..* (files with extensions, e.g. favicon.ico)
    // - metadata routes: apple-icon, icon, manifest, sitemap, robots
    matcher: [
        '/',
        '/(th|en)/:path*',
        '/((?!api|_next|_vercel|apple-icon|icon|manifest|sitemap|robots|.*\\..*).*)'
    ]
}
