'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter, MessageSquare, CheckCircle, XCircle, Clock, Phone, User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import Image from 'next/image';

interface Ticket {
    id: string;
    user_id: string;
    subject_type: string;
    custom_subject: string | null;
    description: string;
    contact_number: string;
    status: string;
    admin_response: string | null;
    created_at: string;
    images: string[];
    profiles?: {
        email: string;
        first_name?: string;
        last_name?: string;
    };
}

const SUBJECT_LABELS: Record<string, string> = {
    'payment_issue': 'เติมเงินไม่สำเร็จ',
    'registration_issue': 'ลงทะเบียนไม่สำเร็จ',
    'blacklist_removal': 'ขอลบรายการ Blacklist',
    'review_removal': 'ขอลบรีวิว',
    'other': 'อื่นๆ',
};

export default function AdminContactPage() {
    const supabase = createClient();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog State
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyStatus, setReplyStatus] = useState<string>('resolved');
    const [submitting, setSubmitting] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            // First fetch tickets
            let query = supabase
                .from('contact_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data: ticketsData, error: ticketsError } = await query;
            if (ticketsError) throw ticketsError;

            if (!ticketsData || ticketsData.length === 0) {
                setTickets([]);
                return;
            }

            // Then fetch profiles manually to avoid RLS join issues
            const userIds = Array.from(new Set(ticketsData.map(t => t.user_id).filter(Boolean)));

            let profilesMap: Record<string, any> = {};
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, email, first_name, last_name')
                    .in('id', userIds);

                if (profilesData) {
                    profilesData.forEach(p => {
                        profilesMap[p.id] = p;
                    });
                }
            }

            // Combine data
            const combinedTickets = ticketsData.map(ticket => ({
                ...ticket,
                profiles: profilesMap[ticket.user_id] || { email: 'Unknown User' }
            }));

            setTickets(combinedTickets);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            // alert('Error fetching tickets: ' + (error as any).message); // Optional debug
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [filterStatus]);

    const handleReply = async () => {
        if (!selectedTicket) return;
        setSubmitting(true);

        try {
            const { error } = await supabase
                .from('contact_tickets')
                .update({
                    status: replyStatus,
                    admin_response: replyText,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedTicket.id);

            if (error) throw error;

            alert('บันทึกการตอบกลับเรียบร้อยแล้ว');
            setSelectedTicket(null);
            fetchTickets();
        } catch (error) {
            console.error('Error replying to ticket:', error);
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setSubmitting(false);
        }
    };

    const openTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setReplyText(ticket.admin_response || '');
        setReplyStatus(ticket.status === 'pending' ? 'resolved' : ticket.status);
    };

    const filteredTickets = tickets.filter(ticket => {
        const searchLower = searchQuery.toLowerCase();
        const subject = ticket.subject_type === 'other' ? ticket.custom_subject : SUBJECT_LABELS[ticket.subject_type];
        return (
            subject?.toLowerCase().includes(searchLower) ||
            ticket.description.toLowerCase().includes(searchLower) ||
            ticket.profiles?.email?.toLowerCase().includes(searchLower) ||
            ticket.contact_number.includes(searchQuery)
        );
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">รอตรวจสอบ</Badge>;
            case 'in_progress':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">กำลังดำเนินการ</Badge>;
            case 'resolved':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">แก้ไขแล้ว</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">ปฏิเสธ</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">รายการติดต่อ (Support Tickets)</h1>
                    <p className="text-gray-500">จัดการคำร้องเรียนและปัญหาการใช้งาน</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="ค้นหา..."
                            className="pl-9 w-full sm:w-[250px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="สถานะ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            <SelectItem value="pending">รอตรวจสอบ</SelectItem>
                            <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                            <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
                            <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">วันที่แจ้ง</th>
                                    <th className="px-6 py-3">หัวข้อ</th>
                                    <th className="px-6 py-3">ผู้แจ้ง</th>
                                    <th className="px-6 py-3">สถานะ</th>
                                    <th className="px-6 py-3 text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                                        </td>
                                    </tr>
                                ) : filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            ไม่พบรายการติดต่อ
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((ticket) => (
                                        <tr key={ticket.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {new Date(ticket.created_at).toLocaleString('th-TH')}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {ticket.subject_type === 'other' ? ticket.custom_subject : SUBJECT_LABELS[ticket.subject_type]}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ticket.profiles?.email || 'Unknown'}</span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {ticket.contact_number}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(ticket.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="outline" onClick={() => openTicket(ticket)}>
                                                    ตรวจสอบ
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Reply Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>รายละเอียดการติดต่อ</DialogTitle>
                        <DialogDescription>
                            Ticket ID: {selectedTicket?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTicket && (
                        <div className="grid md:grid-cols-2 gap-6 py-4">
                            {/* Left: User Request */}
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                                        <User className="w-4 h-4" /> ข้อมูลผู้แจ้ง
                                    </h3>
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-gray-500">Email:</span> {selectedTicket.profiles?.email}</p>
                                        <p><span className="text-gray-500">เบอร์โทร:</span> {selectedTicket.contact_number}</p>
                                        <p><span className="text-gray-500">วันที่:</span> {new Date(selectedTicket.created_at).toLocaleString('th-TH')}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold">หัวข้อ: {selectedTicket.subject_type === 'other' ? selectedTicket.custom_subject : SUBJECT_LABELS[selectedTicket.subject_type]}</h3>
                                    <div className="bg-white border rounded-lg p-3 text-sm min-h-[100px] whitespace-pre-wrap">
                                        {selectedTicket.description}
                                    </div>
                                </div>

                                {selectedTicket.images && selectedTicket.images.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2 text-sm">รูปภาพแนบ ({selectedTicket.images.length})</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedTicket.images.map((url, idx) => (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded border overflow-hidden hover:opacity-80">
                                                    <Image src={url} alt="Attachment" fill className="object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Admin Action */}
                            <div className="space-y-4 border-l pl-0 md:pl-6">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> การดำเนินการ
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">สถานะ</label>
                                    <Select value={replyStatus} onValueChange={setReplyStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">รอตรวจสอบ</SelectItem>
                                            <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                                            <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
                                            <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">ข้อความตอบกลับ (ส่งถึงผู้ใช้)</label>
                                    <Textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="พิมพ์ข้อความตอบกลับ..."
                                        className="min-h-[200px]"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setSelectedTicket(null)}>ยกเลิก</Button>
                                    <Button onClick={handleReply} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                        บันทึกและตอบกลับ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
