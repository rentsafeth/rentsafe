import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import HeroSection from '@/components/features/home/HeroSection'
import { Shield, Search, AlertTriangle, CheckCircle, Star, Building2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'HomePage' })

    return {
        title: `RentSafe - ${t('title')}`,
        description: t('subtitle'),
        openGraph: {
            title: `RentSafe - ${t('title')}`,
            description: t('subtitle'),
            type: 'website',
        },
    }
}

// Helper function to format relative time
function formatRelativeTime(date: Date): { value: number; unit: 'hours' | 'days' } {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays >= 1) {
        return { value: diffDays, unit: 'days' }
    }
    return { value: diffHours || 1, unit: 'hours' }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'HomePage' })
    const supabase = await createClient()

    // Fetch real stats from database
    const [shopsResult, usersResult, reportsResult] = await Promise.all([
        supabase.from('shops').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
    ])

    const stats = {
        shops: shopsResult.count || 0,
        users: usersResult.count || 0,
        reports: reportsResult.count || 0,
    }

    // Fetch verified shops (limit 3)
    const { data: verifiedShops } = await supabase
        .from('shops')
        .select('id, name, service_provinces, rating_average, review_count, logo_url, cover_url')
        .eq('verification_status', 'verified')
        .eq('is_active', true)
        .order('rating_average', { ascending: false })
        .limit(3)

    // Fetch recent approved reports (limit 3)
    const { data: recentReports } = await supabase
        .from('reports')
        .select('id, manual_shop_name, description, created_at, shop_id, shops(name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3)

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <HeroSection stats={stats} />

            {/* Features & Stats Section - Combined */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {t('whyRentSafe')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Feature 1 - Search */}
                        <div className="text-center p-5 md:p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                            <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-xl mb-3 md:mb-4">
                                <Search className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            </div>
                            <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">
                                {t('featureSearchTitle')}
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base hidden sm:block">
                                {t('featureSearchDesc')}
                            </p>
                        </div>

                        {/* Feature 2 - Warning */}
                        <div className="text-center p-5 md:p-6 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-100">
                            <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-red-600 rounded-xl mb-3 md:mb-4">
                                <AlertTriangle className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            </div>
                            <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">
                                {t('featureWarningTitle')}
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base hidden sm:block">
                                {t('featureWarningDesc')}
                            </p>
                        </div>

                        {/* Feature 3 - Verified */}
                        <div className="text-center p-5 md:p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-100">
                            <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-green-600 rounded-xl mb-3 md:mb-4">
                                <CheckCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            </div>
                            <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">
                                {t('featureVerifiedTitle')}
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base hidden sm:block">
                                {t('featureVerifiedDesc')}
                            </p>
                        </div>

                        {/* Stat 1 - Shops */}
                        <div className="text-center p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
                            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1 md:mb-2">
                                {stats.shops.toLocaleString()}
                            </div>
                            <div className="text-gray-600 text-sm md:text-base font-medium">{t('statsShops')}</div>
                        </div>

                        {/* Stat 2 - Users */}
                        <div className="text-center p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
                            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1 md:mb-2">
                                {stats.users.toLocaleString()}
                            </div>
                            <div className="text-gray-600 text-sm md:text-base font-medium">{t('statsUsers')}</div>
                        </div>

                        {/* Stat 3 - Reports */}
                        <div className="text-center p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
                            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1 md:mb-2">
                                {stats.reports.toLocaleString()}
                            </div>
                            <div className="text-gray-600 text-sm md:text-base font-medium">{t('statsReports')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Verified Shops Section */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                {t('verifiedShopsTitle')}
                            </h2>
                            <p className="text-gray-600">{t('verifiedShopsDesc')}</p>
                        </div>
                        <Link href="/search" className="mt-4 md:mt-0 text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                            {t('viewAll')}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {verifiedShops && verifiedShops.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {verifiedShops.map((shop) => (
                                <Link
                                    key={shop.id}
                                    href={`/shop/${shop.id}`}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                                >
                                    {/* Cover Image */}
                                    <div className="h-32 bg-gradient-to-br from-blue-500 to-cyan-400 relative">
                                        {shop.cover_url && (
                                            <Image
                                                src={shop.cover_url}
                                                alt={`${shop.name} cover`}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                        <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            {t('verified')}
                                        </div>
                                    </div>
                                    <div className="p-5 relative">
                                        {/* Logo - overlapping */}
                                        <div className="absolute -top-8 left-5 w-16 h-16 bg-white rounded-xl shadow-md border-2 border-white overflow-hidden">
                                            {shop.logo_url ? (
                                                <Image
                                                    src={shop.logo_url}
                                                    alt={`${shop.name} logo`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                    <Building2 className="w-8 h-8 text-slate-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-6">
                                            <h3 className="font-semibold text-gray-900 text-lg mb-1">{shop.name}</h3>
                                            <p className="text-gray-500 text-sm mb-3">
                                                {shop.service_provinces?.[0] || '-'}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                    <span className="font-medium text-gray-900">
                                                        {shop.rating_average?.toFixed(1) || '0.0'}
                                                    </span>
                                                    <span className="text-gray-400 text-sm">
                                                        ({shop.review_count || 0} {t('reviews')})
                                                    </span>
                                                </div>
                                                <span className="text-blue-600 font-medium text-sm">{t('viewDetails')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            {t('noVerifiedShops')}
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Reports Section */}
            <section className="py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                {t('recentReportsTitle')}
                            </h2>
                            <p className="text-gray-600">{t('recentReportsDesc')}</p>
                        </div>
                        <Link href="/report" className="mt-4 md:mt-0 text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                            {t('reportShop')}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {recentReports && recentReports.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentReports.map((report: any) => {
                                const shopName = report.shops?.name || report.manual_shop_name || 'Unknown'
                                const relTime = formatRelativeTime(new Date(report.created_at))

                                return (
                                    <div key={report.id} className="bg-white rounded-2xl border border-red-100 p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{shopName}</h4>
                                                <p className="text-gray-500 text-sm">
                                                    {t('reportedAgo')} {relTime.value} {t(relTime.unit === 'hours' ? 'hoursAgo' : 'daysAgo')}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {report.description}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            {t('noReports')}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24 bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="container mx-auto px-4 text-center">
                    <Shield className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mx-auto mb-4 md:mb-6" />
                    <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">
                        {t('ctaTitle')}
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
                        {t('ctaDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            {t('ctaSignUp')}
                        </Link>
                        <Link
                            href="/search"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                        >
                            {t('ctaSearch')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
