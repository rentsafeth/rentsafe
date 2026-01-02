-- =====================================================
-- เพิ่ม column reporter_ip ใน reports table
-- รันใน Supabase SQL Editor
-- =====================================================

-- 1. เพิ่ม column สำหรับเก็บ IP Address
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS reporter_ip text;

-- 2. เพิ่ม column สำหรับ User Agent (optional, for fraud detection)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS reporter_user_agent text;

-- 3. ตรวจสอบว่าเพิ่มสำเร็จ
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('reporter_ip', 'reporter_user_agent');
