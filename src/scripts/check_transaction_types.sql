SELECT DISTINCT type, count(*) 
FROM karma_transactions 
GROUP BY type;
