import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import ReportForm from '@/components/features/report/ReportForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ReportPage' });

    return {
        title: `RentSafe - ${t('title')}`,
        description: t('description'),
    };
}

export default async function ReportPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ReportPage' });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?next=/report');
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('title')}</h1>
                <p className="text-slate-600">
                    {t('description')}
                </p>
            </div>

            <ReportForm userId={user.id} />
        </div>
    );
}
