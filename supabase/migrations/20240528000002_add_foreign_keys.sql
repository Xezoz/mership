-- Add foreign key relationships for transactions table
-- This fixes the "Could not find a relationship" error

-- Add foreign key from transactions.user_id to profiles.id
ALTER TABLE transactions
ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
