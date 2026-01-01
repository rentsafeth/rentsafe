-- =====================================================
-- 024_fix_subscription_purchase_function.sql
-- Fix: Change p_shop_id from UUID to TEXT to match shops.id
-- =====================================================

-- Drop the old function first (it has wrong parameter type)
DROP FUNCTION IF EXISTS purchase_subscription_with_credits(UUID, VARCHAR, INTEGER);

-- Recreate with correct TEXT type for shop_id
CREATE OR REPLACE FUNCTION purchase_subscription_with_credits(
    p_shop_id TEXT,
    p_plan_slug VARCHAR,
    p_credits_amount INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_shop_balance INTEGER;
    v_plan RECORD;
    v_new_balance INTEGER;
    v_subscription_id UUID;
    v_ends_at TIMESTAMPTZ;
    v_current_subscription RECORD;
BEGIN
    -- ตรวจสอบยอดเครดิต (lock row เพื่อป้องกัน race condition)
    SELECT credit_balance INTO v_shop_balance
    FROM shops
    WHERE id = p_shop_id
    FOR UPDATE;

    IF v_shop_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'shop_not_found');
    END IF;

    IF v_shop_balance < p_credits_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits', 'current_balance', v_shop_balance);
    END IF;

    -- ดึงข้อมูล plan
    SELECT * INTO v_plan FROM subscription_plans WHERE slug = p_plan_slug;

    IF v_plan IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'plan_not_found');
    END IF;

    -- ตรวจสอบ subscription ปัจจุบัน
    SELECT * INTO v_current_subscription
    FROM shop_subscriptions
    WHERE shop_id = p_shop_id AND status = 'active';

    -- คำนวณวันหมดอายุ
    IF v_current_subscription IS NOT NULL AND v_current_subscription.expires_at > NOW() THEN
        -- ต่ออายุจากวันหมดอายุปัจจุบัน
        v_ends_at := v_current_subscription.expires_at + (v_plan.duration_days || ' days')::INTERVAL;
    ELSE
        -- เริ่มใหม่จากวันนี้
        v_ends_at := NOW() + (v_plan.duration_days || ' days')::INTERVAL;
    END IF;

    -- หักเครดิต
    UPDATE shops
    SET credit_balance = credit_balance - p_credits_amount
    WHERE id = p_shop_id
    RETURNING credit_balance INTO v_new_balance;

    -- บันทึก transaction
    INSERT INTO credit_transactions (shop_id, amount, type, description, balance_after)
    VALUES (p_shop_id, -p_credits_amount, 'subscription_purchase',
            'ซื้อแพ็คเกจ ' || v_plan.name, v_new_balance);

    -- สร้าง/อัพเดท subscription
    IF v_current_subscription IS NOT NULL THEN
        -- อัพเดท subscription ที่มีอยู่
        UPDATE shop_subscriptions
        SET
            plan_id = v_plan.id,
            expires_at = v_ends_at,
            ends_at = v_ends_at,
            status = 'active',
            updated_at = NOW()
        WHERE id = v_current_subscription.id
        RETURNING id INTO v_subscription_id;
    ELSE
        -- สร้าง subscription ใหม่
        INSERT INTO shop_subscriptions (shop_id, plan_id, status, started_at, starts_at, expires_at, ends_at)
        VALUES (p_shop_id, v_plan.id, 'active', NOW(), NOW(), v_ends_at, v_ends_at)
        RETURNING id INTO v_subscription_id;
    END IF;

    -- อัพเดทสถานะร้าน
    UPDATE shops
    SET is_verified_shop = true, subscription_id = v_subscription_id
    WHERE id = p_shop_id;

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'new_balance', v_new_balance,
        'ends_at', v_ends_at,
        'plan_name', v_plan.name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix process_auto_renewals function
CREATE OR REPLACE FUNCTION process_auto_renewals() RETURNS TABLE (
    shop_id TEXT,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    v_sub RECORD;
    v_result JSONB;
BEGIN
    -- หา subscription ที่หมดอายุใน 1 วัน และเปิด auto_renew
    FOR v_sub IN
        SELECT ss.*, sp.slug as plan_slug, sp.credits_price, sp.name as plan_name, s.credit_balance
        FROM shop_subscriptions ss
        JOIN subscription_plans sp ON ss.plan_id = sp.id
        JOIN shops s ON ss.shop_id = s.id
        WHERE ss.status = 'active'
        AND ss.auto_renew_enabled = true
        AND ss.expires_at <= NOW() + INTERVAL '1 day'
        AND ss.expires_at > NOW()
    LOOP
        IF v_sub.credit_balance >= v_sub.credits_price THEN
            -- ต่ออายุอัตโนมัติ
            v_result := purchase_subscription_with_credits(
                v_sub.shop_id, v_sub.plan_slug, v_sub.credits_price
            );

            IF (v_result->>'success')::BOOLEAN THEN
                -- ส่งแจ้งเตือนสำเร็จ
                INSERT INTO notifications (target_type, target_id, shop_id, title, message, type, severity)
                VALUES ('shop', v_sub.shop_id, v_sub.shop_id,
                        'ต่ออายุร้านรับรองอัตโนมัติสำเร็จ',
                        'ระบบได้หักเครดิต ' || v_sub.credits_price || ' เครดิต เพื่อต่ออายุแพ็คเกจ ' || v_sub.plan_name || ' แล้ว',
                        'subscription', 'success');

                RETURN QUERY SELECT v_sub.shop_id, 'renewed'::TEXT, ('Renewed with ' || v_sub.credits_price || ' credits')::TEXT;
            ELSE
                RETURN QUERY SELECT v_sub.shop_id, 'failed'::TEXT, (v_result->>'error')::TEXT;
            END IF;
        ELSE
            -- เครดิตไม่พอ - ส่งแจ้งเตือน
            INSERT INTO notifications (target_type, target_id, shop_id, title, message, type, severity, action_url)
            VALUES ('shop', v_sub.shop_id, v_sub.shop_id,
                    'เครดิตไม่เพียงพอสำหรับต่ออายุอัตโนมัติ',
                    'กรุณาเติมเครดิตอย่างน้อย ' || v_sub.credits_price || ' เครดิต เพื่อต่ออายุ ' || v_sub.plan_name,
                    'subscription', 'warning', '/dashboard/credits');

            RETURN QUERY SELECT v_sub.shop_id, 'insufficient_credits'::TEXT,
                ('Need ' || v_sub.credits_price || ' credits, has ' || v_sub.credit_balance)::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION purchase_subscription_with_credits(TEXT, VARCHAR, INTEGER) IS 'ซื้อ subscription ด้วยเครดิต - หักทันที ไม่ต้องรอ admin อนุมัติ (Fixed: shop_id is TEXT)';
