-- Migration: Fix Daily Boost to update ad_stats_daily
-- แก้ไขให้ Daily Boost บันทึก credits_spent ลง ad_stats_daily ด้วย

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

    -- Update daily stats (add boost_active and credits_spent)
    INSERT INTO ad_stats_daily (shop_id, stat_date, credits_spent, boost_active)
    VALUES (p_shop_id, CURRENT_DATE, boost_price, true)
    ON CONFLICT (shop_id, stat_date) DO UPDATE SET
        credits_spent = ad_stats_daily.credits_spent + boost_price,
        boost_active = true,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'credits_spent', boost_price,
        'expires_at', boost_end,
        'new_balance', new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
