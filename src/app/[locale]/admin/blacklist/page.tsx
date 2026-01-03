'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    ShieldAlert,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Eye,
    AlertTriangle,
    User,
    Phone,
    Calendar,
    FileText,
    Image as ImageIcon,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    FileJson,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import Image from 'next/image';

const REASON_TYPES: Record<string, string> = {
    no_return: 'ไม่คืนรถตามกำหนด',
    damage: 'ทำรถเสียหาย ไม่ยอมชดใช้',
    no_pay: 'หนีไม่จ่ายค่าเช่า',
    fake_docs: 'ใช้เอกสารปลอม',
    other: 'อื่นๆ',
    imported: 'นำเข้าจากระบบ',
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
    warning: { label: 'ต่ำ', color: 'bg-yellow-100 text-yellow-700' },
    moderate: { label: 'ปานกลาง', color: 'bg-orange-100 text-orange-700' },
    severe: { label: 'สูง', color: 'bg-red-100 text-red-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-700', icon: XCircle },
};

interface BlacklistReport {
    id: string;
    id_card_hash: string;
    id_card_last4: string;
    first_name: string;
    last_name: string;
    phone_number: string | null;
    reason_type: string;
    reason_detail: string;
    severity: string;
    status: string;
    incident_date: string | null;
    evidence_urls: string[];
    admin_notes: string | null;
    rejection_reason: string | null;
    report_count: number;
    created_at: string;
    updated_at: string;
    reported_by_shop: {
        id: string;
        name: string;
        phone_number: string | null;
    };
}

interface ImportPreviewItem {
    first_name: string;
    last_name: string;
    id_card: string;
    reason_detail: string;
    reason_type: string;
}

