-- Step 1: Modify shipments table structure
-- Rename user_id to sender_id
ALTER TABLE shipments RENAME COLUMN user_id TO sender_id;

-- Add recipient_id column
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id);

-- Add missing product and notes columns
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS product_value DECIMAL(10, 2);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('package_assigned', 'status_updated', 'message_received', 'payment_received')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    related_shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 3: Update shipments RLS policies
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their shipments" ON shipments;
DROP POLICY IF EXISTS "Users can create shipments" ON shipments;
DROP POLICY IF EXISTS "Users can update their shipments" ON shipments;

-- Create new policies for sender_id and recipient_id
CREATE POLICY "Users can view relevant shipments"
ON shipments FOR SELECT
USING (
    auth.uid() = sender_id 
    OR auth.uid() = recipient_id
);

CREATE POLICY "Customers can create shipments"
ON shipments FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'customer'
    )
);

CREATE POLICY "Reshippers can update assigned shipments"
ON shipments FOR UPDATE
USING (
    auth.uid() = recipient_id
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'reshipper'
    )
);

-- Step 4: Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);
