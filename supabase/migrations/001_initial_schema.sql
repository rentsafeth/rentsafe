-- =============================================
-- RentSafe - Initial Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. SCAM REPORTS
-- =============================================
CREATE TABLE IF NOT EXISTS scam_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_name VARCHAR(200) NOT NULL,
  phone VARCHAR(100),
  facebook_url VARCHAR(255),
  facebook_page_name VARCHAR(200),
  line_id VARCHAR(100),
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(200),
  province VARCHAR(100) NOT NULL,
  area VARCHAR(100),
  fraud_type VARCHAR(50) NOT NULL CHECK (fraud_type IN ('no_refund', 'fake_car', 'scam', 'overcharge', 'car_seized', 'other')),
  damage_amount INTEGER DEFAULT 0,
  incident_date DATE,
  description TEXT NOT NULL,
  evidence_images TEXT[] DEFAULT '{}',
  has_police_report BOOLEAN DEFAULT false,
  police_report_number VARCHAR(100),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_count INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. CONFIRMATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES scam_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment VARCHAR(500),
  damage_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- =============================================
-- 4. CONTACT REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES scam_reports(id) ON DELETE CASCADE,
  requester_name VARCHAR(200) NOT NULL,
  requester_phone VARCHAR(20) NOT NULL,
  requester_email VARCHAR(255),
  message TEXT NOT NULL,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('correction', 'removal', 'other')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_scam_reports_status ON scam_reports(status);
CREATE INDEX IF NOT EXISTS idx_scam_reports_province ON scam_reports(province);
CREATE INDEX IF NOT EXISTS idx_scam_reports_fraud_type ON scam_reports(fraud_type);
CREATE INDEX IF NOT EXISTS idx_scam_reports_created_at ON scam_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scam_reports_reporter_id ON scam_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_scam_reports_verified_count ON scam_reports(verified_count DESC);

CREATE INDEX IF NOT EXISTS idx_confirmations_report_id ON confirmations(report_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_user_id ON confirmations(user_id);

CREATE INDEX IF NOT EXISTS idx_contact_requests_report_id ON contact_requests(report_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);

-- Full-text search index for Thai
CREATE INDEX IF NOT EXISTS idx_scam_reports_search ON scam_reports USING GIN (
  to_tsvector('simple',
    COALESCE(shop_name, '') || ' ' ||
    COALESCE(phone, '') || ' ' ||
    COALESCE(facebook_page_name, '') || ' ' ||
    COALESCE(line_id, '') || ' ' ||
    COALESCE(bank_account_number, '') || ' ' ||
    COALESCE(bank_account_name, '')
  )
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scam_reports_updated_at
  BEFORE UPDATE ON scam_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_requests_updated_at
  BEFORE UPDATE ON contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment verified_count when confirmation is added
CREATE OR REPLACE FUNCTION increment_verified_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scam_reports
  SET verified_count = verified_count + 1
  WHERE id = NEW.report_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_confirmation_insert
  AFTER INSERT ON confirmations
  FOR EACH ROW
  EXECUTE FUNCTION increment_verified_count();

-- Auto-decrement verified_count when confirmation is deleted
CREATE OR REPLACE FUNCTION decrement_verified_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scam_reports
  SET verified_count = GREATEST(0, verified_count - 1)
  WHERE id = OLD.report_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_confirmation_delete
  AFTER DELETE ON confirmations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_verified_count();

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- SCAM_REPORTS policies
CREATE POLICY "Reports are viewable by everyone"
  ON scam_reports FOR SELECT
  USING (status IN ('pending', 'verified') OR reporter_id = auth.uid());

CREATE POLICY "Authenticated users can create reports"
  ON scam_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

CREATE POLICY "Users can update own reports"
  ON scam_reports FOR UPDATE
  USING (reporter_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Only admins can delete reports"
  ON scam_reports FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- CONFIRMATIONS policies
CREATE POLICY "Confirmations are viewable by everyone"
  ON confirmations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create confirmations"
  ON confirmations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can delete own confirmations"
  ON confirmations FOR DELETE
  USING (user_id = auth.uid());

-- CONTACT_REQUESTS policies
CREATE POLICY "Only admins can view contact requests"
  ON contact_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Anyone can create contact requests"
  ON contact_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update contact requests"
  ON contact_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Create bucket for evidence images
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view evidence images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence');

CREATE POLICY "Authenticated users can upload evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own evidence"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'evidence' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================
-- DEMO DATA (Optional)
-- =============================================

-- Uncomment below to add demo data

/*
-- Demo admin user (create in Supabase Auth first, then update role)
UPDATE profiles SET role = 'admin' WHERE email = 'admin@rentsafe.in.th';
*/
