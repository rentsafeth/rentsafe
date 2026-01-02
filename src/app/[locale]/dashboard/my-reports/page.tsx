'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertTriangle, Clock, CheckCircle, XCircle,
    ArrowLeft, Eye, Calendar, DollarSign, Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Report {
    id: string;
    manual_shop_name: string | null;
    manual_shop_contact: string | null;
    manual_bank_account: string | null;
    description: string;
    evidence_urls: string[];
    incident_date: string | null;
    amount_lost: number | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    blacklist_entry?: {
        id: string;
        shop_names: string[];
        total_reports: number;
        severity: string;
    } | null;
}

export default function MyReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string | null>(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const url = filter
                ? `/api/reports?status=${filter}`
                : '/api/reports';
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        อนุมัติแล้ว
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        ถูกปฏิเสธ
                    </Badge>
                );
            case 'pending':
            default:
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        รอตรวจสอบ
                    </Badge>
                );
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">รายงานที่ส่ง</h1>
                            <p className="text-gray-600">ดูสถานะรายงานความผิดปกติที่คุณได้ส่งไป</p>
                        </div>
                    </div>
                    <Link href="/report">
                        <Button className="bg-red-600 hover:bg-red-700">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            รายงานใหม่
                        </Button>
                    </Link>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={filter === null ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(null)}
                    >
                        ทั้งหมด
                    </Button>
                    <Button
                        variant={filter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('pending')}
                        className={filter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                    >
                        รอตรวจสอบ
                    </Button>
                    <Button
                        variant={filter === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('approved')}
                        className={filter === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                        อนุมัติแล้ว
                    </Button>
                    <Button
                        variant={filter === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('rejected')}
                        className={filter === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        ถูกปฏิเสธ
                    </Button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                )}

                {/* Empty State */}
                {!loading && reports.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="font-medium">ยังไม่มีรายงาน</p>
                            <p className="text-sm mt-1">เมื่อคุณส่งรายงาน จะแสดงที่นี่</p>
                            <Link href="/report" className="mt-4 inline-block">
                                <Button className="bg-red-600 hover:bg-red-700">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    รายงานมิจฉาชีพ
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Reports List */}
                {!loading && reports.length > 0 && (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <Card
                                key={report.id}
                                className={`border transition-shadow hover:shadow-md ${report.status === 'pending' ? 'border-yellow-200 bg-yellow-50/30' :
                                    report.status === 'approved' ? 'border-green-200 bg-green-50/30' :
                                        'border-red-200 bg-red-50/30'
                                    }`}
                            >
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    {report.manual_shop_name || 'ไม่ระบุชื่อร้าน'}
                                                </h3>
                                                {getStatusBadge(report.status)}
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                ส่งเมื่อ {formatDate(report.created_at)}
                                            </p>
                                        </div>
                                        {report.amount_lost && report.amount_lost > 0 && (
                                            <Badge variant="outline" className="border-red-200 text-red-700">
                                                <DollarSign className="w-3 h-3 mr-1" />
                                                {formatMoney(report.amount_lost)}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Report Details */}
                                    <div className="bg-white/60 p-4 rounded-lg mb-4">
                                        <p className="text-gray-700 line-clamp-3">{report.description}</p>
                                        {report.incident_date && (
                                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                วันที่เกิดเหตุ: {formatDate(report.incident_date)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Evidence Preview */}
                                    {report.evidence_urls && report.evidence_urls.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {report.evidence_urls.slice(0, 4).map((url, i) => (
                                                <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border flex-shrink-0">
                                                    <Image
                                                        src={url}
                                                        alt={`หลักฐาน ${i + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ))}
                                            {report.evidence_urls.length > 4 && (
                                                <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm text-gray-500">
                                                        +{report.evidence_urls.length - 4}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* View Blacklist Entry Link (for approved reports) */}
                                    {report.status === 'approved' && report.blacklist_entry && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <Link href={`/blacklist/${report.blacklist_entry.id}`}>
                                                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    ดูใน Blacklist ({report.blacklist_entry.total_reports} รายงาน)
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
