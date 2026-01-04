-- Fix Blacklist Notification Trigger
-- Updates the trigger to correctly insert notifications with 'blacklist_id' in data
-- and uses correct column names for the notifications table (based on schema check).

-- 1. DROP old triggers and functions to clean up
DROP TRIGGER IF EXISTS trigger_on_blacklist_approved ON customer_blacklist;
DROP FUNCTION IF EXISTS trigger_blacklist_approved() CASCADE;
DROP FUNCTION IF EXISTS trigger_blacklist_approved_direct() CASCADE;
DROP FUNCTION IF EXISTS trigger_blacklist_approved_corrected() CASCADE;
-- Also drop old helper functions if they exist and are no longer needed
-- DROP FUNCTION IF EXISTS notify_shop CASCADE; 
-- DROP FUNCTION IF EXISTS notify_verified_shops CASCADE;

-- 2. Create the Trigger Function with embedded logic (Safe & Direct)
CREATE OR REPLACE FUNCTION trigger_blacklist_approved_corrected()
RETURNS TRIGGER AS $$
DECLARE
    v_shop_record RECORD;
BEGIN
    -- Only trigger when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- A. Notify the Reporter (Shop Owner)
        -- Using 'shop_id' and 'target_type' based on notifications table schema
        IF NEW.reported_by_shop_id IS NOT NULL THEN
            INSERT INTO notifications (
                shop_id,
                target_type,
                target_id,
                title,
                message,
                type,
                action_url,     -- Correct column name
                action_label,   -- Correct column name
                data,
                is_read
            )
            VALUES (
                NEW.reported_by_shop_id, -- shop_id
                'shop',                  -- target_type
                NEW.reported_by_shop_id, -- target_id
                'รายงานได้รับการอนุมัติ',
                'รายงานลูกค้า ' || NEW.first_name || ' ' || LEFT(NEW.last_name, 1) || '*** ได้ถูกเพิ่มเข้าระบบ Blacklist แล้ว',
                'blacklist_approved',
                '/dashboard/blacklist',
                'success',
                jsonb_build_object('blacklist_id', NEW.id), -- Critical: Include blacklist_id for deep linking
                false
            );
        END IF;

        -- B. Notify all Verified Shops
        -- Iterate through shops where is_verified_shop is true (Correct column name)
        FOR v_shop_record IN SELECT id FROM shops WHERE is_verified_shop = true
        LOOP
            -- Avoid sending duplicate notification to the reporter
            IF NEW.reported_by_shop_id IS NULL OR v_shop_record.id != NEW.reported_by_shop_id THEN
                INSERT INTO notifications (
                    shop_id,
                    target_type,
                    target_id,
                    title,
                    message,
                    type,
                    action_url,
                    action_label,
                    data,
                    is_read
                ) VALUES (
                    v_shop_record.id,        -- shop_id
                    'shop',                  -- target_type
                    v_shop_record.id,        -- target_id
                    'Blacklist ใหม่',
                    'มีลูกค้าใหม่ถูกเพิ่มเข้า Blacklist: ' || NEW.first_name || ' ' || LEFT(NEW.last_name, 1) || '*** (' || NEW.reason_type || ')',
                    'blacklist_new',
                    '/dashboard/blacklist',
                    'warning',
                    jsonb_build_object('blacklist_id', NEW.id, 'severity', NEW.severity), -- Critical: Include blacklist_id
                    false
                );
            END IF;
        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the Trigger
CREATE TRIGGER trigger_on_blacklist_approved
AFTER UPDATE ON customer_blacklist
FOR EACH ROW
EXECUTE FUNCTION trigger_blacklist_approved_corrected();
