-- Fix transactions RLS to allow system to create transactions for any user
-- This is needed for platform fees and reshipper payments

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

-- Create new policies
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add policy to allow authenticated users to insert transactions for others
-- This is needed for platform to credit reshippers
CREATE POLICY "Allow inserting transactions for others"
ON transactions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
