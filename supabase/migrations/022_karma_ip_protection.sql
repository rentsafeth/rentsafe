-- =====================================================
-- 022_karma_ip_protection.sql
-- IP-Based Anti-Abuse Protection for Hearts
-- ป้องกันการสร้างหลาย Account มากดหัวใจให้ตัวเอง
-- =====================================================

-- =====================================================
-- 1. ADD IP ADDRESS COLUMN TO REPORT_HEARTS
-- =====================================================
ALTER TABLE report_hearts ADD COLUMN IF NOT EXISTS ip_address INET;

-- =====================================================
-- 2. ADD UNIQUE CONSTRAINT ON (report_id, ip_address)
-- ป้องกัน IP เดียวกันกดหัวใจรายงานเดียวกันหลายครั้ง
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_hearts_ip_unique 
ON report_hearts(report_id, ip_address) 
WHERE ip_address IS NOT NULL;

-- =====================================================
-- 3. CREATE INDEX FOR IP LOOKUPS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_report_hearts_ip ON report_hearts(ip_address);

-- =====================================================
-- 4. UPDATE FUNCTION: Toggle Heart with IP Check
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_report_heart(
    p_report_id UUID,
    p_ip_address INET DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_existing_heart UUID;
    v_reporter_id UUID;
    v_is_own_report BOOLEAN;
    v_heart_count INTEGER;
    v_new_balance INTEGER;
    v_ip_exists BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    -- Get reporter id
    SELECT reporter_id INTO v_reporter_id
    FROM reports WHERE id = p_report_id;

    IF v_reporter_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'report_not_found');
    END IF;

    -- Check if user is trying to heart their own report
    v_is_own_report := (v_reporter_id = v_user_id);
    IF v_is_own_report THEN
        RETURN jsonb_build_object('success', false, 'error', 'cannot_heart_own_report');
    END IF;

    -- Check if this IP already hearted this report (anti-abuse)
    IF p_ip_address IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM report_hearts 
            WHERE report_id = p_report_id 
            AND ip_address = p_ip_address
            AND user_id != v_user_id  -- Different user, same IP
        ) INTO v_ip_exists;

        IF v_ip_exists THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'ip_already_hearted',
                'message', 'This IP address has already hearted this report'
            );
        END IF;
    END IF;

    -- Check if already hearted by this user
    SELECT id INTO v_existing_heart
    FROM report_hearts
    WHERE report_id = p_report_id AND user_id = v_user_id;

    IF v_existing_heart IS NOT NULL THEN
        -- Remove heart
        DELETE FROM report_hearts WHERE id = v_existing_heart;

        -- Decrease heart count
        UPDATE reports SET heart_count = GREATEST(0, heart_count - 1)
        WHERE id = p_report_id
        RETURNING heart_count INTO v_heart_count;

        -- Note: We don't deduct karma when unhearting

        RETURN jsonb_build_object(
            'success', true,
            'action', 'removed',
            'heart_count', v_heart_count
        );
    ELSE
        -- Add heart with IP
        INSERT INTO report_hearts (report_id, user_id, ip_address)
        VALUES (p_report_id, v_user_id, p_ip_address);

        -- Increase heart count
        UPDATE reports SET heart_count = heart_count + 1
        WHERE id = p_report_id
        RETURNING heart_count INTO v_heart_count;

        -- Give 1 karma credit to reporter
        v_new_balance := add_karma_credits(
            v_reporter_id,
            1,
            'heart_received',
            'ได้รับหัวใจจากรายงาน',
            'report',
            p_report_id
        );

        RETURN jsonb_build_object(
            'success', true,
            'action', 'added',
            'heart_count', v_heart_count,
            'reporter_new_balance', v_new_balance
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 5. COMMENT
-- =====================================================
COMMENT ON COLUMN report_hearts.ip_address IS 'IP ของผู้กดหัวใจ - ใช้ป้องกันการปั่นจากหลาย Account';
