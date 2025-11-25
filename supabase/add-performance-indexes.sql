-- Add indexes for shipments table to speed up dashboard and shipments page queries
CREATE INDEX IF NOT EXISTS idx_shipments_sender_id ON public.shipments(sender_id);
CREATE INDEX IF NOT EXISTS idx_shipments_recipient_id ON public.shipments(recipient_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_updated_at ON public.shipments(updated_at DESC);

-- Add composite index for common dashboard queries (user + status)
CREATE INDEX IF NOT EXISTS idx_shipments_sender_status ON public.shipments(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_recipient_status ON public.shipments(recipient_id, status);

-- Add indexes for profiles table to speed up reshippers page
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);

-- Add indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);
