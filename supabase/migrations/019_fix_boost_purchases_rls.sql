-- Migration: Fix boost_purchases RLS policy
-- แก้ไข RLS policy ให้ shop owner สามารถ insert ผ่าน purchase_daily_boost function ได้

-- วิธีที่ 1: เพิ่ม INSERT policy สำหรับ shop owner
DROP POLICY IF EXISTS "Shop owners can insert boosts" ON boost_purchases;
CREATE POLICY "Shop owners can insert boosts" ON boost_purchases
    FOR INSERT WITH CHECK (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- วิธีที่ 2: แก้ไข function ให้เป็น SECURITY DEFINER (ดีกว่าเพราะควบคุม logic ได้)
CREATE OR REPLACE FUNCTION purchase_daily_boost(p_shop_id TEXT)
RETURNS JSONB AS $$
DECLARE
    boost_price INTEGER;
    current_balance INTEGER;
    new_balance INTEGER;
    boost_end TIMESTAMPTZ;
    shop_owner_id UUID;
BEGIN
    -- Verify shop ownership
    SELECT owner_id INTO shop_owner_id
    FROM shops WHERE id = p_shop_id;

    IF shop_owner_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'shop_not_found');
    END IF;

    IF shop_owner_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_shop_owner');
    END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- เพิ่ม policy สำหรับ shop_ad_settings INSERT ด้วย (ถ้ายังไม่มี)
DROP POLICY IF EXISTS "Shop owners can insert ad settings" ON shop_ad_settings;
CREATE POLICY "Shop owners can insert ad settings" ON shop_ad_settings
    FOR INSERT WITH CHECK (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );
