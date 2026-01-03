-- 1. อนุญาตให้ reported_by_shop_id เป็น NULL ได้ (สำหรับข้อมูลที่นำเข้าโดย Admin)
ALTER TABLE customer_blacklist ALTER COLUMN reported_by_shop_id DROP NOT NULL;

-- 2. แก้ไข Trigger ให้เช็คว่ามี shop_id ก่อนส่งแจ้งเตือนร้านค้าเจ้าของเรื่อง
CREATE OR REPLACE FUNCTION trigger_blacklist_approved()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        -- Notify the reporter (ONLY IF reported_by_shop_id IS NOT NULL)
        IF NEW.reported_by_shop_id IS NOT NULL THEN
            PERFORM notify_shop(
                NEW.reported_by_shop_id,
                'รายงานได้รับการอนุมัติ',
                'รายงานลูกค้า ' || NEW.first_name || ' ' || LEFT(NEW.last_name, 1) || '*** ได้ถูกเพิ่มเข้าระบบ Blacklist แล้ว',
                'blacklist_new',
                'success',
                '/dashboard/blacklist',
                jsonb_build_object('blacklist_id', NEW.id)
            );
        END IF;

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

-- 3. ตรวจสอบข้อมูล
SELECT * FROM customer_blacklist ORDER BY created_at DESC LIMIT 50;
