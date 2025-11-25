-- Add balance column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0.00;

-- Set a default balance for existing users (optional)
UPDATE profiles SET balance = 100.00 WHERE balance = 0.00;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'balance';

-- Check current profiles with balance
SELECT id, email, balance FROM profiles LIMIT 5;
