-- Check pending requests and their related data
SELECT 
    rdr.id as request_id,
    rdr.status,
    rdr.user_id,
    p.email as user_email,
    rdr.report_id,
    r.description as report_desc,
    be.shop_names
FROM report_deletion_requests rdr
LEFT JOIN profiles p ON rdr.user_id = p.id
LEFT JOIN reports r ON rdr.report_id = r.id
LEFT JOIN blacklist_entries be ON r.blacklist_entry_id = be.id
WHERE rdr.status = 'pending';
