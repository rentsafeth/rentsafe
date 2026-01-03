-- 1. Check current DB time vs Bangkok time
SELECT 
    NOW() as db_time_utc, -- เวลา UTC ของ DB
    NOW() AT TIME ZONE 'Asia/Bangkok' as db_time_bkk, -- เวลาไทยที่ DB เห็น
    CURRENT_DATE as db_date, -- วันที่ที่ DB เห็น
    (NOW() AT TIME ZONE 'Asia/Bangkok')::date as bkk_date; -- วันที่ไทย

-- 2. Check pending schedules for today (Bangkok Time)
-- ดูรายการที่ควรจะ Active ในวันนี้ตามเวลาไทย
SELECT * 
FROM ad_schedules 
WHERE status = 'pending' 
  AND type = 'boost'
  AND start_date <= (NOW() AT TIME ZONE 'Asia/Bangkok')::date;

-- 3. Check current boost status in shop_ad_settings
-- ดูว่าตอนนี้ร้านตั้งค่า Boost ไว้อย่างไร
SELECT * 
FROM shop_ad_settings 
WHERE shop_id IN (
    SELECT shop_id 
    FROM ad_schedules 
    WHERE status = 'pending' 
      AND type = 'boost'
      AND start_date <= (NOW() AT TIME ZONE 'Asia/Bangkok')::date
);

-- 4. (Optional) Force Activate for testing
-- ถ้ารันแล้วเจอรายการในข้อ 2 แต่ยังไม่ Active สามารถ Manual Update ได้ด้วยคำสั่งนี้
/*
UPDATE shop_ad_settings
SET boost_active = true,
    boost_expires_at = ((NOW() AT TIME ZONE 'Asia/Bangkok')::date + interval '1 day' + interval '00:00:00')::timestamp
FROM ad_schedules
WHERE shop_ad_settings.shop_id = ad_schedules.shop_id
  AND ad_schedules.status = 'pending'
  AND ad_schedules.type = 'boost'
  AND ad_schedules.start_date <= (NOW() AT TIME ZONE 'Asia/Bangkok')::date;

UPDATE ad_schedules
SET status = 'active'
WHERE status = 'pending' 
  AND type = 'boost'
  AND start_date <= (NOW() AT TIME ZONE 'Asia/Bangkok')::date;
*/
