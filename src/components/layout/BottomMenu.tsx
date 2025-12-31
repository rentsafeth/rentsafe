import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Home, Search, ShieldAlert, User } from 'lucide-react';

export default function BottomMenu() {
    const t = useTranslations('Common');

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                <Link href="/" className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 p-2">
                    <Home className="h-6 w-6" />
                    <span className="text-xs font-medium">Home</span>
                </Link>
                <Link href="/search" className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 p-2">
                    <Search className="h-6 w-6" />
                    <span className="text-xs font-medium">{t('search')}</span>
                </Link>
                <Link href="/report" className="flex flex-col items-center gap-1 text-slate-600 hover:text-red-600 p-2">
                    <ShieldAlert className="h-6 w-6" />
                    <span className="text-xs font-medium">{t('report')}</span>
                </Link>
                <Link href="/profile" className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 p-2">
                    <User className="h-6 w-6" />
                    <span className="text-xs font-medium">Profile</span>
                </Link>
            </div>
        </div>
    );
}
