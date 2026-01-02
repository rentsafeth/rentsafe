-- =====================================================
-- Script ตรวจสอบสถานะการติดตั้งฟีเจอร์ต่างๆ (แบบแสดงผลเป็นตาราง)
-- รันใน Supabase SQL Editor
-- =====================================================

WITH check_results AS (
    -- 1. ตรวจสอบ IP Tracking
    SELECT 
        'IP Tracking (reports.reporter_ip)' as feature,
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reports' AND column_name = 'reporter_ip'
        ) THEN '✅ ติดตั้งแล้ว' ELSE '❌ ยังไม่ติดตั้ง (รัน add_reporter_ip.sql)' END as status

    UNION ALL

    -- 2. ตรวจสอบ Merge Functions
    SELECT 
        'Function: find_related_blacklist_entries',
        CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'find_related_blacklist_entries') 
        THEN '✅ ติดตั้งแล้ว' ELSE '❌ ยังไม่ติดตั้ง (รัน 5_blacklist_merge_functions.sql)' END

    UNION ALL

    SELECT 
        'Function: merge_blacklist_entries',
        CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'merge_blacklist_entries') 
        THEN '✅ ติดตั้งแล้ว' ELSE '❌ ยังไม่ติดตั้ง (รัน 5_blacklist_merge_functions.sql)' END

    UNION ALL

    -- 3. ตรวจสอบ Heart & Karma System
    SELECT 
        'Function: toggle_report_heart',
        CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'toggle_report_heart') 
        THEN '✅ ติดตั้งแล้ว' ELSE '❌ ยังไม่ติดตั้ง (รัน 6_heart_karma_toggle.sql)' END

    UNION ALL

    SELECT 
        'Table: report_hearts',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_hearts') 
        THEN '✅ ติดตั้งแล้ว' ELSE '❌ ยังไม่ติดตั้ง (รัน 6_heart_karma_toggle.sql)' END

    UNION ALL

    SELECT 
        'Table: karma_transactions',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'karma_transactions') 
        THEN '✅ ติดตั้งแล้ว' ELSE '❌ ยังไม่ติดตั้ง (รัน 6_heart_karma_toggle.sql)' END

    UNION ALL

    SELECT 
        'Column: profiles.karma_credits',
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'karma_credits'
        ) THEN '✅ ติดตั้งแล้ว' ELSE '❌ ยังไม่ติดตั้ง (รัน 6_heart_karma_toggle.sql)' END
)
SELECT * FROM check_results;
