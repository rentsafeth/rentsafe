import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://rentsafe.in.th'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/dashboard/',
                    '/admin/',
                    '/profile/',
                    '/register/',
                    '/login/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
