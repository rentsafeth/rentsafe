import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'RentSafe - ตรวจสอบร้านเช่ารถ',
        short_name: 'RentSafe',
        description: 'ระบบตรวจสอบร้านเช่ารถที่น่าเชื่อถือ ปกป้องคุณจากการโกง',
        start_url: '/th',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        orientation: 'portrait',
        icons: [
            {
                src: '/icon',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/icon-192',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-512',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
