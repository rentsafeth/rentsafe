'use client';

import { useState, useEffect, useRef } from 'react';
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
    Scan,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';

const REASON_TYPES = [
    { value: 'no_return', label: 'ไม่คืนรถตามกำหนด', severity: 'severe' },
    { value: 'damage', label: 'ทำรถเสียหาย ไม่ยอมชดใช้', severity: 'moderate' },
    { value: 'no_pay', label: 'หนีไม่จ่ายค่าเช่า', severity: 'moderate' },
    { value: 'fake_docs', label: 'ใช้เอกสารปลอม', severity: 'severe' },
    { value: 'pledge', label: 'เช่าจำนำ', severity: 'severe' },
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
    id_card_number?: string;
    evidence_urls?: string[];
}

export default function BlacklistDashboard() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'search' | 'report' | 'my-reports'>('search');
    const [loading, setLoading] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [remainingSearches, setRemainingSearches] = useState(3);

    // Search state
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
        document_type: 'id_card',
    });
    const [submitting, setSubmitting] = useState(false);

    // Evidence upload state
    const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
    const [uploadingEvidence, setUploadingEvidence] = useState(false);

    // OCR State
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleScanIdCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setAlertState({
                isOpen: true,
                type: 'warning',
                title: 'ไฟล์ขนาดใหญ่เกินไป',
                message: 'ไฟล์มีขนาดใหญ่เกิน 5MB',
            });
            return;
        }

        setIsScanning(true);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const base64Data = evt.target?.result as string;

            try {
                const res = await fetch('/api/ocr/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: base64Data,
                        documentType: reportForm.document_type // Send current selection
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    const errDetail = data.details || data.error;
                    const errorMsg = typeof errDetail === 'object'
                        ? JSON.stringify(errDetail, null, 2)
                        : (errDetail || 'Failed to scan ID card');
                    throw new Error(errorMsg);
                }

                // Helper to clean titles
                const removeTitle = (text: string) => {
                    let cleanText = text.trim();
                    const titles = ['นาย', 'นางสาว', 'นาง', 'ด.ช.', 'ด.ญ.', 'เด็กชาย', 'เด็กหญิง', 'น.ส.', 'น.ส ', 'Ms.', 'Mr.', 'Mrs.', 'Miss.'];
                    const sortedTitles = titles.sort((a, b) => b.length - a.length);

                    for (const title of sortedTitles) {
                        if (cleanText.startsWith(title)) {
                            return cleanText.substring(title.length).trim();
                        }
                    }
                    return cleanText;
                };

                // Auto-fill form
                setReportForm(prev => {
                    const newState = { ...prev };

                    if (data.id_card_number) {
                        const cleanId = data.id_card_number.replace(/[^a-zA-Z0-9]/g, '');
                        // Auto-detect document type
                        if (cleanId.length === 13 && /^\d+$/.test(cleanId)) {
                            newState.document_type = 'id_card';
                            newState.id_card_number = cleanId;
                        } else {
                            // Likely passport or foreign ID if not 13 digits
                            if (/[a-zA-Z]/.test(cleanId)) {
                                newState.document_type = 'passport';
                            }
                            newState.id_card_number = cleanId;
                        }
                    }

                    if (data.first_name) newState.first_name = removeTitle(data.first_name);
                    if (data.last_name) newState.last_name = removeTitle(data.last_name);

                    return newState;
                });

                toast.success('สแกนบัตรและดึงข้อมูลสำเร็จ');

            } catch (error: any) {
                console.error('Scan Error:', error);
                setAlertState({
                    isOpen: true,
                    type: 'error',
                    title: 'การสแกนล้มเหลว',
                    message: error.message || 'ไม่สามารถอ่านข้อมูลจากบัตรได้',
                });
            } finally {
                setIsScanning(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsDataURL(file);
    };

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

        // Auto search from URL
        const q = searchParams.get('q');
        console.log('Search Params q:', q); // DEBUG log

        if (q) {
            console.log('Auto searching for:', q); // DEBUG log
            setSearchQuery(q);
            handleSearch(q);
        }
    }, [searchParams]);

    // Load reports when tab changes
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

    const handleSearch = async (overrideQuery?: string) => {
        const queryToUse = overrideQuery || searchQuery;
        console.log('handleSearch calling API with:', queryToUse); // DEBUG log

        if (!queryToUse.trim()) {
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
                `/api/blacklist?q=${encodeURIComponent(queryToUse)}`
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

            // If it was a UUID search, verify we found something
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queryToUse) && (!data.results || data.results.length === 0)) {
                // Should ideally not happen if the ID exists
            }

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
        // Validate with Auto-Scroll
        const requiredFields: { key: keyof typeof reportForm; id: string; label: string }[] = [
            { key: 'id_card_number', id: 'field-id-card', label: reportForm.document_type === 'passport' ? 'เลข Passport' : (reportForm.document_type === 'driving_license' ? 'เลขใบขับขี่' : 'เลขบัตรประชาชน') },
            { key: 'first_name', id: 'field-first-name', label: 'ชื่อ' },
            { key: 'last_name', id: 'field-last-name', label: 'นามสกุล' },
            { key: 'reason_type', id: 'field-reason-type', label: 'ประเภทปัญหา' },
            { key: 'reason_detail', id: 'field-reason-detail', label: 'รายละเอียดเพิ่มเติม' },
        ];

        for (const field of requiredFields) {
            if (!reportForm[field.key]) {
                setAlertState({
                    isOpen: true,
                    type: 'warning',
                    title: 'ข้อมูลไม่ครบถ้วน',
                    message: `กรุณากรอกข้อมูล: ${field.label}`,
                });

                // Scroll to field, focus, and highlight
                setTimeout(() => {
                    const el = document.getElementById(field.id);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                        el.classList.add('ring-2', 'ring-red-500', 'border-red-500');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-red-500', 'border-red-500'), 3000);
                    }
                }, 100);
                return;
            }
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
                document_type: 'id_card',
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

    // Auto-format search input based on content
    const handleSearchInputChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '');

        // If it looks like an ID card (13 digits), format it
        if (digitsOnly.length === 13) {
            setSearchQuery(digitsOnly);
        }
        // If it looks like a phone number (9-10 digits), keep digits only
        else if (digitsOnly.length >= 9 && digitsOnly.length <= 10 && /^\d+$/.test(value.replace(/-/g, ''))) {
            setSearchQuery(digitsOnly);
        }
        // Otherwise, keep as-is (for name search)
        else {
            setSearchQuery(value);
        }
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
                            {/* Search Description */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <Search className="w-4 h-4 inline mr-1" />
                                    ค้นหาได้จาก <span className="font-medium">เลขบัตรประชาชน</span>, <span className="font-medium">เบอร์โทรศัพท์</span> หรือ <span className="font-medium">ชื่อ-นามสกุล</span>
                                </p>
                            </div>

                            {/* Search Input */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="พิมพ์เลขบัตร, เบอร์โทร หรือชื่อ..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchInputChange(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={() => handleSearch()}
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
                                                                {result.first_name} {result.last_name}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                บัตร ปชช.: {result.id_card_number ? formatIdCard(result.id_card_number) : `****-****-${result.id_card_last4}`}
                                                            </p>
                                                            {result.phone_number && (
                                                                <p className="text-sm text-gray-500">
                                                                    โทร: {result.phone_number}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {/* Badge Removed */}
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-red-200">
                                                        <p className="text-sm">
                                                            <span className="font-medium">เหตุผล:</span>{' '}
                                                            {REASON_TYPES.find(r => r.value === result.reason_type)?.label || result.reason_type}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {result.reason_detail}
                                                        </p>

                                                        {/* Evidence Images */}
                                                        {result.evidence_urls && result.evidence_urls.length > 0 && (
                                                            <div className="mt-3">
                                                                <p className="text-xs font-medium text-gray-500 mb-2">หลักฐาน ({result.evidence_urls.length})</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {result.evidence_urls.map((url: string, idx: number) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="relative w-16 h-16 rounded overflow-hidden border border-gray-200 hover:opacity-80 transition block"
                                                                        >
                                                                            <Image
                                                                                src={url}
                                                                                alt={`Evidence ${idx + 1}`}
                                                                                fill
                                                                                className="object-cover"
                                                                                unoptimized
                                                                            />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {result.report_count > 1 && (
                                                            <p className="text-sm text-red-600 mt-2 font-medium">
                                                                ⚠️ ถูกรายงาน {result.report_count} ครั้ง
                                                            </p>
                                                        )}

                                                        <div className="mt-3 pt-2 border-t border-red-100">
                                                            <p className="text-[10px] text-gray-400 italic">
                                                                * ข้อมูลนี้สำหรับตรวจสอบภายในเท่านั้น ผู้เปิดเผยต่อสาธารณะต้องรับผิดชอบแต่เพียงผู้เดียว
                                                            </p>
                                                        </div>
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

                            <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="docType"
                                        checked={reportForm.document_type === 'id_card'}
                                        onChange={() => setReportForm(prev => ({ ...prev, document_type: 'id_card', id_card_number: '' }))}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">บัตรประชาชน</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="docType"
                                        checked={reportForm.document_type === 'passport'}
                                        onChange={() => setReportForm(prev => ({ ...prev, document_type: 'passport', id_card_number: '' }))}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Passport</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="docType"
                                        checked={reportForm.document_type === 'driving_license'}
                                        onChange={() => setReportForm(prev => ({ ...prev, document_type: 'driving_license', id_card_number: '' }))}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">ใบขับขี่</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {reportForm.document_type === 'passport' ? 'เลข Passport' : (reportForm.document_type === 'driving_license' ? 'เลขใบขับขี่' : 'เลขบัตรประชาชน')} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleScanIdCard}
                                            />
                                            <TooltipProvider>
                                                <Tooltip delayDuration={100}>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 text-xs flex items-center gap-1.5 text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:text-blue-700 transition-colors px-2"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={isScanning}
                                                        >
                                                            {isScanning ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Scan className="w-3 h-3" />
                                                            )}
                                                            {isScanning ? 'กำลังสแกน...' : 'สแกนบัตร'}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>ดึงข้อมูลจากรูปบัตรด้วย Ai</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        )}
                                    </div>
                                    <Input
                                        id="field-id-card"
                                        placeholder={reportForm.document_type === 'passport' ? 'A12345678' : (reportForm.document_type === 'driving_license' ? '12345678' : '1234567890123')}
                                        maxLength={reportForm.document_type === 'passport' ? 20 : (reportForm.document_type === 'driving_license' ? 8 : 13)}
                                        value={reportForm.id_card_number}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (reportForm.document_type === 'id_card') {
                                                val = val.replace(/\D/g, '').slice(0, 13);
                                            } else {
                                                // Passport: Allow A-Z, 0-9, dash
                                                val = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                                            }
                                            setReportForm(prev => ({
                                                ...prev,
                                                id_card_number: val
                                            }));
                                        }}
                                        onBlur={(e) => {
                                            if (reportForm.document_type === 'id_card') {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setReportForm(prev => ({ ...prev, id_card_number: val }));
                                            }
                                        }}
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
                                        id="field-first-name"
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
                                        id="field-last-name"
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
                                        id="field-reason-type"
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
                                    id="field-reason-detail"
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
                                        document_type: 'id_card'
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
