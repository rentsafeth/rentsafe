-- 009_payment_options.sql
-- Add payment option fields to shops table

-- Payment options
ALTER TABLE shops ADD COLUMN IF NOT EXISTS pay_on_pickup BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS accept_credit_card BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN shops.pay_on_pickup IS 'Shop accepts payment on vehicle pickup';
COMMENT ON COLUMN shops.accept_credit_card IS 'Shop accepts credit card payment';
