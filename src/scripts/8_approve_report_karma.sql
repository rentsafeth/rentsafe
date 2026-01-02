-- =====================================================
-- Function สำหรับอนุมัติรายงานและแจกเครดิต 10 แต้ม
-- =====================================================

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

    -- Give karma ONLY if not already approved (prevent double karma)
    IF v_current_status != 'approved' THEN
        -- Update profile karma (+10)
        UPDATE profiles 
        SET karma_credits = COALESCE(karma_credits, 0) + 10
        WHERE id = v_reporter_id;

        -- Log transaction
        INSERT INTO karma_transactions (user_id, amount, transaction_type, source_type, source_id, description)
        VALUES (v_reporter_id, 10, 'credit', 'report_approved', p_report_id, 'ได้รับเครดิตจากการอนุมัติรายงาน (+10)');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION approve_report_and_give_karma(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_report_and_give_karma(uuid) TO service_role;
