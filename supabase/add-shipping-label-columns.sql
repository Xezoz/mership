-- Add shipping label and additional info columns to shipments
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_service TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_instructions TEXT;
