-- ============================================================
-- RUN ALL MIGRATIONS: 008, 009, 010, 011
-- Safe to run multiple times (uses IF NOT EXISTS, ON CONFLICT)
-- ============================================================

-- ============================================================
-- 008: FIX AD FUNCTIONS SECURITY
-- ============================================================

-- Fix record_ad_click function
CREATE OR REPLACE FUNCTION record_ad_click(
    p_shop_id TEXT,
    p_impression_id UUID DEFAULT NULL,
    p_viewer_id UUID DEFAULT NULL,
    p_source TEXT DEFAULT 'search',
    p_ip_hash TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    ad_settings RECORD;
    credits_to_charge INTEGER := 0;
    new_balance INTEGER;
    click_id UUID;
BEGIN
    SELECT * INTO ad_settings
    FROM shop_ad_settings
    WHERE shop_id = p_shop_id;

    IF ad_settings IS NOT NULL AND ad_settings.ppc_enabled THEN
        IF ad_settings.ppc_daily_budget = 0 OR
           ad_settings.ppc_spent_today < ad_settings.ppc_daily_budget THEN
            credits_to_charge := ad_settings.ppc_bid;
            new_balance := add_shop_credits(
                p_shop_id,
                -credits_to_charge,
                'ad_click',
                'PPC Click'
            );
            UPDATE shop_ad_settings
            SET ppc_spent_today = ppc_spent_today + credits_to_charge,
                updated_at = NOW()
            WHERE shop_id = p_shop_id;
        END IF;
    END IF;

    INSERT INTO ad_clicks (
        shop_id, impression_id, viewer_id, source,
        credits_charged, is_ppc, ip_hash
    )
    VALUES (
        p_shop_id, p_impression_id, p_viewer_id, p_source,
        credits_to_charge, credits_to_charge > 0, p_ip_hash
    )
    RETURNING id INTO click_id;

    INSERT INTO ad_stats_daily (shop_id, stat_date, clicks, credits_spent)
    VALUES (p_shop_id, CURRENT_DATE, 1, credits_to_charge)
    ON CONFLICT (shop_id, stat_date) DO UPDATE SET
        clicks = ad_stats_daily.clicks + 1,
        credits_spent = ad_stats_daily.credits_spent + credits_to_charge,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'click_id', click_id,
        'credits_charged', credits_to_charge
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix record_ad_impression function
CREATE OR REPLACE FUNCTION record_ad_impression(
    p_shop_id TEXT,
    p_viewer_id UUID DEFAULT NULL,
    p_source TEXT DEFAULT 'search',
    p_search_query TEXT DEFAULT NULL,
    p_province TEXT DEFAULT NULL,
    p_position INTEGER DEFAULT NULL,
    p_is_boosted BOOLEAN DEFAULT false,
    p_is_ppc BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    impression_id UUID;
BEGIN
    INSERT INTO ad_impressions (
        shop_id, viewer_id, source, search_query,
        province, position, is_boosted, is_ppc
    )
    VALUES (
        p_shop_id, p_viewer_id, p_source, p_search_query,
        p_province, p_position, p_is_boosted, p_is_ppc
    )
    RETURNING id INTO impression_id;

    INSERT INTO ad_stats_daily (shop_id, stat_date, impressions)
    VALUES (p_shop_id, CURRENT_DATE, 1)
    ON CONFLICT (shop_id, stat_date) DO UPDATE SET
        impressions = ad_stats_daily.impressions + 1,
        updated_at = NOW();

    RETURN impression_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_ad_click TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_ad_impression TO anon, authenticated;

-- ============================================================
-- 009: PAYMENT OPTIONS
-- ============================================================

ALTER TABLE shops ADD COLUMN IF NOT EXISTS pay_on_pickup BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS accept_credit_card BOOLEAN DEFAULT false;

COMMENT ON COLUMN shops.pay_on_pickup IS 'Shop accepts payment on vehicle pickup';
COMMENT ON COLUMN shops.accept_credit_card IS 'Shop accepts credit card payment';

-- ============================================================
-- 010: SUBSCRIPTION, NOTIFICATION, BLACKLIST SYSTEM
-- ============================================================

-- 1. SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, features) VALUES
('ฟรี', 'free', 0, 0, '{"blacklist_search_per_day": 3, "show_contact_buttons": false, "is_verified": false, "deposit_guarantee": 0}'),
('Pro รายเดือน', 'pro_monthly', 99, 0, '{"blacklist_search_per_day": -1, "show_contact_buttons": true, "is_verified": true, "deposit_guarantee": 1000}'),
('Pro รายปี', 'pro_yearly', 0, 999, '{"blacklist_search_per_day": -1, "show_contact_buttons": true, "is_verified": true, "deposit_guarantee": 1000}')
ON CONFLICT (slug) DO NOTHING;

-- 2. SHOP SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS shop_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id)
);

ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_verified_shop BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES shop_subscriptions(id);

-- 3. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type VARCHAR(20) NOT NULL,
    target_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 4. CUSTOMER BLACKLIST TABLE
CREATE TABLE IF NOT EXISTS customer_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_card_hash VARCHAR(64) NOT NULL,
    id_card_last4 VARCHAR(4),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    reported_by_shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    reason_type VARCHAR(50) NOT NULL,
    reason_detail TEXT NOT NULL,
    incident_date DATE,
    evidence_urls TEXT[],
    severity VARCHAR(20) DEFAULT 'warning',
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    rejection_reason TEXT,
    report_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blacklist_id_hash ON customer_blacklist(id_card_hash);
