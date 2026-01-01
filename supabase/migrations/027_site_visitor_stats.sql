-- Create table to track daily site visitors
CREATE TABLE IF NOT EXISTS site_daily_stats (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    visitor_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON site_daily_stats
    FOR SELECT TO public USING (true);

-- Function to increment visitor count safely
CREATE OR REPLACE FUNCTION increment_site_visitor()
RETURNS void AS $$
BEGIN
    INSERT INTO site_daily_stats (date, visitor_count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date)
    DO UPDATE SET 
        visitor_count = site_daily_stats.visitor_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public (anon) and authenticated users
GRANT EXECUTE ON FUNCTION increment_site_visitor() TO anon, authenticated, service_role;
