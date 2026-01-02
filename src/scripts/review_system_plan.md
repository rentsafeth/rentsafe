# Implementation Plan: Advanced Shop Review System

## 1. Database Schema Updates (Supabase)
We need to modify the `reviews` table and create new tables for likes and disputes.

### SQL to Run (User will run this)
```sql
-- Check current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews';

-- Proposed Changes (Do not run yet, just for planning)
/*
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending', -- pending, approved, rejected, hidden
ADD COLUMN IF NOT EXISTS comment TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS evidence_urls TEXT[],
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS review_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, ip_address) -- Prevent multiple likes from same IP
);

CREATE TABLE IF NOT EXISTS review_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, resolved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW()
);
*/
```

## 2. Frontend Components
- **`ReviewFormModal.tsx`**: 
    - Rating input (Stars)
    - Comment textarea
    - Image upload (Max 5, preview)
    - Terms checkbox ("I accept responsibility...")
    - Submit button
- **`ReviewList.tsx`**:
    - Display reviews with "Joh***" masking.
    - "Verified Rental" badge (if we can link to a booking, otherwise just "Review").
    - Like button with counter.
    - "View Evidence" button (opens lightbox/modal).
    - "Dispute" button (visible only to Shop Owner).
- **`ShopProfilePage` Update**:
    - Integrate `ReviewList` and `WriteReviewButton`.

## 3. Backend / API
- **`POST /api/reviews`**: Handle submission, file upload (to `review-evidence` bucket), IP recording.
- **`POST /api/reviews/like`**: Handle liking logic, IP check, increment counter.
- **`POST /api/reviews/dispute`**: Handle dispute submission.

## 4. Admin Dashboard
- **`AdminReviewsPage`**: List pending reviews for approval.
- **`AdminDisputesPage`**: List disputes for resolution.

## 5. Storage
- Create new public bucket `review-evidence`.
