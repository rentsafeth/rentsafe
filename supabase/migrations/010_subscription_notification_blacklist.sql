-- 010_subscription_notification_blacklist.sql
-- Subscription, Notification, and Customer Blacklist System

-- =====================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL, -- 'free', 'pro_monthly', 'pro_yearly'
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, features) VALUES
('ฟรี', 'free', 0, 0, '{"blacklist_search_per_day": 3, "show_contact_buttons": false, "is_verified": false, "deposit_guarantee": 0}'),
('Pro รายเดือน', 'pro_monthly', 99, 0, '{"blacklist_search_per_day": -1, "show_contact_buttons": true, "is_verified": true, "deposit_guarantee": 1000}'),
('Pro รายปี', 'pro_yearly', 0, 999, '{"blacklist_search_per_day": -1, "show_contact_buttons": true, "is_verified": true, "deposit_guarantee": 1000}')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2. SHOP SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shop_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'pending'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50), -- 'promptpay', 'credit_card', 'bank_transfer'
    payment_reference VARCHAR(255),
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id) -- One active subscription per shop
);

-- Add subscription columns to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_verified_shop BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES shop_subscriptions(id);

-- =====================================================
-- 3. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Target
    target_type VARCHAR(20) NOT NULL, -- 'all', 'shop', 'user', 'verified_shops'
    target_id UUID, -- shop_id or user_id (null for 'all')

    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'announcement', 'warning', 'blacklist_new', 'subscription', 'system'
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'danger', 'success'

    -- Link/Action
    action_url VARCHAR(500),
    action_label VARCHAR(100),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================================
-- 4. CUSTOMER BLACKLIST TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Customer Info (encrypted in app, hash for search)
    id_card_hash VARCHAR(64) NOT NULL, -- SHA256 hash of ID card for searching
    id_card_last4 VARCHAR(4), -- Last 4 digits for display
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),

    -- Report Info
    reported_by_shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    reason_type VARCHAR(50) NOT NULL, -- 'no_return', 'damage', 'no_pay', 'fake_docs', 'other'
    reason_detail TEXT NOT NULL,
    incident_date DATE,
    evidence_urls TEXT[], -- Array of image URLs

    -- Severity & Status
    severity VARCHAR(20) DEFAULT 'warning', -- 'warning', 'moderate', 'severe'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'

    -- Admin Review
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    rejection_reason TEXT,

    -- Report Count (updated by trigger)
    report_count INTEGER DEFAULT 1,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_blacklist_id_hash ON customer_blacklist(id_card_hash);
