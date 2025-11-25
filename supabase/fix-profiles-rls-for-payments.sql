-- Check and fix profiles RLS policies for balance updates

-- First, let's see current policies
-- Run this in Supabase SQL Editor to see what policies exist:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Drop existing update policies that might be blocking
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create policy that allows users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- IMPORTANT: Add policy to allow authenticated users to update other profiles
-- This is needed for the platform to credit reshipper balances
CREATE POLICY "Allow balance updates for payments"
ON profiles FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
