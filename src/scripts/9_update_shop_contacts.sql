-- Add array columns for multiple contacts
ALTER TABLE shops ADD COLUMN IF NOT EXISTS line_ids text[] DEFAULT '{}';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS facebook_urls text[] DEFAULT '{}';

-- Migrate existing data to new columns
-- Only migrate if the new columns are empty to avoid overwriting if run multiple times
UPDATE shops 
SET line_ids = ARRAY[line_id] 
WHERE line_id IS NOT NULL AND line_id != '' AND (line_ids IS NULL OR line_ids = '{}');

UPDATE shops 
SET facebook_urls = ARRAY[facebook_url] 
WHERE facebook_url IS NOT NULL AND facebook_url != '' AND (facebook_urls IS NULL OR facebook_urls = '{}');

-- Notify success
DO $$
BEGIN
    RAISE NOTICE 'Shop contact columns updated and data migrated successfully.';
END $$;
