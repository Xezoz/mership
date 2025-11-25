-- Check transactions table structure and policies
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions';

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'transactions';
