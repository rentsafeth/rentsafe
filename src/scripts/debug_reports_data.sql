-- Check columns in reports table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports';

-- Check data of the latest 5 reports to see where facebook link is stored
SELECT 
    id, 
    manual_shop_name, 
    manual_facebook_url, 
    facebook_urls, 
    social_links,
    description
FROM reports 
ORDER BY created_at DESC 
LIMIT 5;
