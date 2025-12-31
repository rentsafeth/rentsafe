-- 008_fix_ad_functions_security.sql
-- Add SECURITY DEFINER to ad functions so they can bypass RLS

-- Fix record_ad_click function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix record_ad_impression function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_ad_click TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_ad_impression TO anon, authenticated;
