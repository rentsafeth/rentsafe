-- คำสั่งสำหรับตรวจสอบโครงสร้างตารางปัจจุบัน
-- Run these commands in Supabase SQL Editor

-- 1. ตรวจสอบตาราง reviews
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews';

-- 2. ตรวจสอบตาราง shops (เพื่อดูว่ามี rating_average หรือไม่)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shops';

-- 3. ตรวจสอบว่ามีตาราง profiles หรือไม่ (สำหรับดึงชื่อผู้ใช้)
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'profiles';
