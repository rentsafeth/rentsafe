import SearchResults from '@/components/features/search/SearchResults';
import { Suspense } from 'react';

export default function SearchPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Suspense fallback={<div>Loading...</div>}>
                <SearchResults />
            </Suspense>
        </div>
    );
}
