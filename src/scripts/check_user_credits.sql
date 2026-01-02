-- =====================================================
-- Script เช็คเครดิตของผู้ใช้ (Simple Version)
-- =====================================================

-- 1. ดูเครดิตในตาราง profiles (ถ้ามี column karma_credits)
SELECT 
    id,
    email, 
    karma_credits,
    role
FROM profiles 
ORDER BY karma_credits DESC;

-- 2. ถ้าต้องการดู transactions ให้รันคำสั่งนี้ (ต้องมีตาราง karma_transactions ก่อน)
/*
SELECT * FROM karma_transactions ORDER BY created_at DESC;
*/
