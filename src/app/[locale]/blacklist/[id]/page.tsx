import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BlacklistDetail from '@/components/features/blacklist/BlacklistDetail'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
    const { locale, id } = await params
    const supabase = await createClient()

    const { data: entry } = await supabase
        .from('blacklist_entries')
        .select('shop_names, bank_account_no, total_reports, total_amount_lost, phone_numbers')
        .eq('id', id)
        .single()

    const shopName = entry?.shop_names?.[0] || (locale === 'th' ? 'ไม่ทราบชื่อ' : 'Unknown')
    const isThai = locale === 'th'

    // Create a descriptive title
    const pageTitle = isThai
        ? `พบBlacklist ${shopName} | RentSafe`
        : `Found Blacklist: ${shopName} | RentSafe`

    // Create a detailed description
    const reportCount = entry?.total_reports || 0
    const totalLoss = entry?.total_amount_lost || 0
    const formattedLoss = new Intl.NumberFormat('th-TH').format(totalLoss)

    const description = isThai
        ? `⚠️ ${shopName} ถูกรายงาน ${reportCount} ครั้ง มูลค่าความเสียหายรวม ฿${formattedLoss} - ตรวจสอบก่อนโอนเงิน!`
        : `⚠️ ${shopName} reported ${reportCount} times. Total loss: ฿${formattedLoss} - Verify before transfer!`

    const url = `https://www.rentsafe.in.th/${locale}/blacklist/${id}`

    return {
        title: pageTitle,
        description: description,
        openGraph: {
            title: pageTitle,
            description: description,
            url: url,
            siteName: 'RentSafe',
            type: 'article',
            locale: locale === 'th' ? 'th_TH' : 'en_US',
            images: [
                {
                    url: 'https://www.rentsafe.in.th/og-blacklist.png',
                    width: 1200,
                    height: 630,
                    alt: isThai ? `Blacklist: ${shopName}` : `Blacklist: ${shopName}`,
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: pageTitle,
            description: description,
            images: ['https://www.rentsafe.in.th/og-blacklist.png'],
        },
    }
}

export default async function BlacklistDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params
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
            manual_facebook_url,
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
            <BlacklistDetail entry={entry} reports={reports || []} locale={locale} />
        </div>
    )
}
