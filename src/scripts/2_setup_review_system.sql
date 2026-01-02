-- คำสั่งสำหรับสร้างระบบรีวิวใหม่ (แก้ไข: ปรับ shop_id เป็น TEXT)
-- Run these commands in Supabase SQL Editor

-- 1. สร้างตาราง reviews (แก้ไข shop_id เป็น TEXT ให้ตรงกับตาราง shops)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, -- แก้ไขเป็น TEXT
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'pending', 
    ip_address TEXT,
    evidence_urls TEXT[], 
    like_count INTEGER DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT TRUE,
    reviewer_name TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. สร้างตาราง review_likes
CREATE TABLE IF NOT EXISTS review_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, ip_address)
);

-- 3. สร้างตาราง review_disputes (แก้ไข shop_id เป็น TEXT)
CREATE TABLE IF NOT EXISTS review_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    shop_id TEXT REFERENCES shops(id), -- แก้ไขเป็น TEXT
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. เปิดใช้งาน RLS และกำหนด Policy
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_disputes ENABLE ROW LEVEL SECURITY;

-- Policy: ทุกคนอ่านรีวิวที่อนุมัติแล้วได้
CREATE POLICY "Public reviews are viewable by everyone" 
ON reviews FOR SELECT 
USING (status = 'approved');

-- Policy: User สร้างรีวิวได้
CREATE POLICY "Users can create reviews" 
ON reviews FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy: User อ่านรีวิวตัวเองได้เสมอ
CREATE POLICY "Users can read own reviews" 
ON reviews FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Shop Owner อ่านรีวิวของร้านตัวเองได้
CREATE POLICY "Shop owners can read shop reviews" 
ON reviews FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM shops 
    WHERE shops.id = reviews.shop_id 
    AND shops.owner_id = auth.uid()
  )
);

-- Policy: Likes
CREATE POLICY "Everyone can insert likes" ON review_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can view likes" ON review_likes FOR SELECT USING (true);
