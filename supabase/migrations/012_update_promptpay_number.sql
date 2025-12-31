-- 012_update_payment_settings.sql
-- Update PromptPay number and Bank Account in system_settings

-- Update PromptPay number
INSERT INTO system_settings (key, value, description)
VALUES ('promptpay_number', '"0983236189"', 'PromptPay number for receiving payments')
ON CONFLICT (key) DO UPDATE SET value = '"0983236189"';

-- Add Bank Account settings
INSERT INTO system_settings (key, value, description)
VALUES ('bank_name', '"ธ.กสิกรไทย"', 'Bank name for receiving payments')
ON CONFLICT (key) DO UPDATE SET value = '"ธ.กสิกรไทย"';

INSERT INTO system_settings (key, value, description)
VALUES ('bank_account_number', '"116-8-176534"', 'Bank account number for receiving payments')
ON CONFLICT (key) DO UPDATE SET value = '"116-8-176534"';

INSERT INTO system_settings (key, value, description)
VALUES ('bank_account_name', '"จตุพร เพิ่มทองคำ"', 'Bank account holder name')
ON CONFLICT (key) DO UPDATE SET value = '"จตุพร เพิ่มทองคำ"';
