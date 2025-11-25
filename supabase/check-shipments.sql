-- Check current shipments table structure and data
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shipments'
ORDER BY ordinal_position;

-- Check if there are any existing shipments
SELECT id, sender_id, recipient_id, tracking_number, status, created_at
FROM shipments
LIMIT 5;

-- Check RLS policies on shipments
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'shipments';
