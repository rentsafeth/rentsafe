import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If logged in, redirect to dashboard
    if (user) {
        redirect(`/${locale}/dashboard`);
    }

    // If not logged in, show login prompt
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        RentSafe
                    </h1>
                    <p className="text-gray-600 mb-8">
                        กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์และจัดการร้านค้าของคุณ
                    </p>

                    <div className="space-y-3">
                        <Link href={`/${locale}/login?next=/dashboard`} className="block">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <LogIn className="w-4 h-4 mr-2" />
                                เข้าสู่ระบบ
                            </Button>
                        </Link>

                        <Link href={`/${locale}/register`} className="block">
                            <Button variant="outline" className="w-full">
                                <UserPlus className="w-4 h-4 mr-2" />
                                สมัครสมาชิก
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <Link href={`/${locale}`} className="text-sm text-gray-500 hover:text-gray-700">
                            กลับหน้าหลัก
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
