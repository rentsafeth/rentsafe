-- Function to recalculate karma balance
CREATE OR REPLACE FUNCTION recalculate_karma_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's profile with the sum of all transactions
    UPDATE profiles
    SET karma_credits = (
        SELECT COALESCE(SUM(CASE 
            WHEN type = 'credit' THEN amount 
            WHEN type = 'debit' THEN -amount 
            ELSE 0 
        END), 0)
        FROM karma_transactions
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    )
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after INSERT/UPDATE/DELETE on karma_transactions
DROP TRIGGER IF EXISTS trigger_update_karma_balance ON karma_transactions;
CREATE TRIGGER trigger_update_karma_balance
AFTER INSERT OR UPDATE OR DELETE ON karma_transactions
FOR EACH ROW
EXECUTE FUNCTION recalculate_karma_balance();

-- Recalculate for all users immediately to fix existing discrepancies
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
