-- Migration: Add notification for welcome credits
-- เพิ่มการแจ้งเตือนเมื่อได้รับเครดิตโบนัสร้านใหม่

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
            'โบนัสเครดิตสำหรับร้านใหม่'
        );

        -- Add notification
        PERFORM notify_shop(
            NEW.id,
            'เครดิตลงทะเบียนร้านใหม่สำเร็จ +' || welcome_amount,
            'ยินดีด้วย! คุณได้รับเครดิตโบนัสสำหรับร้านใหม่เรียบร้อยแล้ว',
            'welcome_bonus',
            'success',
            '/dashboard/credits'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
