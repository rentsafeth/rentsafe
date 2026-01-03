SELECT 
    p.email,
    p.karma_credits as "Current Karma (Profile)",
    (
        SELECT COALESCE(SUM(CASE 
            WHEN type = 'credit' THEN amount 
            WHEN type = 'debit' THEN -amount 
            ELSE 0 
        END), 0)
        FROM karma_transactions 
        WHERE user_id = p.id
    ) as "Calculated from History"
FROM profiles p
ORDER BY p.karma_credits DESC NULLS LAST;
