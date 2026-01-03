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
    MessageCircle,
    Heart,
    Loader2,
    Facebook,
    ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BlacklistEntry {
    id: string
    bank_account_no: string | null
    phone_numbers: string[]
    id_card_numbers: string[]
    line_ids: string[]
    facebook_urls: string[]
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
    heart_count?: number
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

// Facebook Link Component with Warning Logic
function FacebookLink({ url }: { url: string }) {
    const [showWarning, setShowWarning] = useState(false)
    const [hasSeenWarning, setHasSeenWarning] = useState(false)

    useEffect(() => {
        const seen = localStorage.getItem('seen_fb_warning')
        if (seen) {
            setHasSeenWarning(true)
        }
    }, [])

    const handleClick = (e: React.MouseEvent) => {
        if (!hasSeenWarning) {
            e.preventDefault()
            setShowWarning(true)
        }
    }

    const handleConfirm = () => {
        localStorage.setItem('seen_fb_warning', 'true')
        setHasSeenWarning(true)
        setShowWarning(false)
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    // Clean URL for display
    const displayUrl = url.replace(/^https?:\/\/(www\.)?facebook\.com\//, '').split('/')[0] || 'Facebook Page'

    return (
        <>
            <div className="flex flex-col items-start">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClick}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${!hasSeenWarning
                        ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 animate-pulse'
                        : 'text-blue-600 hover:underline'
                        }`}
                >
                    <Facebook className="w-4 h-4" />
                    <span>{displayUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                </a>

                {!hasSeenWarning && (
                    <div className="mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                        ⚠️ ระวัง! มิจฉาชีพมักตั้งชื่อเลียนแบบเพจจริง
                    </div>
                )}

                {hasSeenWarning && (
                    <span className="text-[10px] text-slate-400 mt-0.5">
                        ตรวจสอบให้แน่ใจว่าเป็นเพจจริง
                    </span>
                )}
            </div>

            <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                            คำเตือน: คุณกำลังจะไปที่เพจมิจฉาชีพ
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="font-medium text-slate-900">
                                "เนื่องจากส่วนใหญ่มิจฉาชีพจะตั้งชื่อเลียนแบบเพจจริง ให้กดที่ลิงก์เพื่อไปยังหน้าเพจมิจฉาชีพ"
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                                <p>✅ สังเกตยอดไลค์และผู้ติดตาม (เพจจริงมักมีเยอะ)</p>
                                <p>✅ สังเกตวันที่สร้างเพจ (เพจปลอมมักเพิ่งสร้าง)</p>
                                <p>✅ ชื่อบัญชีธนาคารต้องตรงกับชื่อร้าน/บริษัท</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
                            รับทราบและดำเนินการต่อ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// Heart Button Component
function HeartButton({ reportId, reporterId, initialHeartCount = 0 }: {
    reportId: string
    reporterId: string
    initialHeartCount?: number
}) {
    const [hasHearted, setHasHearted] = useState(false)
    const [heartCount, setHeartCount] = useState(initialHeartCount)
    const [isLoading, setIsLoading] = useState(false)
    const [isOwnReport, setIsOwnReport] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        checkHeartStatus()
    }, [reportId])

    const checkHeartStatus = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        setIsAuthenticated(!!user)
        if (user) {
            setIsOwnReport(user.id === reporterId)

            // Check if user has hearted this report
            try {
                const response = await fetch(`/api/karma/heart?report_id=${reportId}`)
                const data = await response.json()
                if (data.success) {
                    setHasHearted(data.hasHearted)
                    setHeartCount(data.heartCount)
                }
            } catch (error) {
                console.error('Error checking heart status:', error)
            }
        }
    }

    const handleHeart = async () => {
        if (isLoading || isOwnReport || !isAuthenticated) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/karma/heart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_id: reportId })
            })

            const data = await response.json()
            if (data.success) {
                setHasHearted(data.action === 'added')
                setHeartCount(data.heart_count)
            }
        } catch (error) {
            console.error('Error toggling heart:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isOwnReport) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-slate-400 cursor-not-allowed">
                            <Heart className="w-5 h-5" />
                            <span className="text-sm font-medium">{heartCount}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>ไม่สามารถกดใจรายงานของตัวเองได้</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    if (!isAuthenticated) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href="/login" className="flex items-center gap-1.5 text-slate-400 hover:text-pink-500 transition-colors">
                            <Heart className="w-5 h-5" />
                            <span className="text-sm font-medium">{heartCount}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>เข้าสู่ระบบเพื่อกดให้กำลังใจ</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleHeart}
                        disabled={isLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${hasHearted
                            ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-500'
                            }`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Heart className={`w-5 h-5 ${hasHearted ? 'fill-pink-500' : ''}`} />
                        )}
                        <span className="text-sm font-medium">{heartCount}</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{hasHearted ? 'ยกเลิกกำลังใจ' : 'กดให้กำลังใจ (+1 เครดิตให้ผู้รายงาน)'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default function BlacklistDetail({ entry, reports }: Props) {
    const t = useTranslations('BlacklistPage')
    const [expandedReport, setExpandedReport] = useState<string | null>(null)

    // Mask name for privacy
    const maskName = (name: string | null | undefined): string => {
        if (!name) return t('anonymousReporter')

        const parts = name.split(' ')
        return parts.map(part => {
            if (part.length <= 1) return part
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
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
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
                        <Badge className={`${severityColors[entry.severity]} text-sm px-3 py-1 shadow-sm`}>
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {t(`severity.${entry.severity}`)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                            <div className="text-2xl font-bold text-red-600">{entry.total_reports}</div>
                            <div className="text-sm text-slate-600">{t('totalReports')}</div>
                        </div>
                        <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                            <div className="text-2xl font-bold text-red-600">{formatMoney(entry.total_amount_lost)}</div>
                            <div className="text-sm text-slate-600">{t('totalLoss')}</div>
                        </div>
                        <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                            <div className="text-sm font-medium text-slate-800">
                                {entry.first_reported_at ? formatDate(entry.first_reported_at) : '-'}
                            </div>
                            <div className="text-sm text-slate-600">{t('firstReport')}</div>
                        </div>
                        <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
                            <div className="text-sm font-medium text-slate-800">
                                {entry.last_reported_at ? formatDate(entry.last_reported_at) : '-'}
                            </div>
                            <div className="text-sm text-slate-600">{t('lastReport')}</div>
                        </div>
                    </div>

                    {/* Identifiers */}
                    <div className="bg-white/80 rounded-xl p-4 space-y-4 shadow-sm">
                        <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">{t('identifiers')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Bank Accounts */}
                            {entry.bank_account_no && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <CreditCard className="w-4 h-4" />
                                        <span>{t('bankAccount')}</span>
                                    </div>
                                    <div className="font-mono font-medium text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100 inline-block">
                                        {entry.bank_account_no}
                                    </div>
                                </div>
                            )}

                            {/* Phone Numbers */}
                            {entry.phone_numbers?.length > 0 && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Phone className="w-4 h-4" />
                                        <span>{t('phone')}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {entry.phone_numbers.map((phone, i) => (
                                            <span key={i} className="font-medium text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block w-fit">
                                                {phone}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Line IDs */}
                            {entry.line_ids?.length > 0 && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <MessageCircle className="w-4 h-4" />
                                        <span>Line ID</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {entry.line_ids.map((lineId, i) => (
                                            <span key={i} className="font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 inline-block w-fit">
                                                {lineId}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Facebook URLs */}
                            {entry.facebook_urls?.length > 0 && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Facebook className="w-4 h-4" />
                                        <span>Facebook</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {entry.facebook_urls.map((url, i) => (
                                            <FacebookLink key={i} url={url} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ID Cards */}
                            {entry.id_card_numbers?.length > 0 && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <User className="w-4 h-4" />
                                        <span>{t('idCard')}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {entry.id_card_numbers.map((id, i) => (
                                            <span key={i} className="font-mono font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded w-fit">
                                                {id}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {entry.shop_names?.length > 1 && (
                            <div className="pt-3 border-t border-slate-200 mt-2">
                                <p className="text-sm text-slate-600">
                                    <span className="font-semibold">{t('alsoKnownAs')}:</span> {entry.shop_names.slice(1).join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Heart Info Banner */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Heart className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-purple-800">
                            กดหัวใจเพื่อให้กำลังใจผู้รายงาน
                        </p>
                        <p className="text-xs text-purple-600">
                            +1 เครดิตปลอบใจให้ผู้รายงาน (กดซ้ำเพื่อยกเลิก)
                        </p>
                    </div>
                </div>
            </div>

            {/* Add Report Button */}
            <div className="flex justify-end">
                <Link href={`/report?blacklist_id=${entry.id}&bank=${entry.bank_account_no || ''}`}>
                    <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg">
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
                        <Card key={report.id} className="border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
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
                                    <div className="flex items-center gap-3">
                                        {report.amount_lost && report.amount_lost > 0 && (
                                            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                                                <DollarSign className="w-3 h-3 mr-1" />
                                                {formatMoney(report.amount_lost)}
                                            </Badge>
                                        )}
                                        <HeartButton
                                            reportId={report.id}
                                            reporterId={report.reporter_id}
                                            initialHeartCount={report.heart_count || 0}
                                        />
                                    </div>
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
