-- เพิ่มคอลัมน์ facebook_page_names สำหรับเก็บชื่อ Page Facebook 
-- โดยจะมีความสัมพันธ์กับ facebook_urls แบบ index เดียวกัน (index 0 ของ names คู่กับ index 0 ของ urls)

ALTER TABLE shops ADD COLUMN IF NOT EXISTS facebook_page_names text[] DEFAULT '{}';

-- ตรวจสอบผลลัพธ์
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shops' 
AND column_name LIKE 'facebook%';
