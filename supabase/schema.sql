-- RentSafe Database Schema
-- Run this in Supabase SQL Editor
-- Based on project_blueprint.md

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (for all users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    phone TEXT,
    pdpa_accepted_at TIMESTAMPTZ,
    terms_accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable" ON profiles
    FOR SELECT USING (true);

-- =====================================================
-- SHOPS TABLE (Based on blueprint)
-- =====================================================
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,

    -- Contact
    phone_number TEXT NOT NULL,
    line_id TEXT,
    facebook_url TEXT,
    website TEXT,

    -- Service Area (Array of provinces)
    service_provinces TEXT[] NOT NULL DEFAULT '{}',

    -- Bank Info (for verification - locked after verified)
    bank_account_no TEXT,
    bank_account_name TEXT,

    -- Verification Status
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMPTZ,

    -- Stats
    rating_average DECIMAL(2, 1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,

    -- Images
    logo_url TEXT,
    banner_url TEXT,

    -- Flags
    is_active BOOLEAN DEFAULT TRUE,

    -- PDPA
    pdpa_accepted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Policies for shops
CREATE POLICY "Anyone can view active shops" ON shops
    FOR SELECT USING (is_active = true);

CREATE POLICY "Shop owners can view own shop" ON shops
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Shop owners can update own shop" ON shops
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Shop owners can insert shop" ON shops
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- SHOP IMAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shop_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT DEFAULT 'gallery' CHECK (image_type IN ('logo', 'cover', 'gallery', 'document')),
    is_public BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shop_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public images viewable by all" ON shop_images
    FOR SELECT USING (is_public = true);

CREATE POLICY "Shop owners can manage images" ON shop_images
    FOR ALL USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Rating (1-5)
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

    -- Review Content
    title TEXT,
    content TEXT NOT NULL,

    -- Rental Details
    rental_date DATE,
    vehicle_type TEXT CHECK (vehicle_type IN ('car', 'motorcycle')),
    vehicle_model TEXT,

    -- Pros/Cons
    pros TEXT[],
    cons TEXT[],

    -- Flags
    is_verified_rental BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,

    -- Stats
    helpful_count INTEGER DEFAULT 0,

    -- Response
    shop_response TEXT,
    shop_response_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public reviews" ON reviews
    FOR SELECT USING (is_hidden = false);

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Shop owners can respond to reviews" ON reviews
    FOR UPDATE USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- =====================================================
-- REPORTS TABLE (Fraud Reports - Based on blueprint)
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

    -- If shop is not in system, manual entry
    manual_shop_name TEXT,
    manual_shop_contact TEXT,
    manual_bank_account TEXT,
    manual_id_card TEXT,

    -- Report Details
    description TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    incident_date DATE,
    amount_lost DECIMAL(12, 2),

    -- Reference ID (auto-generated)
    reference_id TEXT UNIQUE,

    -- Liability waiver accepted
    liability_accepted BOOLEAN DEFAULT FALSE,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate reference ID
CREATE OR REPLACE FUNCTION generate_report_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_id := 'RPT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('report_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence for reference ID
CREATE SEQUENCE IF NOT EXISTS report_seq START 1;

-- Trigger for reference ID
DROP TRIGGER IF EXISTS set_report_reference ON reports;
CREATE TRIGGER set_report_reference
    BEFORE INSERT ON reports
    FOR EACH ROW EXECUTE FUNCTION generate_report_reference();

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =====================================================
-- VERIFICATIONS TABLE (Shop verification documents - Based on blueprint)
-- =====================================================
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'business_license', 'bank_book', 'other')),
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view own verifications" ON verifications
    FOR SELECT USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

CREATE POLICY "Shop owners can upload verifications" ON verifications
    FOR INSERT WITH CHECK (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- =====================================================
-- SAVED SHOPS TABLE (Favorites)
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, shop_id)
);

-- Enable RLS
ALTER TABLE saved_shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved shops" ON saved_shops
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update shop rating
CREATE OR REPLACE FUNCTION update_shop_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shops
    SET
        rating_average = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id) AND is_hidden = false
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id) AND is_hidden = false
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id) AND is_hidden = false
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.shop_id, OLD.shop_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for review changes
DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_shop_rating();

DROP TRIGGER IF EXISTS on_review_updated ON reviews;
CREATE TRIGGER on_review_updated
    AFTER UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_shop_rating();

DROP TRIGGER IF EXISTS on_review_deleted ON reviews;
CREATE TRIGGER on_review_deleted
    AFTER DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_shop_rating();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shops_updated_at
    BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shops_service_provinces ON shops USING GIN(service_provinces);
