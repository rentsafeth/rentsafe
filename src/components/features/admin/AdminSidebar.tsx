'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, ShieldAlert, LogOut, Settings, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const menuItems = [
    { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/admin/shops', label: 'อนุมัติร้านค้า', icon: CheckCircle },
    { href: '/admin/shops/manage', label: 'จัดการร้านค้า', icon: Settings },
    { href: '/admin/reports', label: 'ตรวจสอบรายงาน', icon: ShieldAlert },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
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
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
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
