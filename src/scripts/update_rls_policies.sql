-- Drop old strict policies
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can view ocr logs" ON ocr_logs;

-- Re-create policies allowing 'admin', 'super_admin', and 'owner'
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'super_admin', 'owner')
        )
    );

CREATE POLICY "Admins can view ocr logs" ON ocr_logs
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'super_admin', 'owner')
        )
    );
