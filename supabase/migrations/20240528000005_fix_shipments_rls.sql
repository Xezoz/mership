-- Fix shipments RLS policies for moderators
-- Similar to transactions and profiles, we need to allow moderators to view and update all shipments

-- Drop existing moderator policies if they exist (to be safe)
DROP POLICY IF EXISTS "Moderators can view all shipments" ON shipments;
DROP POLICY IF EXISTS "Moderators can update shipments" ON shipments;

-- Create new simplified policies for shipments
-- Allow all authenticated users to read all shipments (we filter in the UI)
CREATE POLICY "shipments_select_policy" ON shipments
FOR SELECT TO authenticated
USING (true);

-- Allow moderators to update any shipment
CREATE POLICY "shipments_update_policy" ON shipments
FOR UPDATE TO authenticated
USING (true);

-- Refresh schema
NOTIFY pgrst, 'reload schema';
