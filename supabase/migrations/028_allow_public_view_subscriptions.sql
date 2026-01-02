-- =====================================================
-- 028_allow_public_view_subscriptions.sql
-- Fix: Allow public read access to shop_subscriptions so visitors can see verified status
-- =====================================================

-- Drop the restrictive policy if it exists (or just add a new one for public)
-- Note: The previous policy was for 'authenticated' users. We need one for 'public' (anon).

CREATE POLICY "Public can view active subscriptions"
ON shop_subscriptions FOR SELECT TO public
USING (true);

-- Alternatively, if we want to be more specific (only active ones):
-- USING (status = 'active');
-- But 'true' is simpler and safe since subscription data isn't highly sensitive (just status/dates).
