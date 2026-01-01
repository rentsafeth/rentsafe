'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Heart, Sparkles, Gift, TrendingUp, CheckCircle,
    Star, Loader2, Clock, ArrowLeft, ChevronLeft, ChevronRight,
    ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface KarmaTransaction {
    id: string
    amount: number
    type: string
    description: string
    balance_after: number
    created_at: string
    reference_type?: string
    reference_id?: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

const typeColors: Record<string, string> = {
    heart_received: 'bg-pink-100 text-pink-700',
    report_verified: 'bg-green-100 text-green-700',
    bonus: 'bg-yellow-100 text-yellow-700',
    reward_redeemed: 'bg-purple-100 text-purple-700'
}

export default function KarmaHistoryPage() {
    const params = useParams()
    const router = useRouter()
    const locale = params.locale as string
    const t = useTranslations('KarmaHistoryPage')

    const [loading, setLoading] = useState(true)
    const [transactions, setTransactions] = useState<KarmaTransaction[]>([])
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    })

    const loadTransactions = useCallback(async (page: number) => {
        try {
            const response = await fetch(`/api/karma/history?page=${page}&limit=20`)
            const data = await response.json()
            if (data.success) {
                setTransactions(data.transactions)
                setPagination(data.pagination)
            }
        } catch (error) {
            console.error('Error loading transactions:', error)
        }
    }, [])

    const checkAuthAndLoadData = useCallback(async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push(`/${locale}/login`)
            return
        }

        await loadTransactions(1)
        setLoading(false)
    }, [loadTransactions, router, locale])

    useEffect(() => {
        checkAuthAndLoadData()
    }, [checkAuthAndLoadData])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handlePageChange = (newPage: number) => {
        setLoading(true)
        loadTransactions(newPage).then(() => setLoading(false))
    }

    const renderSourceLink = (tx: KarmaTransaction) => {
        if (tx.reference_type === 'report' && tx.reference_id) {
            return (
                <Link
                    href={`/${locale}/report/${tx.reference_id}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                    <ExternalLink className="w-3 h-3" />
                    {t('viewSource')}
                </Link>
            )
        }
        return null
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                    <p className="text-slate-500">{t('loading')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/${locale}/profile/karma`}>
                    <Button variant="outline" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t('title')}</h1>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-green-600">{t('summary.received')}</p>
                                <p className="text-xl font-bold text-green-700">
                                    +{transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <Gift className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-red-600">{t('summary.spent')}</p>
                                <p className="text-xl font-bold text-red-700">
                                    {transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        {t('list.title', { count: pagination.total })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>{t('list.empty')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[tx.type] || 'bg-slate-100'}`}>
                                                {tx.type === 'heart_received' && <Heart className="w-5 h-5" />}
                                                {tx.type === 'report_verified' && <CheckCircle className="w-5 h-5" />}
                                                {tx.type === 'bonus' && <Gift className="w-5 h-5" />}
                                                {tx.type === 'reward_redeemed' && <Star className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {t(`types.${tx.type}`)}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {formatDate(tx.created_at)}
                                                </p>
                                                {renderSourceLink(tx)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-lg ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {t('list.balance', { amount: tx.balance_after })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm text-slate-600 px-4">
                                        {t('pagination.pageInfo', { page: pagination.page, totalPages: pagination.totalPages })}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
