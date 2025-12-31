'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateShopStatus(shopId: string, status: 'verified' | 'rejected'): Promise<void> {
    console.log('[Server Action] updateShopStatus called with:', { shopId, status });

    const supabase = await createClient();
    console.log('[Server Action] Supabase client created');

    const { data, error } = await supabase.from('shops').update({
        verification_status: status,
        verified_at: status === 'verified' ? new Date().toISOString() : null
    }).eq('id', shopId).select();

    console.log('[Server Action] Update result:', { data, error });

    if (error) {
        console.error('[Server Action] Update status error:', error);
        throw new Error(error.message);
    }

    // Revalidate all locales
    console.log('[Server Action] Revalidating paths...');
    revalidatePath('/th/admin/shops');
    revalidatePath('/en/admin/shops');
    console.log('[Server Action] Done!');
}
