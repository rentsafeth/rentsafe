-- =====================================================
-- SQL Functions สำหรับ Multiple Identifiers Matching และ Merge Entries
-- รันใน Supabase SQL Editor
-- =====================================================

-- 1. Function: หา blacklist entries ที่มีความเกี่ยวข้องกัน (potential duplicates)
-- จาก bank_account_no, phone_numbers, line_ids, id_card_numbers
CREATE OR REPLACE FUNCTION find_related_blacklist_entries(entry_id uuid)
RETURNS TABLE (
    related_entry_id uuid,
    related_shop_names text[],
    match_type text,
    match_value text
) AS $$
DECLARE
    source_entry RECORD;
BEGIN
    -- Get source entry data
    SELECT * INTO source_entry FROM blacklist_entries WHERE id = entry_id;
    
    IF source_entry IS NULL THEN
        RETURN;
    END IF;
    
    -- Match by bank_account_no
    IF source_entry.bank_account_no IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            be.id as related_entry_id,
            be.shop_names as related_shop_names,
            'bank_account'::text as match_type,
            source_entry.bank_account_no::text as match_value
        FROM blacklist_entries be
        WHERE be.id != entry_id
        AND be.bank_account_no = source_entry.bank_account_no;
    END IF;
    
    -- Match by overlapping phone_numbers
    IF array_length(source_entry.phone_numbers, 1) > 0 THEN
        RETURN QUERY
        SELECT DISTINCT
            be.id as related_entry_id,
            be.shop_names as related_shop_names,
            'phone'::text as match_type,
            unnest(source_entry.phone_numbers)::text as match_value
        FROM blacklist_entries be
        WHERE be.id != entry_id
        AND be.phone_numbers && source_entry.phone_numbers;
    END IF;
    
    -- Match by overlapping line_ids
    IF array_length(source_entry.line_ids, 1) > 0 THEN
        RETURN QUERY
        SELECT DISTINCT
            be.id as related_entry_id,
            be.shop_names as related_shop_names,
            'line_id'::text as match_type,
            unnest(source_entry.line_ids)::text as match_value
        FROM blacklist_entries be
        WHERE be.id != entry_id
        AND be.line_ids && source_entry.line_ids;
    END IF;
    
    -- Match by overlapping id_card_numbers
    IF array_length(source_entry.id_card_numbers, 1) > 0 THEN
        RETURN QUERY
        SELECT DISTINCT
            be.id as related_entry_id,
            be.shop_names as related_shop_names,
            'id_card'::text as match_type,
            unnest(source_entry.id_card_numbers)::text as match_value
        FROM blacklist_entries be
        WHERE be.id != entry_id
        AND be.id_card_numbers && source_entry.id_card_numbers;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function: Merge two blacklist entries into one
-- ย้าย reports ทั้งหมดไป entry ใหม่ และลบ entry เก่า
CREATE OR REPLACE FUNCTION merge_blacklist_entries(
    target_entry_id uuid,  -- Entry ที่จะเก็บไว้
    source_entry_id uuid   -- Entry ที่จะถูก merge และลบ
) RETURNS jsonb AS $$
DECLARE
    target_entry RECORD;
    source_entry RECORD;
    merged_shop_names text[];
    merged_phone_numbers text[];
    merged_line_ids text[];
    merged_id_card_numbers text[];
    reports_moved int;
