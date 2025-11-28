-- Add read column to messages table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'read'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN read BOOLEAN DEFAULT false;
    END IF;
END $$;
