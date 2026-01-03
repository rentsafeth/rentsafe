-- Database Function: Aggregate Scam Provinces from Reports to Blacklist Entries
-- This function automatically updates blacklist_entries.scam_provinces 
-- with unique provinces from all associated reports

CREATE OR REPLACE FUNCTION aggregate_scam_provinces()
RETURNS TRIGGER AS $$
BEGIN
  -- Update blacklist_entries with unique provinces from all its reports
  UPDATE blacklist_entries
  SET scam_provinces = (
    SELECT ARRAY_AGG(DISTINCT province)
    FROM (
      SELECT UNNEST(scam_provinces) as province
      FROM reports
      WHERE blacklist_entry_id = NEW.blacklist_entry_id
      AND scam_provinces IS NOT NULL
      AND scam_provinces != '{}'
    ) subquery
  )
  WHERE id = NEW.blacklist_entry_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_aggregate_provinces ON reports;

-- Create trigger to run after INSERT or UPDATE on reports
CREATE TRIGGER trigger_aggregate_provinces
AFTER INSERT OR UPDATE ON reports
FOR EACH ROW
WHEN (NEW.blacklist_entry_id IS NOT NULL)
EXECUTE FUNCTION aggregate_scam_provinces();

-- Manual migration: Update existing blacklist entries with aggregated provinces
-- Run this once to populate existing data
UPDATE blacklist_entries be
SET scam_provinces = (
  SELECT ARRAY_AGG(DISTINCT province)
  FROM (
    SELECT UNNEST(scam_provinces) as province
    FROM reports r
    WHERE r.blacklist_entry_id = be.id
    AND r.scam_provinces IS NOT NULL
    AND r.scam_provinces != '{}'
  ) subquery
)
WHERE EXISTS (
  SELECT 1 FROM reports r 
  WHERE r.blacklist_entry_id = be.id 
  AND r.scam_provinces IS NOT NULL
);
