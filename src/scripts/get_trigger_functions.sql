SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name IN ('link_report_to_blacklist', 'update_blacklist_stats');
