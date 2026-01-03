-- Fix bad data in facebook_urls column
-- Some entries have concatenated strings like "https://facebook.com/..., Line: ..., Phone: ..."
-- This script cleans them up to keep only the Facebook URL part.

DO $$
DECLARE
    r RECORD;
    url text;
    clean_url text;
    new_fbs text[];
    has_change boolean;
BEGIN
    FOR r IN SELECT id, facebook_urls FROM blacklist_entries WHERE facebook_urls IS NOT NULL AND array_length(facebook_urls, 1) > 0 LOOP
        new_fbs := '{}';
        has_change := false;

        FOREACH url IN ARRAY r.facebook_urls LOOP
            -- Check if the URL contains the garbage suffix
            IF url LIKE '%, Line:%' OR url LIKE '%, Phone:%' THEN
                -- Extract the part before the first comma
                clean_url := split_part(url, ',', 1);
                
                -- Remove 'FB:' prefix if present (case insensitive)
                clean_url := REGEXP_REPLACE(clean_url, '^FB:\s*', '', 'i');
                
                -- Trim whitespace
                clean_url := TRIM(clean_url);
                
                -- Only add if it's not empty and looks valid (not just "FB:")
                IF length(clean_url) > 3 THEN
                     new_fbs := array_append(new_fbs, clean_url);
                END IF;
                
                has_change := true;
            ELSE
                new_fbs := array_append(new_fbs, url);
            END IF;
        END LOOP;

        IF has_change THEN
            UPDATE blacklist_entries 
            SET facebook_urls = new_fbs
            WHERE id = r.id;
        END IF;
    END LOOP;
END $$;
