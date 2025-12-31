-- 005_boost_schedules.sql
-- Add boost scheduling feature for advance booking

-- 1. Create boost_schedules table
CREATE TABLE IF NOT EXISTS boost_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 1,
    total_credits INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure end_date >= start_date
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_boost_schedules_shop_id ON boost_schedules(shop_id);
CREATE INDEX IF NOT EXISTS idx_boost_schedules_dates ON boost_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_boost_schedules_status ON boost_schedules(status);

-- 3. Enable RLS
ALTER TABLE boost_schedules ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Shop owners can view their schedules
CREATE POLICY "Shop owners can view their schedules" ON boost_schedules
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- Shop owners can create schedules for their shop
CREATE POLICY "Shop owners can create schedules" ON boost_schedules
    FOR INSERT WITH CHECK (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- Shop owners can update their pending schedules
CREATE POLICY "Shop owners can update pending schedules" ON boost_schedules
    FOR UPDATE USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
        AND status = 'pending'
    );

-- Admins can manage all schedules
CREATE POLICY "Admins can manage all schedules" ON boost_schedules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. Function to activate scheduled boosts (run daily via cron)
CREATE OR REPLACE FUNCTION activate_scheduled_boosts()
RETURNS void AS $$
DECLARE
    schedule_rec RECORD;
BEGIN
    -- Find all pending schedules that should start today
    FOR schedule_rec IN
        SELECT bs.*, s.credit_balance
        FROM boost_schedules bs
        JOIN shops s ON s.id = bs.shop_id
        WHERE bs.status = 'pending'
        AND bs.start_date <= CURRENT_DATE
        AND bs.end_date >= CURRENT_DATE
    LOOP
        -- Update schedule status to active
        UPDATE boost_schedules
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

    -- Mark completed schedules
    UPDATE boost_schedules
    SET status = 'completed', updated_at = NOW()
    WHERE status = 'active'
    AND end_date < CURRENT_DATE;

    -- Deactivate expired boosts
    UPDATE shop_ad_settings
    SET boost_active = false, updated_at = NOW()
    WHERE boost_active = true
    AND boost_expires_at < NOW()
    AND shop_id NOT IN (
        SELECT shop_id FROM boost_schedules
        WHERE status = 'active'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION activate_scheduled_boosts() TO authenticated;
GRANT EXECUTE ON FUNCTION activate_scheduled_boosts() TO service_role;
