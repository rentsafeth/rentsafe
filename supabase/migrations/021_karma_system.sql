-- =====================================================
-- 021_karma_system.sql
-- Karma System - เครดิตปลอบใจ (Community Credit System)
-- ระบบให้รางวัลผู้ใช้ที่รายงานมิจฉาชีพและได้รับหัวใจจากชุมชน
-- =====================================================

-- =====================================================
-- 1. USER KARMA TABLE
-- เก็บยอดเครดิตปลอบใจของผู้ใช้แต่ละคน
-- =====================================================
CREATE TABLE IF NOT EXISTS user_karma (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_credits INTEGER DEFAULT 0,
    total_hearts_received INTEGER DEFAULT 0,
    total_reports_submitted INTEGER DEFAULT 0,
    total_reports_verified INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- 2. KARMA TRANSACTIONS TABLE
-- ประวัติการได้รับ/ใช้เครดิตปลอบใจ
-- =====================================================
CREATE TABLE IF NOT EXISTS karma_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'heart_received', 'report_verified', 'bonus', 'reward_redeemed'
    reference_type VARCHAR(50), -- 'report', 'blacklist_entry', 'reward'
    reference_id UUID,
    description TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. REPORT HEARTS TABLE
-- เก็บการกดหัวใจของผู้ใช้บนรายงาน
-- =====================================================
CREATE TABLE IF NOT EXISTS report_hearts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

-- =====================================================
-- 4. ADD HEART COUNT TO REPORTS TABLE
-- =====================================================
ALTER TABLE reports ADD COLUMN IF NOT EXISTS heart_count INTEGER DEFAULT 0;

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_karma_user_id ON user_karma(user_id);
CREATE INDEX IF NOT EXISTS idx_user_karma_credits ON user_karma(total_credits DESC);
CREATE INDEX IF NOT EXISTS idx_karma_transactions_user_id ON karma_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_karma_transactions_created_at ON karma_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_karma_transactions_type ON karma_transactions(type);
CREATE INDEX IF NOT EXISTS idx_report_hearts_report_id ON report_hearts(report_id);
CREATE INDEX IF NOT EXISTS idx_report_hearts_user_id ON report_hearts(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_heart_count ON reports(heart_count DESC);

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE user_karma ENABLE ROW LEVEL SECURITY;
ALTER TABLE karma_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_hearts ENABLE ROW LEVEL SECURITY;

-- User Karma - Users can view their own karma
DROP POLICY IF EXISTS "Users can view their own karma" ON user_karma;
CREATE POLICY "Users can view their own karma" ON user_karma
    FOR SELECT USING (user_id = auth.uid());

-- User Karma - Admins can view all
DROP POLICY IF EXISTS "Admins can view all karma" ON user_karma;
CREATE POLICY "Admins can view all karma" ON user_karma
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Karma Transactions - Users can view their own transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON karma_transactions;
CREATE POLICY "Users can view their own transactions" ON karma_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Karma Transactions - Admins can view all
DROP POLICY IF EXISTS "Admins can manage all karma transactions" ON karma_transactions;
CREATE POLICY "Admins can manage all karma transactions" ON karma_transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Report Hearts - Anyone authenticated can view hearts
DROP POLICY IF EXISTS "Anyone can view report hearts" ON report_hearts;
CREATE POLICY "Anyone can view report hearts" ON report_hearts
    FOR SELECT TO authenticated USING (true);

-- Report Hearts - Authenticated users can insert (via function)
DROP POLICY IF EXISTS "Authenticated users can heart reports" ON report_hearts;
CREATE POLICY "Authenticated users can heart reports" ON report_hearts
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Report Hearts - Users can delete their own hearts
DROP POLICY IF EXISTS "Users can remove their own hearts" ON report_hearts;
CREATE POLICY "Users can remove their own hearts" ON report_hearts
    FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 7. FUNCTION: Add Karma Credits
-- =====================================================
CREATE OR REPLACE FUNCTION add_karma_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_type VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Get or create user karma record
    INSERT INTO user_karma (user_id, total_credits)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Get current balance
    SELECT total_credits INTO v_current_balance
    FROM user_karma WHERE user_id = p_user_id FOR UPDATE;

    v_new_balance := v_current_balance + p_amount;

    -- Update balance
    UPDATE user_karma
    SET total_credits = v_new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Update counters based on type
    IF p_type = 'heart_received' THEN
        UPDATE user_karma
        SET total_hearts_received = total_hearts_received + 1
        WHERE user_id = p_user_id;
    ELSIF p_type = 'report_verified' THEN
        UPDATE user_karma
        SET total_reports_verified = total_reports_verified + 1
        WHERE user_id = p_user_id;
    END IF;

    -- Log transaction
    INSERT INTO karma_transactions (
        user_id, amount, type, description,
        reference_type, reference_id, balance_after
    )
    VALUES (
        p_user_id, p_amount, p_type, p_description,
        p_reference_type, p_reference_id, v_new_balance
    );

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 8. FUNCTION: Toggle Heart on Report
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_report_heart(p_report_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_existing_heart UUID;
    v_reporter_id UUID;
    v_is_own_report BOOLEAN;
    v_heart_count INTEGER;
    v_new_balance INTEGER;
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

    -- Check if already hearted
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
        -- Add heart
        INSERT INTO report_hearts (report_id, user_id)
        VALUES (p_report_id, v_user_id);

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
-- 9. FUNCTION: Get User Karma
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_karma(p_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_karma RECORD;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    -- Get or create karma record
    INSERT INTO user_karma (user_id, total_credits)
    VALUES (v_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_karma FROM user_karma WHERE user_id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'total_credits', v_karma.total_credits,
        'total_hearts_received', v_karma.total_hearts_received,
        'total_reports_submitted', v_karma.total_reports_submitted,
        'total_reports_verified', v_karma.total_reports_verified
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 10. TRIGGER: Update reporter karma when report is approved
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_report_approved_karma()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        -- Give 10 karma credits to reporter for verified report
        PERFORM add_karma_credits(
            NEW.reporter_id,
            10,
            'report_verified',
            'รายงานได้รับการยืนยัน',
            'report',
            NEW.id
        );

        -- Update user_karma counters
        UPDATE user_karma
        SET total_reports_verified = total_reports_verified + 1
        WHERE user_id = NEW.reporter_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_approved_karma ON reports;
CREATE TRIGGER on_report_approved_karma
    AFTER UPDATE OF status ON reports
    FOR EACH ROW
    EXECUTE FUNCTION trigger_report_approved_karma();

-- =====================================================
-- 11. TRIGGER: Update total_reports_submitted when new report is created
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_report_created_karma()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure user has karma record
    INSERT INTO user_karma (user_id, total_credits, total_reports_submitted)
    VALUES (NEW.reporter_id, 0, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_reports_submitted = user_karma.total_reports_submitted + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_created_karma ON reports;
CREATE TRIGGER on_report_created_karma
    AFTER INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION trigger_report_created_karma();

-- =====================================================
-- 12. COMMENTS
-- =====================================================
COMMENT ON TABLE user_karma IS 'เก็บยอดเครดิตปลอบใจของผู้ใช้';
COMMENT ON TABLE karma_transactions IS 'ประวัติการได้รับ/ใช้เครดิตปลอบใจ';
COMMENT ON TABLE report_hearts IS 'การกดหัวใจบนรายงาน - 1 หัวใจ = 1 เครดิตให้ผู้รายงาน';
COMMENT ON COLUMN user_karma.total_credits IS 'ยอดเครดิตปลอบใจรวม';
COMMENT ON COLUMN user_karma.total_hearts_received IS 'จำนวนหัวใจที่ได้รับทั้งหมด';
COMMENT ON COLUMN karma_transactions.type IS 'heart_received (1 credit), report_verified (10 credits), bonus, reward_redeemed';
