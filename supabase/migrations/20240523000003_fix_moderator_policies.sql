-- Fix infinite recursion in moderator policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Moderators can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Moderators can update profiles" ON profiles;
DROP POLICY IF EXISTS "Moderators can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Moderators can update transactions" ON transactions;
DROP POLICY IF EXISTS "Moderators can view all shipments" ON shipments;

-- Create a function to check if user is moderator (avoids recursion)
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

-- Recreate policies using the function
CREATE POLICY "Moderators can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_moderator());

CREATE POLICY "Moderators can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_moderator());

CREATE POLICY "Moderators can view all transactions"
ON transactions FOR SELECT
TO authenticated
USING (is_moderator());

CREATE POLICY "Moderators can update transactions"
ON transactions FOR UPDATE
TO authenticated
USING (is_moderator());

CREATE POLICY "Moderators can view all shipments"
ON shipments FOR SELECT
TO authenticated
USING (is_moderator());
