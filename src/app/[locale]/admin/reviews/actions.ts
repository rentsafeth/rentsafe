'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateReviewStatus(reviewId: string, status: 'approved' | 'rejected') {
    const supabase = await createClient();
    const { error } = await supabase
        .from('reviews')
        .update({ status })
        .eq('id', reviewId);

    if (error) {
        console.error('Error updating review status:', error);
        throw error;
    }

    revalidatePath('/[locale]/admin/reviews', 'page');
}

export async function handleDisputeAction(disputeId: string, action: 'keep_review' | 'delete_review', relatedReviewId?: string) {
    const supabase = await createClient();

    if (action === 'delete_review' && relatedReviewId) {
        // Mark review as rejected
        const { error: reviewError } = await supabase
            .from('reviews')
            .update({ status: 'rejected' })
            .eq('id', relatedReviewId);
        if (reviewError) throw reviewError;

        // Resolve dispute
        const { error: disputeError } = await supabase
            .from('review_disputes')
            .update({ status: 'resolved' })
            .eq('id', disputeId);
        if (disputeError) throw disputeError;
    } else {
        // Dismiss dispute
        const { error: disputeError } = await supabase
            .from('review_disputes')
            .update({ status: 'dismissed' })
            .eq('id', disputeId);
        if (disputeError) throw disputeError;
    }

    revalidatePath('/[locale]/admin/reviews', 'page');
}
