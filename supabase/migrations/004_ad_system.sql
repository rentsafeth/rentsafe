-- =============================================
-- Advertising System for RentSafe
-- =============================================

-- 1. Ad Settings in system_settings
INSERT INTO system_settings (key, value, description) VALUES
    ('ad_system_enabled', 'true', 'Enable/disable advertising system'),
    ('daily_boost_price', '50', 'Price for daily boost in credits'),
    ('min_ppc_bid', '1', 'Minimum PPC bid per click'),
    ('max_ppc_bid', '100', 'Maximum PPC bid per click'),
    ('featured_spots_count', '3', 'Number of featured spots on homepage'),
    ('min_featured_bid', '100', 'Minimum bid for featured spot per day')
ON CONFLICT (key) DO NOTHING;

-- 2. Shop Ad Settings Table (per-shop configuration)
CREATE TABLE IF NOT EXISTS shop_ad_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE UNIQUE,

    -- PPC Settings
    ppc_enabled BOOLEAN DEFAULT false,
    ppc_bid INTEGER DEFAULT 5, -- credits per click
    ppc_daily_budget INTEGER DEFAULT 0, -- 0 = unlimited
    ppc_spent_today INTEGER DEFAULT 0,

    -- Daily Boost
    boost_active BOOLEAN DEFAULT false,
    boost_expires_at TIMESTAMPTZ,

    -- Featured Spot (auction)
    featured_bid INTEGER DEFAULT 0,
    featured_active BOOLEAN DEFAULT false,
    featured_expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ad Impressions Table (when shop appears in search)
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id), -- null if anonymous
    source TEXT NOT NULL CHECK (source IN ('search', 'homepage', 'featured', 'category')),
    search_query TEXT, -- what user searched for
    province TEXT,
    position INTEGER, -- position in results
    is_boosted BOOLEAN DEFAULT false,
    is_ppc BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ad Clicks Table (when user clicks to view shop)
CREATE TABLE IF NOT EXISTS ad_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    impression_id UUID REFERENCES ad_impressions(id),
    viewer_id UUID REFERENCES auth.users(id),
    source TEXT NOT NULL CHECK (source IN ('search', 'homepage', 'featured', 'category')),
    credits_charged INTEGER DEFAULT 0,
    is_ppc BOOLEAN DEFAULT false,
    ip_hash TEXT, -- hashed IP for fraud detection
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Daily Boost Purchases Table
CREATE TABLE IF NOT EXISTS boost_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    credits_spent INTEGER NOT NULL,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Featured Spot Bids Table
CREATE TABLE IF NOT EXISTS featured_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    bid_amount INTEGER NOT NULL,
    bid_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_winner BOOLEAN DEFAULT false,
    credits_charged INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shop_id, bid_date)
);

