-- Consolidated script to add all potentially missing columns
-- Run this to ensure your database schema matches the application code

-- 1. Add shipping label and info columns
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_service TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_instructions TEXT;

-- 2. Add outbound tracking number
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS outbound_tracking_number TEXT;

-- 3. Add balance column to profiles (just in case)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0.00;

-- 4. Verify columns exist (this will output the columns if they exist)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shipments' 
AND column_name IN ('shipping_carrier', 'outbound_tracking_number', 'shipping_label_url');
