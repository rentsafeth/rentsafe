import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { updateSession } from '@/lib/supabase/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
    // Update Supabase auth session and get user
    const { response: supabaseResponse, user } = await updateSession(request)

    // Apply internationalization
    const intlResponse = intlMiddleware(request)

    // Merge cookies from supabase response to intl response
    supabaseResponse.cookies.getAll().forEach(cookie => {
        intlResponse.cookies.set(cookie.name, cookie.value)
    })

    // --- Authentication & Access Control Logic ---
    const url = request.nextUrl.clone()
    const path = url.pathname

    // Remove locale prefix to check actual path (e.g. /th/dashboard -> /dashboard)
    const pathWithoutLocale = path.replace(/^\/(th|en)/, '') || '/'

    // Define protected roots
    const isProtectedRoute = /^\/(dashboard|admin)/.test(pathWithoutLocale)
    const isAuthRoute = /^\/(login|register)/.test(pathWithoutLocale)

    // 1. Block unauthenticated access to protected routes
    if (isProtectedRoute && !user) {
        // Redirect to login page with matching locale
        const locale = path.match(/^\/(th|en)/)?.[1] || 'th'
        url.pathname = `/${locale}/login`
        // Add redirect param so they come back after login? (Optional, skipping for simplicity)
        return NextResponse.redirect(url)
    }

    // 2. Redirect authenticated users away from auth pages (login/user registration)
    // Exception: Allow authenticated users to access shop registration
    if (isAuthRoute && user && !pathWithoutLocale.startsWith('/register/shop')) {
        const locale = path.match(/^\/(th|en)/)?.[1] || 'th'
        url.pathname = `/${locale}/dashboard`
        return NextResponse.redirect(url)
    }

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
