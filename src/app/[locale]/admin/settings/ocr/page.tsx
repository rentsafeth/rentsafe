'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Activity, CheckCircle, XCircle, Clock, Key } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface OcrLog {
    id: string;
    created_at: string;
    status: 'success' | 'error';
    latency_ms: number;
    error_message?: string;
    provider: string;
}

export default function OcrSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [logs, setLogs] = useState<OcrLog[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        success: 0,
        error: 0,
        avgLatency: 0
    });

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Setting
            const { data: setting } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'gemini_api_key')
                .single();

            if (setting) {
                setApiKey(setting.value);
            }

            // 2. Fetch Logs
            const { data: logData, error: logError } = await supabase
                .from('ocr_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (logData) {
                setLogs(logData);

                // Calculate Stats (Client-side for simplicity on last 50, strictly we should use count query)
                // Let's do a simple count query for total stats if needed, but for now this is okay for glimpse
                const total = logData.length;
                const success = logData.filter(l => l.status === 'success').length;
                const error = total - success;
                const avgLatency = total > 0
                    ? Math.round(logData.reduce((acc, curr) => acc + (curr.latency_ms || 0), 0) / total)
                    : 0;

                setStats({ total, success, error, avgLatency });
            }

        } catch (error) {
            console.error('Error loading OCR settings:', error);
            toast.error('โหลดข้อมูลไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveKey = async () => {
        if (!apiKey.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'gemini_api_key',
                    value: apiKey.trim(),
                    description: 'Google Gemini API Key for OCR service',
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast.success('บันทึก API Key เรียบร้อยแล้ว');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('บันทึกไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ตั้งค่า OCR AI (Gemini)</h1>
                    <p className="text-muted-foreground">จัดการ API Key และดูสถิติการใช้งานระบบสแกนบัตร</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* API Key Setting */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-yellow-500" />
                            API Configuration
                        </CardTitle>
                        <CardDescription>
                            ตั้งค่า Google Gemini API Key
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Gemini API Key</label>
                            <Input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIza..."
                            />
                        </div>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={handleSaveKey}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            บันทึกการตั้งค่า
                        </Button>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Statistics (Last 50 requests)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                                <div className="text-xs text-gray-500">Total Requests</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                                <div className="text-xs text-green-600">Successful</div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100">
                                <div className="text-2xl font-bold text-red-600">{stats.error}</div>
                                <div className="text-xs text-red-600">Failed</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                                <div className="text-2xl font-bold text-blue-600">{stats.avgLatency}ms</div>
                                <div className="text-xs text-blue-600">Avg. Latency</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="divide-x divide-gray-200">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Time</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Latency</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Message / Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                            No logs found
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                                {format(new Date(log.created_at), 'dd MMM HH:mm:ss', { locale: th })}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.status === 'success' ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Success
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none shadow-none">
                                                        <XCircle className="w-3 h-3 mr-1" /> Error
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 font-mono">
                                                {log.latency_ms}ms
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 truncate max-w-xs">
                                                {log.error_message || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
