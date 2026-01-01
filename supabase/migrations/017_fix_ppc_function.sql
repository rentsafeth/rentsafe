-- Migration: Fix PPC record_ad_click function
-- ปัญหา: PPC ไม่หักเครดิต เพราะ search_path ไม่ถูกต้องใน Supabase
-- แก้ไข: เพิ่ม SET search_path = public และใช้ explicit schema prefix

-- ตรวจสอบว่า function add_shop_credits มีอยู่และทำงานได้
-- ถ้าไม่มี ให้สร้างใหม่ (พร้อม explicit schema)
CREATE OR REPLACE FUNCTION public.add_shop_credits(
    p_shop_id TEXT,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_balance INTEGER;
BEGIN
    -- Update shop credit balance
    UPDATE public.shops
    SET credit_balance = credit_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_shop_id
    RETURNING credit_balance INTO new_balance;

    -- Record transaction
    INSERT INTO public.credit_transactions (shop_id, amount, type, description, balance_after)
    VALUES (p_shop_id, p_amount, p_type, p_description, new_balance);

    RETURN new_balance;
END;
$$;

-- สร้าง function record_ad_click ใหม่พร้อม explicit schema
-- สำคัญ: ต้องใช้ SET search_path = public เพื่อให้หา table ได้
CREATE OR REPLACE FUNCTION public.record_ad_click(
    p_shop_id TEXT,
    p_impression_id UUID DEFAULT NULL,
    p_viewer_id UUID DEFAULT NULL,
    p_source TEXT DEFAULT 'search',
    p_ip_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ad_settings RECORD;
    v_shop_credit INTEGER;
    credits_to_charge INTEGER := 0;
    new_balance INTEGER;
    click_id UUID;
    debug_info TEXT := '';
BEGIN
    -- Get shop's ad settings with explicit schema
    SELECT ppc_enabled, ppc_bid, ppc_daily_budget, ppc_spent_today
    INTO v_ad_settings
    FROM public.shop_ad_settings
    WHERE shop_id = p_shop_id;

    -- Get shop credit balance
    SELECT credit_balance INTO v_shop_credit
    FROM public.shops
    WHERE id = p_shop_id;

    -- Debug logging
    IF v_ad_settings IS NULL THEN
        debug_info := 'ad_settings: NOT_FOUND';
    ELSE
        debug_info := 'ad_settings: FOUND, ppc_enabled=' || v_ad_settings.ppc_enabled::TEXT;
        debug_info := debug_info || ', bid=' || COALESCE(v_ad_settings.ppc_bid::TEXT, 'null');
        debug_info := debug_info || ', budget=' || COALESCE(v_ad_settings.ppc_daily_budget::TEXT, 'null');
        debug_info := debug_info || ', spent=' || COALESCE(v_ad_settings.ppc_spent_today::TEXT, 'null');
        debug_info := debug_info || ', shop_credit=' || COALESCE(v_shop_credit::TEXT, 'null');
    END IF;

    -- Check if PPC is enabled and should charge
    IF v_ad_settings IS NOT NULL AND v_ad_settings.ppc_enabled = true THEN
        -- Check daily budget (0 means unlimited)
        IF v_ad_settings.ppc_daily_budget = 0 OR
           v_ad_settings.ppc_spent_today < v_ad_settings.ppc_daily_budget THEN

            -- Check if shop has enough credits
            IF v_shop_credit >= v_ad_settings.ppc_bid THEN
                credits_to_charge := v_ad_settings.ppc_bid;

                -- Deduct credits using the helper function
                new_balance := public.add_shop_credits(
                    p_shop_id,
                    -credits_to_charge,
                    'ad_click',
                    'PPC Click - หักค่าคลิกโฆษณา'
                );

                -- Update spent today
                UPDATE public.shop_ad_settings
                SET ppc_spent_today = ppc_spent_today + credits_to_charge,
                    updated_at = NOW()
                WHERE shop_id = p_shop_id;

                debug_info := debug_info || ', CHARGED=' || credits_to_charge::TEXT;
            ELSE
                debug_info := debug_info || ', insufficient_credits';
            END IF;
        ELSE
            debug_info := debug_info || ', budget_exceeded';
        END IF;
    ELSE
        debug_info := debug_info || ', ppc_not_enabled';
    END IF;

    -- Record click
    INSERT INTO public.ad_clicks (
        shop_id, impression_id, viewer_id, source,
        credits_charged, is_ppc, ip_hash
    )
    VALUES (
        p_shop_id, p_impression_id, p_viewer_id, p_source,
        credits_to_charge, credits_to_charge > 0, p_ip_hash
    )
    RETURNING id INTO click_id;

    -- Update daily stats
    INSERT INTO public.ad_stats_daily (shop_id, stat_date, clicks, credits_spent, ppc_active)
    VALUES (p_shop_id, CURRENT_DATE, 1, credits_to_charge, credits_to_charge > 0)
    ON CONFLICT (shop_id, stat_date) DO UPDATE SET
        clicks = ad_stats_daily.clicks + 1,
        credits_spent = ad_stats_daily.credits_spent + credits_to_charge,
        ppc_active = ad_stats_daily.ppc_active OR (credits_to_charge > 0),
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'click_id', click_id,
        'credits_charged', credits_to_charge,
        'debug', debug_info
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.record_ad_click(TEXT, UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_ad_click(TEXT, UUID, UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.add_shop_credits(TEXT, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_shop_credits(TEXT, INTEGER, TEXT, TEXT) TO anon;
