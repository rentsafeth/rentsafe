export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import { SearchBar } from '@/components/search/SearchBar'
import { StatsCard } from '@/components/shared/StatsCard'
import { ReportCard } from '@/components/reports/ReportCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import {
  FileWarning,
  CheckCircle,
  Banknote,
  MapPin,
  Search,
  ClipboardCheck,
  ThumbsUp,
  AlertTriangle,
  ArrowRight,
  Phone,
  MessageCircle,
} from 'lucide-react'

async function getStats() {
  const supabase = await createClient()

  const [
    { count: totalReports },
    { count: verifiedReports },
    { data: damageData },
    { data: provincesData },
  ] = await Promise.all([
    supabase
      .from('scam_reports')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('scam_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified'),
    supabase.from('scam_reports').select('damage_amount'),
    supabase.from('scam_reports').select('province'),
  ])

  const totalDamage = damageData?.reduce((sum, r) => sum + (r.damage_amount || 0), 0) || 0
  const uniqueProvinces = new Set(provincesData?.map((r) => r.province)).size

  return {
    total_reports: totalReports || 0,
    verified_reports: verifiedReports || 0,
    total_damage: totalDamage,
    provinces_count: uniqueProvinces,
  }
}

async function getRecentReports() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('scam_reports')
    .select('*')
    .in('status', ['pending', 'verified'])
    .order('created_at', { ascending: false })
    .limit(6)

  return data || []
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M'
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'K'
  }
  return amount.toString()
}

export default async function HomePage() {
  const stats = await getStats()
  const recentReports = await getRecentReports()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="secondary" className="mb-4">
                <AlertTriangle className="h-4 w-4 mr-1" />
                ตรวจสอบก่อนเช่า
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                เช็คก่อนเช่า{' '}
                <span className="text-primary">ปลอดภัยแน่นอน</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                ตรวจสอบความน่าเชื่อถือของร้านรถเช่าก่อนใช้บริการ
                ป้องกันการโกง ปลอดภัย มั่นใจ 100%
              </p>

              {/* Search Bar */}
              <div className="max-w-xl mx-auto pt-4">
                <SearchBar size="lg" />
              </div>

              {/* Quick Search Tags */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Link href="/search?type=phone">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    <Phone className="h-3 w-3 mr-1" />
                    เบอร์โทร
                  </Badge>
                </Link>
                <Link href="/search?type=facebook">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Facebook
                  </Badge>
                </Link>
                <Link href="/search?type=line">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    LINE
                  </Badge>
                </Link>
                <Link href="/search?type=bank">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    <Banknote className="h-3 w-3 mr-1" />
                    บัญชีธนาคาร
                  </Badge>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                title="รายงานทั้งหมด"
                value={stats.total_reports}
                icon={FileWarning}
              />
              <StatsCard
                title="ยืนยันแล้ว"
                value={stats.verified_reports}
                icon={CheckCircle}
              />
              <StatsCard
                title="ความเสียหายรวม"
                value={'฿' + formatCurrency(stats.total_damage)}
                icon={Banknote}
              />
              <StatsCard
                title="จังหวัด"
                value={stats.provinces_count}
                icon={MapPin}
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-12">วิธีการใช้งาน</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">1. ค้นหาร้านรถเช่า</h3>
                <p className="text-muted-foreground text-sm">
                  ค้นหาด้วยชื่อร้าน เบอร์โทร Facebook LINE หรือเลขบัญชี
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <ClipboardCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">2. ตรวจสอบรายงาน</h3>
                <p className="text-muted-foreground text-sm">
                  ดูรายงานจากผู้ใช้งานจริงที่เคยใช้บริการ
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <ThumbsUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">3. ตัดสินใจอย่างมั่นใจ</h3>
                <p className="text-muted-foreground text-sm">
                  เลือกร้านที่ปลอดภัย หลีกเลี่ยงร้านที่มีรายงาน
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Reports */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">รายงานล่าสุด</h2>
              <Button variant="ghost" asChild>
                <Link href="/search">
                  ดูทั้งหมด
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {recentReports.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileWarning className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มีรายงาน</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container">
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center text-white">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                เคยถูกโกง? รายงานเลย!
              </h2>
              <p className="text-white/90 mb-6 max-w-xl mx-auto">
                ช่วยเตือนคนอื่นไม่ให้ถูกโกงเหมือนคุณ
                รายงานร้านที่หลอกลวงเพื่อปกป้องผู้บริโภค
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/report/new">
                  <FileWarning className="mr-2 h-5 w-5" />
                  รายงานร้านโกง
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
