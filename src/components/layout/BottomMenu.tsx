'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Search, ShieldAlert, User } from 'lucide-react';

export default function BottomMenu() {
    const t = useTranslations('Common');
    const pathname = usePathname();

    // Remove locale prefix for matching
    const pathWithoutLocale = pathname.replace(/^\/(th|en)/, '') || '/';

    const menuItems = [
        { href: '/', icon: Home, label: 'Home', matchPaths: ['/'] },
        { href: '/search', icon: Search, label: t('search'), matchPaths: ['/search'] },
        { href: '/report', icon: ShieldAlert, label: t('report'), matchPaths: ['/report'] },
        { href: '/profile', icon: User, label: 'Profile', matchPaths: ['/profile', '/dashboard'] },
    ];

    const isActive = (matchPaths: string[]) => {
        return matchPaths.some(path => {
            if (path === '/') return pathWithoutLocale === '/';
            return pathWithoutLocale.startsWith(path);
        });
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {menuItems.map((item) => {
                    const active = isActive(item.matchPaths);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                                active
                                    ? 'text-blue-600'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Icon className={`h-6 w-6 ${active ? 'stroke-[2.5]' : ''}`} />
                            <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
