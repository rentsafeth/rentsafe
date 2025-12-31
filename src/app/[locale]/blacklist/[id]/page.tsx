import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BlacklistDetail from '@/components/features/blacklist/BlacklistDetail'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
    const { locale, id } = await params
    const t = await getTranslations({ locale, namespace: 'BlacklistPage' })
    const supabase = await createClient()

    const { data: entry } = await supabase
        .from('blacklist_entries')
        .select('shop_names, bank_account_no')
        .eq('id', id)
        .single()

    const shopName = entry?.shop_names?.[0] || 'Unknown'

    return {
        title: `${t('title')} - ${shopName}`,
        description: t('metaDescription', { shopName }),
    }
}

export default async function BlacklistDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params
    const t = await getTranslations({ locale, namespace: 'BlacklistPage' })
    const supabase = await createClient()

    // Fetch blacklist entry
    const { data: entry, error: entryError } = await supabase
        .from('blacklist_entries')
        .select('*')
        .eq('id', id)
        .single()

    if (entryError || !entry) {
        notFound()
    }

    // Fetch all approved reports for this blacklist entry
    const { data: reports } = await supabase
        .from('reports')
        .select(`
            id,
            reporter_id,
            manual_shop_name,
            manual_shop_contact,
            manual_bank_account,
            description,
            evidence_urls,
            incident_date,
            amount_lost,
            created_at,
            profiles:reporter_id (
                full_name,
                avatar_url
            )
        `)
        .eq('blacklist_entry_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <BlacklistDetail entry={entry} reports={reports || []} />
        </div>
    )
}
