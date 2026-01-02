-- Add Foreign Key from report_deletion_requests.user_id to profiles.id
-- This allows Supabase to join these tables directly in API queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'report_deletion_requests_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE report_deletion_requests
        ADD CONSTRAINT report_deletion_requests_user_id_fkey_profiles
        FOREIGN KEY (user_id)
        REFERENCES profiles(id);
    END IF;
END $$;
