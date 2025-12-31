-- 007_fix_ad_settings_rls.sql
-- Allow public read access to shop_ad_settings for search results

-- Add policy to allow anyone to read ad settings (for search results display)
DROP POLICY IF EXISTS "Public can read ad settings" ON shop_ad_settings;
CREATE POLICY "Public can read ad settings" ON shop_ad_settings
    FOR SELECT USING (true);
