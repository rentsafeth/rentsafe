'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Heart, Sparkles, Gift, TrendingUp, FileText, CheckCircle,
    Star, Loader2, Clock, ArrowRight, AlertTriangle, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface KarmaData {
    total_credits: number
    total_hearts_received: number
    total_reports_submitted: number
    total_reports_verified: number
}

interface KarmaTransaction {
    id: string
    amount: number
    type: string
    description: string
    balance_after: number
    created_at: string
}

const typeLabels: Record<string, string> = {
    heart_received: 'ได้รับหัวใจ',
    report_verified: 'รายงานได้รับการยืนยัน',
    bonus: 'โบนัส',
    reward_redeemed: 'แลกของรางวัล'
}

const typeColors: Record<string, string> = {
    heart_received: 'bg-pink-100 text-pink-700',
    report_verified: 'bg-green-100 text-green-700',
    bonus: 'bg-yellow-100 text-yellow-700',
    reward_redeemed: 'bg-purple-100 text-purple-700'
}

export default function KarmaPage() {
    const params = useParams()
    const router = useRouter()
    const locale = params.locale as string
    const isThai = locale === 'th'

    const [loading, setLoading] = useState(true)
    const [karma, setKarma] = useState<KarmaData | null>(null)
    const [transactions, setTransactions] = useState<KarmaTransaction[]>([])
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        checkAuthAndLoadData()
    }, [])

    const checkAuthAndLoadData = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push(`/${locale}/login`)
            return
        }

        setUser(user)
        await Promise.all([loadKarma(), loadTransactions()])
        setLoading(false)
    }

    const loadKarma = async () => {
        try {
            const response = await fetch('/api/karma')
            const data = await response.json()
            if (data.success) {
                setKarma(data)
            }
        } catch (error) {
            console.error('Error loading karma:', error)
        }
    }

    const loadTransactions = async () => {
        try {
            const response = await fetch('/api/karma/history?limit=10')
            const data = await response.json()
            if (data.success) {
                setTransactions(data.transactions)
            }
        } catch (error) {
            console.error('Error loading transactions:', error)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                    <p className="text-slate-500">กำลังโหลด...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white mb-8">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full filter blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-72 h-72 bg-yellow-300 rounded-full filter blur-3xl"></div>
                </div>

                <div className="relative px-6 py-10 md:py-14">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">เครดิตปลอบใจ</h1>
                            <p className="text-white/80">Karma Credits</p>
                        </div>
                    </div>

                    {/* Main Balance */}
                    <div className="text-center mb-8">
                        <div className="text-6xl md:text-7xl font-bold mb-2">
                            {karma?.total_credits || 0}
                        </div>
                        <p className="text-xl text-white/80">เครดิต</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm text-center">
                            <Heart className="w-6 h-6 mx-auto mb-2 text-pink-200" />
                            <div className="text-2xl font-bold">{karma?.total_hearts_received || 0}</div>
                            <div className="text-xs text-white/80">หัวใจที่ได้รับ</div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm text-center">
                            <FileText className="w-6 h-6 mx-auto mb-2 text-blue-200" />
                            <div className="text-2xl font-bold">{karma?.total_reports_submitted || 0}</div>
                            <div className="text-xs text-white/80">รายงานทั้งหมด</div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm text-center">
                            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-200" />
                            <div className="text-2xl font-bold">{karma?.total_reports_verified || 0}</div>
                            <div className="text-xs text-white/80">รายงานที่ยืนยัน</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How to Earn Section */}
            <Card className="mb-8 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                        <Gift className="w-5 h-5" />
                        วิธีสะสมเครดิตปลอบใจ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Heart className="w-5 h-5 text-pink-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800">รับหัวใจจากผู้อื่น</h4>
                                <p className="text-sm text-slate-600">เมื่อรายงานของคุณได้รับหัวใจ = +1 เครดิต/หัวใจ</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800">รายงานได้รับการยืนยัน</h4>
                                <p className="text-sm text-slate-600">เมื่อรายงานผ่านการตรวจสอบ = +10 เครดิต</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Coming Soon Rewards */}
            <Card className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-800">
                        <Star className="w-5 h-5" />
                        สิทธิพิเศษเร็วๆ นี้
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold text-purple-800 mb-2">
                            สะสมเครดิตปลอบใจ เพื่อรับสิทธิพิเศษ!
                        </h3>
                        <p className="text-purple-600 max-w-md mx-auto">
                            ของรางวัลและสิทธิพิเศษสำหรับผู้ช่วยเหลือชุมชน กำลังจะมาเร็วๆ นี้
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <Badge className="bg-purple-100 text-purple-700 px-4 py-2">
                                ส่วนลดค่าบริการ
                            </Badge>
                            <Badge className="bg-pink-100 text-pink-700 px-4 py-2">
                                Badge พิเศษ
                            </Badge>
                            <Badge className="bg-amber-100 text-amber-700 px-4 py-2">
                                และอื่นๆ อีกมาก
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        ประวัติล่าสุด
                    </CardTitle>
                    <Link href={`/${locale}/profile/karma/history`}>
                        <Button variant="ghost" size="sm" className="text-purple-600">
                            ดูทั้งหมด <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>ยังไม่มีประวัติการได้รับเครดิต</p>
                            <Link href={`/${locale}/report`}>
                                <Button className="mt-4 bg-gradient-to-r from-red-500 to-orange-500">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    รายงานมิจฉาชีพเพื่อรับเครดิต
                                </Button>
                            </Link>
                        </div>
                    ) : (
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
                                                {tx.description || typeLabels[tx.type] || tx.type}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {formatDate(tx.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            คงเหลือ {tx.balance_after}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* CTA to Report */}
            <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-7 h-7 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-1">ช่วยเหลือคนอื่นและรับเครดิต</h3>
                        <p className="text-sm text-slate-600">
                            รายงานมิจฉาชีพเพื่อปกป้องผู้อื่น รับ +10 เครดิตเมื่อรายงานได้รับการยืนยัน
                        </p>
                    </div>
                    <Link href={`/${locale}/report`}>
                        <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                            รายงาน <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
