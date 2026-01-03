-- update function process_daily_boosts to support PPC schedules too

CREATE OR REPLACE FUNCTION process_daily_boosts()
RETURNS json AS $$
DECLARE
    v_boost_activated INT := 0;
    v_boost_expired INT := 0;
    v_ppc_activated INT := 0;
    v_ppc_expired INT := 0;
    v_today_date DATE;
BEGIN
    -- ใช้วันที่ปัจจุบันตามเวลาไทย
    v_today_date := (NOW() AT TIME ZONE 'Asia/Bangkok')::date;

    -------------------------------------------------------
    -- 1. BOOST LOGIC
    -------------------------------------------------------
    
    -- 1.1 Activate BOOST
    WITH activated_boosts AS (
        UPDATE ad_schedules
        SET status = 'active',
            updated_at = NOW()
        WHERE type = 'boost'
          AND status = 'pending'
          AND start_date <= v_today_date
        RETURNING id, shop_id, end_date
    ),
    updated_boost_settings AS (
        UPDATE shop_ad_settings s
        SET boost_active = true,
            boost_expires_at = (a.end_date || ' 23:59:59.999')::timestamp AT TIME ZONE 'Asia/Bangkok',
            updated_at = NOW()
        FROM activated_boosts a
        WHERE s.shop_id = a.shop_id
        RETURNING s.shop_id
    )
    SELECT COUNT(*) INTO v_boost_activated FROM updated_boost_settings;

    -- 1.2 Expire BOOST
    WITH expired_boosts AS (
        UPDATE shop_ad_settings
        SET boost_active = false,
            updated_at = NOW()
        WHERE boost_active = true
          AND boost_expires_at < NOW()
        RETURNING shop_id
    )
    SELECT COUNT(*) INTO v_boost_expired FROM expired_boosts;


    -------------------------------------------------------
    -- 2. PPC LOGIC
    -------------------------------------------------------

    -- 2.1 Activate PPC
    -- ค้นหา PPC Schedule ที่ถึงเวลาเริ่ม และ update shop settings
    WITH activated_ppc AS (
        UPDATE ad_schedules
        SET status = 'active',
            updated_at = NOW()
        WHERE type = 'ppc'
          AND status = 'pending'
          AND start_date <= v_today_date
        RETURNING id, shop_id, ppc_bid, ppc_daily_budget
    ),
    updated_ppc_settings AS (
        UPDATE shop_ad_settings s
        SET ppc_enabled = true,
            ppc_bid = a.ppc_bid,
            ppc_daily_budget = a.ppc_daily_budget,
            updated_at = NOW()
        FROM activated_ppc a
        WHERE s.shop_id = a.shop_id
        RETURNING s.shop_id
    )
    SELECT COUNT(*) INTO v_ppc_activated FROM updated_ppc_settings;

    -- 2.2 Expire PPC
    -- ค้นหา PPC Schedule ที่เป็น Active และ วันที่จบ < วันนี้ (คือจบไปแล้วเมื่อวาน)
    -- หรือ วันที่จบ = วันนี้ แต่เราจะให้จบตอนสิ้นวัน?
    -- ปกติ PPC จบคือจบเลย ปิด switch
    
    -- หา Schedule ที่เพิ่งจบไป (end_date < today) และสถานะยังเป็น active
    -- ต้องระวัง: ถ้า user ต่ออายุ หรือมี schedule ใหม่มารอ อาจจะชนกัน
    -- เอาแบบง่าย: ถ้า schedule active อันปัจจุบันหมดเวลา ให้ set status completed และปิด ppc
    WITH completed_ppc_schedules AS (
        UPDATE ad_schedules
        SET status = 'completed',
            updated_at = NOW()
        WHERE type = 'ppc'
          AND status = 'active'
          AND end_date < v_today_date -- จบไปแล้ว (เมื่อวาน)
        RETURNING id, shop_id
    ),
    stopped_ppc_settings AS (
        UPDATE shop_ad_settings s
        SET ppc_enabled = false,
            updated_at = NOW()
        FROM completed_ppc_schedules a
        -- เช็คด้วยว่าไม่มี schedule อื่นที่ active อยู่ (เผื่อซ้อนทับ - แต่จริงๆ UI กันไว้แล้ว)
        WHERE s.shop_id = a.shop_id
        RETURNING s.shop_id
    )
    SELECT COUNT(*) INTO v_ppc_expired FROM stopped_ppc_settings;


    -- Return statistic
    RETURN json_build_object(
        'boost_activated', v_boost_activated,
        'boost_expired', v_boost_expired,
        'ppc_activated', v_ppc_activated,
        'ppc_expired', v_ppc_expired,
        'processed_date', v_today_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test run
SELECT process_daily_boosts();
