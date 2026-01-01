-- Migration: Fix welcome bonus description message
-- แก้ไขข้อความโบนัสเครดิตให้ถูกต้อง

-- อัพเดท function give_welcome_credits ให้ใช้ข้อความที่ถูกต้อง
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

        -- Add welcome credits with correct message
        PERFORM add_shop_credits(
            NEW.id,
            welcome_amount,
            'welcome_bonus',
            'โบนัสเครดิตสำหรับร้านใหม่'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_welcome_credits ON shops;
CREATE TRIGGER trigger_welcome_credits
    AFTER UPDATE ON shops
    FOR EACH ROW
    EXECUTE FUNCTION give_welcome_credits();
