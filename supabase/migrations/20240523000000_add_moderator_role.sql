-- Add 'moderator' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';

-- Create policy for moderators to view all profiles
CREATE POLICY "Moderators can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'moderator'
  )
);

-- Create policy for moderators to update profiles (e.g. ban/verify)
CREATE POLICY "Moderators can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'moderator'
  )
);

-- Create policy for moderators to view all transactions
CREATE POLICY "Moderators can view all transactions"
ON transactions FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'moderator'
  )
);

-- Create policy for moderators to update transactions (e.g. process withdrawals)
CREATE POLICY "Moderators can update transactions"
ON transactions FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'moderator'
  )
);

-- Create policy for moderators to view all shipments
CREATE POLICY "Moderators can view all shipments"
ON shipments FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'moderator'
  )
);
