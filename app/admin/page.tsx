export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { FraudTypeBadge } from '@/components/shared/FraudTypeBadge'
import type { ScamReport, ContactRequest } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import {
  Shield,
  FileWarning,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  LogOut,
} from 'lucide-react'

async function getAdminData() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return null
  }

  // Get reports
  const { data: reports } = await supabase
    .from('scam_reports')
    .select('*')
    .order('created_at', { ascending: false })

  // Get contact requests
  const { data: contactRequests } = await supabase
    .from('contact_requests')
    .select('*, report:scam_reports(shop_name)')
    .order('created_at', { ascending: false })

  // Get users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Get stats
  const pendingReports = reports?.filter((r) => r.status === 'pending').length || 0
  const verifiedReports = reports?.filter((r) => r.status === 'verified').length || 0
  const pendingContacts = contactRequests?.filter((c) => c.status === 'pending').length || 0

  return {
    profile,
    reports: reports || [],
    contactRequests: contactRequests || [],
    users: users || [],
    stats: {
      pendingReports,
      verifiedReports,
      totalReports: reports?.length || 0,
      pendingContacts,
      totalUsers: users?.length || 0,
    },
  }
}

export default async function AdminPage() {
  const data = await getAdminData()

  if (!data) {
    redirect('/login')
  }

  const { profile, reports, contactRequests, users, stats } = data

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">RentSafe</span>
            </Link>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile.name}
            </span>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">รอตรวจสอบ</p>
                  <p className="text-2xl font-bold">{stats.pendingReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ยืนยันแล้ว</p>
                  <p className="text-2xl font-bold">{stats.verifiedReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">คำขอติดต่อ</p>
                  <p className="text-2xl font-bold">{stats.pendingContacts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ผู้ใช้ทั้งหมด</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reports">
          <TabsList className="mb-6">
            <TabsTrigger value="reports">
              <FileWarning className="h-4 w-4 mr-2" />
              รายงาน ({stats.totalReports})
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <MessageSquare className="h-4 w-4 mr-2" />
              คำขอติดต่อ ({contactRequests.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              ผู้ใช้ ({stats.totalUsers})
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>รายงานทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">ร้าน</th>
                        <th className="text-left p-3">ประเภท</th>
                        <th className="text-left p-3">สถานะ</th>
                        <th className="text-left p-3">วันที่</th>
                        <th className="text-left p-3">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report: ScamReport) => (
                        <tr key={report.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <p className="font-medium">{report.shop_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.province}
                            </p>
                          </td>
                          <td className="p-3">
                            <FraudTypeBadge type={report.fraud_type} size="sm" />
                          </td>
                          <td className="p-3">
                            <StatusBadge status={report.status} size="sm" />
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {formatDistanceToNow(new Date(report.created_at), {
                              addSuffix: true,
                              locale: th,
                            })}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/report/${report.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              {report.status === 'pending' && (
                                <>
                                  <form
                                    action={`/api/admin/reports/${report.id}/verify`}
                                    method="post"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-green-600"
                                      type="submit"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </form>
                                  <form
                                    action={`/api/admin/reports/${report.id}/reject`}
                                    method="post"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-600"
                                      type="submit"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </form>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Requests Tab */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>คำขอติดต่อ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">ผู้ติดต่อ</th>
                        <th className="text-left p-3">รายงาน</th>
                        <th className="text-left p-3">ประเภท</th>
                        <th className="text-left p-3">สถานะ</th>
                        <th className="text-left p-3">วันที่</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactRequests.map((request: ContactRequest & { report?: { shop_name: string } }) => (
                        <tr key={request.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <p className="font-medium">{request.requester_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {request.requester_phone}
                            </p>
                          </td>
                          <td className="p-3">
                            {request.report?.shop_name || '-'}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {request.request_type === 'correction'
                                ? 'แก้ไข'
                                : request.request_type === 'removal'
                                ? 'ลบ'
                                : 'อื่นๆ'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                request.status === 'pending'
                                  ? 'secondary'
                                  : request.status === 'resolved'
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              {request.status === 'pending'
                                ? 'รอดำเนินการ'
                                : request.status === 'in_progress'
                                ? 'กำลังดำเนินการ'
                                : request.status === 'resolved'
                                ? 'เสร็จสิ้น'
                                : 'ปฏิเสธ'}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {formatDistanceToNow(new Date(request.created_at), {
                              addSuffix: true,
                              locale: th,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>ผู้ใช้ทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">ชื่อ</th>
                        <th className="text-left p-3">อีเมล</th>
                        <th className="text-left p-3">บทบาท</th>
                        <th className="text-left p-3">วันที่สมัคร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{user.name}</td>
                          <td className="p-3 text-muted-foreground">
                            {user.email}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                user.role === 'admin' ? 'default' : 'secondary'
                              }
                            >
                              {user.role === 'admin' ? 'แอดมิน' : 'ผู้ใช้'}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {formatDistanceToNow(new Date(user.created_at), {
                              addSuffix: true,
                              locale: th,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
