-- =====================================================
-- 025_fix_subscription_rls_policy.sql
-- Fix: RLS policy for shop_subscriptions with join
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Shop owners can view their subscription" ON shop_subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON shop_subscriptions;

-- Recreate with simpler, more robust policy
CREATE POLICY "Shop owners can view their subscription"
ON shop_subscriptions FOR SELECT TO authenticated
USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow shop owners to insert their own subscriptions (for edge cases)
CREATE POLICY "Shop owners can insert their subscription"
ON shop_subscriptions FOR INSERT TO authenticated
WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow shop owners to update their own subscriptions (for auto-renew toggle)
CREATE POLICY "Shop owners can update their subscription"
ON shop_subscriptions FOR UPDATE TO authenticated
USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin can do everything
CREATE POLICY "Admins can manage subscriptions"
ON shop_subscriptions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Also ensure subscription_plans is readable
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT TO public USING (true);
