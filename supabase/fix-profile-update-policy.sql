-- Allow users to update their own profile balance
-- First, check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Drop old restrictive update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policy that allows users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'UPDATE';
