-- 1. Create Function to Process Daily Boosts (Activate Pending & Expire Old)
-- รองรับ Timezone Asia/Bangkok เพื่อให้ตัดรอบตามเวลาไทย

CREATE OR REPLACE FUNCTION process_daily_boosts()
RETURNS json AS $$
DECLARE
    v_activated_count INT := 0;
    v_expired_count INT := 0;
    v_today_date DATE;
BEGIN
    -- ใช้วันที่ปัจจุบันตามเวลาไทย
    v_today_date := (NOW() AT TIME ZONE 'Asia/Bangkok')::date;

    -- 1. Activate Pending Boosts for Today (or past days pending)
    -- ดึงรายการจองที่ถึงกำหนดแล้วแต่ยังเป็น Pending
    WITH activated_schedules AS (
        UPDATE ad_schedules
        SET status = 'active',
            updated_at = NOW()
        WHERE type = 'boost'
          AND status = 'pending'
          AND start_date <= v_today_date
        RETURNING id, shop_id, end_date
    ),
    updated_settings AS (
        UPDATE shop_ad_settings s
        SET boost_active = true,
            -- ตั้งเวลาหมดอายุเป็น 23:59:59 ของวันสิ้นสุด (เวลาไทย)
            boost_expires_at = (a.end_date || ' 23:59:59.999')::timestamp AT TIME ZONE 'Asia/Bangkok',
            updated_at = NOW()
        FROM activated_schedules a
        WHERE s.shop_id = a.shop_id
        RETURNING s.shop_id
    )
    SELECT COUNT(*) INTO v_activated_count FROM updated_settings;

    -- 2. Expire Boosts that have ended
    -- ถ้าหมดเวลาแล้ว (เทียบกับเวลาปัจจุบัน) ให้ปิด Active
    WITH expired_updates AS (
        UPDATE shop_ad_settings
        SET boost_active = false,
            updated_at = NOW()
        WHERE boost_active = true
          AND boost_expires_at < NOW()
        RETURNING shop_id
    )
    SELECT COUNT(*) INTO v_expired_count FROM expired_updates;

    -- Return statistic
    RETURN json_build_object(
        'activated', v_activated_count,
        'expired', v_expired_count,
        'processed_date', v_today_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Run immediately to fix today's issue
SELECT process_daily_boosts();
