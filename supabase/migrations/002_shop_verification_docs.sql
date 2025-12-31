-- Add new fields to shops table for verification documents
-- Run this after the initial schema.sql

-- Business type (individual or company)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'individual'
    CHECK (business_type IN ('individual', 'company'));

-- Bank name
ALTER TABLE shops ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Verification documents URLs (private - only visible to owner and admin)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS id_card_url TEXT; -- For individual: ID card copy
ALTER TABLE shops ADD COLUMN IF NOT EXISTS business_license_url TEXT; -- Business registration / company certificate
ALTER TABLE shops ADD COLUMN IF NOT EXISTS bank_book_url TEXT; -- Bank book photo (optional)

-- Admin verification notes
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);

-- Email notification tracking
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verification_email_sent_at TIMESTAMPTZ;

-- Create storage bucket for verification documents if not exists
-- Run in Supabase Dashboard or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification-docs bucket (run in Supabase Dashboard)
-- These ensure only authenticated users can upload and only admins/owners can view

-- Policy: Shop owners can upload their verification documents
-- CREATE POLICY "Shop owners can upload verification docs"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'verification-docs'
--     AND auth.uid() IS NOT NULL
--     AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy: Shop owners and admins can view verification documents
-- CREATE POLICY "Shop owners and admins can view verification docs"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'verification-docs'
--     AND (
--         -- Owner can view their own docs
--         (storage.foldername(name))[1] = auth.uid()::text
--         OR
--         -- Admins can view all docs
--         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--     )
-- );

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_shops_verification_status ON shops(verification_status);
CREATE INDEX IF NOT EXISTS idx_shops_business_type ON shops(business_type);
