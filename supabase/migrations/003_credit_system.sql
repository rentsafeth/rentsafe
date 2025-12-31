-- =============================================
-- Credit System for RentSafe
-- =============================================

-- 1. System Settings Table (for enable/disable features)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
    ('credit_topup_enabled', 'false', 'Enable/disable credit top-up feature'),
    ('welcome_credits', '1000', 'Free credits given to new verified shops'),
    ('promptpay_number', '"0838068396"', 'PromptPay number for receiving payments')
ON CONFLICT (key) DO NOTHING;

-- 2. Credit Packages Table
CREATE TABLE IF NOT EXISTS credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    credits INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default packages (1 บาท = 1 เครดิต)
INSERT INTO credit_packages (name, description, price, credits, bonus_credits, sort_order) VALUES
    ('100 เครดิต', 'แพ็คเกจเริ่มต้น', 100, 100, 0, 1),
    ('300 เครดิต', 'แพ็คเกจยอดนิยม', 300, 300, 0, 2),
    ('500 เครดิต', 'แพ็คเกจคุ้มค่า', 500, 500, 0, 3),
    ('1,000 เครดิต', 'แพ็คเกจพรีเมียม', 1000, 1000, 0, 4)
ON CONFLICT DO NOTHING;

-- 3. Credit Orders Table (for tracking top-up requests)
CREATE TABLE IF NOT EXISTS credit_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    package_id UUID REFERENCES credit_packages(id),
    reference_code TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    credits_to_add INTEGER NOT NULL,
    slip_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Credit Transactions Table (for tracking all credit movements)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive = add, negative = deduct
    type TEXT NOT NULL CHECK (type IN ('welcome_bonus', 'topup', 'ad_click', 'ad_impression', 'daily_boost', 'refund', 'admin_adjustment')),
    description TEXT,
    reference_id UUID, -- can reference credit_orders.id or ad_clicks.id etc.
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add credit_balance to shops table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'shops' AND column_name = 'credit_balance') THEN
        ALTER TABLE shops ADD COLUMN credit_balance INTEGER DEFAULT 0;
    END IF;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_orders_shop_id ON credit_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_credit_orders_status ON credit_orders(status);
CREATE INDEX IF NOT EXISTS idx_credit_orders_reference_code ON credit_orders(reference_code);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_shop_id ON credit_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- 7. Function to generate unique reference code
CREATE OR REPLACE FUNCTION generate_reference_code()
RETURNS TEXT AS $$
DECLARE
    ref_code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Format: RS-YYYYMMDD-XXXX (random 4 chars)
        ref_code := 'RS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

        SELECT COUNT(*) INTO exists_count FROM credit_orders WHERE reference_code = ref_code;
        EXIT WHEN exists_count = 0;
    END LOOP;

    RETURN ref_code;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to add credits to shop (with transaction logging)
CREATE OR REPLACE FUNCTION add_shop_credits(
    p_shop_id TEXT,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_balance INTEGER;
BEGIN
    -- Update shop balance
    UPDATE shops
    SET credit_balance = COALESCE(credit_balance, 0) + p_amount
    WHERE id = p_shop_id
    RETURNING credit_balance INTO new_balance;

    -- Log transaction
    INSERT INTO credit_transactions (shop_id, amount, type, description, reference_id, balance_after)
    VALUES (p_shop_id, p_amount, p_type, p_description, p_reference_id, new_balance);

    RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to give welcome bonus when shop is verified
CREATE OR REPLACE FUNCTION give_welcome_credits()
RETURNS TRIGGER AS $$
DECLARE
    welcome_amount INTEGER;
BEGIN
    -- Only trigger when status changes to 'verified'
    IF NEW.verification_status = 'verified' AND
       (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN

        -- Get welcome credits amount from settings
        SELECT (value::TEXT)::INTEGER INTO welcome_amount
        FROM system_settings WHERE key = 'welcome_credits';

        IF welcome_amount IS NULL THEN
            welcome_amount := 1000; -- Default
        END IF;

        -- Add welcome credits
        PERFORM add_shop_credits(
            NEW.id,
            welcome_amount,
            'welcome_bonus',
            'เครดิตต้อนรับสำหรับร้านค้าใหม่'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for welcome credits
DROP TRIGGER IF EXISTS trigger_welcome_credits ON shops;
CREATE TRIGGER trigger_welcome_credits
    AFTER UPDATE ON shops
    FOR EACH ROW
    EXECUTE FUNCTION give_welcome_credits();

-- 10. RLS Policies

-- System Settings: Only admin can modify, everyone can read
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings" ON system_settings
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify system settings" ON system_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Credit Packages: Everyone can read active packages
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active credit packages" ON credit_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage credit packages" ON credit_packages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Credit Orders: Shop owners can see their own, admins can see all
ALTER TABLE credit_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view their own orders" ON credit_orders
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

CREATE POLICY "Shop owners can create orders for their shop" ON credit_orders
    FOR INSERT WITH CHECK (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

CREATE POLICY "Shop owners can update their pending orders" ON credit_orders
    FOR UPDATE USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
        AND status = 'pending'
    );

CREATE POLICY "Admins can manage all credit orders" ON credit_orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Credit Transactions: Shop owners can see their own, admins can see all
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view their own transactions" ON credit_transactions
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

CREATE POLICY "Admins can view all transactions" ON credit_transactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 11. Storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-slips', 'payment-slips', false)
ON CONFLICT DO NOTHING;

-- Storage policies for payment slips
CREATE POLICY "Shop owners can upload slips" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-slips' AND
        auth.uid() IN (
            SELECT owner_id FROM shops WHERE id::TEXT = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Shop owners can view their slips" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-slips' AND
        auth.uid() IN (
            SELECT owner_id FROM shops WHERE id::TEXT = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Admins can view all slips" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-slips' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
