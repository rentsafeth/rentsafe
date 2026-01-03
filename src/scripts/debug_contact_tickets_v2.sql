SELECT 
    t.id as ticket_id,
    t.subject_type,
    t.custom_subject,
    t.created_at,
    t.user_id,
    p.id as profile_id,
    p.email,
    p.full_name,
    p.first_name,
    p.last_name
FROM 
    contact_tickets t
LEFT JOIN 
    profiles p ON t.user_id = p.id
ORDER BY 
    t.created_at DESC
LIMIT 10;
