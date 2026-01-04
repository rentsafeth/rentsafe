-- Create app_settings table (renamed from system_configs to avoid conflict)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Gemini API Key
INSERT INTO app_settings (key, value, description)
VALUES 
    ('gemini_api_key', 'AIzaSyAwSHugjU7ch3LXIoAyfKfIKImLXOgLr3s', 'Google Gemini API Key for OCR service')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- Create ocr_logs table for tracking usage stats
CREATE TABLE IF NOT EXISTS ocr_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    latency_ms INTEGER, -- Time taken in milliseconds
    error_message TEXT,
    provider TEXT DEFAULT 'gemini',
    extracted_data JSONB -- Optional: store what fields were found
);

-- Enable RLS (Security)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_logs ENABLE ROW LEVEL SECURITY;

-- Note: Using 'profiles' table for role checking as per codebase

-- Policy: Admin can do everything on app_settings
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Policy: Admin can view logs
DROP POLICY IF EXISTS "Admins can view ocr logs" ON ocr_logs;
CREATE POLICY "Admins can view ocr logs" ON ocr_logs
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Policy: Users can insert logs (for audit trail)
DROP POLICY IF EXISTS "Users can insert ocr logs" ON ocr_logs;
CREATE POLICY "Users can insert ocr logs" ON ocr_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
