-- Add membership_tier column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS membership_tier text DEFAULT 'free';

-- Update RLS policies if necessary (existing policies likely cover update/read)
-- Ensure the column is visible to the user
