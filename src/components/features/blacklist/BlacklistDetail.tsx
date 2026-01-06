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
    ExternalLink,
    Copy,
    CheckCircle2,
    MapPin,
    Share2
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
    scam_provinces?: string[] | null
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
    manual_facebook_url: string | null
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
    locale?: string
}

// Helper function for i18n
const getLocalizedText = (isThai: boolean, th: string, en: string) => isThai ? th : en;

// Facebook Link Component with Warning Logic and Tutorial
function FacebookLink({ url, isFirst = false, isThai = true }: { url: string; isFirst?: boolean; isThai?: boolean }) {
    const [showWarning, setShowWarning] = useState(false)
    const [hasSeenWarning, setHasSeenWarning] = useState(false)
    const [showTutorial, setShowTutorial] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const seen = localStorage.getItem('seen_fb_warning')
        const seenTutorial = localStorage.getItem('seen_fb_tutorial')

        if (seen) {
            setHasSeenWarning(true)
        }

        // Show tutorial only for first Facebook link on first visit
        if (isFirst && !seenTutorial) {
            setTimeout(() => setShowTutorial(true), 800)
        }
    }, [isFirst])

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

    const handleTutorialClose = () => {
        localStorage.setItem('seen_fb_tutorial', 'true')
        setShowTutorial(false)
    }

    // Clean URL for display
    const displayUrl = url.replace(/^https?:\/\/(www\.)?facebook\.com\//, '').split('/')[0] || 'Facebook Page'

    // If not mounted yet, render a simple link to avoid hydration mismatch
    if (!isMounted) {
        return (
            <div className="flex flex-col items-start">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200"
                >
                    <Facebook className="w-4 h-4" />
                    <span>{displayUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        )
    }

    return (
        <>
            <div className="relative flex flex-col items-start">
                {/* Tutorial Spotlight */}
                {showTutorial && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/60 z-40"
                            onClick={handleTutorialClose}
                        />
                        {/* Spotlight on link */}
                        <div className="absolute -inset-3 bg-white rounded-lg shadow-2xl z-50 animate-pulse" />
                        {/* Tutorial Popup */}
                        <div className="absolute top-full left-0 mt-3 w-72 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-400 rounded-xl p-4 shadow-2xl z-50">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-orange-900 mb-1">
                                        {isThai ? 'ระวัง!' : 'Warning!'}
                                    </h4>
                                    <p className="text-sm text-orange-800 mb-3">
                                        {isThai
                                            ? 'มิจฉาชีพมักตั้งชื่อเลียนแบบเพจจริง คลิกที่นี่เพื่อเปิดไปยังเพจมิจฉาชีพโดยตรง'
                                            : 'Scammers often impersonate real pages. Click here to open the scammer\'s page directly'}
                                    </p>
                                    <button
                                        onClick={handleTutorialClose}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                                        {isThai ? 'เข้าใจแล้ว' : 'Got it'}
                                    </button>
                                </div>
                            </div>
                            {/* Arrow pointing up */}
                            <div className="absolute -top-2 left-6 w-4 h-4 bg-gradient-to-br from-orange-50 to-red-50 border-t-2 border-l-2 border-orange-400 transform rotate-45" />
                        </div>
                    </>
                )}

                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClick}
                    className={`relative flex items-center gap-2 text-sm font-medium transition-colors ${showTutorial
                        ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded-md border-2 border-orange-400 z-50'
                        : !hasSeenWarning
                            ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 animate-pulse'
                            : 'text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100'
                        }`}
                >
                    <Facebook className="w-4 h-4" />
                    <span>{displayUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                </a>

                {/* Always show warning message */}
                <div className="mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                    {isThai
                        ? '⚠️ ระวัง! มิจฉาชีพมักตั้งชื่อเลียนแบบเพจจริง'
                        : '⚠️ Warning! Scammers often impersonate real pages'}
                </div>
            </div>

            <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                            {isThai
                                ? 'คำเตือน: คุณกำลังจะไปที่เพจมิจฉาชีพ'
                                : 'Warning: You are about to visit a scammer\'s page'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="font-medium text-slate-900">
                                {isThai
                                    ? 'เนื่องจากส่วนใหญ่มิจฉาชีพจะตั้งชื่อเลียนแบบเพจจริง ให้ตรวจสอบให้ดีก่อนติดต่อ'
                                    : 'Since most scammers impersonate real pages, verify carefully before contacting'}
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                                <p>✅ {isThai ? 'สังเกตยอดไลค์และผู้ติดตาม (เพจจริงมักมีเยอะ)' : 'Check likes and followers (real pages usually have more)'}</p>
                                <p>✅ {isThai ? 'สังเกตวันที่สร้างเพจ (เพจปลอมมักเพิ่งสร้าง)' : 'Check page creation date (fake pages are usually new)'}</p>
                                <p>✅ {isThai ? 'ชื่อบัญชีธนาคารต้องตรงกับชื่อร้าน/บริษัท' : 'Bank account name must match shop/company name'}</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{isThai ? 'ยกเลิก' : 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
                            {isThai ? 'รับทราบและดำเนินการต่อ' : 'Acknowledge and Continue'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// Heart Button Component
function HeartButton({ reportId, reporterId, initialHeartCount = 0, isThai = true }: {
    reportId: string
    reporterId: string
    initialHeartCount?: number
    isThai?: boolean
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
                        <p>{isThai ? 'ไม่สามารถกดใจรายงานของตัวเองได้' : 'Cannot like your own report'}</p>
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
                        <p>{isThai ? 'เข้าสู่ระบบเพื่อกดให้กำลังใจ' : 'Login to encourage'}</p>
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
                    <p>{hasHearted
                        ? (isThai ? 'ยกเลิกกำลังใจ' : 'Remove support')
                        : (isThai ? 'กดให้กำลังใจ (+1 เครดิตให้ผู้รายงาน)' : 'Encourage (+1 credit to reporter)')}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default function BlacklistDetail({ entry, reports, locale = 'th' }: Props) {
    const t = useTranslations('BlacklistPage')
    const [expandedReport, setExpandedReport] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [shareSuccess, setShareSuccess] = useState(false)
    const isThai = locale === 'th';

    // Function to share blacklist
    const handleShare = async () => {
        const blacklistName = entry.shop_names?.[0] || (isThai ? 'ไม่ทราบชื่อ' : 'Unknown')
        const shareText = isThai
            ? `พบBlacklist ${blacklistName}`
            : `Found Blacklist: ${blacklistName}`
        const shareUrl = `https://www.rentsafe.in.th/${locale}/blacklist/${entry.id}`

        // Check if it's a touch device (likely mobile)
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0

        if (isMobile && navigator.share) {
            // Use native share on mobile
            try {
                await navigator.share({
                    title: shareText,
                    text: shareText,
                    url: shareUrl
                })
            } catch (err) {
                // User cancelled or error - fallback to copy
                if ((err as Error).name !== 'AbortError') {
                    await copyToClipboard(shareUrl, shareText)
                }
            }
        } else {
            // Desktop: copy link to clipboard
            await copyToClipboard(shareUrl, shareText)
        }
    }

    const copyToClipboard = async (url: string, text: string) => {
        try {
            await navigator.clipboard.writeText(`${text}\n${url}`)
            setShareSuccess(true)
            setTimeout(() => setShareSuccess(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    // Function to copy scammer details
    const copyScammerDetails = async () => {
        const details = `🚨 ข้อมูลมิจฉาชีพ - ${entry.shop_names?.[0] || 'ไม่ทราบชื่อ'}

${entry.bank_account_no ? `💳 เลขบัญชี: ${entry.bank_account_no}\n` : ''}${entry.phone_numbers?.length > 0 ? `📞 เบอร์โทร: ${entry.phone_numbers.join(', ')}\n` : ''}${entry.line_ids?.length > 0 ? `💬 Line ID: ${entry.line_ids.join(', ')}\n` : ''}${entry.facebook_urls?.length > 0 ? `📘 Facebook: ${entry.facebook_urls[0]}\n` : ''}${entry.shop_names?.length > 1 ? `🏪 ชื่ออื่นๆ: ${entry.shop_names.slice(1).join(', ')}\n` : ''}
📊 ถูกรายงาน: ${entry.total_reports} ครั้ง
💰 ยอดเสียหายรวม: ${formatMoney(entry.total_amount_lost)}

⚠️ ข้อมูลจาก RentSafe.in.th`

        try {
            await navigator.clipboard.writeText(details)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

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
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg sm:text-2xl text-red-800 break-words">
                                    {entry.shop_names?.[0] || t('unknownShop')}
                                </CardTitle>
                                <p className="text-red-600 text-sm mt-1">
                                    {t('reportedBy', { count: entry.total_reports })}
                                </p>
                            </div>
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleShare}
                                        className={`flex items-center gap-2 transition-all ${shareSuccess
                                            ? 'bg-green-100 border-green-300 text-green-700'
                                            : 'bg-white/80 border-red-200 text-red-700 hover:bg-red-50'
                                            }`}
                                    >
                                        {shareSuccess ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>{isThai ? 'คัดลอกแล้ว!' : 'Copied!'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Share2 className="w-4 h-4" />
                                                <span>{isThai ? 'แชร์' : 'Share'}</span>
                                            </>
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isThai ? 'แชร์เตือนภัย Blacklist นี้' : 'Share this Blacklist warning'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
                                            <FacebookLink key={i} url={url} isThai={isThai} isFirst={i === 0} />
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

                        {/* Scam Provinces */}
                        {entry.scam_provinces && entry.scam_provinces.length > 0 && (
                            <div className="pt-3 border-t border-slate-200 mt-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="font-semibold">
                                        {isThai ? 'จังหวัดที่มีรายงาน' : 'Reported Provinces'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(entry.scam_provinces || []).map((province, i) => (
                                        <Badge key={i} variant="outline" className="bg-red-50 border-red-200 text-red-700">
                                            📍 {province}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Emergency Action Card */}
            <Card className="border-2 border-red-500 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 overflow-hidden">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-900">
                                {isThai ? 'พบบัญชี/เบอร์นี้?' : 'Found this account/number?'}
                            </h3>
                            <p className="text-sm text-red-700 mt-1">
                                {isThai ? 'ดำเนินการด่วน! ป้องกันการสูญเสียเงิน' : 'Act now! Prevent financial loss'}
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                        {/* Call 1441 */}
                        <a
                            href="tel:1441"
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all group"
                        >
                            <Phone className="w-8 h-8 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-lg">
                                {isThai ? 'โทร 1441' : 'Call 1441'}
                            </span>
                            <span className="text-xs text-red-100 text-center">
                                {isThai ? 'อายัดบัญชีภายใน 1 ชม.' : 'Freeze account within 1 hr'}
                            </span>
                        </a>

                        {/* Report Online */}
                        <a
                            href="https://www.thaipoliceonline.go.th"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all group"
                        >
                            <FileText className="w-8 h-8 group-hover:scale-110 transition-transform" />
                            <span className="font-bold">
                                {isThai ? 'แจ้งความออนไลน์' : 'Report Online'}
                            </span>
                            <span className="text-xs text-blue-100 text-center flex items-center gap-1">
                                {isThai ? 'ตำรวจไซเบอร์' : 'Cyber Police'} <ExternalLink className="w-3 h-3" />
                            </span>
                        </a>

                        {/* Copy Details */}
                        <button
                            onClick={copyScammerDetails}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all group"
                        >
                            {copied ? (
                                <CheckCircle2 className="w-8 h-8 animate-bounce" />
                            ) : (
                                <Copy className="w-8 h-8 group-hover:scale-110 transition-transform" />
                            )}
                            <span className="font-bold">
                                {copied
                                    ? (isThai ? 'คัดลอกแล้ว!' : 'Copied!')
                                    : (isThai ? 'คัดลอกข้อมูล' : 'Copy Details')}
                            </span>
                            <span className="text-xs text-purple-100 text-center">
                                {isThai ? 'สำหรับแจ้งความ' : 'For reporting'}
                            </span>
                        </button>
                    </div>

                    <div className="mt-4 p-3 bg-white/50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-800">
                            <strong>💡 {isThai ? 'เคล็ดลับ:' : 'Tip:'}</strong>
                            {isThai
                                ? ' คัดลอกข้อมูลก่อน → โทร 1441 → จากนั้นแจ้งความออนไลน์เพื่อติดตามคดี'
                                : ' Copy details first → Call 1441 → Then report online to track the case'}
                        </p>
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
                            {isThai
                                ? 'กดหัวใจเพื่อให้กำลังใจผู้รายงาน'
                                : 'Click heart to encourage reporters'}
                        </p>
                        <p className="text-xs text-purple-600">
                            {isThai
                                ? '+1 เครดิตปลอบใจให้ผู้รายงาน (กดซ้ำเพื่อยกเลิก)'
                                : '+1 karma credit to reporter (click again to cancel)'}
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

                                    {/* Contact Info from Report */}
                                    {(report.manual_facebook_url || report.manual_shop_contact || report.manual_bank_account) && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            {/* Facebook */}
                                            {(() => {
                                                let fbUrl = report.manual_facebook_url;
                                                // Fallback parsing
                                                if (!fbUrl && report.manual_shop_contact) {
                                                    const match = report.manual_shop_contact.match(/(?:FB|Facebook):\s*(https?:\/\/[^\s,]+)/i);
                                                    if (match && match[1]) fbUrl = match[1];
                                                }

                                                if (fbUrl) {
                                                    return <FacebookLink url={fbUrl} />;
                                                }
                                                return null;
                                            })()}

                                            {/* Bank Account */}
                                            {report.manual_bank_account && (
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard className="w-4 h-4 text-slate-500" />
                                                    <span>{report.manual_bank_account}</span>
                                                </div>
                                            )}
                                        </div>
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
        </div >
    )
}
