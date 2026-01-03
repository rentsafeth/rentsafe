-- 1. แก้ไขข้อมูลเก่าให้ถูกต้อง (Force 'credit' type for existing positive transactions)
-- สมมติว่ารายการที่ amount เป็นบวกและ description เกี่ยวกับการได้รับเครดิต คือ credit ทั้งหมด
UPDATE karma_transactions 
SET type = 'credit' 
WHERE (type IS NULL OR type ILIKE 'credit' OR description LIKE '%ได้รับเครดิต%')
AND amount > 0;

-- 2. แก้ไข Function ให้ใช้ชื่อคอลัมน์ที่ถูกต้อง (type) แทน transaction_type
CREATE OR REPLACE FUNCTION approve_report_and_give_karma(
    p_report_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_reporter_id uuid;
    v_current_status text;
BEGIN
    -- Get report info
    SELECT reporter_id, status INTO v_reporter_id, v_current_status
    FROM reports WHERE id = p_report_id;

    IF v_reporter_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'report_not_found');
    END IF;

    -- Update report status to approved
    UPDATE reports SET status = 'approved' WHERE id = p_report_id;

    -- Give karma ONLY if not already approved
    IF v_current_status != 'approved' THEN
        -- Insert transaction (Trigger will handle profile update automatically)
        -- Note: We don't need to UPDATE profiles manually anymore because of the trigger
        INSERT INTO karma_transactions (user_id, amount, type, source_type, source_id, description)
        VALUES (v_reporter_id, 10, 'credit', 'report_approved', p_report_id, 'ได้รับเครดิตจากการอนุมัติรายงาน (+10)');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
