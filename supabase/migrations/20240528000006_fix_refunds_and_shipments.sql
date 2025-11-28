-- Fix RLS policies to allow moderators to process refunds and view shipments

-- 1. Allow moderators to insert transactions for OTHER users (required for refunds)
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;

CREATE POLICY "transactions_insert_policy" ON transactions
FOR INSERT TO authenticated
WITH CHECK (
  -- Users can insert their own transactions
  user_id = auth.uid() 
  OR 
  -- Moderators can insert transactions for anyone (checked via profile role)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'moderator'
  )
);

-- 2. Ensure Shipments are viewable by all (fixing the "no packages" issue)
DROP POLICY IF EXISTS "shipments_select_policy" ON shipments;
DROP POLICY IF EXISTS "shipments_update_policy" ON shipments;
DROP POLICY IF EXISTS "shipments_insert_policy" ON shipments;

-- Allow reading all shipments
CREATE POLICY "shipments_select_policy" ON shipments
FOR SELECT TO authenticated
USING (true);

-- Allow updating all shipments (moderators need this, users restricted by app logic)
CREATE POLICY "shipments_update_policy" ON shipments
FOR UPDATE TO authenticated
USING (true);

-- Allow inserting shipments
CREATE POLICY "shipments_insert_policy" ON shipments
FOR INSERT TO authenticated
WITH CHECK (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
