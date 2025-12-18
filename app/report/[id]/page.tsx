export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { FraudTypeBadge } from '@/components/shared/FraudTypeBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'
import type { ScamReport, Confirmation, Profile } from '@/types'
import { formatDistanceToNow, format } from 'date-fns'
import { th } from 'date-fns/locale'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Facebook,
  MessageCircle,
  Banknote,
  Calendar,
  FileText,
  Shield,
  CheckCircle2,
  Share2,
  AlertTriangle,
  User,
  ImageIcon,
} from 'lucide-react'

interface ReportPageProps {
  params: Promise<{ id: string }>
}

async function getReport(id: string): Promise<ScamReport | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('scam_reports')
    .select('*, reporter:profiles(*)')
    .eq('id', id)
    .single()

  return data
}

async function getConfirmations(reportId: string): Promise<(Confirmation & { user: Profile })[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('confirmations')
    .select('*, user:profiles(*)')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false })

  return data || []
}

export default async function ReportDetailPage({ params }: ReportPageProps) {
  const { id } = await params
  const report = await getReport(id)

  if (!report) {
    notFound()
  }

  const confirmations = await getConfirmations(id)

  const reporterName = report.is_anonymous
    ? 'ไม่ระบุตัวตน'
    : report.reporter?.name || 'ผู้ใช้'

  const totalDamage =
    report.damage_amount +
    confirmations.reduce((sum, c) => sum + (c.damage_amount || 0), 0)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="container py-8">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/search">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับ
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">
                        {report.shop_name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={report.status} />
                        <FraudTypeBadge type={report.fraud_type} />
                      </div>
                    </div>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {reporterName}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(report.created_at), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ช่องทางติดต่อ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Province */}
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">จังหวัด</p>
                      <p className="font-medium">
                        {report.province}
                        {report.area && `, ${report.area}`}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  {report.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">เบอร์โทร</p>
                        <p className="font-medium">{report.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Facebook */}
                  {(report.facebook_url || report.facebook_page_name) && (
                    <div className="flex items-center gap-3">
                      <Facebook className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Facebook</p>
                        <p className="font-medium">
                          {report.facebook_page_name || report.facebook_url}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* LINE */}
                  {report.line_id && (
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">LINE ID</p>
                        <p className="font-medium">{report.line_id}</p>
                      </div>
                    </div>
                  )}

                  {/* Bank */}
                  {report.bank_name && (
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          บัญชีธนาคาร
                        </p>
                        <p className="font-medium">
                          {report.bank_name}
                          {report.bank_account_number &&
                            ` - ${report.bank_account_number}`}
                          {report.bank_account_name &&
                            ` (${report.bank_account_name})`}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">รายละเอียด</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Incident Date */}
                  {report.incident_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          วันที่เกิดเหตุ
                        </p>
                        <p className="font-medium">
                          {format(new Date(report.incident_date), 'dd MMMM yyyy', {
                            locale: th,
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Police Report */}
                  {report.has_police_report && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          เลขที่แจ้งความ
                        </p>
                        <p className="font-medium">
                          {report.police_report_number || 'มีการแจ้งความ'}
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Description Text */}
                  <div className="whitespace-pre-wrap">{report.description}</div>
                </CardContent>
              </Card>

              {/* Evidence Images */}
              {report.evidence_images && report.evidence_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      หลักฐาน ({report.evidence_images.length} รูป)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {report.evidence_images.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src={url}
                            alt={`หลักฐาน ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Confirmations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ผู้ยืนยัน ({confirmations.length} คน)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {confirmations.length > 0 ? (
                    <div className="space-y-4">
                      {confirmations.map((confirmation) => (
                        <div
                          key={confirmation.id}
                          className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">
                                {confirmation.user?.name || 'ผู้ใช้'}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(confirmation.created_at),
                                  { addSuffix: true, locale: th }
                                )}
                              </span>
                            </div>
                            {confirmation.comment && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {confirmation.comment}
                              </p>
                            )}
                            {confirmation.damage_amount && (
                              <Badge variant="secondary" className="mt-2">
                                ความเสียหาย ฿
                                {confirmation.damage_amount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      ยังไม่มีผู้ยืนยัน
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Damage Summary */}
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                  <p className="text-sm text-red-700 mb-2">ความเสียหายรวม</p>
                  <p className="text-3xl font-bold text-red-700">
                    ฿{totalDamage.toLocaleString()}
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    จาก {1 + confirmations.length} คน
                  </p>
                </CardContent>
              </Card>

              {/* Verification Stats */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {report.verified_count}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        คนยืนยันรายงานนี้
                      </p>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/report/${id}/confirm`}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      ฉันก็โดนเหมือนกัน
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Shop Owner */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">คุณเป็นเจ้าของร้านนี้?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    หากต้องการแก้ไขหรือลบรายงาน กรุณาติดต่อเรา
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/report/${id}/contact`}>ติดต่อแอดมิน</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
