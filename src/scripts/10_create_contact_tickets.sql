-- Create contact_tickets table
CREATE TABLE IF NOT EXISTS contact_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id), -- Optional, can be null for guests
    subject_type TEXT NOT NULL CHECK (subject_type IN ('payment_issue', 'registration_issue', 'blacklist_removal', 'review_removal', 'other')),
    custom_subject TEXT, -- Used when subject_type is 'other'
    description TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_tickets ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON contact_tickets
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Users can create tickets (authenticated)
CREATE POLICY "Users can create tickets" ON contact_tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
-- 3. Allow public insert (for guests/registration issues) - Optional, but good if login fails
-- For now, let's restrict to authenticated users or handle guest logic later if needed.
-- If you want guests to submit, we might need a different approach or allow public insert with null user_id.
-- Let's stick to authenticated for now as per your dashboard requirement.

-- 4. Admins can view all tickets
CREATE POLICY "Admins can view all tickets" ON contact_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. Admins can update tickets (reply/status)
CREATE POLICY "Admins can update tickets" ON contact_tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create storage bucket for ticket images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-images', 'contact-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload contact images" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'contact-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view contact images" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'contact-images');
