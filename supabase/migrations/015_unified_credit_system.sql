-- =====================================================
-- 015_unified_credit_system.sql
-- Unified Credit System for Ads + Subscription
-- =====================================================

-- 1. เพิ่มคอลัมน์ใน credit_orders สำหรับป้องกันการแจ้งซ้ำ
ALTER TABLE credit_orders ADD COLUMN IF NOT EXISTS transfer_datetime TIMESTAMPTZ;
ALTER TABLE credit_orders ADD COLUMN IF NOT EXISTS slip_hash VARCHAR(64);

-- สร้าง unique index เพื่อป้องกัน slip ซ้ำ (เฉพาะที่ยังไม่ถูก rejected)
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_orders_slip_hash
    ON credit_orders(slip_hash) WHERE slip_hash IS NOT NULL AND status != 'rejected';

-- 2. เพิ่ม auto_renew setting ใน shop_subscriptions
ALTER TABLE shop_subscriptions ADD COLUMN IF NOT EXISTS auto_renew_enabled BOOLEAN DEFAULT false;

-- 3. เพิ่มคอลัมน์ credits_price ใน subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS credits_price INTEGER DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30;

-- อัพเดทราคา subscription plans
UPDATE subscription_plans SET credits_price = 99, duration_days = 30 WHERE slug = 'pro_monthly';
UPDATE subscription_plans SET credits_price = 999, duration_days = 365 WHERE slug = 'pro_yearly';

-- 4. เพิ่ม type ใหม่ใน credit_transactions
-- อัพเดท CHECK constraint เพื่อรองรับ type 'subscription_purchase'
DO $$
BEGIN
    -- ลบ constraint เดิม
    ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

    -- เพิ่ม constraint ใหม่ที่รองรับ subscription_purchase
    ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_type_check
        CHECK (type IN ('welcome_bonus', 'topup', 'ad_click', 'ad_impression', 'daily_boost', 'refund', 'admin_adjustment', 'subscription_purchase', 'subscription_renewal'));
END $$;

