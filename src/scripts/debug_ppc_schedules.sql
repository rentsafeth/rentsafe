-- Debug PPC Schedules
SELECT 
    id,
    shop_id,
    type,
    status,
    start_date,
    end_date,
    ppc_bid,
    ppc_daily_budget,
    created_at,
    -- เปรียบเทียบกับวันที่ปัจจุบัน (ไทย)
    (start_date <= (NOW() AT TIME ZONE 'Asia/Bangkok')::date) as should_be_active_start,
    (end_date >= (NOW() AT TIME ZONE 'Asia/Bangkok')::date) as should_be_active_end
FROM ad_schedules
WHERE type = 'ppc'
ORDER BY created_at DESC;
