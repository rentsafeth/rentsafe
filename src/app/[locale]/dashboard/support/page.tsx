'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Clock, CheckCircle, XCircle, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';

interface Ticket {
    id: string;
    subject_type: string;
    custom_subject: string | null;
    description: string;
    status: string;
    admin_response: string | null;
    created_at: string;
    images: string[];
}

const SUBJECT_LABELS: Record<string, string> = {
    'payment_issue': 'เติมเงินไม่สำเร็จ',
    'registration_issue': 'ลงทะเบียนไม่สำเร็จ',
    'blacklist_removal': 'ขอลบรายการ Blacklist',
    'review_removal': 'ขอลบรีวิว',
    'other': 'อื่นๆ',
};

export default function SupportPage() {
    const router = useRouter();
    const supabase = createClient();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    useEffect(() => {
        const fetchTickets = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data } = await supabase
                .from('contact_tickets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            setTickets(data || []);
            setLoading(false);
        };

        fetchTickets();
    }, [supabase, router]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" /> รอตรวจสอบ</Badge>;
            case 'in_progress':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> กำลังดำเนินการ</Badge>;
            case 'resolved':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> แก้ไขแล้ว</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> ปฏิเสธ</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">ประวัติการติดต่อ</h1>
                <Link href="/contact">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        แจ้งปัญหาใหม่
                    </Button>
                </Link>
            </div>

            {tickets.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">ยังไม่มีประวัติการติดต่อ</p>
                        <p className="text-sm mb-6">หากพบปัญหาการใช้งาน สามารถแจ้งทีมงานได้ทันที</p>
                        <Link href="/contact">
                            <Button variant="outline">แจ้งปัญหาการใช้งาน</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <Card
                            key={ticket.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedTicket(ticket)}
                        >
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">
                                                {ticket.subject_type === 'other'
                                                    ? ticket.custom_subject
                                                    : SUBJECT_LABELS[ticket.subject_type]}
                                            </h3>
                                            {getStatusBadge(ticket.status)}
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-1">
                                            {ticket.description}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(ticket.created_at).toLocaleString('th-TH')}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 hidden sm:block" />
                                </div>

                                {ticket.admin_response && (
                                    <div className="mt-4 pt-4 border-t bg-slate-50 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-6 rounded-b-lg">
                                        <p className="text-sm font-semibold text-blue-600 mb-1">ตอบกลับจากแอดมิน:</p>
                                        <p className="text-sm text-gray-700">{ticket.admin_response}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {selectedTicket?.subject_type === 'other'
                                ? selectedTicket?.custom_subject
                                : selectedTicket ? SUBJECT_LABELS[selectedTicket.subject_type] : ''}
                        </DialogTitle>
                        <DialogDescription>
                            ส่งเมื่อ: {selectedTicket && new Date(selectedTicket.created_at).toLocaleString('th-TH')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">สถานะ:</span>
                            {selectedTicket && getStatusBadge(selectedTicket.status)}
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-900">รายละเอียด</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg text-sm">
                                {selectedTicket?.description}
                            </p>
                        </div>

                        {selectedTicket?.images && selectedTicket.images.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-gray-900">รูปภาพแนบ</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {selectedTicket.images.map((url, idx) => (
                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity">
                                            <Image
                                                src={url}
                                                alt={`Attachment ${idx + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTicket?.admin_response && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
                                <h4 className="font-semibold text-sm text-blue-800 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    ตอบกลับจากแอดมิน
                                </h4>
                                <p className="text-blue-900 text-sm whitespace-pre-wrap">
                                    {selectedTicket.admin_response}
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
