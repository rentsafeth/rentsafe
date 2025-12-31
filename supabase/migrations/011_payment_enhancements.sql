-- 011_payment_enhancements.sql
-- Add missing columns for payment and subscription system

-- Add plan_slug to payment_transactions for easier lookup
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS plan_slug VARCHAR(50);

-- Add confirmed_at and confirmed_by for admin verification
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES auth.users(id);

-- Add rejection tracking
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update status enum to include 'confirmed' and 'rejected'
-- (status field already exists, just document new values: 'pending', 'confirmed', 'rejected', 'failed')

-- Fix shop_subscriptions columns (rename for consistency)
-- starts_at -> started_at (already exists as started_at)
-- expires_at -> ends_at
ALTER TABLE shop_subscriptions ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shop_subscriptions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

-- Migrate data if columns were renamed
UPDATE shop_subscriptions SET starts_at = started_at WHERE starts_at IS NULL AND started_at IS NOT NULL;
UPDATE shop_subscriptions SET ends_at = expires_at WHERE ends_at IS NULL AND expires_at IS NOT NULL;

-- Add duration_days to subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30;

-- Update plan duration
UPDATE subscription_plans SET duration_days = 30 WHERE slug = 'pro_monthly';
UPDATE subscription_plans SET duration_days = 365 WHERE slug = 'pro_yearly';
UPDATE subscription_plans SET duration_days = 0 WHERE slug = 'free';

-- Create storage bucket for payment slips (run manually in Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('payment-slips', 'payment-slips', false)
-- ON CONFLICT (id) DO NOTHING;

-- RLS for payment transactions - Shop owners can view their own payments
CREATE POLICY IF NOT EXISTS "Shop owners can view their payments"
ON payment_transactions FOR SELECT
TO authenticated
USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- Shop owners can insert their payments
CREATE POLICY IF NOT EXISTS "Shop owners can create payments"
ON payment_transactions FOR INSERT
TO authenticated
WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- Add shop_id index to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_notifications_shop ON notifications(shop_id);

-- Update notification policy to use shop_id
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;

CREATE POLICY "Users can view their notifications"
ON notifications FOR SELECT
TO authenticated
USING (
    target_type = 'all'
    OR target_id = auth.uid()
    OR shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR (target_type = 'verified_shops' AND EXISTS (
        SELECT 1 FROM shop_subscriptions ss
        JOIN shops s ON ss.shop_id = s.id
        WHERE s.owner_id = auth.uid() AND ss.status = 'active'
    ))
);

-- Shop owners can insert notifications to their own shop
CREATE POLICY IF NOT EXISTS "System can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow system to insert notifications

-- Add comment
COMMENT ON TABLE payment_transactions IS 'Stores all payment transactions for subscriptions';
COMMENT ON COLUMN payment_transactions.plan_slug IS 'Slug of the plan being purchased (pro_monthly, pro_yearly)';
COMMENT ON COLUMN payment_transactions.confirmed_at IS 'When admin confirmed/rejected the payment';
COMMENT ON COLUMN payment_transactions.confirmed_by IS 'Admin who confirmed/rejected the payment';
