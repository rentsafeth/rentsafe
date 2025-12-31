import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://rentsafe.in.th'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient()

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: `${BASE_URL}/th`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/en`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/th/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/en/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/th/report`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/en/report`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/th/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/en/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/th/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/en/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/th/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/en/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/th/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/en/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]

    // Dynamic shop pages
    const { data: shops } = await supabase
        .from('shops')
        .select('id, updated_at')
        .eq('verification_status', 'verified')
        .eq('is_active', true)

    const shopPages: MetadataRoute.Sitemap = shops?.flatMap(shop => [
        {
            url: `${BASE_URL}/th/shop/${shop.id}`,
            lastModified: new Date(shop.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/en/shop/${shop.id}`,
            lastModified: new Date(shop.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
    ]) || []

    // Dynamic blacklist pages
    const { data: blacklistEntries } = await supabase
        .from('blacklist_entries')
        .select('id, updated_at')

    const blacklistPages: MetadataRoute.Sitemap = blacklistEntries?.flatMap(entry => [
        {
            url: `${BASE_URL}/th/blacklist/${entry.id}`,
            lastModified: new Date(entry.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/en/blacklist/${entry.id}`,
            lastModified: new Date(entry.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        },
    ]) || []

    return [...staticPages, ...shopPages, ...blacklistPages]
}
