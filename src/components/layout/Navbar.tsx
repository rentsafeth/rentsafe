'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect } from 'react'
import { ShieldCheck, Search, FileWarning, Menu, X, User, LogOut, Globe, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import NotificationBell from '@/components/features/notifications/NotificationBell'
import InstallPWAButton from '@/components/common/InstallPWAButton'

export default function Navbar() {
    const t = useTranslations('Common')
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showLangMenu, setShowLangMenu] = useState(false)
    const [role, setRole] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createClient()
        let isMounted = true

        // Fail-safe: Force stop loading after 5 seconds if auth check hangs
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                setIsLoading(false)
            }
        }, 5000)

        const fetchProfile = async (userId: string) => {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .maybeSingle()

                if (isMounted) {
                    setRole(profile?.role ?? null)
                }
            } catch (err) {
                console.error('Error fetching profile:', err)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!isMounted) return

                setUser(session?.user ?? null)
                if (session?.user) {
                    await fetchProfile(session.user.id)
                } else {
                    setIsLoading(false)
                }
            } catch (error) {
                console.error('Auth error:', error)
                if (isMounted) setIsLoading(false)
            }
        }

        checkUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return

            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user.id)
            } else {
                setRole(null)
                setIsLoading(false)
            }
        })

        return () => {
            isMounted = false
            clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [])

    const switchLocale = (newLocale: string) => {
        // Get current path without locale prefix
        const pathWithoutLocale = pathname.replace(/^\/(th|en)/, '') || '/'
        // Navigate to new locale path
        window.location.href = `/${newLocale}${pathWithoutLocale}`
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const navLinks = [
        { href: '/search', label: t('search'), icon: Search },
        { href: '/report', label: t('report'), icon: FileWarning, className: 'text-red-600 hover:text-red-700' },
    ]

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center group-hover:from-blue-700 group-hover:to-blue-800 transition-all shadow-md">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            RentSafe
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${link.className || 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side - Language & Auth */}
                    <div className="hidden md:flex items-center gap-3">
                        <InstallPWAButton />
                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="text-sm uppercase">{locale}</span>
                            </button>

                            {showLangMenu && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                    <button
                                        onClick={() => switchLocale('th')}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 ${locale === 'th' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                                    >
                                        🇹🇭 ไทย
                                    </button>
                                    <button
                                        onClick={() => switchLocale('en')}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 ${locale === 'en' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                                    >
                                        🇺🇸 English
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Auth Buttons */}
                        {isLoading ? (
                            <div className="w-24 h-10 bg-gray-100 animate-pulse rounded-xl"></div>
                        ) : user ? (
                            <div className="flex items-center gap-2">
                                <NotificationBell />
                                <Link
                                    href={role === 'admin' ? '/admin' : '/dashboard'}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    {role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('logout')}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium rounded-xl transition-colors"
                                >
                                    {t('login')}
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    {t('register')}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-1 md:hidden">
                        <InstallPWAButton />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100">
                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${link.className || 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    <link.icon className="w-5 h-5" />
                                    {link.label}
                                </Link>
                            ))}

                            {/* Language Switcher Mobile */}
                            <div className="flex items-center gap-2 px-4 py-3">
                                <Globe className="w-5 h-5 text-gray-500" />
                                <button
                                    onClick={() => switchLocale('th')}
                                    className={`px-3 py-1 rounded-lg text-sm ${locale === 'th' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-600'}`}
                                >
                                    🇹🇭 ไทย
                                </button>
                                <button
                                    onClick={() => switchLocale('en')}
                                    className={`px-3 py-1 rounded-lg text-sm ${locale === 'en' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-600'}`}
                                >
                                    🇺🇸 EN
                                </button>
                            </div>

                            <hr className="my-2 border-gray-100" />

                            {user ? (
                                <>
                                    <Link
                                        href={role === 'admin' ? '/admin' : '/dashboard'}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                                    >
                                        <User className="w-5 h-5" />
                                        {role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout()
                                            setIsMenuOpen(false)
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors w-full"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        {t('logout')}
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-2 px-4">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl transition-colors hover:border-blue-200 hover:bg-blue-50"
                                    >
                                        {t('login')}
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl transition-colors"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                        {t('register')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
