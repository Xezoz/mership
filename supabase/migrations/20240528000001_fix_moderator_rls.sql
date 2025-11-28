-- Fix moderator RLS policies to allow reading transactions and profiles
-- This fixes the 400 error when moderators try to view dashboard data

-- First, ensure the is_moderator function exists and works correctly
CREATE OR REPLACE FUNCTION is_moderator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'moderator' 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing moderator policies if they exist
DROP POLICY IF EXISTS "Moderators can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Moderators can update profiles" ON profiles;
DROP POLICY IF EXISTS "Moderators can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Moderators can update transactions" ON transactions;
DROP POLICY IF EXISTS "Moderators can view all shipments" ON shipments;
DROP POLICY IF EXISTS "Moderators can update shipments" ON shipments;

-- Recreate policies with proper permissions
-- Profiles table
CREATE POLICY "Moderators can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_moderator() OR id = auth.uid());

CREATE POLICY "Moderators can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_moderator());

-- Transactions table
CREATE POLICY "Moderators can view all transactions"
ON transactions FOR SELECT
TO authenticated
USING (is_moderator() OR user_id = auth.uid());

CREATE POLICY "Moderators can update transactions"
ON transactions FOR UPDATE
TO authenticated
USING (is_moderator());

-- Shipments table
CREATE POLICY "Moderators can view all shipments"
ON shipments FOR SELECT
TO authenticated
USING (is_moderator() OR sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Moderators can update shipments"
ON shipments FOR UPDATE
TO authenticated
USING (is_moderator());

-- Grant explicit permissions to authenticated users
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT SELECT ON shipments TO authenticated;
GRANT UPDATE ON transactions TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT UPDATE ON shipments TO authenticated;
