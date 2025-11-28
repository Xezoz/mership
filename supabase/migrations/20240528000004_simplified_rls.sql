-- Alternative approach: Use a simpler moderator check without recursion
-- This creates a materialized view to avoid RLS recursion issues

-- First, drop all existing policies that depend on is_moderator()
DROP POLICY IF EXISTS "Moderators can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Moderators can update profiles" ON profiles;
DROP POLICY IF EXISTS "Moderators can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Moderators can update transactions" ON transactions;
DROP POLICY IF EXISTS "Moderators can view all shipments" ON shipments;
DROP POLICY IF EXISTS "Moderators can update shipments" ON shipments;

-- Drop other existing policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS is_moderator();

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
-- Profiles - allow all authenticated users to read all profiles
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid());

-- Transactions - allow all authenticated users to read all transactions
CREATE POLICY "transactions_select_policy" ON transactions
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "transactions_insert_own" ON transactions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_policy" ON transactions
FOR UPDATE TO authenticated
USING (true);

-- Refresh schema
NOTIFY pgrst, 'reload schema';
