'use client';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShieldAlert, LogOut, Settings, CheckCircle, MessageSquare, GitMerge, Trash2, Coins, CreditCard, Megaphone, Bell, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const menuItems = [
    { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/admin/shops', label: 'อนุมัติร้านค้า', icon: CheckCircle },
    { href: '/admin/shops/manage', label: 'จัดการร้านค้า', icon: Settings },
    { href: '/admin/reports', label: 'ตรวจสอบรายงาน', icon: ShieldAlert },
    { href: '/admin/reports/deletion-requests', label: 'คำขอลบรายงาน', icon: Trash2 },
    { href: '/admin/reviews', label: 'จัดการรีวิว', icon: MessageSquare },
    { href: '/admin/credits', label: 'จัดการเครดิต', icon: Coins },
    { href: '/admin/ads', label: 'จัดการโฆษณา', icon: Megaphone },
    { href: '/admin/notifications', label: 'แจ้งเตือน', icon: Bell },
    { href: '/admin/contact', label: 'รายการติดต่อ', icon: MessageSquare },
    { href: '/admin/users', label: 'จัดการผู้ใช้', icon: Users },
    { href: '/admin/blacklist-merge', label: 'Merge Blacklist', icon: GitMerge },
];

import { useAlert } from '@/components/ui/alert-modal';

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const { showConfirm } = useAlert();
    const [stats, setStats] = useState({
        pendingShops: 0,
        pendingReports: 0,
        pendingDeletions: 0,
        pendingReviews: 0,
        pendingCredits: 0,
        pendingTickets: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                const data = await res.json();
                if (!data.error) {
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats');
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        showConfirm(
            'คุณต้องการออกจากระบบใช่หรือไม่?',
            async () => {
                await supabase.auth.signOut();
                router.push('/login');
            },
            'ยืนยันการออกจากระบบ'
        );
    };

    return (
        <div className="hidden md:flex w-64 bg-slate-900 text-white min-h-screen p-4 flex-col overflow-y-auto">
            <div className="mb-8 px-2">
                <h1 className="text-2xl font-bold">RentSafe Admin</h1>
                <p className="text-slate-400 text-sm">Management Console</p>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    // Remove locale prefix for comparison
                    const pathWithoutLocale = pathname.replace(/^\/(th|en)/, '');
                    const isActive = pathWithoutLocale === item.href ||
                        (item.href !== '/admin' && pathWithoutLocale.startsWith(item.href) && !menuItems.some(m => m.href !== item.href && pathWithoutLocale.startsWith(m.href) && m.href.length > item.href.length));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-lg transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </div>
                            {(() => {
                                let count = 0;
                                if (item.href === '/admin/shops') count = stats.pendingShops;
                                else if (item.href === '/admin/reports') count = stats.pendingReports;
                                else if (item.href === '/admin/reports/deletion-requests') count = stats.pendingDeletions;
                                else if (item.href === '/admin/reviews') count = stats.pendingReviews;
                                else if (item.href === '/admin/credits') count = stats.pendingCredits;
                                else if (item.href === '/admin/contact') count = stats.pendingTickets;

                                return count > 0 ? (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                        {count}
                                    </span>
                                ) : null;
                            })()}
                        </Link>
                    );
                })}
            </nav>

            <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 mt-auto"
            >
                <LogOut className="w-5 h-5" />
                ออกจากระบบ
            </button>
        </div>
    );
}
