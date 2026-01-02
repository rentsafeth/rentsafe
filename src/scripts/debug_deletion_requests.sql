-- =====================================================
-- Script ตรวจสอบคำขอลบรายงาน (Debug Deletion Requests)
-- =====================================================

-- 1. ดูจำนวนคำขอลบทั้งหมด
SELECT count(*) as total_requests FROM report_deletion_requests;

-- 2. ดูรายละเอียดคำขอลบ 10 รายการล่าสุด
SELECT 
    rdr.id,
    rdr.status,
    rdr.reason,
    rdr.created_at,
    p.email as user_email,
    r.description as report_desc
FROM report_deletion_requests rdr
LEFT JOIN profiles p ON rdr.user_id = p.id
LEFT JOIN reports r ON rdr.report_id = r.id
ORDER BY rdr.created_at DESC
LIMIT 10;

-- 3. เช็คว่ามี Policy อะไรบ้างบนตารางนี้
SELECT * FROM pg_policies WHERE tablename = 'report_deletion_requests';
