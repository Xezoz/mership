-- Sample data for testing reshipper profiles
-- First, run the add-reshipper-profile-fields.sql migration

-- Update an existing reshipper with sample data
-- Replace 'reshipper@example.com' with your actual reshipper email
UPDATE public.profiles
SET 
    about = 'Professional reshipper with 5+ years of experience. Fast, reliable, and secure shipping services for all your international needs. Specializing in electronics, fashion, and general merchandise.',
    address_street = '123 Main Street, Suite 100',
    address_city = 'New York',
    address_state = 'NY',
    address_zip = '10001',
    address_country = 'United States',
    allowed_sites = ARRAY['Amazon', 'eBay', 'Walmart', 'Target', 'Best Buy', 'Newegg'],
    banned_items = ARRAY['Weapons', 'Hazardous materials', 'Illegal substances', 'Live animals'],
    is_verified = true,
    rating = 4.8,
    review_count = 127,
    total_shipments = 543
WHERE email = 'reshipper@example.com' AND role = 'reshipper';

-- Verify the update
SELECT 
    full_name,
    email,
    role,
    is_verified,
    rating,
    review_count,
    address_city,
    address_country,
    array_length(allowed_sites, 1) as allowed_sites_count,
    array_length(banned_items, 1) as banned_items_count
FROM public.profiles
WHERE role = 'reshipper';