export default function AdminBlacklistPage() {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<BlacklistReport[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [searchQuery, setSearchQuery] = useState('');

    // Detail modal
    const [selectedReport, setSelectedReport] = useState<BlacklistReport | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Import modal
    const [showImportModal, setShowImportModal] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [previewData, setPreviewData] = useState<ImportPreviewItem[]>([]);
    const [importing, setImporting] = useState(false);
    const [importStep, setImportStep] = useState<1 | 2>(1);

    // Action states
    const [processing, setProcessing] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const supabase = createClient();

    useEffect(() => {
        loadReports();
    }, [statusFilter]);

    const handleParseJson = () => {
        try {
            const rawData = JSON.parse(importJson);
            if (!Array.isArray(rawData)) {
                alert('รูปแบบ JSON ไม่ถูกต้อง: ต้องเป็น Array [{}, {}]');
                return;
            }

            const parsed: ImportPreviewItem[] = rawData.map((item: any) => {
                // Determine Name
                let firstName = '';
                let lastName = '';
                let fullName = item['ชื่อ'] || item['name'] || '';

                // Remove keys logic (Thai titles)
                const titles = ['นาย', 'นางสาว', 'นาง', 'ด.ช.', 'ด.ญ.', 'ว่าที่ร้อยตรี', 'ดร.', 'Mr.', 'Mrs.', 'Ms.'];
                const sortedTitles = titles.sort((a, b) => b.length - a.length);
                let cleanName = fullName.trim();
                for (const title of sortedTitles) {
                    if (cleanName.startsWith(title)) {
                        cleanName = cleanName.substring(title.length).trim();
                        break;
                    }
                }
                const parts = cleanName.split(/\s+/); // Split by any whitespace
                if (parts.length > 0) firstName = parts[0];
                if (parts.length > 1) lastName = parts.slice(1).join(' ');

                // Determine ID Card
                const idCard = (item['เลขบัตรประจำตัวประชาชน'] || item['id_card'] || item['id_number'] || '').replace(/\D/g, '');

                // Determine Reason
                const reasonDetail = item['รูปแบบการโกง'] || item['reason'] || item['reason_detail'] || '';

                // Map reason type from keywords
                let reasonType = 'imported';
                const lowerReason = reasonDetail.toLowerCase();
                if (lowerReason.includes('ไม่คืน') || lowerReason.includes('ขโมย')) reasonType = 'no_return';
                else if (lowerReason.includes('ชน') || lowerReason.includes('จำนำ')) reasonType = 'damage'; // Assumed 'Pawn' is bad/damage related for car rental context or 'no_return'
                if (lowerReason.includes('จำนำ')) reasonType = 'no_return'; // Correction: Pawn usually means lost car
                else if (lowerReason.includes('ไม่จ่าย') || lowerReason.includes('ค้าง')) reasonType = 'no_pay';
                else if (lowerReason.includes('ปลอม')) reasonType = 'fake_docs';

                return {
                    first_name: firstName,
                    last_name: lastName,
                    id_card: idCard,
                    reason_detail: reasonDetail,
                    reason_type: reasonType,
                };
            }).filter(item => item.first_name && item.id_card); // Filter invalid

            setPreviewData(parsed);
            setImportStep(2);
        } catch (error) {
            alert('JSON Parse Error: กรุณาตรวจสอบรูปแบบ JSON');
        }
    };

    const handleConfirmImport = async () => {
        setImporting(true);
        try {
            const response = await fetch('/api/admin/blacklist/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reports: previewData }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Import failed');
            }

            alert(`นำเข้าสำเร็จ ${result.count} รายการ`);
            setShowImportModal(false);
            setImportJson('');
            setPreviewData([]);
            setImportStep(1);
            loadReports(); // Refresh list
        } catch (error: any) {
            console.error('Import error:', error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setImporting(false);
        }
    };

    const resetImport = () => {
        setImportJson('');
        setPreviewData([]);
        setImportStep(1);
    };

    const loadReports = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('customer_blacklist')
                .select(`
                    *,
                    reported_by_shop:shops!reported_by_shop_id(id, name, phone_number)
                `)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (report: BlacklistReport) => {
        setProcessing(true);
        try {
            const response = await fetch('/api/admin/blacklist/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_id: report.id,
                    admin_notes: adminNotes,
                }),
            });

            if (!response.ok) throw new Error('Failed to approve');

            await loadReports();
            setShowDetailModal(false);
            setAdminNotes('');
        } catch (error) {
            console.error('Error approving:', error);
            alert('เกิดข้อผิดพลาดในการอนุมัติ');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (report: BlacklistReport) => {
        if (!rejectionReason.trim()) {
            alert('กรุณาระบุเหตุผลที่ไม่อนุมัติ');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/admin/blacklist/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_id: report.id,
                    rejection_reason: rejectionReason,
                    admin_notes: adminNotes,
                }),
            });

            if (!response.ok) throw new Error('Failed to reject');

            await loadReports();
            setShowDetailModal(false);
            setAdminNotes('');
            setRejectionReason('');
        } catch (error) {
            console.error('Error rejecting:', error);
            alert('เกิดข้อผิดพลาดในการปฏิเสธ');
        } finally {
            setProcessing(false);
        }
    };

    const openDetail = (report: BlacklistReport) => {
        setSelectedReport(report);
        setAdminNotes(report.admin_notes || '');
        setRejectionReason(report.rejection_reason || '');
        setShowDetailModal(true);
    };

    const filteredReports = reports.filter(report => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            report.first_name.toLowerCase().includes(q) ||
            report.last_name.toLowerCase().includes(q) ||
            report.id_card_last4.includes(q) ||
            report.phone_number?.includes(q)
        );
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                        <h1 className="text-2xl font-bold text-gray-900">จัดการ Blacklist</h1>
                    </div>
                    <p className="text-gray-600">ตรวจสอบและอนุมัติรายงาน Blacklist จากร้านค้า</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { status: 'pending', label: 'รอตรวจสอบ', color: 'bg-yellow-500' },
                        { status: 'approved', label: 'อนุมัติแล้ว', color: 'bg-green-500' },
                        { status: 'rejected', label: 'ไม่อนุมัติ', color: 'bg-red-500' },
                        { status: 'all', label: 'ทั้งหมด', color: 'bg-gray-500' },
                    ].map(item => (
                        <button
                            key={item.status}
                            onClick={() => setStatusFilter(item.status)}
                            className={`p-4 rounded-lg border-2 transition-all ${statusFilter === item.status
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <div className={`w-3 h-3 rounded-full ${item.color} mb-2`} />
                            <p className="text-2xl font-bold text-gray-900">
                                {item.status === 'all'
                                    ? reports.length
                                    : reports.filter(r => r.status === item.status).length}
                            </p>
                            <p className="text-sm text-gray-500">{item.label}</p>
                        </button>
                    ))}
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="ค้นหาชื่อ, เลขบัตร, เบอร์โทร..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button
                        onClick={() => setShowImportModal(true)}
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
                    >
                        <FileJson className="w-4 h-4 mr-2" />
                        นำเข้า JSON
                    </Button>
                </div>

                {/* Reports List */}
                <Card>
                    <CardHeader>
                        <CardTitle>รายงาน ({filteredReports.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : filteredReports.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>ไม่มีรายงาน</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredReports.map((report) => {
                                    const statusConfig = STATUS_CONFIG[report.status];
                                    const StatusIcon = statusConfig?.icon || Clock;
                                    const severityConfig = SEVERITY_CONFIG[report.severity];

                                    return (
                                        <div
                                            key={report.id}
                                            className="p-4 bg-gray-50 rounded-lg border hover:border-blue-300 transition-colors cursor-pointer"
                                            onClick={() => openDetail(report)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold text-gray-900">
                                                            {report.first_name} {report.last_name}
                                                        </p>
                                                        <Badge className={severityConfig?.color || ''}>
                                                            {severityConfig?.label || report.severity}
                                                        </Badge>
                                                        <Badge className={statusConfig?.color || ''}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {statusConfig?.label || report.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        บัตร: ****-****-{report.id_card_last4}
                                                        {report.phone_number && ` | โทร: ${report.phone_number}`}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <span className="font-medium">เหตุผล:</span>{' '}
                                                        {REASON_TYPES[report.reason_type] || report.reason_type}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        รายงานโดย: {report.reported_by_shop?.name || 'ไม่ทราบ'} |{' '}
                                                        {formatDate(report.created_at)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {report.evidence_urls?.length > 0 && (
                                                        <Badge variant="outline" className="gap-1">
                                                            <ImageIcon className="w-3 h-3" />
                                                            {report.evidence_urls.length}
                                                        </Badge>
                                                    )}
                                                    <Eye className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-600" />
                            รายละเอียดรายงาน
                        </DialogTitle>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    ข้อมูลลูกค้า
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">ชื่อ-นามสกุล</p>
                                        <p className="font-medium">{selectedReport.first_name} {selectedReport.last_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">เลขบัตร ปชช.</p>
                                        <p className="font-medium font-mono">****-****-{selectedReport.id_card_last4}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">เบอร์โทร</p>
                                        <p className="font-medium">{selectedReport.phone_number || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">ความเสี่ยง</p>
                                        <Badge className={SEVERITY_CONFIG[selectedReport.severity]?.color || ''}>
                                            {SEVERITY_CONFIG[selectedReport.severity]?.label || selectedReport.severity}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Report Details */}
                            <div className="bg-red-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    รายละเอียดการรายงาน
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">ประเภทปัญหา</p>
                                        <p className="font-medium">{REASON_TYPES[selectedReport.reason_type] || selectedReport.reason_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">รายละเอียด</p>
                                        <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.reason_detail}</p>
                                    </div>
                                    {selectedReport.incident_date && (
                                        <div>
                                            <p className="text-gray-500">วันที่เกิดเหตุ</p>
                                            <p className="font-medium">
                                                {new Date(selectedReport.incident_date).toLocaleDateString('th-TH')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Evidence */}
                            {selectedReport.evidence_urls?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" />
                                        หลักฐาน ({selectedReport.evidence_urls.length})
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {selectedReport.evidence_urls.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Evidence ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <ExternalLink className="w-6 h-6 text-white opacity-0 hover:opacity-100" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reporter Info */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">รายงานโดย</h3>
                                <p className="text-sm">
                                    <span className="font-medium">{selectedReport.reported_by_shop?.name}</span>
                                    {selectedReport.reported_by_shop?.phone_number && (
                                        <span className="text-gray-500"> | {selectedReport.reported_by_shop.phone_number}</span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(selectedReport.created_at)}
                                </p>
                            </div>

                            {/* Admin Actions */}
                            {selectedReport.status === 'pending' && (
                                <div className="border-t pt-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            หมายเหตุ Admin (ไม่บังคับ)
                                        </label>
                                        <Textarea
                                            placeholder="เพิ่มหมายเหตุ..."
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            เหตุผลที่ไม่อนุมัติ (กรณีปฏิเสธ)
                                        </label>
                                        <Textarea
                                            placeholder="ระบุเหตุผล..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowDetailModal(false)}
                                        >
                                            ปิด
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleReject(selectedReport)}
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4 mr-2" />
                                            )}
                                            ไม่อนุมัติ
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprove(selectedReport)}
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            อนุมัติ
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Show decision for processed reports */}
                            {selectedReport.status !== 'pending' && (
                                <div className={`p-4 rounded-lg ${selectedReport.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                                    }`}>
                                    <h3 className="font-semibold mb-2">
                                        {selectedReport.status === 'approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
                                    </h3>
                                    {selectedReport.admin_notes && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">หมายเหตุ:</span> {selectedReport.admin_notes}
                                        </p>
                                    )}
                                    {selectedReport.rejection_reason && (
                                        <p className="text-sm text-red-600">
                                            <span className="font-medium">เหตุผล:</span> {selectedReport.rejection_reason}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Import JSON Modal */}
            <Dialog
                open={showImportModal}
                onOpenChange={(open) => {
                    if (!open) resetImport();
                    setShowImportModal(open);
                }}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileJson className="w-5 h-5 text-green-600" />
                            นำเข้า Blacklist (JSON)
                        </DialogTitle>
                        <DialogDescription>
                            นำเข้าข้อมูลแบล็คลิสต์จากไฟล์ JSON (รองรับรูปแบบ Array of Objects)
                        </DialogDescription>
                    </DialogHeader>

                    {importStep === 1 ? (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                                <p className="text-sm text-yellow-800 font-semibold mb-2">รูปแบบข้อมูลที่รองรับ:</p>
                                <pre className="text-xs bg-white p-2 rounded border border-yellow-200 overflow-auto">
                                    {`[
  {
    "ชื่อ": "นาย สมชาย เข็มกลัด",
    "เลขบัตรประจำตัวประชาชน": "1-2345-67890-12-3",
    "รูปแบบการโกง": "ขโมยรถ"
  },
  ...
]`}
                                </pre>
                            </div>
                            <Textarea
                                placeholder="วาง JSON ที่นี่..."
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                className="min-h-[300px] font-mono text-sm"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowImportModal(false)}>
                                    ยกเลิก
                                </Button>
                                <Button onClick={handleParseJson} disabled={!importJson.trim()}>
                                    ตรวจสอบข้อมูล
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">
                                    ตรวจสอบข้อมูล ({previewData.length} รายการ)
                                </h3>
                                <Button variant="outline" size="sm" onClick={() => setImportStep(1)}>
                                    แก้ไข JSON
                                </Button>
                            </div>

                            <div className="border rounded-md overflow-hidden">
                                <div className="max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                                                <th className="px-4 py-3">เลขบัตร (Last 4)</th>
                                                <th className="px-4 py-3">สาเหตุ</th>
                                                <th className="px-4 py-3">ประเภท</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((item, idx) => (
                                                <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium">
                                                        {item.first_name} {item.last_name}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono">
                                                        ****{item.id_card.slice(-4)}
                                                    </td>
                                                    <td className="px-4 py-3 truncate max-w-[200px]" title={item.reason_detail}>
                                                        {item.reason_detail}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline">
                                                            {REASON_TYPES[item.reason_type] || item.reason_type}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowImportModal(false)}>
                                    ยกเลิก
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={handleConfirmImport}
                                    disabled={importing}
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            กำลังนำเข้า...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            ยืนยันการนำเข้า ({previewData.length})
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
