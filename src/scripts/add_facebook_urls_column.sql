-- Add facebook_urls column
ALTER TABLE blacklist_entries 
ADD COLUMN IF NOT EXISTS facebook_urls text[] DEFAULT '{}';

-- Function to migrate FB links from phone_numbers
DO $$
DECLARE
    r RECORD;
    phone text;
    new_phones text[];
    new_fbs text[];
    has_change boolean;
BEGIN
    FOR r IN SELECT id, phone_numbers, facebook_urls FROM blacklist_entries WHERE phone_numbers IS NOT NULL AND array_length(phone_numbers, 1) > 0 LOOP
        new_phones := '{}';
        new_fbs := COALESCE(r.facebook_urls, '{}');
        has_change := false;

        FOREACH phone IN ARRAY r.phone_numbers LOOP
            IF phone ILIKE '%facebook.com%' OR phone ILIKE 'FB:%' THEN
                -- Clean up the URL (remove 'FB:' prefix and whitespace)
                new_fbs := array_append(new_fbs, TRIM(REPLACE(REPLACE(phone, 'FB:', ''), 'fb:', '')));
                has_change := true;
            ELSE
                new_phones := array_append(new_phones, phone);
            END IF;
        END LOOP;

        IF has_change THEN
            UPDATE blacklist_entries 
            SET phone_numbers = new_phones,
                facebook_urls = new_fbs
            WHERE id = r.id;
        END IF;
    END LOOP;
END $$;
