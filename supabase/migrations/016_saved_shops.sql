-- =====================================================
-- 016_saved_shops.sql
-- Saved/Bookmarked Shops Feature
-- =====================================================

-- 1. Create saved_shops table
CREATE TABLE IF NOT EXISTS saved_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, shop_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_shops_user_id ON saved_shops(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_shops_shop_id ON saved_shops(shop_id);
CREATE INDEX IF NOT EXISTS idx_saved_shops_created_at ON saved_shops(created_at DESC);

-- 3. Enable RLS
ALTER TABLE saved_shops ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view their own saved shops
DROP POLICY IF EXISTS "Users can view their saved shops" ON saved_shops;
CREATE POLICY "Users can view their saved shops"
ON saved_shops FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can save shops
DROP POLICY IF EXISTS "Users can save shops" ON saved_shops;
CREATE POLICY "Users can save shops"
ON saved_shops FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can unsave their shops
DROP POLICY IF EXISTS "Users can unsave their shops" ON saved_shops;
CREATE POLICY "Users can unsave their shops"
ON saved_shops FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 5. Comments
COMMENT ON TABLE saved_shops IS 'Stores user bookmarked/saved shops';
COMMENT ON COLUMN saved_shops.user_id IS 'User who saved the shop';
COMMENT ON COLUMN saved_shops.shop_id IS 'Shop that was saved';
