'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, Send, Info, AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    target_group: 'all' | 'users' | 'shop_owners';
    created_at: string;
}

export default function AdminNotificationsPage() {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
    const [targetGroup, setTargetGroup] = useState<'all' | 'users' | 'shop_owners'>('all');

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('ไม่สามารถดึงข้อมูลการแจ้งเตือนได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('admin_notifications')
                .insert({
                    title,
                    message,
                    type,
                    target_group: targetGroup
                });

            if (error) throw error;

            toast.success('สร้างประกาศแจ้งเตือนสำเร็จ');
            setTitle('');
            setMessage('');
            setType('info');
            setTargetGroup('all');
            fetchNotifications();
        } catch (error) {
            console.error('Error creating notification:', error);
            toast.error('เกิดข้อผิดพลาดในการสร้างประกาศ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('คุณต้องการลบประกาศนี้ใช่หรือไม่?')) return;

        try {
            const { error } = await supabase
                .from('admin_notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('ลบประกาศสำเร็จ');
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('เกิดข้อผิดพลาดในการลบ');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const getTargetLabel = (target: string) => {
        switch (target) {
            case 'users': return 'ผู้ใช้ทั่วไป';
            case 'shop_owners': return 'ร้านค้า';
            default: return 'ทุกคน';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">แจ้งเตือน (Notifications)</h1>
                    <p className="text-gray-500">จัดการประกาศและการแจ้งเตือนในระบบ</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Create Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Send className="w-5 h-5" /> สร้างประกาศใหม่
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">หัวข้อ</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="เช่น แจ้งปิดปรับปรุงระบบ"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">ข้อความ</label>
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="รายละเอียดประกาศ..."
                                    className="min-h-[100px]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">ประเภท</label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="success">Success</SelectItem>
                                            <SelectItem value="error">Error</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">ส่งถึง</label>
                                    <Select value={targetGroup} onValueChange={(v: any) => setTargetGroup(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">ทุกคน</SelectItem>
                                            <SelectItem value="users">ผู้ใช้ทั่วไป</SelectItem>
                                            <SelectItem value="shop_owners">ร้านค้า</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                ส่งประกาศ
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* History List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="w-5 h-5" /> ประวัติการประกาศ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                ยังไม่มีประวัติการประกาศ
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 p-2 rounded-full bg-slate-100`}>
                                                {getTypeIcon(item.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    {item.title}
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        {getTargetLabel(item.target_group)}
                                                    </Badge>
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.message}</p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(item.created_at).toLocaleString('th-TH')}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
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