-- 7. Ad Stats Daily Summary (for analytics)
CREATE TABLE IF NOT EXISTS ad_stats_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    credits_spent INTEGER DEFAULT 0,
    boost_active BOOLEAN DEFAULT false,
    ppc_active BOOLEAN DEFAULT false,
    featured_active BOOLEAN DEFAULT false,
    avg_position DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shop_id, stat_date)
);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shop_ad_settings_shop_id ON shop_ad_settings(shop_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_shop_id ON ad_impressions(shop_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created_at ON ad_impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_shop_id ON ad_clicks(shop_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_created_at ON ad_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_boost_purchases_shop_id ON boost_purchases(shop_id);
CREATE INDEX IF NOT EXISTS idx_boost_purchases_expires_at ON boost_purchases(expires_at);
CREATE INDEX IF NOT EXISTS idx_featured_bids_bid_date ON featured_bids(bid_date);
CREATE INDEX IF NOT EXISTS idx_ad_stats_daily_shop_date ON ad_stats_daily(shop_id, stat_date);

-- 9. Function to purchase daily boost
CREATE OR REPLACE FUNCTION purchase_daily_boost(p_shop_id TEXT)
RETURNS JSONB AS $$
DECLARE
    boost_price INTEGER;
    current_balance INTEGER;
    new_balance INTEGER;
    boost_end TIMESTAMPTZ;
BEGIN
    -- Get boost price
    SELECT (value::TEXT)::INTEGER INTO boost_price
    FROM system_settings WHERE key = 'daily_boost_price';

    IF boost_price IS NULL THEN
        boost_price := 50;
    END IF;

    -- Check balance
    SELECT credit_balance INTO current_balance
    FROM shops WHERE id = p_shop_id;

    IF current_balance < boost_price THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits');
    END IF;

    -- Calculate expiry (24 hours from now)
    boost_end := NOW() + INTERVAL '24 hours';

    -- Deduct credits
    new_balance := add_shop_credits(
        p_shop_id,
        -boost_price,
        'daily_boost',
        'Daily Boost 24 ชั่วโมง'
    );

    -- Update ad settings
    INSERT INTO shop_ad_settings (shop_id, boost_active, boost_expires_at)
    VALUES (p_shop_id, true, boost_end)
    ON CONFLICT (shop_id) DO UPDATE SET
        boost_active = true,
        boost_expires_at = boost_end,
        updated_at = NOW();

    -- Log purchase
    INSERT INTO boost_purchases (shop_id, credits_spent, expires_at)
    VALUES (p_shop_id, boost_price, boost_end);

    RETURN jsonb_build_object(
        'success', true,
        'credits_spent', boost_price,
        'expires_at', boost_end,
        'new_balance', new_balance
    );
END;
$$ LANGUAGE plpgsql;

-- 10. Function to record ad click and charge PPC
CREATE OR REPLACE FUNCTION record_ad_click(
    p_shop_id TEXT,
    p_impression_id UUID DEFAULT NULL,
    p_viewer_id UUID DEFAULT NULL,
    p_source TEXT DEFAULT 'search',
    p_ip_hash TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    ad_settings RECORD;
    credits_to_charge INTEGER := 0;
    new_balance INTEGER;
    click_id UUID;
BEGIN
    -- Get shop's ad settings
    SELECT * INTO ad_settings
    FROM shop_ad_settings
    WHERE shop_id = p_shop_id;

    -- Check if PPC is enabled and should charge
    IF ad_settings IS NOT NULL AND ad_settings.ppc_enabled THEN
        -- Check daily budget
        IF ad_settings.ppc_daily_budget = 0 OR
           ad_settings.ppc_spent_today < ad_settings.ppc_daily_budget THEN

            credits_to_charge := ad_settings.ppc_bid;

            -- Deduct credits
            new_balance := add_shop_credits(
                p_shop_id,
                -credits_to_charge,
                'ad_click',
                'PPC Click'
            );

            -- Update spent today
            UPDATE shop_ad_settings
            SET ppc_spent_today = ppc_spent_today + credits_to_charge,
                updated_at = NOW()
            WHERE shop_id = p_shop_id;
        END IF;
    END IF;

    -- Record click
    INSERT INTO ad_clicks (
        shop_id, impression_id, viewer_id, source,
        credits_charged, is_ppc, ip_hash
    )
    VALUES (
        p_shop_id, p_impression_id, p_viewer_id, p_source,
        credits_to_charge, credits_to_charge > 0, p_ip_hash
    )
    RETURNING id INTO click_id;

    -- Update daily stats
    INSERT INTO ad_stats_daily (shop_id, stat_date, clicks, credits_spent)
    VALUES (p_shop_id, CURRENT_DATE, 1, credits_to_charge)
    ON CONFLICT (shop_id, stat_date) DO UPDATE SET
        clicks = ad_stats_daily.clicks + 1,
        credits_spent = ad_stats_daily.credits_spent + credits_to_charge,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'click_id', click_id,
        'credits_charged', credits_to_charge
    );
END;
$$ LANGUAGE plpgsql;

-- 11. Function to record impression
CREATE OR REPLACE FUNCTION record_ad_impression(
    p_shop_id TEXT,
    p_viewer_id UUID DEFAULT NULL,
    p_source TEXT DEFAULT 'search',
    p_search_query TEXT DEFAULT NULL,
    p_province TEXT DEFAULT NULL,
    p_position INTEGER DEFAULT NULL,
    p_is_boosted BOOLEAN DEFAULT false,
    p_is_ppc BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    impression_id UUID;
BEGIN
    INSERT INTO ad_impressions (
        shop_id, viewer_id, source, search_query,
        province, position, is_boosted, is_ppc
    )
    VALUES (
        p_shop_id, p_viewer_id, p_source, p_search_query,
        p_province, p_position, p_is_boosted, p_is_ppc
    )
    RETURNING id INTO impression_id;

    -- Update daily stats
    INSERT INTO ad_stats_daily (shop_id, stat_date, impressions)
    VALUES (p_shop_id, CURRENT_DATE, 1)
    ON CONFLICT (shop_id, stat_date) DO UPDATE SET
        impressions = ad_stats_daily.impressions + 1,
        updated_at = NOW();

    RETURN impression_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Function to get shop ranking score (for search ordering)
CREATE OR REPLACE FUNCTION get_shop_ad_score(p_shop_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    ad_settings RECORD;
    score INTEGER := 0;
BEGIN
    SELECT * INTO ad_settings
    FROM shop_ad_settings
    WHERE shop_id = p_shop_id;

    IF ad_settings IS NULL THEN
        RETURN 0;
    END IF;

    -- Featured spot = highest priority (1000 base)
    IF ad_settings.featured_active AND ad_settings.featured_expires_at > NOW() THEN
        score := score + 1000 + ad_settings.featured_bid;
    END IF;

    -- Daily boost = high priority (500 base)
    IF ad_settings.boost_active AND ad_settings.boost_expires_at > NOW() THEN
        score := score + 500;
    END IF;

    -- PPC bid adds to score
    IF ad_settings.ppc_enabled THEN
        score := score + (ad_settings.ppc_bid * 10);
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 13. Scheduled function to reset daily PPC spent (run via cron)
CREATE OR REPLACE FUNCTION reset_daily_ppc_spent()
RETURNS void AS $$
BEGIN
    UPDATE shop_ad_settings
    SET ppc_spent_today = 0,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 14. Scheduled function to expire boosts (run via cron)
CREATE OR REPLACE FUNCTION expire_boosts()
RETURNS void AS $$
BEGIN
    UPDATE shop_ad_settings
    SET boost_active = false,
        updated_at = NOW()
    WHERE boost_active = true AND boost_expires_at < NOW();

    UPDATE boost_purchases
    SET is_active = false
    WHERE is_active = true AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 15. RLS Policies

-- Shop Ad Settings
ALTER TABLE shop_ad_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can view their ad settings" ON shop_ad_settings;
CREATE POLICY "Shop owners can view their ad settings" ON shop_ad_settings
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Shop owners can update their ad settings" ON shop_ad_settings;
CREATE POLICY "Shop owners can update their ad settings" ON shop_ad_settings
    FOR ALL USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can manage all ad settings" ON shop_ad_settings;
CREATE POLICY "Admins can manage all ad settings" ON shop_ad_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Ad Impressions (insert only for tracking, select for analytics)
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create impressions" ON ad_impressions;
CREATE POLICY "Anyone can create impressions" ON ad_impressions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Shop owners can view their impressions" ON ad_impressions;
CREATE POLICY "Shop owners can view their impressions" ON ad_impressions
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all impressions" ON ad_impressions;
CREATE POLICY "Admins can view all impressions" ON ad_impressions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Ad Clicks
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create clicks" ON ad_clicks;
CREATE POLICY "Anyone can create clicks" ON ad_clicks
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Shop owners can view their clicks" ON ad_clicks;
CREATE POLICY "Shop owners can view their clicks" ON ad_clicks
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all clicks" ON ad_clicks;
CREATE POLICY "Admins can view all clicks" ON ad_clicks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Boost Purchases
ALTER TABLE boost_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can view their boosts" ON boost_purchases;
CREATE POLICY "Shop owners can view their boosts" ON boost_purchases
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can manage boosts" ON boost_purchases;
CREATE POLICY "Admins can manage boosts" ON boost_purchases
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Featured Bids
ALTER TABLE featured_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can manage their bids" ON featured_bids;
CREATE POLICY "Shop owners can manage their bids" ON featured_bids
    FOR ALL USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Anyone can view winning bids" ON featured_bids;
CREATE POLICY "Anyone can view winning bids" ON featured_bids
    FOR SELECT USING (is_winner = true);

DROP POLICY IF EXISTS "Admins can manage all bids" ON featured_bids;
CREATE POLICY "Admins can manage all bids" ON featured_bids
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Ad Stats Daily
ALTER TABLE ad_stats_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can view their stats" ON ad_stats_daily;
CREATE POLICY "Shop owners can view their stats" ON ad_stats_daily
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all stats" ON ad_stats_daily;
CREATE POLICY "Admins can view all stats" ON ad_stats_daily
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
