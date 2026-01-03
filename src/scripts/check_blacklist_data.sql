SELECT id, shop_names, phone_numbers, line_ids, bank_account_no
FROM blacklist_entries 
WHERE array_to_string(shop_names, ',') LIKE '%Fon Carrent%' 
   OR array_to_string(phone_numbers, ',') LIKE '%FB:%'
LIMIT 5;
