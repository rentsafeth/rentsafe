-- ============================================================
-- CHECK SYSTEM STATUS - รันใน Supabase SQL Editor เพื่อเช็คการตั้งค่า
-- ============================================================

-- 1. เช็ค System Settings
SELECT '=== SYSTEM SETTINGS ===' as section;
SELECT key, value, description FROM system_settings ORDER BY key;

-- 2. เช็ค Subscription Plans
SELECT '=== SUBSCRIPTION PLANS ===' as section;
SELECT slug, name, price_monthly, duration_days, is_active, features FROM subscription_plans ORDER BY price_monthly;

-- 3. เช็ค Active Subscriptions
SELECT '=== ACTIVE SUBSCRIPTIONS ===' as section;
SELECT
    ss.id,
    s.name as shop_name,
    sp.name as plan_name,
    ss.status,
    ss.starts_at,
    ss.ends_at,
    s.is_verified_shop
FROM shop_subscriptions ss
JOIN shops s ON ss.shop_id = s.id
JOIN subscription_plans sp ON ss.plan_id = sp.id
WHERE ss.status = 'active'
ORDER BY ss.ends_at;

-- 4. เช็ค Pending Payments
SELECT '=== PENDING PAYMENTS ===' as section;
SELECT
    pt.id,
    s.name as shop_name,
    pt.plan_slug,
    pt.amount,
    pt.payment_method,
    pt.status,
    pt.created_at
FROM payment_transactions pt
JOIN shops s ON pt.shop_id = s.id
WHERE pt.status = 'pending'
ORDER BY pt.created_at DESC
LIMIT 10;

-- 5. เช็ค Pending Blacklist Reports
SELECT '=== PENDING BLACKLIST REPORTS ===' as section;
SELECT
    cb.id,
    cb.first_name || ' ' || LEFT(cb.last_name, 1) || '***' as customer_name,
    cb.reason_type,
    cb.severity,
    cb.status,
    s.name as reported_by,
    cb.created_at
FROM customer_blacklist cb
JOIN shops s ON cb.reported_by_shop_id = s.id
WHERE cb.status = 'pending'
ORDER BY cb.created_at DESC
LIMIT 10;

-- 6. เช็ค Verified Shops (ร้านรับรอง)
SELECT '=== VERIFIED SHOPS ===' as section;
SELECT
    s.id,
    s.name,
    s.phone_number,
    s.is_verified_shop,
    ss.ends_at as subscription_ends
FROM shops s
LEFT JOIN shop_subscriptions ss ON s.id = ss.shop_id AND ss.status = 'active'
WHERE s.is_verified_shop = true
ORDER BY s.name;

-- 7. เช็ค Admin Users
SELECT '=== ADMIN USERS ===' as section;
SELECT
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.created_at
FROM profiles p
WHERE p.role = 'admin';

-- 8. เช็ค Recent Notifications
SELECT '=== RECENT NOTIFICATIONS (Last 10) ===' as section;
SELECT
    n.id,
    s.name as shop_name,
    n.type,
    n.title,
    n.is_read,
    n.created_at
FROM notifications n
LEFT JOIN shops s ON n.shop_id = s.id
ORDER BY n.created_at DESC
LIMIT 10;

-- 9. เช็ค Storage Buckets (ต้องเช็คใน Dashboard)
SELECT '=== STORAGE BUCKETS (Check in Dashboard) ===' as section;
SELECT 'payment-slips' as bucket, 'Should be Public' as status
UNION ALL
SELECT 'blacklist-evidence' as bucket, 'Should be Public, 5MB limit' as status;

-- 10. สรุปจำนวนข้อมูล
SELECT '=== SUMMARY ===' as section;
SELECT
    (SELECT COUNT(*) FROM shops) as total_shops,
    (SELECT COUNT(*) FROM shops WHERE is_verified_shop = true) as verified_shops,
    (SELECT COUNT(*) FROM shop_subscriptions WHERE status = 'active') as active_subscriptions,
    (SELECT COUNT(*) FROM payment_transactions WHERE status = 'pending') as pending_payments,
    (SELECT COUNT(*) FROM customer_blacklist WHERE status = 'pending') as pending_blacklist,
    (SELECT COUNT(*) FROM customer_blacklist WHERE status = 'approved') as approved_blacklist,
    (SELECT COUNT(*) FROM notifications WHERE is_read = false) as unread_notifications;

-- 11. เช็ค Functions
SELECT '=== FUNCTIONS ===' as section;
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'is_shop_pro',
    'get_remaining_blacklist_searches',
    'notify_shop',
    'notify_verified_shops',
    'record_ad_click',
    'record_ad_impression'
)
ORDER BY routine_name;

-- 12. เช็ค Policies
SELECT '=== RLS POLICIES ===' as section;
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'system_settings',
    'subscription_plans',
    'shop_subscriptions',
    'notifications',
    'customer_blacklist',
    'payment_transactions'
)
ORDER BY tablename, policyname;
