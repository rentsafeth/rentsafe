-- คำสั่งสร้าง Policy สำหรับ Storage Bucket 'review-evidence'
-- Run these commands in Supabase SQL Editor

-- หมายเหตุ: ต้องสร้าง Bucket ชื่อ 'review-evidence' ในเมนู Storage ก่อนนะครับ

-- 1. อนุญาตให้ทุกคนดูรูปได้ (Public Read)
-- ถ้าตั้งค่า Bucket เป็น Public ใน UI แล้ว ไม่ต้องรันคำสั่งนี้ก็ได้ แต่รันไว้ก็ไม่เสียหายครับ
CREATE POLICY "Give public access to review evidence"
ON storage.objects FOR SELECT
USING ( bucket_id = 'review-evidence' );

-- 2. อนุญาตให้ User ที่ Login แล้วอัปโหลดรูปได้
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'review-evidence'
    -- บังคับว่าไฟล์ต้องถูกอัปโหลดโดยเจ้าของ (Supabase จัดการให้อัตโนมัติ)
);

-- 3. อนุญาตให้ User อัปเดต/ลบรูปของตัวเองได้
CREATE POLICY "Allow users to update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'review-evidence' AND owner = auth.uid() );

CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'review-evidence' AND owner = auth.uid() );
