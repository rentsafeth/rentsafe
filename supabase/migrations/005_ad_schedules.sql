-- 005_ad_schedules.sql
-- Combined scheduling system for both Boost and PPC

-- 1. Create ad_schedules table (unified for both boost and ppc)
CREATE TABLE IF NOT EXISTS ad_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('boost', 'ppc')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 1,
    total_credits INTEGER NOT NULL DEFAULT 0,
    -- PPC specific fields
    ppc_bid INTEGER,
    ppc_daily_budget INTEGER,
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure end_date >= start_date
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_ad_schedules_shop_id ON ad_schedules(shop_id);
CREATE INDEX IF NOT EXISTS idx_ad_schedules_type ON ad_schedules(type);
CREATE INDEX IF NOT EXISTS idx_ad_schedules_dates ON ad_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_schedules_status ON ad_schedules(status);

-- 3. Enable RLS
ALTER TABLE ad_schedules ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Shop owners can view their schedules
CREATE POLICY "Shop owners can view their schedules" ON ad_schedules
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- Shop owners can create schedules for their shop
CREATE POLICY "Shop owners can create schedules" ON ad_schedules
    FOR INSERT WITH CHECK (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- Shop owners can update their pending schedules
CREATE POLICY "Shop owners can update pending schedules" ON ad_schedules
    FOR UPDATE USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- Admins can manage all schedules
CREATE POLICY "Admins can manage all schedules" ON ad_schedules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. Function to activate scheduled ads (run daily via cron or trigger)
CREATE OR REPLACE FUNCTION activate_scheduled_ads()
RETURNS void AS $$
DECLARE
    schedule_rec RECORD;
BEGIN
    -- Activate pending boost schedules that should start today
    FOR schedule_rec IN
        SELECT *
        FROM ad_schedules
        WHERE type = 'boost'
        AND status = 'pending'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
    LOOP
        -- Update schedule status to active
        UPDATE ad_schedules
        SET status = 'active', updated_at = NOW()
        WHERE id = schedule_rec.id;

        -- Activate boost in shop_ad_settings
        INSERT INTO shop_ad_settings (shop_id, boost_active, boost_expires_at)
        VALUES (
            schedule_rec.shop_id,
            true,
            (schedule_rec.end_date + INTERVAL '1 day')::TIMESTAMPTZ
        )
        ON CONFLICT (shop_id) DO UPDATE SET
            boost_active = true,
            boost_expires_at = (schedule_rec.end_date + INTERVAL '1 day')::TIMESTAMPTZ,
            updated_at = NOW();
    END LOOP;

    -- Activate pending PPC schedules that should start today
    FOR schedule_rec IN
        SELECT *
        FROM ad_schedules
        WHERE type = 'ppc'
        AND status = 'pending'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
    LOOP
        -- Update schedule status to active
        UPDATE ad_schedules
        SET status = 'active', updated_at = NOW()
        WHERE id = schedule_rec.id;

        -- Activate PPC in shop_ad_settings
        UPDATE shop_ad_settings
        SET
            ppc_enabled = true,
            ppc_bid = COALESCE(schedule_rec.ppc_bid, ppc_bid),
            ppc_daily_budget = COALESCE(schedule_rec.ppc_daily_budget, ppc_daily_budget),
            updated_at = NOW()
        WHERE shop_id = schedule_rec.shop_id;
    END LOOP;

    -- Mark completed boost schedules
    UPDATE ad_schedules
    SET status = 'completed', updated_at = NOW()
    WHERE type = 'boost'
    AND status = 'active'
    AND end_date < CURRENT_DATE;

    -- Mark completed PPC schedules and disable PPC
    FOR schedule_rec IN
        SELECT *
        FROM ad_schedules
        WHERE type = 'ppc'
        AND status = 'active'
        AND end_date < CURRENT_DATE
    LOOP
        UPDATE ad_schedules
        SET status = 'completed', updated_at = NOW()
        WHERE id = schedule_rec.id;

        -- Check if there's another active PPC schedule
        IF NOT EXISTS (
            SELECT 1 FROM ad_schedules
            WHERE shop_id = schedule_rec.shop_id
            AND type = 'ppc'
            AND status = 'active'
            AND id != schedule_rec.id
        ) THEN
            -- No other active PPC schedule, disable PPC
            UPDATE shop_ad_settings
            SET ppc_enabled = false, updated_at = NOW()
            WHERE shop_id = schedule_rec.shop_id;
        END IF;
    END LOOP;

    -- Deactivate expired boosts (not covered by schedules)
    UPDATE shop_ad_settings
    SET boost_active = false, updated_at = NOW()
    WHERE boost_active = true
    AND boost_expires_at < NOW()
    AND shop_id NOT IN (
        SELECT shop_id FROM ad_schedules
        WHERE type = 'boost'
        AND status = 'active'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION activate_scheduled_ads() TO authenticated;
GRANT EXECUTE ON FUNCTION activate_scheduled_ads() TO service_role;

-- 7. Drop old table if exists (from previous migration)
DROP TABLE IF EXISTS boost_schedules;
