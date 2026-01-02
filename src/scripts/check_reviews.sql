SELECT 
    r.id, 
    r.shop_id, 
    r.status, 
    r.rating, 
    r.comment,
    s.name as shop_name,
    s.id as shop_id_from_shops
FROM reviews r
LEFT JOIN shops s ON r.shop_id = s.id
ORDER BY r.created_at DESC;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name = 'shop_id';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shops' AND column_name = 'id';
