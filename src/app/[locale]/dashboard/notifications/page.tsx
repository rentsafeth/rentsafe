'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    ShieldAlert,
    CreditCard,
    Clock,
    Loader2,
    Check,
    Crown,
    XCircle,
    Info,
    Gift,
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
    id: string;
    shop_id: string;
    type: string;
    title: string;
    message: string;
    data: Record<string, any> | null;
    is_read: boolean;
    created_at: string;
}

const NOTIFICATION_ICONS: Record<string, any> = {
    blacklist_new: ShieldAlert,
    blacklist_approved: CheckCircle,
    blacklist_rejected: XCircle,
    subscription: Crown,
    subscription_expired: AlertTriangle,
    subscription_expiring: Clock,
    payment: CreditCard,
    warning: AlertTriangle,
    info: Info,
    welcome_bonus: Gift,
};

const NOTIFICATION_COLORS: Record<string, string> = {
    blacklist_new: 'text-red-600 bg-red-100',
    blacklist_approved: 'text-green-600 bg-green-100',
    blacklist_rejected: 'text-red-600 bg-red-100',
    subscription: 'text-yellow-600 bg-yellow-100',
    subscription_expired: 'text-red-600 bg-red-100',
    subscription_expiring: 'text-orange-600 bg-orange-100',
    payment: 'text-green-600 bg-green-100',
    warning: 'text-orange-600 bg-orange-100',
    info: 'text-blue-600 bg-blue-100',
    welcome_bonus: 'text-pink-600 bg-pink-100',
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [markingRead, setMarkingRead] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await fetch('/api/notifications?limit=50');
            const data = await response.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_ids: [notificationId] }),
            });

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            // Dispatch event to update global badge
            window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        setMarkingRead(true);
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_all: true }),
            });

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            // Dispatch event to update global badge
            window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setMarkingRead(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'เมื่อสักครู่';
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getNotificationLink = (notification: Notification): string | null => {
        switch (notification.type) {
            case 'blacklist_new':
            case 'blacklist_approved':
            case 'blacklist_rejected':
                return '/dashboard/blacklist';
            case 'subscription':
            case 'subscription_expired':
            case 'subscription_expiring':
                return '/dashboard/subscription';
            case 'welcome_bonus':
                return '/dashboard/credits';
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Bell className="w-8 h-8 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
                            {unreadCount > 0 && (
                                <Badge className="bg-red-500 text-white">
                                    {unreadCount} ใหม่
                                </Badge>
                            )}
                        </div>
                        <p className="text-gray-600">การแจ้งเตือนทั้งหมดสำหรับร้านของคุณ</p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            disabled={markingRead}
                        >
                            {markingRead ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4 mr-2" />
                            )}
                            อ่านทั้งหมด
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>ยังไม่มีการแจ้งเตือน</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((notification) => {
                                    const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                                    const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-600 bg-gray-100';
                                    const link = getNotificationLink(notification);

                                    const content = (
                                        <div
                                            className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/50' : ''
                                                }`}
                                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                                        {formatDate(notification.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                {!notification.is_read && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                        <span className="text-xs text-blue-600">ยังไม่ได้อ่าน</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );

                                    if (link) {
                                        return (
                                            <Link key={notification.id} href={link}>
                                                {content}
                                            </Link>
                                        );
                                    }

                                    return <div key={notification.id}>{content}</div>;
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
