-- =====================================================
-- อัพเดท toggle_report_heart function ให้รองรับ karma credits
-- รันใน Supabase SQL Editor
-- =====================================================

-- ลบ function เก่า (ถ้ามี)
DROP FUNCTION IF EXISTS toggle_report_heart(uuid, text);

-- สร้าง function ใหม่ที่รองรับ toggle karma credits
CREATE OR REPLACE FUNCTION toggle_report_heart(
    p_report_id uuid,
    p_ip_address text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_reporter_id uuid;
    v_existing_heart_id uuid;
    v_new_heart_count int;
    v_action text;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;
    
    -- Get report's reporter_id
    SELECT reporter_id INTO v_reporter_id 
    FROM reports 
    WHERE id = p_report_id;
    
    IF v_reporter_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'report_not_found');
    END IF;
    
    -- Can't heart your own report
    IF v_user_id = v_reporter_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'cannot_heart_own_report');
    END IF;
    
    -- Check if already hearted
    SELECT id INTO v_existing_heart_id
    FROM report_hearts 
    WHERE report_id = p_report_id AND user_id = v_user_id;
    
    IF v_existing_heart_id IS NOT NULL THEN
        -- REMOVE HEART (toggle off)
        DELETE FROM report_hearts WHERE id = v_existing_heart_id;
        
        -- Decrement heart_count
        UPDATE reports 
        SET heart_count = GREATEST(COALESCE(heart_count, 0) - 1, 0)
        WHERE id = p_report_id
        RETURNING heart_count INTO v_new_heart_count;
        
        -- REMOVE karma credit from reporter
        UPDATE profiles 
        SET karma_credits = GREATEST(COALESCE(karma_credits, 0) - 1, 0)
        WHERE id = v_reporter_id;
        
        -- Log karma transaction (negative)
        INSERT INTO karma_transactions (user_id, amount, transaction_type, source_type, source_id, description)
        VALUES (v_reporter_id, -1, 'debit', 'heart_removed', p_report_id, 'Heart removed from report');
        
        v_action := 'removed';
    ELSE
        -- ADD HEART (toggle on)
        INSERT INTO report_hearts (report_id, user_id, ip_address)
        VALUES (p_report_id, v_user_id, p_ip_address);
        
        -- Increment heart_count
        UPDATE reports 
        SET heart_count = COALESCE(heart_count, 0) + 1
        WHERE id = p_report_id
        RETURNING heart_count INTO v_new_heart_count;
        
        -- ADD karma credit to reporter
        UPDATE profiles 
        SET karma_credits = COALESCE(karma_credits, 0) + 1
        WHERE id = v_reporter_id;
        
        -- Log karma transaction (positive)
        INSERT INTO karma_transactions (user_id, amount, transaction_type, source_type, source_id, description)
        VALUES (v_reporter_id, 1, 'credit', 'heart_received', p_report_id, 'Heart received on report');
        
        v_action := 'added';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'action', v_action,
        'heart_count', COALESCE(v_new_heart_count, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION toggle_report_heart(uuid, text) TO authenticated;

-- =====================================================
-- สร้าง tables ที่จำเป็น (ถ้ายังไม่มี)
-- =====================================================

-- report_hearts table
CREATE TABLE IF NOT EXISTS report_hearts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(report_id, user_id)
);

-- karma_transactions table  
CREATE TABLE IF NOT EXISTS karma_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount int NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    source_type text NOT NULL,
    source_id uuid,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Add karma_credits column to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'karma_credits'
    ) THEN
        ALTER TABLE profiles ADD COLUMN karma_credits int DEFAULT 0;
    END IF;
END $$;

-- Add heart_count column to reports if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' AND column_name = 'heart_count'
    ) THEN
        ALTER TABLE reports ADD COLUMN heart_count int DEFAULT 0;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_report_hearts_report_id ON report_hearts(report_id);
CREATE INDEX IF NOT EXISTS idx_report_hearts_user_id ON report_hearts(user_id);
CREATE INDEX IF NOT EXISTS idx_karma_transactions_user_id ON karma_transactions(user_id);

-- RLS for report_hearts
ALTER TABLE report_hearts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid errors
DROP POLICY IF EXISTS "Users can view all hearts" ON report_hearts;
DROP POLICY IF EXISTS "Users can insert own hearts" ON report_hearts;
DROP POLICY IF EXISTS "Users can delete own hearts" ON report_hearts;

-- Create policies
CREATE POLICY "Users can view all hearts" 
ON report_hearts FOR SELECT USING (true);

CREATE POLICY "Users can insert own hearts" 
ON report_hearts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hearts" 
ON report_hearts FOR DELETE USING (auth.uid() = user_id);
