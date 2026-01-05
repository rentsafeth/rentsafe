-- Add new columns for shop verification images
ALTER TABLE shops
ADD COLUMN lease_agreement_url TEXT,
ADD COLUMN lease_agreement_with_car_url TEXT;
