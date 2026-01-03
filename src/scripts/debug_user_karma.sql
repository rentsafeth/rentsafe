SELECT 
    p.id, 
    p.email, 
    p.karma_credits,
    (SELECT SUM(amount) FROM karma_transactions WHERE user_id = p.id AND transaction_type = 'credit') as total_credits_in_tx,
    (SELECT SUM(amount) FROM karma_transactions WHERE user_id = p.id AND transaction_type = 'debit') as total_debits_in_tx
FROM profiles p
WHERE p.id IN (SELECT user_id FROM karma_transactions);
