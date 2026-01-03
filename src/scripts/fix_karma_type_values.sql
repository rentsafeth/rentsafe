-- 1. Update existing transactions to have type 'credit'
-- We found that type is 'report_verified', which is causing the issue.
-- We should standardize on 'credit' for the type, and keep 'report_verified' in reference_type or description if needed.
-- But based on the schema, type should be 'credit' or 'debit'.

UPDATE karma_transactions 
SET type = 'credit' 
WHERE type = 'report_verified';

-- 2. Update the trigger function to be more robust
-- Just in case other types sneak in, let's handle them or ensure we only sum 'credit' and 'debit'
-- But really, we should enforce 'credit'/'debit' at the application level.
-- For now, let's stick to the plan of fixing the data.

-- Re-run the recalculation just to be sure
UPDATE profiles p
SET karma_credits = (
    SELECT COALESCE(SUM(CASE 
        WHEN type = 'credit' THEN amount 
        WHEN type = 'debit' THEN -amount 
        ELSE 0 
    END), 0)
    FROM karma_transactions kt
    WHERE kt.user_id = p.id
)
WHERE EXISTS (SELECT 1 FROM karma_transactions WHERE user_id = p.id);