-- 5. Function สำหรับซื้อ subscription ด้วยเครดิต
CREATE OR REPLACE FUNCTION purchase_subscription_with_credits(
    p_shop_id UUID,
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
    WHERE id = p_shop_id::TEXT
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
    WHERE id = p_shop_id::TEXT
    RETURNING credit_balance INTO v_new_balance;

    -- บันทึก transaction
    INSERT INTO credit_transactions (shop_id, amount, type, description, balance_after)
    VALUES (p_shop_id::TEXT, -p_credits_amount, 'subscription_purchase',
            'ซื้อแพ็คเกจ ' || v_plan.name, v_new_balance);

    -- สร้าง/อัพเดท subscription
    IF v_current_subscription IS NOT NULL THEN
        -- อัพเดท subscription ที่มีอยู่
        UPDATE shop_subscriptions
        SET
            plan_id = v_plan.id,
            expires_at = v_ends_at,
            status = 'active',
            updated_at = NOW()
        WHERE id = v_current_subscription.id
        RETURNING id INTO v_subscription_id;
    ELSE
        -- สร้าง subscription ใหม่
        INSERT INTO shop_subscriptions (shop_id, plan_id, status, started_at, expires_at)
        VALUES (p_shop_id, v_plan.id, 'active', NOW(), v_ends_at)
        RETURNING id INTO v_subscription_id;
    END IF;

    -- อัพเดทสถานะร้าน
    UPDATE shops
    SET is_verified_shop = true, subscription_id = v_subscription_id
    WHERE id = p_shop_id::TEXT;

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'new_balance', v_new_balance,
        'ends_at', v_ends_at,
        'plan_name', v_plan.name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function สำหรับต่ออายุอัตโนมัติ
CREATE OR REPLACE FUNCTION process_auto_renewals() RETURNS TABLE (
    shop_id UUID,
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
        JOIN shops s ON ss.shop_id::TEXT = s.id
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
                INSERT INTO notifications (target_type, target_id, title, message, type, severity)
                VALUES ('shop', v_sub.shop_id,
                        'ต่ออายุร้านรับรองอัตโนมัติสำเร็จ',
                        'ระบบได้หักเครดิต ' || v_sub.credits_price || ' เครดิต เพื่อต่ออายุแพ็คเกจ ' || v_sub.plan_name || ' แล้ว',
                        'subscription', 'success');

                RETURN QUERY SELECT v_sub.shop_id, 'renewed'::TEXT, ('Renewed with ' || v_sub.credits_price || ' credits')::TEXT;
            ELSE
                RETURN QUERY SELECT v_sub.shop_id, 'failed'::TEXT, (v_result->>'error')::TEXT;
            END IF;
        ELSE
            -- เครดิตไม่พอ - ส่งแจ้งเตือน
            INSERT INTO notifications (target_type, target_id, title, message, type, severity, action_url)
            VALUES ('shop', v_sub.shop_id,
                    'เครดิตไม่เพียงพอสำหรับต่ออายุอัตโนมัติ',
                    'กรุณาเติมเครดิตอย่างน้อย ' || v_sub.credits_price || ' เครดิต เพื่อต่ออายุ ' || v_sub.plan_name,
                    'subscription', 'warning', '/dashboard/credits');

            RETURN QUERY SELECT v_sub.shop_id, 'insufficient_credits'::TEXT,
                ('Need ' || v_sub.credits_price || ' credits, has ' || v_sub.credit_balance)::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function สำหรับตรวจสอบ slip ซ้ำ
CREATE OR REPLACE FUNCTION check_duplicate_slip(p_slip_hash VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM credit_orders
        WHERE slip_hash = p_slip_hash
        AND status != 'rejected'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function สำหรับหาร้านที่มีเครดิตต่ำ
CREATE OR REPLACE FUNCTION get_low_credit_shops(p_threshold INTEGER DEFAULT 100)
RETURNS TABLE (
    shop_id TEXT,
    shop_name TEXT,
    credit_balance INTEGER,
    has_active_subscription BOOLEAN,
    subscription_ends_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as shop_id,
        s.name as shop_name,
        s.credit_balance,
        (ss.id IS NOT NULL AND ss.status = 'active' AND ss.expires_at > NOW()) as has_active_subscription,
        ss.expires_at as subscription_ends_at
    FROM shops s
    LEFT JOIN shop_subscriptions ss ON s.id = ss.shop_id::TEXT AND ss.status = 'active'
    WHERE s.credit_balance < p_threshold
    AND s.verification_status = 'verified';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function สำหรับส่งแจ้งเตือนเครดิตต่ำ
CREATE OR REPLACE FUNCTION send_low_credit_notifications(p_threshold INTEGER DEFAULT 100)
RETURNS INTEGER AS $$
DECLARE
    v_shop RECORD;
    v_count INTEGER := 0;
    v_existing_notification UUID;
BEGIN
    FOR v_shop IN SELECT * FROM get_low_credit_shops(p_threshold) LOOP
        -- ตรวจสอบว่าส่งแจ้งเตือนไปแล้วในวันนี้หรือยัง
        SELECT id INTO v_existing_notification
        FROM notifications
        WHERE target_type = 'shop'
        AND target_id = v_shop.shop_id::UUID
        AND type = 'credit_low'
        AND created_at >= CURRENT_DATE
        LIMIT 1;

        IF v_existing_notification IS NULL THEN
            INSERT INTO notifications (target_type, target_id, title, message, type, severity, action_url)
            VALUES ('shop', v_shop.shop_id::UUID,
                    'เครดิตเหลือน้อย',
                    'ยอดเครดิตของคุณเหลือเพียง ' || v_shop.credit_balance || ' เครดิต กรุณาเติมเครดิตเพื่อใช้บริการต่อ',
                    'credit_low', 'warning', '/dashboard/credits');
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Index เพิ่มเติมสำหรับ performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_subscriptions_expires_at ON shop_subscriptions(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_shops_credit_balance ON shops(credit_balance) WHERE verification_status = 'verified';

-- 11. Comments
COMMENT ON COLUMN credit_orders.transfer_datetime IS 'วันเวลาที่ผู้ใช้ระบุว่าโอนเงิน';
COMMENT ON COLUMN credit_orders.slip_hash IS 'SHA256 hash ของ slip image เพื่อป้องกันการใช้ slip ซ้ำ';
COMMENT ON COLUMN shop_subscriptions.auto_renew_enabled IS 'เปิด/ปิดการต่ออายุอัตโนมัติ';
COMMENT ON COLUMN subscription_plans.credits_price IS 'ราคาเป็นเครดิต (99 = รายเดือน, 999 = รายปี)';
COMMENT ON COLUMN subscription_plans.duration_days IS 'จำนวนวันที่ได้รับ (30 = รายเดือน, 365 = รายปี)';
COMMENT ON FUNCTION purchase_subscription_with_credits IS 'ซื้อ subscription ด้วยเครดิต - หักทันที ไม่ต้องรอ admin อนุมัติ';
COMMENT ON FUNCTION process_auto_renewals IS 'ต่ออายุอัตโนมัติสำหรับร้านที่เปิดใช้งาน - เรียกจาก cron job';
COMMENT ON FUNCTION send_low_credit_notifications IS 'ส่งแจ้งเตือนเครดิตต่ำ - เรียกจาก cron job (วันละครั้ง)';
