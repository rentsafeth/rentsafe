-- Database Function: Search Blacklist Entries
-- Allows partial, case-insensitive search across multiple array columns (shop_names, phone_numbers, etc.)

CREATE OR REPLACE FUNCTION search_blacklist(keyword text)
RETURNS SETOF blacklist_entries AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM blacklist_entries
  WHERE 
    -- Search in Bank Account (Single text column)
    bank_account_no ILIKE '%' || keyword || '%'
    
    -- Search in Shop Names (Array)
    OR EXISTS (
      SELECT 1 FROM unnest(shop_names) AS t(val) WHERE val ILIKE '%' || keyword || '%'
    )
    
    -- Search in Phone Numbers (Array)
    OR EXISTS (
      SELECT 1 FROM unnest(phone_numbers) AS t(val) WHERE val ILIKE '%' || keyword || '%'
    )
    
    -- Search in Line IDs (Array)
    OR EXISTS (
      SELECT 1 FROM unnest(line_ids) AS t(val) WHERE val ILIKE '%' || keyword || '%'
    )
    
    -- Search in Facebook URLs (Array)
    OR EXISTS (
      SELECT 1 FROM unnest(facebook_urls) AS t(val) WHERE val ILIKE '%' || keyword || '%'
    )
    
    -- Search in ID Card Numbers (Array)
    OR EXISTS (
      SELECT 1 FROM unnest(id_card_numbers) AS t(val) WHERE val ILIKE '%' || keyword || '%'
    );
END;
$$ LANGUAGE plpgsql;
