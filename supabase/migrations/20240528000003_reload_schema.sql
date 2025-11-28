-- Refresh Supabase schema cache
-- Run this to make Supabase recognize existing foreign keys

NOTIFY pgrst, 'reload schema';
