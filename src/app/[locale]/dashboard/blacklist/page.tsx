'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StandaloneAlert } from '@/components/ui/alert-modal';
import {
    Search,
    Plus,
    ShieldAlert,
    Loader2,
    Crown,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    ChevronRight,
    Phone,
    User,
    CreditCard,
    Calendar,
    FileText,
    Upload,
    X,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import Link from 'next/link';

const REASON_TYPES = [
    { value: 'no_return', label: 'ไม่คืนรถตามกำหนด', severity: 'severe' },
    { value: 'damage', label: 'ทำรถเสียหาย ไม่ยอมชดใช้', severity: 'moderate' },
    { value: 'no_pay', label: 'หนีไม่จ่ายค่าเช่า', severity: 'moderate' },
    { value: 'fake_docs', label: 'ใช้เอกสารปลอม', severity: 'severe' },
    { value: 'other', label: 'อื่นๆ', severity: 'warning' },
];

const STATUS_CONFIG = {
    pending: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const SEVERITY_CONFIG = {
    warning: { label: 'ต่ำ', color: 'bg-yellow-100 text-yellow-700' },
    moderate: { label: 'ปานกลาง', color: 'bg-orange-100 text-orange-700' },
    severe: { label: 'สูง', color: 'bg-red-100 text-red-700' },
};

interface BlacklistReport {
    id: string;
    id_card_last4: string;
    first_name: string;
    last_name: string;
    phone_number: string | null;
    reason_type: string;
    reason_detail: string;
    severity: string;
    status: string;
    created_at: string;
    rejection_reason?: string;
}

interface SearchResult {
    id: string;
    id_card_last4: string;
    first_name: string;
    last_name: string;
    phone_number: string | null;
    reason_type: string;
    reason_detail: string;
    severity: string;
    report_count: number;
    created_at: string;
}

export default function BlacklistDashboard() {
    const [activeTab, setActiveTab] = useState<'search' | 'report' | 'my-reports'>('search');
    const [loading, setLoading] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [remainingSearches, setRemainingSearches] = useState(3);

    // Search state
    const [searchType, setSearchType] = useState<'id_card' | 'phone' | 'name'>('id_card');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searched, setSearched] = useState(false);

    // Report form state
    const [reportForm, setReportForm] = useState({
        id_card_number: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        reason_type: '',
        reason_detail: '',
        incident_date: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Evidence upload state
    const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
    const [uploadingEvidence, setUploadingEvidence] = useState(false);

    // My reports state
    const [myReports, setMyReports] = useState<BlacklistReport[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // Alert state
    const [alertState, setAlertState] = useState({
        isOpen: false,
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        title: '',
        message: '',
    });

    const supabase = createClient();

    useEffect(() => {
        checkSubscription();
    }, []);

    useEffect(() => {
        if (activeTab === 'my-reports') {
            loadMyReports();
        }
    }, [activeTab]);

    const checkSubscription = async () => {
        try {
            const response = await fetch('/api/subscription');
            const data = await response.json();
            setIsPro(data.is_pro || false);
            setRemainingSearches(data.remaining_blacklist_searches ?? 3);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setAlertState({
                isOpen: true,
                type: 'warning',
                title: 'กรุณากรอกข้อมูล',
                message: 'กรุณากรอกข้อมูลที่ต้องการค้นหา',
            });
            return;
        }

        setLoading(true);
        setSearched(false);

        try {
            const response = await fetch(
                `/api/blacklist?type=${searchType}&q=${encodeURIComponent(searchQuery)}`
            );
            const data = await response.json();

            if (response.status === 429) {
                setAlertState({
                    isOpen: true,
                    type: 'warning',
                    title: 'เกินจำนวนการค้นหา',
                    message: data.message || 'คุณใช้สิทธิ์ค้นหาครบแล้ววันนี้',
                });
                return;
            }

            if (data.error) {
                throw new Error(data.error);
            }

            setSearchResults(data.results || []);
            setRemainingSearches(data.remaining_searches ?? remainingSearches);
            setSearched(true);
        } catch (error) {
            console.error('Search error:', error);
            setAlertState({
                isOpen: true,
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: 'ไม่สามารถค้นหาได้ กรุณาลองใหม่อีกครั้ง',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Max 5 files
        if (evidenceUrls.length + files.length > 5) {
            setAlertState({
                isOpen: true,
                type: 'warning',
                title: 'เกินจำนวน',
                message: 'สามารถอัปโหลดหลักฐานได้สูงสุด 5 ไฟล์',
            });
            return;
        }

        setUploadingEvidence(true);

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload/evidence', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Upload failed');
                }

                setEvidenceUrls(prev => [...prev, data.url]);
            }
        } catch (error: any) {
            setAlertState({
                isOpen: true,
                type: 'error',
                title: 'อัปโหลดไม่สำเร็จ',
                message: error.message || 'ไม่สามารถอัปโหลดไฟล์ได้',
            });
        } finally {
            setUploadingEvidence(false);
            // Reset input
            e.target.value = '';
        }
    };

    const removeEvidence = (index: number) => {
        setEvidenceUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitReport = async () => {
        // Validate
        if (!reportForm.id_card_number || !reportForm.first_name || !reportForm.last_name ||
            !reportForm.reason_type || !reportForm.reason_detail) {
            setAlertState({
                isOpen: true,
                type: 'warning',
                title: 'กรุณากรอกข้อมูลให้ครบ',
                message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน',
            });
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch('/api/blacklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...reportForm,
                    evidence_urls: evidenceUrls,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit report');
            }

            setAlertState({
                isOpen: true,
                type: 'success',
                title: 'ส่งรายงานสำเร็จ',
                message: data.message,
            });

            // Reset form
            setReportForm({
                id_card_number: '',
                first_name: '',
                last_name: '',
                phone_number: '',
                reason_type: '',
                reason_detail: '',
                incident_date: '',
            });
            setEvidenceUrls([]);

            // Switch to my reports tab
            setActiveTab('my-reports');
        } catch (error: any) {
            setAlertState({
                isOpen: true,
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: error.message || 'ไม่สามารถส่งรายงานได้',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const loadMyReports = async () => {
        setLoadingReports(true);
        try {
            const response = await fetch('/api/blacklist/my-reports');
            const data = await response.json();
            setMyReports(data.reports || []);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoadingReports(false);
        }
    };

    const formatIdCard = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 13);
        if (digits.length <= 1) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
        if (digits.length <= 10) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
        if (digits.length <= 12) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`;
        return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Customer Blacklist</h1>
                    </div>
                    <p className="text-gray-600">ค้นหาและรายงานลูกค้าที่มีประวัติไม่ดี</p>
                </div>

                {/* Subscription Status */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isPro ? (
                                    <>
                                        <Crown className="w-6 h-6 text-yellow-500" />
                                        <div>
                                            <p className="font-semibold text-gray-900">ร้านรับรอง</p>
                                            <p className="text-sm text-gray-500">ค้นหาไม่จำกัด</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-6 h-6 text-gray-400" />
                                        <div>
                                            <p className="font-semibold text-gray-900">แพ็คเกจฟรี</p>
                                            <p className="text-sm text-gray-500">
                                                เหลือ {remainingSearches}/3 ครั้งวันนี้
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                            {!isPro && (
                                <Link href="/pricing">
                                    <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                                        <Crown className="w-4 h-4 mr-2" />
                                        อัปเกรด
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={activeTab === 'search' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('search')}
                        className={activeTab === 'search' ? 'bg-blue-600' : ''}
                    >
                        <Search className="w-4 h-4 mr-2" />
                        ค้นหา
                    </Button>
                    <Button
                        variant={activeTab === 'report' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('report')}
                        className={activeTab === 'report' ? 'bg-blue-600' : ''}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        รายงาน
                    </Button>
                    <Button
                        variant={activeTab === 'my-reports' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('my-reports')}
                        className={activeTab === 'my-reports' ? 'bg-blue-600' : ''}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        รายงานของฉัน
                    </Button>
                </div>

                {/* Search Tab */}
                {activeTab === 'search' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5" />
                                ค้นหาประวัติลูกค้า
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search Type */}
                            <div className="flex gap-2">
                                <Button
                                    variant={searchType === 'id_card' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSearchType('id_card')}
                                    className={searchType === 'id_card' ? 'bg-blue-600' : ''}
                                >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    เลขบัตร ปชช.
                                </Button>
                                <Button
                                    variant={searchType === 'phone' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSearchType('phone')}
                                    className={searchType === 'phone' ? 'bg-blue-600' : ''}
                                >
                                    <Phone className="w-4 h-4 mr-1" />
                                    เบอร์โทร
                                </Button>
                                <Button
                                    variant={searchType === 'name' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSearchType('name')}
                                    className={searchType === 'name' ? 'bg-blue-600' : ''}
                                >
                                    <User className="w-4 h-4 mr-1" />
                                    ชื่อ-นามสกุล
                                </Button>
                            </div>

                            {/* Search Input */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder={
                                        searchType === 'id_card' ? '1-2345-67890-12-3' :
                                        searchType === 'phone' ? '081-234-5678' :
                                        'ชื่อ นามสกุล'
                                    }
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleSearch}
                                    disabled={loading || (!isPro && remainingSearches === 0)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>

                            {/* Search Results */}
                            {searched && (
                                <div className="mt-6">
                                    {searchResults.length === 0 ? (
                                        <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                            <p className="font-semibold text-green-700">ไม่พบในระบบ Blacklist</p>
                                            <p className="text-sm text-green-600">ลูกค้าคนนี้ไม่มีประวัติที่ถูกรายงาน</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-red-600 mb-4">
                                                <AlertTriangle className="w-5 h-5" />
                                                <span className="font-semibold">
                                                    พบ {searchResults.length} รายการในระบบ Blacklist
                                                </span>
                                            </div>
                                            {searchResults.map((result) => (
                                                <div
                                                    key={result.id}
                                                    className="p-4 bg-red-50 rounded-lg border border-red-200"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">
                                                                {result.first_name} {result.last_name.charAt(0)}***
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                บัตร ปชช.: ****-****-{result.id_card_last4}
                                                            </p>
                                                            {result.phone_number && (
                                                                <p className="text-sm text-gray-500">
                                                                    โทร: {result.phone_number}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Badge className={SEVERITY_CONFIG[result.severity as keyof typeof SEVERITY_CONFIG]?.color || ''}>
                                                            ความเสี่ยง: {SEVERITY_CONFIG[result.severity as keyof typeof SEVERITY_CONFIG]?.label || result.severity}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-red-200">
                                                        <p className="text-sm">
                                                            <span className="font-medium">เหตุผล:</span>{' '}
                                                            {REASON_TYPES.find(r => r.value === result.reason_type)?.label || result.reason_type}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {result.reason_detail}
                                                        </p>
                                                        {result.report_count > 1 && (
                                                            <p className="text-sm text-red-600 mt-2 font-medium">
                                                                ⚠️ ถูกรายงาน {result.report_count} ครั้ง
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Report Tab */}
                {activeTab === 'report' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                รายงานลูกค้าที่มีปัญหา
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                                    รายงานจะถูกตรวจสอบโดย Admin ก่อนเผยแพร่
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        เลขบัตรประชาชน <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="1-2345-67890-12-3"
                                        value={reportForm.id_card_number}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            id_card_number: formatIdCard(e.target.value)
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        เบอร์โทรศัพท์
                                    </label>
                                    <Input
                                        placeholder="081-234-5678"
                                        value={reportForm.phone_number}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            phone_number: e.target.value
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อ <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="ชื่อจริง"
                                        value={reportForm.first_name}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            first_name: e.target.value
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        นามสกุล <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="นามสกุล"
                                        value={reportForm.last_name}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            last_name: e.target.value
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ประเภทปัญหา <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={reportForm.reason_type}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            reason_type: e.target.value
                                        }))}
                                    >
                                        <option value="">เลือกประเภท</option>
                                        {REASON_TYPES.map((reason) => (
                                            <option key={reason.value} value={reason.value}>
                                                {reason.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        วันที่เกิดเหตุ
                                    </label>
                                    <Input
                                        type="date"
                                        value={reportForm.incident_date}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            incident_date: e.target.value
                                        }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รายละเอียดเพิ่มเติม <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    placeholder="อธิบายรายละเอียดของเหตุการณ์ที่เกิดขึ้น..."
                                    rows={4}
                                    value={reportForm.reason_detail}
                                    onChange={(e) => setReportForm(prev => ({
                                        ...prev,
                                        reason_detail: e.target.value
                                    }))}
                                />
                            </div>

                            {/* Evidence Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    หลักฐาน (ไม่บังคับ)
                                </label>
                                <div className="space-y-3">
                                    {/* Uploaded images preview */}
                                    {evidenceUrls.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {evidenceUrls.map((url, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={url}
                                                        alt={`หลักฐาน ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEvidence(index)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload button */}
                                    {evidenceUrls.length < 5 && (
                                        <div className="flex items-center gap-3">
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleEvidenceUpload}
                                                    className="hidden"
                                                    disabled={uploadingEvidence}
                                                />
                                                <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                                    {uploadingEvidence ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                    ) : (
                                                        <Upload className="w-4 h-4 text-gray-400" />
                                                    )}
                                                    <span className="text-sm text-gray-600">
                                                        {uploadingEvidence ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพหลักฐาน'}
                                                    </span>
                                                </div>
                                            </label>
                                            <span className="text-xs text-gray-400">
                                                สูงสุด 5 รูป (JPG, PNG)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setReportForm({
                                        id_card_number: '',
                                        first_name: '',
                                        last_name: '',
                                        phone_number: '',
                                        reason_type: '',
                                        reason_detail: '',
                                        incident_date: '',
                                    })}
                                >
                                    ล้างข้อมูล
                                </Button>
                                <Button
                                    onClick={handleSubmitReport}
                                    disabled={submitting}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <ShieldAlert className="w-4 h-4 mr-2" />
                                    )}
                                    ส่งรายงาน
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* My Reports Tab */}
                {activeTab === 'my-reports' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                รายงานของฉัน
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingReports ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                </div>
                            ) : myReports.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>คุณยังไม่เคยส่งรายงาน</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myReports.map((report) => {
                                        const statusConfig = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG];
                                        const StatusIcon = statusConfig?.icon || Clock;

                                        return (
                                            <div
                                                key={report.id}
                                                className="p-4 bg-gray-50 rounded-lg border"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {report.first_name} {report.last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {REASON_TYPES.find(r => r.value === report.reason_type)?.label}
                                                        </p>
                                                    </div>
                                                    <Badge className={statusConfig?.color || ''}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {statusConfig?.label || report.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {report.reason_detail}
                                                </p>
                                                {report.rejection_reason && (
                                                    <p className="text-sm text-red-600 mt-2">
                                                        เหตุผลที่ไม่อนุมัติ: {report.rejection_reason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(report.created_at).toLocaleDateString('th-TH', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Alert Modal */}
            <StandaloneAlert
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
            />
        </div>
    );
}
