-- 1. Check all columns in reports table again
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports';

-- 2. Check data in potential columns
SELECT 
    id, 
    manual_shop_name, 
    manual_facebook_url, 
    social_links,
    description
FROM reports 
ORDER BY created_at DESC 
LIMIT 5;
