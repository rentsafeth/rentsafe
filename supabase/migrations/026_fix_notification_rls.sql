-- =====================================================
-- 026_fix_notification_rls.sql
-- Fix: Allow users to update notifications where they are target_id OR shop_id
-- =====================================================

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;

-- Recreate with broader condition
CREATE POLICY "Users can update their notifications"
ON notifications FOR UPDATE TO authenticated
USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR target_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR target_id::TEXT = auth.uid()::TEXT
)
WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR target_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR target_id::TEXT = auth.uid()::TEXT
);
