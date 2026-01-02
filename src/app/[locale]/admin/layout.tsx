import AdminSidebar from '@/components/features/admin/AdminSidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlertProvider } from '@/components/ui/alert-modal';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check for admin role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        redirect('/');
    }

    return (
        <AlertProvider>
            <div className="flex min-h-screen bg-slate-100">
                <AdminSidebar />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </AlertProvider>
    );
}
