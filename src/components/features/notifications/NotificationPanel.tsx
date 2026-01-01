'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, X, CheckCircle, AlertTriangle, Info, ShieldAlert, Crown, ChevronRight, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'announcement' | 'warning' | 'blacklist_new' | 'subscription' | 'system' | 'welcome_bonus';
    severity: 'info' | 'warning' | 'danger' | 'success';
    action_url?: string;
    action_label?: string;
    is_read: boolean;
    created_at: string;
    metadata?: Record<string, any>;
}

const typeConfig = {
    announcement: {
        icon: Info,
        label: 'ประกาศ',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-500',
    },
    warning: {
        icon: AlertTriangle,
        label: 'คำเตือน',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-500',
    },
    blacklist_new: {
        icon: ShieldAlert,
        label: 'Blacklist ใหม่',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-500',
    },
    subscription: {
        icon: Crown,
        label: 'Subscription',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        iconColor: 'text-purple-500',
    },
    system: {
        icon: Info,
        label: 'ระบบ',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-500',
    },
    welcome_bonus: {
        icon: Gift,
        label: 'ของขวัญ',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        iconColor: 'text-pink-500',
    },
};

const severityColors = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
};

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;

    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

interface NotificationPanelProps {
    maxItems?: number;
    showViewAll?: boolean;
}

export default function NotificationPanel({ maxItems = 5, showViewAll = true }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showAllModal, setShowAllModal] = useState(false);
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [loadingAll, setLoadingAll] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await fetch(`/api/notifications?limit=${maxItems}`);
            const data = await response.json();

            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAllNotifications = async () => {
        setLoadingAll(true);
        try {
            const response = await fetch('/api/notifications?limit=50');
            const data = await response.json();

            if (data.notifications) {
                setAllNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error loading all notifications:', error);
        } finally {
            setLoadingAll(false);
        }
    };

    const markAsRead = async (notificationIds?: string[]) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    notificationIds
                        ? { notification_ids: notificationIds }
                        : { mark_all: true }
                ),
            });

            // Refresh notifications
            loadNotifications();
            if (showAllModal) {
                loadAllNotifications();
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleViewAll = () => {
        setShowAllModal(true);
        loadAllNotifications();
    };

    const NotificationItem = ({ notification, compact = false }: { notification: Notification; compact?: boolean }) => {
        const config = typeConfig[notification.type] || typeConfig.system;
        const Icon = config.icon;

        return (
            <div
                className={`p-3 rounded-lg border transition-all ${config.bgColor} ${config.borderColor} ${!notification.is_read ? 'ring-2 ring-blue-300' : ''
                    }`}
                onClick={() => {
                    if (!notification.is_read) {
                        markAsRead([notification.id]);
                    }
                }}
            >
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${config.bgColor}`}>
                        <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${severityColors[notification.severity]}`}>
                                {config.label}
                            </Badge>
                            {!notification.is_read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                                {formatTimeAgo(notification.created_at)}
                            </span>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                        {!compact && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                        )}
                        {notification.action_url && (
                            <Link
                                href={notification.action_url}
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                            >
                                {notification.action_label || 'ดูรายละเอียด'}
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
                        {unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead()}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            อ่านทั้งหมด
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Bell className="w-12 h-12 mb-3 opacity-50" />
                            <p>ไม่มีการแจ้งเตือน</p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-2">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {showViewAll && notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={handleViewAll}
                        >
                            ดูทั้งหมด
                        </Button>
                    </div>
                )}
            </div>

            {/* All Notifications Modal */}
            <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            การแจ้งเตือนทั้งหมด
                        </DialogTitle>
                        <DialogDescription>
                            รายการแจ้งเตือนทั้งหมดของคุณ
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {loadingAll ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : allNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Bell className="w-12 h-12 mb-3 opacity-50" />
                                <p>ไม่มีการแจ้งเตือน</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {allNotifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
