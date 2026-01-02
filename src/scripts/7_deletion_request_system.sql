-- =====================================================
-- ระบบขอลบรายงานและจัดการเครดิต
-- รันใน Supabase SQL Editor
-- =====================================================

-- 1. สร้างตารางเก็บคำร้องขอลบ
CREATE TABLE IF NOT EXISTS report_deletion_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE report_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests" ON report_deletion_requests;
CREATE POLICY "Users can view own requests" 
ON report_deletion_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own requests" ON report_deletion_requests;
CREATE POLICY "Users can create own requests" 
ON report_deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all requests" ON report_deletion_requests;
CREATE POLICY "Admins can view all requests" 
ON report_deletion_requests FOR SELECT TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update requests" ON report_deletion_requests;
CREATE POLICY "Admins can update requests" 
ON report_deletion_requests FOR UPDATE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Function คำนวณเครดิตที่จะถูกลบ (เท่ากับจำนวนหัวใจที่ได้)
CREATE OR REPLACE FUNCTION get_report_karma_count(p_report_id uuid)
RETURNS int AS $$
DECLARE
    v_count int;
BEGIN
    SELECT heart_count INTO v_count
    FROM reports
    WHERE id = p_report_id;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function สำหรับ Admin อนุมัติการลบ
CREATE OR REPLACE FUNCTION approve_report_deletion(
    p_request_id uuid,
    p_admin_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_request RECORD;
    v_report_id uuid;
    v_reporter_id uuid;
    v_karma_to_deduct int;
BEGIN
    -- Get request details
    SELECT * INTO v_request 
    FROM report_deletion_requests 
    WHERE id = p_request_id AND status = 'pending';
    
    IF v_request IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'request_not_found_or_processed');
    END IF;
    
    v_report_id := v_request.report_id;
    v_reporter_id := v_request.user_id;
    
    -- Calculate karma to deduct (from hearts)
    SELECT heart_count INTO v_karma_to_deduct
    FROM reports
    WHERE id = v_report_id;
    
    v_karma_to_deduct := COALESCE(v_karma_to_deduct, 0);
    
    -- Deduct karma from reporter
    IF v_karma_to_deduct > 0 THEN
        UPDATE profiles 
        SET karma_credits = GREATEST(karma_credits - v_karma_to_deduct, 0)
        WHERE id = v_reporter_id;
        
        -- Log transaction
        INSERT INTO karma_transactions (
            user_id, 
            amount, 
            transaction_type, 
            source_type, 
            source_id, 
            description
        ) VALUES (
            v_reporter_id, 
            -v_karma_to_deduct, 
            'debit', 
            'report_deleted', 
            v_report_id, 
            'Report deleted by request (Karma reversal)'
        );
    END IF;
    
    -- Update request status
    UPDATE report_deletion_requests
    SET status = 'approved',
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Delete the report (Cascade will handle hearts and other related data)
    DELETE FROM reports WHERE id = v_report_id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'karma_deducted', v_karma_to_deduct
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_report_karma_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_report_deletion(uuid, uuid) TO authenticated;
