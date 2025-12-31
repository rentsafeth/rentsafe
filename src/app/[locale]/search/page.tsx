import SearchResults from '@/components/features/search/SearchResults';
import { Suspense } from 'react';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const isThai = locale === 'th';

    return {
        title: isThai ? 'ค้นหาร้านรถเช่า & ตรวจสอบ Blacklist' : 'Search Car Rental & Check Blacklist',
        description: isThai
            ? 'ค้นหาร้านรถเช่าที่น่าเชื่อถือ ตรวจสอบประวัติ blacklist ก่อนเช่ารถ ปลอดภัยจากมิจฉาชีพ'
            : 'Search trusted car rental shops, check blacklist history before renting. Stay safe from fraud.',
        openGraph: {
            title: isThai ? 'ค้นหาร้านรถเช่า & ตรวจสอบ Blacklist | RentSafe' : 'Search Car Rental & Check Blacklist | RentSafe',
            description: isThai
                ? 'ค้นหาร้านรถเช่าที่น่าเชื่อถือ ตรวจสอบประวัติ blacklist ก่อนเช่ารถ'
                : 'Search trusted car rental shops, check blacklist history before renting.',
        },
    };
}

export default function SearchPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Suspense fallback={<div>Loading...</div>}>
                <SearchResults />
            </Suspense>
        </div>
    );
}
