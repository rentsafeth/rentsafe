-- =====================================================
-- SQL สำหรับตรวจสอบ Reports ใน Supabase SQL Editor
-- =====================================================

-- 1. ดูข้อมูลทั้งหมดใน reports table
SELECT 
    id,
    reporter_id,
    shop_id,
    manual_shop_name,
    description,
    status,
    created_at,
    evidence_urls
FROM reports 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. นับจำนวน reports แยกตามสถานะ
SELECT 
    status, 
    COUNT(*) as count 
FROM reports 
GROUP BY status;

-- 3. ตรวจสอบ RLS Policies ของ reports table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reports';

-- 4. ตรวจสอบว่า RLS เปิดอยู่หรือไม่
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'reports';

-- 5. ตรวจสอบ profiles ของผู้รายงาน (ถ้า join ไม่ได้อาจเป็นปัญหา)
SELECT 
    r.id as report_id,
    r.reporter_id,
    r.manual_shop_name,
    r.status,
    p.full_name,
    p.email
FROM reports r
LEFT JOIN profiles p ON r.reporter_id = p.id
ORDER BY r.created_at DESC
LIMIT 10;

-- =====================================================
-- ถ้าไม่มีข้อมูลแสดง ลองรัน query นี้เพื่อ bypass RLS:
-- =====================================================

-- รันใน Supabase SQL Editor (ต้องเป็น admin)
-- SET ROLE service_role;
-- SELECT * FROM reports;

-- =====================================================
-- สร้าง RLS Policy สำหรับ Admin ถ้ายังไม่มี
-- =====================================================

-- ตรวจสอบว่ามี is_admin function หรือไม่
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'is_admin';

-- ถ้าไม่มี สร้าง is_admin function (ต้องมี admin_users table)
/*
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- สร้าง RLS Policy ให้ Admin อ่าน reports ได้ทั้งหมด
/*
CREATE POLICY "Admins can view all reports" 
ON reports 
FOR SELECT 
USING (is_admin());
*/

-- สร้าง RLS Policy ให้ผู้ใช้อ่าน reports ของตัวเองได้
/*
CREATE POLICY "Users can view own reports" 
ON reports 
FOR SELECT 
USING (auth.uid() = reporter_id);
*/
