'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    GitMerge, Search, AlertTriangle, Loader2,
    ChevronRight, CheckCircle, Phone, CreditCard,
    MessageCircle, User, ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface BlacklistEntry {
    id: string;
    bank_account_no: string | null;
    phone_numbers: string[];
    line_ids: string[];
    id_card_numbers: string[];
    shop_names: string[];
    total_reports: number;
    total_amount_lost: number;
    severity: string;
}

interface RelatedEntry {
    related_entry_id: string;
    related_shop_names: string[];
    match_type: string;
    match_value: string;
}

export default function AdminMergeBlacklistPage() {
    const [entries, setEntries] = useState<BlacklistEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<BlacklistEntry | null>(null);
    const [relatedEntries, setRelatedEntries] = useState<RelatedEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [merging, setMerging] = useState(false);
    const [mergeTarget, setMergeTarget] = useState<string | null>(null);
    const supabase = createClient();

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blacklist_entries')
            .select('*')
            .order('total_reports', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching entries:', error);
            toast.error('ไม่สามารถโหลดข้อมูลได้');
        } else {
            setEntries(data || []);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const findRelated = async (entry: BlacklistEntry) => {
        setSelectedEntry(entry);
        setSearching(true);
        setRelatedEntries([]);

        try {
            const { data, error } = await supabase.rpc('find_related_blacklist_entries', {
                entry_id: entry.id
            });

            if (error) {
                console.error('Error finding related:', error);
                toast.error('ไม่พบ function find_related_blacklist_entries กรุณารัน SQL script ก่อน');
            } else {
                // Group by entry_id and combine match types
                const grouped = (data || []).reduce((acc: Record<string, RelatedEntry & { match_types: string[] }>, item: RelatedEntry) => {
                    if (!acc[item.related_entry_id]) {
                        acc[item.related_entry_id] = {
                            ...item,
                            match_types: [item.match_type]
                        };
                    } else {
                        acc[item.related_entry_id].match_types.push(item.match_type);
                    }
                    return acc;
                }, {});

                setRelatedEntries(Object.values(grouped));
            }
        } catch (e) {
            console.error('Error:', e);
        }

        setSearching(false);
    };

    const mergeEntries = async (targetId: string, sourceId: string) => {
        setMerging(true);
        setMergeTarget(sourceId);

        try {
            const { data, error } = await supabase.rpc('merge_blacklist_entries', {
                target_entry_id: targetId,
                source_entry_id: sourceId
            });

            if (error) {
                console.error('Merge error:', error);
                toast.error('ไม่สามารถ Merge ได้: ' + error.message);
            } else if (data?.success) {
                toast.success(`Merge สำเร็จ! ย้าย ${data.reports_moved} รายงาน`);
                // Refresh data
                fetchEntries();
                setSelectedEntry(null);
                setRelatedEntries([]);
            } else {
                toast.error('Merge ไม่สำเร็จ: ' + (data?.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error:', e);
        }

        setMerging(false);
        setMergeTarget(null);
    };

    const getMatchIcon = (type: string) => {
        switch (type) {
            case 'bank_account': return <CreditCard className="w-4 h-4" />;
            case 'phone': return <Phone className="w-4 h-4" />;
            case 'line_id': return <MessageCircle className="w-4 h-4" />;
            case 'id_card': return <User className="w-4 h-4" />;
            default: return null;
        }
    };

    const getMatchLabel = (type: string) => {
        switch (type) {
            case 'bank_account': return 'เลขบัญชี';
            case 'phone': return 'เบอร์โทร';
            case 'line_id': return 'Line ID';
            case 'id_card': return 'เลขบัตร';
            default: return type;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-600 text-white';
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-orange-100 text-orange-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <GitMerge className="w-6 h-6" />
                    Merge Blacklist Entries
                </h1>
                <p className="text-gray-500">
                    รวม entries ที่เป็นมิจฉาชีพคนเดียวกันแต่ใช้ข้อมูลต่างกัน
                </p>
            </div>

            {/* Alert for SQL setup */}
            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800">ก่อนใช้งานให้รัน SQL script</p>
                            <p className="text-sm text-amber-700">
                                รัน <code className="bg-amber-100 px-1 rounded">src/scripts/5_blacklist_merge_functions.sql</code> ใน Supabase SQL Editor ก่อน
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Entry List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Blacklist Entries ({entries.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {entries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        onClick={() => findRelated(entry)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedEntry?.id === entry.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {entry.shop_names?.[0] || 'ไม่ระบุชื่อ'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {entry.bank_account_no || 'ไม่มีเลขบัญชี'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getSeverityColor(entry.severity)}>
                                                    {entry.total_reports} รายงาน
                                                </Badge>
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Related Entries */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            Entries ที่เกี่ยวข้อง
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!selectedEntry ? (
                            <div className="text-center py-8 text-gray-500">
                                <GitMerge className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>เลือก entry ทางซ้ายเพื่อหา entries ที่อาจเป็นคนเดียวกัน</p>
                            </div>
                        ) : searching ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : relatedEntries.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                                <p className="font-medium text-green-700">ไม่พบ entries ที่ซ้ำซ้อน</p>
                                <p className="text-sm">Entry นี้ไม่มีข้อมูลที่ตรงกับ entries อื่น</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Source Info */}
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-700 font-medium">Entry ที่เลือก (Target):</p>
                                    <p className="font-bold text-blue-900">
                                        {selectedEntry.shop_names?.[0] || 'ไม่ระบุ'}
                                    </p>
                                    <p className="text-sm text-blue-600">{selectedEntry.bank_account_no}</p>
                                </div>

                                {/* Related Entries */}
                                {relatedEntries.map((related: RelatedEntry & { match_types?: string[] }) => (
                                    <div key={related.related_entry_id} className="p-4 border rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {related.related_shop_names?.[0] || 'ไม่ระบุชื่อ'}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {(related.match_types || [related.match_type]).map((type, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {getMatchIcon(type)}
                                                            <span className="ml-1">{getMatchLabel(type)}</span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => mergeEntries(selectedEntry.id, related.related_entry_id)}
                                                disabled={merging}
                                                className="bg-orange-600 hover:bg-orange-700"
                                            >
                                                {merging && mergeTarget === related.related_entry_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ArrowRight className="w-4 h-4 mr-1" />
                                                        Merge
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
