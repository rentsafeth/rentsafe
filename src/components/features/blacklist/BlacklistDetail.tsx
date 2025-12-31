'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    AlertTriangle,
    ShieldAlert,
    Phone,
    CreditCard,
    User,
    Calendar,
    DollarSign,
    FileText,
    Image as ImageIcon,
    Plus,
    MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface BlacklistEntry {
    id: string
    bank_account_no: string | null
    phone_numbers: string[]
    id_card_numbers: string[]
    line_ids: string[]
    shop_names: string[]
    total_reports: number
    total_amount_lost: number
    first_reported_at: string
    last_reported_at: string
    severity: 'low' | 'medium' | 'high' | 'critical'
}

interface Report {
    id: string
    reporter_id: string
    manual_shop_name: string | null
    manual_shop_contact: string | null
    manual_bank_account: string | null
    description: string
    evidence_urls: string[]
    incident_date: string | null
    amount_lost: number | null
    created_at: string
    profiles: {
        full_name: string | null
        avatar_url: string | null
    }[] | {
        full_name: string | null
        avatar_url: string | null
    } | null
}

interface Props {
    entry: BlacklistEntry
    reports: Report[]
}

const severityColors = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    high: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-red-600 text-white border-red-700',
}

const severityLabels = {
    low: 'ระดับต่ำ',
    medium: 'ระดับกลาง',
    high: 'ระดับสูง',
    critical: 'อันตรายมาก',
}

export default function BlacklistDetail({ entry, reports }: Props) {
    const t = useTranslations('BlacklistPage')
    const [expandedReport, setExpandedReport] = useState<string | null>(null)

    // Mask name for privacy (e.g., "สมชาย ใจดี" -> "สม*** ใ***")
    const maskName = (name: string | null | undefined): string => {
        if (!name) return t('anonymousReporter')

        const parts = name.split(' ')
        return parts.map(part => {
            if (part.length <= 1) return part
            // Show first character, mask the rest
            return part.charAt(0) + '*'.repeat(Math.min(part.length - 1, 3))
        }).join(' ')
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center">
                                <ShieldAlert className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-red-800">
                                    {entry.shop_names?.[0] || t('unknownShop')}
                                </CardTitle>
                                <p className="text-red-600 text-sm mt-1">
                                    {t('reportedBy', { count: entry.total_reports })}
                                </p>
                            </div>
                        </div>
                        <Badge className={`${severityColors[entry.severity]} text-sm px-3 py-1`}>
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {t(`severity.${entry.severity}`)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/80 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{entry.total_reports}</div>
                            <div className="text-sm text-slate-600">{t('totalReports')}</div>
                        </div>
                        <div className="bg-white/80 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{formatMoney(entry.total_amount_lost)}</div>
                            <div className="text-sm text-slate-600">{t('totalLoss')}</div>
                        </div>
                        <div className="bg-white/80 rounded-lg p-4 text-center">
                            <div className="text-sm font-medium text-slate-800">
                                {entry.first_reported_at ? formatDate(entry.first_reported_at) : '-'}
                            </div>
                            <div className="text-sm text-slate-600">{t('firstReport')}</div>
                        </div>
                        <div className="bg-white/80 rounded-lg p-4 text-center">
                            <div className="text-sm font-medium text-slate-800">
                                {entry.last_reported_at ? formatDate(entry.last_reported_at) : '-'}
                            </div>
                            <div className="text-sm text-slate-600">{t('lastReport')}</div>
                        </div>
                    </div>

                    {/* Identifiers */}
                    <div className="bg-white/80 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-slate-800">{t('identifiers')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {entry.bank_account_no && (
                                <div className="flex items-center gap-2 text-sm">
                                    <CreditCard className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-600">{t('bankAccount')}:</span>
                                    <span className="font-mono font-medium text-red-700">{entry.bank_account_no}</span>
                                </div>
                            )}
                            {entry.phone_numbers?.length > 0 && entry.phone_numbers.map((phone, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-600">{t('phone')}:</span>
                                    <span className="font-medium text-red-700">{phone}</span>
                                </div>
                            ))}
                            {entry.id_card_numbers?.length > 0 && entry.id_card_numbers.map((id, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-600">{t('idCard')}:</span>
                                    <span className="font-mono font-medium text-red-700">{id}</span>
                                </div>
                            ))}
                            {entry.line_ids?.length > 0 && entry.line_ids.map((lineId, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <MessageCircle className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-600">Line:</span>
                                    <span className="font-medium text-red-700">{lineId}</span>
                                </div>
                            ))}
                        </div>
                        {entry.shop_names?.length > 1 && (
                            <div className="pt-2 border-t border-slate-200">
                                <p className="text-sm text-slate-600">
                                    {t('alsoKnownAs')}: {entry.shop_names.slice(1).join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add Report Button */}
            <div className="flex justify-end">
                <Link href={`/report?blacklist_id=${entry.id}&bank=${entry.bank_account_no || ''}`}>
                    <Button className="bg-red-600 hover:bg-red-700">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('addReport')}
                    </Button>
                </Link>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('allReports')} ({reports.length})
                </h3>

                {reports.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center text-slate-500">
                            {t('noReports')}
                        </CardContent>
                    </Card>
                ) : (
                    reports.map((report) => (
                        <Card key={report.id} className="border-slate-200 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                {maskName(Array.isArray(report.profiles) ? report.profiles[0]?.full_name : report.profiles?.full_name)}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {t('reportedOn')} {formatDate(report.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    {report.amount_lost && report.amount_lost > 0 && (
                                        <Badge variant="outline" className="border-red-200 text-red-700">
                                            <DollarSign className="w-3 h-3 mr-1" />
                                            {formatMoney(report.amount_lost)}
                                        </Badge>
                                    )}
                                </div>

                                {/* Report Details */}
                                <div className="space-y-3">
                                    {report.incident_date && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="w-4 h-4" />
                                            {t('incidentDate')}: {formatDate(report.incident_date)}
                                        </div>
                                    )}

                                    <p className={`text-slate-700 ${expandedReport === report.id ? '' : 'line-clamp-3'}`}>
                                        {report.description}
                                    </p>

                                    {report.description.length > 200 && (
                                        <button
                                            onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                                            className="text-blue-600 text-sm hover:underline"
                                        >
                                            {expandedReport === report.id ? t('showLess') : t('showMore')}
                                        </button>
                                    )}

                                    {/* Evidence Images */}
                                    {report.evidence_urls && report.evidence_urls.length > 0 && (
                                        <div className="pt-3 border-t border-slate-100">
                                            <p className="text-sm text-slate-600 mb-2 flex items-center gap-1">
                                                <ImageIcon className="w-4 h-4" />
                                                {t('evidence')} ({report.evidence_urls.length})
                                            </p>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {report.evidence_urls.map((url, i) => (
                                                    <a
                                                        key={i}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-shrink-0"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`${t('evidence')} ${i + 1}`}
                                                            className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:border-blue-400 transition-colors"
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
