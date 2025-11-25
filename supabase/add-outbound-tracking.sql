-- Add outbound tracking number column to shipments
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS outbound_tracking_number TEXT;
