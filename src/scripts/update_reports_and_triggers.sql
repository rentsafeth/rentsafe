-- 1. Add new columns to reports table
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS manual_facebook_url text,
ADD COLUMN IF NOT EXISTS manual_line_id text,
ADD COLUMN IF NOT EXISTS manual_phone_number text;

-- 2. Update the trigger function to handle new columns
CREATE OR REPLACE FUNCTION link_report_to_blacklist()
RETURNS TRIGGER AS $$
DECLARE
    v_bank TEXT;
    v_phone TEXT;
    v_line TEXT;
    v_facebook TEXT;
    v_idcard TEXT;
    v_shop_name TEXT;
    v_blacklist_id UUID;
    v_existing_id UUID;
BEGIN
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
        IF NEW.shop_id IS NOT NULL THEN
            -- Try to get contact info from registered shop
            -- Note: Assuming shops table has these columns. If not, they will be null.
            SELECT bank_account_no, phone_number, name, facebook_url, line_id
            INTO v_bank, v_phone, v_shop_name, v_facebook, v_line
            FROM shops WHERE id = NEW.shop_id;
        ELSE
            v_bank := NEW.manual_bank_account;
            v_phone := NEW.manual_phone_number;
            v_line := NEW.manual_line_id;
            v_facebook := NEW.manual_facebook_url;
            v_shop_name := NEW.manual_shop_name;
            v_idcard := NEW.manual_id_card;
            
            -- Fallback: If specific columns are empty but legacy contact field has data, 
            -- we might want to use it, but for now let's rely on the new columns 
            -- as the ReportForm will be updated to fill them.
            IF v_phone IS NULL AND NEW.manual_shop_contact IS NOT NULL THEN
                v_phone := NEW.manual_shop_contact;
            END IF;
        END IF;

        -- Find existing blacklist entry by bank account
        IF v_bank IS NOT NULL THEN
            SELECT id INTO v_existing_id
            FROM blacklist_entries
            WHERE bank_account_no = v_bank;
        END IF;

        IF v_existing_id IS NOT NULL THEN
            v_blacklist_id := v_existing_id;
            UPDATE blacklist_entries SET
                phone_numbers = CASE
                    WHEN v_phone IS NOT NULL AND NOT (v_phone = ANY(phone_numbers))
                    THEN array_append(phone_numbers, v_phone)
                    ELSE phone_numbers
                END,
                line_ids = CASE
                    WHEN v_line IS NOT NULL AND NOT (v_line = ANY(line_ids))
                    THEN array_append(line_ids, v_line)
                    ELSE line_ids
                END,
                facebook_urls = CASE
                    WHEN v_facebook IS NOT NULL AND NOT (v_facebook = ANY(facebook_urls))
                    THEN array_append(facebook_urls, v_facebook)
                    ELSE facebook_urls
                END,
                id_card_numbers = CASE
                    WHEN v_idcard IS NOT NULL AND NOT (v_idcard = ANY(id_card_numbers))
                    THEN array_append(id_card_numbers, v_idcard)
                    ELSE id_card_numbers
                END,
                shop_names = CASE
                    WHEN v_shop_name IS NOT NULL AND NOT (v_shop_name = ANY(shop_names))
                    THEN array_append(shop_names, v_shop_name)
                    ELSE shop_names
                END,
                last_reported_at = NOW(),
                updated_at = NOW()
            WHERE id = v_blacklist_id;
        ELSE
            INSERT INTO blacklist_entries (
                bank_account_no, phone_numbers, line_ids, facebook_urls, id_card_numbers, shop_names,
                first_reported_at, last_reported_at
            ) VALUES (
                v_bank,
                CASE WHEN v_phone IS NOT NULL THEN ARRAY[v_phone] ELSE '{}' END,
                CASE WHEN v_line IS NOT NULL THEN ARRAY[v_line] ELSE '{}' END,
                CASE WHEN v_facebook IS NOT NULL THEN ARRAY[v_facebook] ELSE '{}' END,
                CASE WHEN v_idcard IS NOT NULL THEN ARRAY[v_idcard] ELSE '{}' END,
                CASE WHEN v_shop_name IS NOT NULL THEN ARRAY[v_shop_name] ELSE '{}' END,
                NOW(), NOW()
            )
            RETURNING id INTO v_blacklist_id;
        END IF;
        NEW.blacklist_entry_id := v_blacklist_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