BEGIN
    -- Get both entries
    SELECT * INTO target_entry FROM blacklist_entries WHERE id = target_entry_id;
    SELECT * INTO source_entry FROM blacklist_entries WHERE id = source_entry_id;
    
    IF target_entry IS NULL OR source_entry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Entry not found');
    END IF;
    
    -- Merge arrays (remove duplicates)
    merged_shop_names := ARRAY(
        SELECT DISTINCT unnest(
            COALESCE(target_entry.shop_names, '{}') || 
            COALESCE(source_entry.shop_names, '{}')
        )
    );
    
    merged_phone_numbers := ARRAY(
        SELECT DISTINCT unnest(
            COALESCE(target_entry.phone_numbers, '{}') || 
            COALESCE(source_entry.phone_numbers, '{}')
        )
    );
    
    merged_line_ids := ARRAY(
        SELECT DISTINCT unnest(
            COALESCE(target_entry.line_ids, '{}') || 
            COALESCE(source_entry.line_ids, '{}')
        )
    );
    
    merged_id_card_numbers := ARRAY(
        SELECT DISTINCT unnest(
            COALESCE(target_entry.id_card_numbers, '{}') || 
            COALESCE(source_entry.id_card_numbers, '{}')
        )
    );
    
    -- Update target entry with merged data
    UPDATE blacklist_entries SET
        shop_names = merged_shop_names,
        phone_numbers = merged_phone_numbers,
        line_ids = merged_line_ids,
        id_card_numbers = merged_id_card_numbers,
        total_reports = target_entry.total_reports + source_entry.total_reports,
        total_amount_lost = target_entry.total_amount_lost + source_entry.total_amount_lost,
        first_reported_at = LEAST(target_entry.first_reported_at, source_entry.first_reported_at),
        last_reported_at = GREATEST(target_entry.last_reported_at, source_entry.last_reported_at)
    WHERE id = target_entry_id;
    
    -- Move all reports from source to target
    UPDATE reports SET blacklist_id = target_entry_id
    WHERE blacklist_id = source_entry_id;
    
    GET DIAGNOSTICS reports_moved = ROW_COUNT;
    
    -- Delete source entry
    DELETE FROM blacklist_entries WHERE id = source_entry_id;
    
    -- Recalculate severity for target entry
    PERFORM update_blacklist_severity(target_entry_id);
    
    RETURN jsonb_build_object(
        'success', true,
        'merged_entry_id', target_entry_id,
        'reports_moved', reports_moved,
        'deleted_entry_id', source_entry_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function: Update severity based on reports count and amount
CREATE OR REPLACE FUNCTION update_blacklist_severity(entry_id uuid)
RETURNS void AS $$
DECLARE
    entry RECORD;
    new_severity text;
BEGIN
    SELECT * INTO entry FROM blacklist_entries WHERE id = entry_id;
    
    IF entry IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate severity
    IF entry.total_reports >= 6 OR entry.total_amount_lost >= 50000 THEN
        new_severity := 'critical';
    ELSIF entry.total_reports >= 4 OR entry.total_amount_lost >= 20000 THEN
        new_severity := 'high';
    ELSIF entry.total_reports >= 2 OR entry.total_amount_lost >= 5000 THEN
        new_severity := 'medium';
    ELSE
        new_severity := 'low';
    END IF;
    
    UPDATE blacklist_entries SET severity = new_severity WHERE id = entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Check for potential duplicates when creating new report
-- เรียกใช้เมื่อสร้าง report ใหม่ เพื่อหา entries ที่เกี่ยวข้อง
CREATE OR REPLACE FUNCTION find_matching_blacklist_entry(
    p_bank_account text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_line_id text DEFAULT NULL,
    p_id_card text DEFAULT NULL
) RETURNS TABLE (
    entry_id uuid,
    shop_names text[],
    total_reports int,
    match_score int
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        be.id as entry_id,
        be.shop_names,
        be.total_reports,
        (
            CASE WHEN p_bank_account IS NOT NULL AND be.bank_account_no = p_bank_account THEN 3 ELSE 0 END +
            CASE WHEN p_phone IS NOT NULL AND p_phone = ANY(be.phone_numbers) THEN 2 ELSE 0 END +
            CASE WHEN p_line_id IS NOT NULL AND p_line_id = ANY(be.line_ids) THEN 2 ELSE 0 END +
            CASE WHEN p_id_card IS NOT NULL AND p_id_card = ANY(be.id_card_numbers) THEN 3 ELSE 0 END
        ) as match_score
    FROM blacklist_entries be
    WHERE 
        (p_bank_account IS NOT NULL AND be.bank_account_no = p_bank_account) OR
        (p_phone IS NOT NULL AND p_phone = ANY(be.phone_numbers)) OR
        (p_line_id IS NOT NULL AND p_line_id = ANY(be.line_ids)) OR
        (p_id_card IS NOT NULL AND p_id_card = ANY(be.id_card_numbers))
    ORDER BY match_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
