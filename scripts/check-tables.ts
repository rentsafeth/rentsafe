// Run this in browser console or create a test page

const tables = [
    'system_settings',
    'credit_packages',
    'credit_orders',
    'credit_transactions',
    'shop_ad_settings',
    'ad_impressions',
    'ad_clicks',
    'boost_purchases',
    'featured_bids',
    'ad_stats_daily'
];

// Check each table
async function checkTables() {
    const results = [];

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            results.push({
                table,
                exists: !error,
                error: error?.message
            });
        } catch (e) {
            results.push({
                table,
                exists: false,
                error: e.message
            });
        }
    }

    console.table(results);
    return results;
}

checkTables();
