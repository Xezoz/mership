-- First, let's check the current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check for any triggers on the profiles table
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'profiles'::regclass;

-- Try to update balance directly with SQL (replace the email with your user's email)
-- Find your user first
SELECT id, email, balance 
FROM profiles 
LIMIT 5;

-- Update balance for a specific user (replace 'your-email@example.com' with actual email)
-- UPDATE profiles 
-- SET balance = 100.00 
-- WHERE email = 'your-email@example.com';

-- Or update by ID (replace 'user-id-here' with actual user ID)
-- UPDATE profiles 
-- SET balance = 100.00 
-- WHERE id = 'user-id-here';