CREATE INDEX IF NOT EXISTS idx_shops_verification_status ON shops(verification_status);
CREATE INDEX IF NOT EXISTS idx_shops_rating ON shops(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(name);
CREATE INDEX IF NOT EXISTS idx_shops_bank_account ON shops(bank_account_no);
CREATE INDEX IF NOT EXISTS idx_shops_phone ON shops(phone_number);
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_shop_id ON reports(shop_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_manual_bank ON reports(manual_bank_account);
CREATE INDEX IF NOT EXISTS idx_reports_manual_id_card ON reports(manual_id_card);
CREATE INDEX IF NOT EXISTS idx_verifications_shop_id ON verifications(shop_id);

-- =====================================================
-- REVIEW HELPFUL VOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view helpful votes" ON review_helpful_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote helpful" ON review_helpful_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote" ON review_helpful_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update review helpful_count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reviews
    SET helpful_count = (
        SELECT COUNT(*)
        FROM review_helpful_votes
        WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
    )
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for helpful votes
DROP TRIGGER IF EXISTS on_helpful_vote_added ON review_helpful_votes;
CREATE TRIGGER on_helpful_vote_added
    AFTER INSERT ON review_helpful_votes
    FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

DROP TRIGGER IF EXISTS on_helpful_vote_removed ON review_helpful_votes;
CREATE TRIGGER on_helpful_vote_removed
    AFTER DELETE ON review_helpful_votes
    FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- =====================================================
-- ADD REPORT COUNT TO SHOPS
-- =====================================================
ALTER TABLE shops ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Function to update shop report_count
CREATE OR REPLACE FUNCTION update_shop_report_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update count for shop_id if linked
    IF COALESCE(NEW.shop_id, OLD.shop_id) IS NOT NULL THEN
        UPDATE shops
        SET report_count = (
            SELECT COUNT(*)
            FROM reports
            WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id)
            AND status = 'approved'
        )
        WHERE id = COALESCE(NEW.shop_id, OLD.shop_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for shop report count
DROP TRIGGER IF EXISTS on_report_status_changed ON reports;
CREATE TRIGGER on_report_status_changed
    AFTER INSERT OR UPDATE OF status ON reports
    FOR EACH ROW EXECUTE FUNCTION update_shop_report_count();

-- =====================================================
-- BLACKLIST ENTRIES TABLE (Group multiple reports by identifier)
-- =====================================================
CREATE TABLE IF NOT EXISTS blacklist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Primary identifier (usually bank account - most reliable)
    bank_account_no TEXT UNIQUE,

    -- Additional identifiers for matching
    phone_numbers TEXT[] DEFAULT '{}',
    id_card_numbers TEXT[] DEFAULT '{}',
    line_ids TEXT[] DEFAULT '{}',

    -- Shop info (aggregated from all reports)
    shop_names TEXT[] DEFAULT '{}',

    -- Stats (auto-updated by trigger)
    total_reports INTEGER DEFAULT 0,
    total_amount_lost DECIMAL(12, 2) DEFAULT 0,

    -- First and last report dates
    first_reported_at TIMESTAMPTZ,
    last_reported_at TIMESTAMPTZ,

    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blacklist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blacklist entries" ON blacklist_entries
    FOR SELECT USING (true);

-- Indexes for blacklist search
CREATE INDEX IF NOT EXISTS idx_blacklist_bank ON blacklist_entries(bank_account_no);
CREATE INDEX IF NOT EXISTS idx_blacklist_phones ON blacklist_entries USING GIN(phone_numbers);
CREATE INDEX IF NOT EXISTS idx_blacklist_idcards ON blacklist_entries USING GIN(id_card_numbers);
CREATE INDEX IF NOT EXISTS idx_blacklist_lines ON blacklist_entries USING GIN(line_ids);
CREATE INDEX IF NOT EXISTS idx_blacklist_shop_names ON blacklist_entries USING GIN(shop_names);
CREATE INDEX IF NOT EXISTS idx_blacklist_severity ON blacklist_entries(severity);

-- Add blacklist_entry_id to reports for grouping
ALTER TABLE reports ADD COLUMN IF NOT EXISTS blacklist_entry_id UUID REFERENCES blacklist_entries(id);
CREATE INDEX IF NOT EXISTS idx_reports_blacklist_entry ON reports(blacklist_entry_id);

-- Function to find or create blacklist entry and link report
CREATE OR REPLACE FUNCTION link_report_to_blacklist()
RETURNS TRIGGER AS $$
DECLARE
    v_bank TEXT;
    v_phone TEXT;
    v_idcard TEXT;
    v_shop_name TEXT;
    v_blacklist_id UUID;
    v_existing_id UUID;
BEGIN
    -- Only process when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
        -- Get identifiers from shop or manual entry
        IF NEW.shop_id IS NOT NULL THEN
            SELECT bank_account_no, phone_number, name
            INTO v_bank, v_phone, v_shop_name
            FROM shops WHERE id = NEW.shop_id;
        ELSE
            v_bank := NEW.manual_bank_account;
            v_phone := NEW.manual_shop_contact;
            v_shop_name := NEW.manual_shop_name;
            v_idcard := NEW.manual_id_card;
        END IF;

        -- Try to find existing blacklist entry by bank account
        IF v_bank IS NOT NULL THEN
            SELECT id INTO v_existing_id
            FROM blacklist_entries
            WHERE bank_account_no = v_bank;
        END IF;

        IF v_existing_id IS NOT NULL THEN
            -- Update existing entry
            v_blacklist_id := v_existing_id;

            UPDATE blacklist_entries SET
                phone_numbers = CASE
                    WHEN v_phone IS NOT NULL AND NOT (v_phone = ANY(phone_numbers))
                    THEN array_append(phone_numbers, v_phone)
                    ELSE phone_numbers
                END,
                id_card_numbers = CASE
                    WHEN v_idcard IS NOT NULL AND NOT (v_idcard = ANY(id_card_numbers))
                    THEN array_append(id_card_numbers, v_idcard)
                    ELSE id_card_numbers
                END,
                shop_names = CASE
                    WHEN v_shop_name IS NOT NULL AND NOT (v_shop_name = ANY(shop_names))
                    THEN array_append(shop_names, v_shop_name)
                    ELSE shop_names
                END,
                last_reported_at = NOW(),
                updated_at = NOW()
            WHERE id = v_blacklist_id;
        ELSE
            -- Create new blacklist entry
            INSERT INTO blacklist_entries (
                bank_account_no,
                phone_numbers,
                id_card_numbers,
                shop_names,
                first_reported_at,
                last_reported_at
            ) VALUES (
                v_bank,
                CASE WHEN v_phone IS NOT NULL THEN ARRAY[v_phone] ELSE '{}' END,
                CASE WHEN v_idcard IS NOT NULL THEN ARRAY[v_idcard] ELSE '{}' END,
                CASE WHEN v_shop_name IS NOT NULL THEN ARRAY[v_shop_name] ELSE '{}' END,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_blacklist_id;
        END IF;

        -- Link report to blacklist entry
        NEW.blacklist_entry_id := v_blacklist_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to link report to blacklist
DROP TRIGGER IF EXISTS on_report_link_blacklist ON reports;
CREATE TRIGGER on_report_link_blacklist
    BEFORE INSERT OR UPDATE OF status ON reports
    FOR EACH ROW EXECUTE FUNCTION link_report_to_blacklist();

-- Function to update blacklist stats (counts, amounts, severity)
CREATE OR REPLACE FUNCTION update_blacklist_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_entry_id UUID;
    v_count INTEGER;
    v_amount DECIMAL(12,2);
BEGIN
    v_entry_id := COALESCE(NEW.blacklist_entry_id, OLD.blacklist_entry_id);

    IF v_entry_id IS NOT NULL THEN
        -- Calculate totals from all approved reports
        SELECT
            COUNT(*),
            COALESCE(SUM(amount_lost), 0)
        INTO v_count, v_amount
        FROM reports
        WHERE blacklist_entry_id = v_entry_id
        AND status = 'approved';

        -- Update blacklist entry
        UPDATE blacklist_entries SET
            total_reports = v_count,
            total_amount_lost = v_amount,
            severity = CASE
                WHEN v_count >= 10 THEN 'critical'
                WHEN v_count >= 5 THEN 'high'
                WHEN v_count >= 2 THEN 'medium'
                ELSE 'low'
            END,
            updated_at = NOW()
        WHERE id = v_entry_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update blacklist stats
DROP TRIGGER IF EXISTS on_report_update_blacklist_stats ON reports;
CREATE TRIGGER on_report_update_blacklist_stats
    AFTER INSERT OR UPDATE OR DELETE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_blacklist_stats();

-- Policy to allow viewing approved reports publicly
DROP POLICY IF EXISTS "Anyone can view approved reports" ON reports;
CREATE POLICY "Anyone can view approved reports" ON reports
    FOR SELECT USING (status = 'approved');

-- =====================================================
-- ADDITIONAL INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review ON review_helpful_votes(review_id);

-- =====================================================
-- STORAGE BUCKETS (Based on blueprint)
-- =====================================================
-- Run these in Supabase SQL Editor or via Dashboard:
--
-- 1. shop-images: For shop logos and banners (PUBLIC)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images', 'shop-images', true);
--
-- 2. report-evidence: For slip/chat screenshots - 5MB limit (PUBLIC)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('report-evidence', 'report-evidence', true);
--
-- 3. verification-docs: For ID cards/Business licenses (PRIVATE)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

-- =====================================================
-- STORAGE POLICIES
-- =====================================================
-- For shop-images bucket:
-- CREATE POLICY "Anyone can view shop images" ON storage.objects
--     FOR SELECT USING (bucket_id = 'shop-images');
-- CREATE POLICY "Shop owners can upload images" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'shop-images' AND auth.uid() IS NOT NULL);

-- For report-evidence bucket:
-- CREATE POLICY "Anyone can view evidence" ON storage.objects
--     FOR SELECT USING (bucket_id = 'report-evidence');
-- CREATE POLICY "Authenticated users can upload evidence" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'report-evidence' AND auth.uid() IS NOT NULL);

-- For verification-docs bucket (private):
-- CREATE POLICY "Only admins and owners can view docs" ON storage.objects
--     FOR SELECT USING (bucket_id = 'verification-docs' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "Shop owners can upload docs" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'verification-docs' AND auth.uid() IS NOT NULL);