CREATE INDEX IF NOT EXISTS idx_blacklist_phone ON customer_blacklist(phone_number);
CREATE INDEX IF NOT EXISTS idx_blacklist_name ON customer_blacklist(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_blacklist_status ON customer_blacklist(status);

-- =====================================================
-- 5. BLACKLIST SEARCH LOGS (Rate Limiting)
-- =====================================================
CREATE TABLE IF NOT EXISTS blacklist_search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    search_query VARCHAR(255),
    search_type VARCHAR(20), -- 'id_card', 'phone', 'name'
    result_found BOOLEAN DEFAULT false,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for counting daily searches
CREATE INDEX IF NOT EXISTS idx_search_logs_shop_date ON blacklist_search_logs(shop_id, searched_at);

-- =====================================================
-- 6. PAYMENT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES shop_subscriptions(id),

    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    payment_method VARCHAR(50) NOT NULL, -- 'promptpay', 'credit_card', 'bank_transfer'

    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'

    -- Payment Gateway Info
    gateway VARCHAR(50), -- 'stripe', 'omise', 'manual'
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,

    -- QR Code for PromptPay
    qr_code_url VARCHAR(500),
    qr_expires_at TIMESTAMP WITH TIME ZONE,

    -- Slip Upload (for manual verification)
    slip_url VARCHAR(500),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Subscription Plans - Public read
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT
TO public
USING (is_active = true);

-- Shop Subscriptions - Shop owner can view their own
CREATE POLICY "Shop owners can view their subscription"
ON shop_subscriptions FOR SELECT
TO authenticated
USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- Notifications - Users can view their own notifications
CREATE POLICY "Users can view their notifications"
ON notifications FOR SELECT
TO authenticated
USING (
    target_type = 'all'
    OR target_id = auth.uid()
    OR (target_type = 'shop' AND target_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
    OR (target_type = 'verified_shops' AND EXISTS (
        SELECT 1 FROM shops WHERE owner_id = auth.uid() AND is_verified_shop = true
    ))
);

-- Customer Blacklist - Approved entries visible to all authenticated
CREATE POLICY "Authenticated users can view approved blacklist"
ON customer_blacklist FOR SELECT
TO authenticated
USING (status = 'approved');

-- Customer Blacklist - Shop owners can view their own pending reports
CREATE POLICY "Shop owners can view their reports"
ON customer_blacklist FOR SELECT
TO authenticated
USING (
    reported_by_shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- Customer Blacklist - Shop owners can insert
CREATE POLICY "Shop owners can report customers"
ON customer_blacklist FOR INSERT
TO authenticated
WITH CHECK (
    reported_by_shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- Blacklist Search Logs - Shop owners can view and insert their own
CREATE POLICY "Shop owners can manage their search logs"
ON blacklist_search_logs FOR ALL
TO authenticated
USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- Payment Transactions - Shop owners can view their own
CREATE POLICY "Shop owners can view their payments"
ON payment_transactions FOR SELECT
TO authenticated
USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to check if shop has active Pro subscription
CREATE OR REPLACE FUNCTION is_shop_pro(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM shop_subscriptions ss
        JOIN subscription_plans sp ON ss.plan_id = sp.id
        WHERE ss.shop_id = p_shop_id
        AND ss.status = 'active'
        AND (ss.expires_at IS NULL OR ss.expires_at > NOW())
        AND sp.slug IN ('pro_monthly', 'pro_yearly')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining blacklist searches for today
CREATE OR REPLACE FUNCTION get_remaining_blacklist_searches(p_shop_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_is_pro BOOLEAN;
    v_searches_today INTEGER;
    v_limit INTEGER;
BEGIN
    -- Check if Pro
    v_is_pro := is_shop_pro(p_shop_id);

    IF v_is_pro THEN
        RETURN -1; -- Unlimited
    END IF;

    -- Count today's searches
    SELECT COUNT(*) INTO v_searches_today
    FROM blacklist_search_logs
    WHERE shop_id = p_shop_id
    AND searched_at >= CURRENT_DATE
    AND searched_at < CURRENT_DATE + INTERVAL '1 day';

    -- Free limit is 3
    v_limit := 3;

    RETURN GREATEST(0, v_limit - v_searches_today);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for all verified shops
CREATE OR REPLACE FUNCTION notify_verified_shops(
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(30),
    p_severity VARCHAR(20) DEFAULT 'info',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO notifications (target_type, target_id, title, message, type, severity, metadata)
    SELECT 'shop', s.id, p_title, p_message, p_type, p_severity, p_metadata
    FROM shops s
    WHERE s.is_verified_shop = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify shop owner
CREATE OR REPLACE FUNCTION notify_shop(
    p_shop_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(30),
    p_severity VARCHAR(20) DEFAULT 'info',
    p_action_url VARCHAR(500) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (target_type, target_id, title, message, type, severity, action_url, metadata)
    VALUES ('shop', p_shop_id, p_title, p_message, p_type, p_severity, p_action_url, p_metadata)
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Trigger: When blacklist report is approved, notify all verified shops
CREATE OR REPLACE FUNCTION trigger_blacklist_approved()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        -- Notify the reporter
        PERFORM notify_shop(
            NEW.reported_by_shop_id,
            'รายงานได้รับการอนุมัติ',
            'รายงานลูกค้า ' || NEW.first_name || ' ' || LEFT(NEW.last_name, 1) || '*** ได้ถูกเพิ่มเข้าระบบ Blacklist แล้ว',
            'blacklist_new',
            'success',
            '/dashboard/blacklist',
            jsonb_build_object('blacklist_id', NEW.id)
        );

        -- Notify all verified shops
        PERFORM notify_verified_shops(
            'Blacklist ใหม่',
            'มีลูกค้าใหม่ถูกเพิ่มเข้า Blacklist: ' || NEW.first_name || ' ' || LEFT(NEW.last_name, 1) || '*** - ' || NEW.reason_type,
            'blacklist_new',
            'warning',
            jsonb_build_object('blacklist_id', NEW.id, 'severity', NEW.severity)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_blacklist_status_change
    AFTER UPDATE OF status ON customer_blacklist
    FOR EACH ROW
    EXECUTE FUNCTION trigger_blacklist_approved();

-- Trigger: Notify when subscription is about to expire (7 days before)
-- This would typically be called by a cron job

-- Update shop is_verified_shop when subscription changes
CREATE OR REPLACE FUNCTION update_shop_verified_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shops
    SET is_verified_shop = (
        NEW.status = 'active'
        AND (NEW.expires_at IS NULL OR NEW.expires_at > NOW())
    )
    WHERE id = NEW.shop_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_change
    AFTER INSERT OR UPDATE ON shop_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_verified_status();

-- =====================================================
-- 10. COMMENTS
-- =====================================================
COMMENT ON TABLE subscription_plans IS 'Available subscription plans (Free, Pro Monthly, Pro Yearly)';
COMMENT ON TABLE shop_subscriptions IS 'Shop subscription records';
COMMENT ON TABLE notifications IS 'In-app notifications for shops and users';
COMMENT ON TABLE customer_blacklist IS 'Customer blacklist reported by shops';
COMMENT ON TABLE blacklist_search_logs IS 'Log of blacklist searches for rate limiting';
COMMENT ON TABLE payment_transactions IS 'Payment transaction records';

COMMENT ON COLUMN customer_blacklist.id_card_hash IS 'SHA256 hash of ID card number for searching';
COMMENT ON COLUMN customer_blacklist.reason_type IS 'no_return, damage, no_pay, fake_docs, other';
COMMENT ON COLUMN customer_blacklist.status IS 'pending (awaiting review), approved, rejected';
