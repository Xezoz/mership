-- Add reshipper profile fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS about TEXT,
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state TEXT,
ADD COLUMN IF NOT EXISTS address_zip TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT,
ADD COLUMN IF NOT EXISTS allowed_sites TEXT[],
ADD COLUMN IF NOT EXISTS banned_items TEXT[],
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_shipments INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.about IS 'Reshipper bio/description';
COMMENT ON COLUMN public.profiles.address_street IS 'Street address for shipping';
COMMENT ON COLUMN public.profiles.address_city IS 'City for shipping address';
COMMENT ON COLUMN public.profiles.address_state IS 'State/Province for shipping address';
COMMENT ON COLUMN public.profiles.address_zip IS 'ZIP/Postal code';
COMMENT ON COLUMN public.profiles.address_country IS 'Country for shipping address';
COMMENT ON COLUMN public.profiles.allowed_sites IS 'Array of allowed shopping sites';
COMMENT ON COLUMN public.profiles.banned_items IS 'Array of banned item types';
COMMENT ON COLUMN public.profiles.is_verified IS 'Whether the reshipper is verified';
COMMENT ON COLUMN public.profiles.rating IS 'Average rating (0.0 to 5.0)';
COMMENT ON COLUMN public.profiles.review_count IS 'Number of reviews received';
COMMENT ON COLUMN public.profiles.total_shipments IS 'Total number of shipments completed';