CREATE INDEX IF NOT EXISTS idx_blacklist_phone ON customer_blacklist(phone_number);
CREATE INDEX IF NOT EXISTS idx_blacklist_name ON customer_blacklist(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_blacklist_status ON customer_blacklist(status);

-- 5. BLACKLIST SEARCH LOGS
CREATE TABLE IF NOT EXISTS blacklist_search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    search_query VARCHAR(255),
    search_type VARCHAR(20),
    result_found BOOLEAN DEFAULT false,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_shop_date ON blacklist_search_logs(shop_id, searched_at);

-- 6. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES shop_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    qr_code_url VARCHAR(500),
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    slip_url VARCHAR(500),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ROW LEVEL SECURITY
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "Shop owners can view their subscription" ON shop_subscriptions;
CREATE POLICY "Shop owners can view their subscription"
ON shop_subscriptions FOR SELECT TO authenticated
USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view approved blacklist" ON customer_blacklist;
CREATE POLICY "Authenticated users can view approved blacklist"
ON customer_blacklist FOR SELECT TO authenticated USING (status = 'approved');

DROP POLICY IF EXISTS "Shop owners can view their reports" ON customer_blacklist;
CREATE POLICY "Shop owners can view their reports"
ON customer_blacklist FOR SELECT TO authenticated
USING (reported_by_shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Shop owners can report customers" ON customer_blacklist;
CREATE POLICY "Shop owners can report customers"
ON customer_blacklist FOR INSERT TO authenticated
WITH CHECK (reported_by_shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Shop owners can manage their search logs" ON blacklist_search_logs;
CREATE POLICY "Shop owners can manage their search logs"
ON blacklist_search_logs FOR ALL TO authenticated
USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Shop owners can view their payments" ON payment_transactions;
CREATE POLICY "Shop owners can view their payments"
ON payment_transactions FOR SELECT TO authenticated
USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- 8. HELPER FUNCTIONS
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

CREATE OR REPLACE FUNCTION get_remaining_blacklist_searches(p_shop_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_is_pro BOOLEAN;
    v_searches_today INTEGER;
    v_limit INTEGER;
BEGIN
    v_is_pro := is_shop_pro(p_shop_id);
    IF v_is_pro THEN RETURN -1; END IF;

    SELECT COUNT(*) INTO v_searches_today
    FROM blacklist_search_logs
    WHERE shop_id = p_shop_id
    AND searched_at >= CURRENT_DATE
    AND searched_at < CURRENT_DATE + INTERVAL '1 day';

    v_limit := 3;
    RETURN GREATEST(0, v_limit - v_searches_today);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    FROM shops s WHERE s.is_verified_shop = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- 9. TRIGGERS
CREATE OR REPLACE FUNCTION trigger_blacklist_approved()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        PERFORM notify_shop(
            NEW.reported_by_shop_id,
            'รายงานได้รับการอนุมัติ',
            'รายงานลูกค้า ' || NEW.first_name || ' ' || LEFT(NEW.last_name, 1) || '*** ได้ถูกเพิ่มเข้าระบบ Blacklist แล้ว',
            'blacklist_new', 'success', '/dashboard/blacklist',
            jsonb_build_object('blacklist_id', NEW.id)
        );
        PERFORM notify_verified_shops(
            'Blacklist ใหม่',
            'มีลูกค้าใหม่ถูกเพิ่มเข้า Blacklist: ' || NEW.first_name || ' ' || LEFT(NEW.last_name, 1) || '*** - ' || NEW.reason_type,
            'blacklist_new', 'warning',
            jsonb_build_object('blacklist_id', NEW.id, 'severity', NEW.severity)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_blacklist_status_change ON customer_blacklist;
CREATE TRIGGER on_blacklist_status_change
    AFTER UPDATE OF status ON customer_blacklist
    FOR EACH ROW EXECUTE FUNCTION trigger_blacklist_approved();

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

DROP TRIGGER IF EXISTS on_subscription_change ON shop_subscriptions;
CREATE TRIGGER on_subscription_change
    AFTER INSERT OR UPDATE ON shop_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_shop_verified_status();

-- ============================================================
-- 011: PAYMENT ENHANCEMENTS
-- ============================================================

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS plan_slug VARCHAR(50);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES auth.users(id);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE shop_subscriptions ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shop_subscriptions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

UPDATE shop_subscriptions SET starts_at = started_at WHERE starts_at IS NULL AND started_at IS NOT NULL;
UPDATE shop_subscriptions SET ends_at = expires_at WHERE ends_at IS NULL AND expires_at IS NOT NULL;

ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30;

UPDATE subscription_plans SET duration_days = 30 WHERE slug = 'pro_monthly';
UPDATE subscription_plans SET duration_days = 365 WHERE slug = 'pro_yearly';
UPDATE subscription_plans SET duration_days = 0 WHERE slug = 'free';

DROP POLICY IF EXISTS "Shop owners can create payments" ON payment_transactions;
CREATE POLICY "Shop owners can create payments"
ON payment_transactions FOR INSERT TO authenticated
WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_shop ON notifications(shop_id);

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications"
ON notifications FOR SELECT TO authenticated
USING (
    target_type = 'all'
    OR target_id = auth.uid()
    OR shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR (target_type = 'verified_shops' AND EXISTS (
        SELECT 1 FROM shop_subscriptions ss
        JOIN shops s ON ss.shop_id = s.id
        WHERE s.owner_id = auth.uid() AND ss.status = 'active'
    ))
);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- DONE! All migrations 008-011 completed.
-- ============================================================
-- Don't forget to create Storage bucket "payment-slips" manually in Supabase Dashboard!
