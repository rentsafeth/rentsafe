SELECT id, manual_shop_name, manual_facebook_url, manual_shop_contact
FROM reports
WHERE manual_shop_name LIKE '%Fon Carrent%'
ORDER BY created_at DESC;
