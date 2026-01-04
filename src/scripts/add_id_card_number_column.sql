-- Add id_card_number column to customer_blacklist table
-- This allows storing the full ID card number for display purposes.

ALTER TABLE customer_blacklist 
ADD COLUMN IF NOT EXISTS id_card_number TEXT;

-- Optional: Comments for clarity
COMMENT ON COLUMN customer_blacklist.id_card_number IS 'Full ID Card number (Plain text for display as requested)';
