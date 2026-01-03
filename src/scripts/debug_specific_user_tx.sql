SELECT 
    kt.id,
    kt.amount,
    kt.type,
    kt.description,
    kt.created_at,
    kt.reference_type,
    kt.reference_id
FROM karma_transactions kt
JOIN profiles p ON kt.user_id = p.id
WHERE p.email = 'easyosteam@gmail.com';
