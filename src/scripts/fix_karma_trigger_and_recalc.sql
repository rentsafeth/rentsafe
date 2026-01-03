-- แก้ไข Function Recalculate Karma Balance ให้ใช้ column 'type' เท่านั้น
-- และปรับปรุง Logic การคำนวณให้ถูกต้องตามความเป็นจริง

CREATE OR REPLACE FUNCTION recalculate_karma_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's profile with the sum of all transactions
    UPDATE profiles
    SET karma_credits = (
        SELECT COALESCE(SUM(CASE 
            -- ถ้าเป็น debit ให้ลบอย่างเดียว
            WHEN type = 'debit' THEN -ABS(amount)
            -- ถ้าเป็น credit ให้บวก
            WHEN type = 'credit' THEN ABS(amount)
            -- กรณีอื่นๆ (เช่น report_approved, reward) ให้ดูที่ยอด amount
            ELSE 
                CASE WHEN amount > 0 THEN amount ELSE -ABS(amount) END
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

-- Recalculate for all users immediately
UPDATE profiles p
SET karma_credits = (
    SELECT COALESCE(SUM(CASE 
        WHEN type = 'debit' THEN -ABS(amount)
        WHEN type = 'credit' THEN ABS(amount)
        ELSE 
             CASE WHEN amount > 0 THEN amount ELSE -ABS(amount) END
    END), 0)
    FROM karma_transactions kt
    WHERE kt.user_id = p.id
)
WHERE EXISTS (SELECT 1 FROM karma_transactions WHERE user_id = p.id);
