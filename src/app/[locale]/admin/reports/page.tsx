import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Clock, ShieldCheck, ShieldX, User } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';

import ReportActions from '@/components/features/admin/ReportActions';

export default async function AdminReportsPage() {
    const supabase = createAdminClient();

    const { data: reports } = await supabase
        .from('reports')
        .select(`
            *,
            profiles:reporter_id (
                full_name,
                email
            )
        `)
        .order('created_at', { ascending: false });

    async function updateStatus(reportId: string, status: 'approved' | 'rejected') {
        'use server';
        const supabase = createAdminClient();
        const { error } = await supabase.from('reports').update({ status: status }).eq('id', reportId);

        if (error) {
            console.error('Update report status error:', error);
            throw error;
        }

        revalidatePath('/th/admin/reports');
        revalidatePath('/en/admin/reports');
    }

    // Count reports by status
    const pendingCount = reports?.filter(r => r.status === 'pending').length || 0;
    const approvedCount = reports?.filter(r => r.status === 'approved').length || 0;
    const rejectedCount = reports?.filter(r => r.status === 'rejected').length || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ตรวจสอบรายงาน</h1>
                <p className="text-gray-500">ตรวจสอบและอนุมัติ/ปฏิเสธรายงานความผิดปกติจากผู้ใช้</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{reports?.length || 0}</p>
                                <p className="text-sm text-gray-500">รายงานทั้งหมด</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingCount}</p>
                                <p className="text-sm text-gray-500">รอตรวจสอบ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{approvedCount}</p>
                                <p className="text-sm text-gray-500">อนุมัติแล้ว</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <ShieldX className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{rejectedCount}</p>
                                <p className="text-sm text-gray-500">ปฏิเสธแล้ว</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                {(!reports || reports.length === 0) ? (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="font-medium">ยังไม่มีรายงานความผิดปกติ</p>
                            <p className="text-sm mt-1">เมื่อผู้ใช้ส่งรายงานเข้ามา จะแสดงที่นี่</p>
                        </CardContent>
                    </Card>
                ) : null}

                {reports?.map((report) => {
                    const reporter = report.profiles as { full_name: string | null; email: string | null } | null;

                    return (
                        <Card key={report.id} className={report.status === 'pending' ? 'border-yellow-200 bg-yellow-50/30' : ''}>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-red-600">{report.manual_shop_name || 'ไม่ระบุชื่อร้าน'}</h3>
                                            <Badge variant={
                                                report.status === 'approved' ? 'destructive' :
                                                    report.status === 'rejected' ? 'outline' : 'secondary'
                                            }>
                                                {report.status === 'approved' ? 'อนุมัติแล้ว' :
                                                    report.status === 'rejected' ? 'ปฏิเสธแล้ว' : 'รอตรวจสอบ'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                            <User className="w-4 h-4" />
                                            <span className="font-medium">{reporter?.full_name || 'ไม่ระบุชื่อ'}</span>
                                            {reporter?.email && <span className="text-slate-400">({reporter.email})</span>}
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            วันที่เกิดเหตุ: {report.incident_date ? new Date(report.incident_date).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                                        </p>
                                    </div>

                                    {report.status === 'pending' && (
                                        <ReportActions reportId={report.id} onUpdate={updateStatus} />
                                    )}
                                </div>

                                <div className="bg-slate-50 p-4 rounded-md mb-4">
                                    <p className="font-semibold mb-1">รายละเอียด:</p>
                                    <p className="text-slate-700">{report.description}</p>
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                                        <p><span className="text-slate-400">บัญชีธนาคาร:</span> {report.manual_bank_account || '-'}</p>
                                        <p><span className="text-slate-400">ช่องทางติดต่อ:</span> {report.manual_shop_contact || '-'}</p>
                                        {report.amount_lost && (
                                            <p><span className="text-slate-400">มูลค่าความเสียหาย:</span> {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(report.amount_lost)}</p>
                                        )}
                                    </div>
                                </div>

                                {report.evidence_urls && report.evidence_urls.length > 0 && (
                                    <div>
                                        <p className="font-semibold mb-2">หลักฐาน ({report.evidence_urls.length} รายการ):</p>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {report.evidence_urls.map((url: string, index: number) => (
                                                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="relative h-24 w-24 flex-shrink-0 border rounded overflow-hidden hover:ring-2 hover:ring-blue-400">
                                                    <Image src={url} alt={`หลักฐาน ${index + 1}`} fill className="object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
