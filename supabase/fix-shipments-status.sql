-- Fix the shipments status constraint to include 'received'
-- First, drop the old constraint
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check;

-- Add new constraint with 'received' status
ALTER TABLE shipments ADD CONSTRAINT shipments_status_check 
CHECK (status IN ('pending', 'received', 'in_transit', 'delivered', 'cancelled', 'returned', 'discarded'));

-- Add action and handling_fee columns
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS customer_action TEXT CHECK (customer_action IN ('ship', 'return', 'discard'));
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS handling_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS action_taken_at TIMESTAMPTZ;
