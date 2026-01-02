-- เพิ่ม Policy ให้ Admin สามารถจัดการรีวิวได้ทั้งหมด
-- (สมมติว่า Admin มี role = 'admin' ในตาราง profiles หรือ metadata)

-- 1. ลบ Policy เดิมที่อาจจะขัดแย้ง (ถ้ามี) หรือสร้างใหม่เลย
-- แต่เพื่อความปลอดภัย เราจะเพิ่ม Policy ใหม่สำหรับ Admin โดยเฉพาะ

-- Policy: Admin สามารถทำได้ทุกอย่างกับ reviews (SELECT, UPDATE, DELETE)
CREATE POLICY "Admins can do everything on reviews"
ON reviews
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admin สามารถทำได้ทุกอย่างกับ review_disputes
CREATE POLICY "Admins can do everything on review_disputes"
ON review_disputes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admin สามารถทำได้ทุกอย่างกับ review_likes (เผื่อไว้)
CREATE POLICY "Admins can do everything on review_likes"
ON review_likes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
