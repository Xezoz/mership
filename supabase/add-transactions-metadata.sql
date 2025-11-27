-- Add metadata column to transactions table for storing checkout session IDs and other data

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON public.transactions USING gin(metadata);

-- Comment
COMMENT ON COLUMN public.transactions.metadata IS 'Stores additional data like checkout_session_id for payment verification';
