-- ============================================================
-- 013: ADDITIONAL SCHEMA UPDATES
-- For: Upload evidence, Notifications, Subscription plans
-- ============================================================

-- 1. ADD SUBSCRIPTION PLANS USED IN THE SYSTEM
-- The current system uses these plan slugs
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, features, duration_days) VALUES
('ร้านรับรอง รายเดือน', 'verified-monthly', 199, 0, '{"blacklist_search_per_day": -1, "show_contact_buttons": true, "is_verified": true, "search_ranking_boost": 300}', 30),
('ร้านรับรอง รายไตรมาส', 'verified-quarterly', 499, 0, '{"blacklist_search_per_day": -1, "show_contact_buttons": true, "is_verified": true, "search_ranking_boost": 300}', 90),
('ร้านรับรอง รายปี', 'verified-yearly', 1499, 0, '{"blacklist_search_per_day": -1, "show_contact_buttons": true, "is_verified": true, "search_ranking_boost": 300}', 365)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    features = EXCLUDED.features,
    duration_days = EXCLUDED.duration_days;

-- 2. ADD POLICY FOR UPDATING NOTIFICATIONS (mark as read)
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications"
ON notifications FOR UPDATE TO authenticated
USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
)
WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- 3. ADD DATA COLUMN TO NOTIFICATIONS IF NOT EXISTS
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- 4. UPDATE is_shop_pro FUNCTION TO CHECK is_verified_shop COLUMN
CREATE OR REPLACE FUNCTION is_shop_pro(p_shop_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- First check the quick flag
    IF EXISTS (SELECT 1 FROM shops WHERE id = p_shop_id AND is_verified_shop = true) THEN
        RETURN true;
    END IF;

    -- Then check active subscription
    RETURN EXISTS (
        SELECT 1 FROM shop_subscriptions ss
        WHERE ss.shop_id = p_shop_id
        AND ss.status = 'active'
        AND (ss.ends_at IS NULL OR ss.ends_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ADD ADMIN POLICIES FOR BLACKLIST MANAGEMENT
DROP POLICY IF EXISTS "Admins can update blacklist reports" ON customer_blacklist;
CREATE POLICY "Admins can update blacklist reports"
ON customer_blacklist FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can view all blacklist reports" ON customer_blacklist;
CREATE POLICY "Admins can view all blacklist reports"
ON customer_blacklist FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. ADD ADMIN POLICIES FOR PAYMENT MANAGEMENT
DROP POLICY IF EXISTS "Admins can view all payments" ON payment_transactions;
CREATE POLICY "Admins can view all payments"
ON payment_transactions FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update payments" ON payment_transactions;
CREATE POLICY "Admins can update payments"
ON payment_transactions FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. ADD ADMIN POLICIES FOR SUBSCRIPTION MANAGEMENT
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON shop_subscriptions;
CREATE POLICY "Admins can manage subscriptions"
ON shop_subscriptions FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. ADD POLICY FOR INSERTING NOTIFICATIONS (for API routes)
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET SETUP (Run in Supabase Dashboard > Storage)
-- ============================================================
-- Create bucket: blacklist-evidence
-- Settings:
--   - Public: true (for displaying images)
--   - File size limit: 5MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Then add these policies:
--
-- Policy name: "Authenticated users can upload evidence"
-- Allowed operation: INSERT
-- Target roles: authenticated
-- Policy definition: (bucket_id = 'blacklist-evidence'::text)
--
-- Policy name: "Public can view evidence"
-- Allowed operation: SELECT
-- Target roles: public
-- Policy definition: (bucket_id = 'blacklist-evidence'::text)
--
-- Policy name: "Users can delete their own evidence"
-- Allowed operation: DELETE
-- Target roles: authenticated
-- Policy definition: (bucket_id = 'blacklist-evidence'::text AND (storage.foldername(name))[1] = 'evidence')
-- ============================================================

-- 9. CRON SECRET REMINDER
-- Add CRON_SECRET to your .env file:
-- CRON_SECRET=your-random-secure-string-here
--
-- Then set up a cron job (e.g., Vercel Cron or GitHub Actions) to call:
-- GET /api/cron/check-subscriptions
-- With header: Authorization: Bearer your-random-secure-string-here
-- Schedule: Daily at midnight (0 0 * * *)

-- ============================================================
-- DONE!
-- ============================================================
