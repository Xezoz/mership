-- Add read column to messages table
-- This column tracks whether a message has been read by the recipient

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'read'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN read BOOLEAN DEFAULT false NOT NULL;
        
        -- Set all existing messages as unread
        UPDATE public.messages SET read = false WHERE read IS NULL;
        
        RAISE NOTICE 'Added read column to messages table';
    ELSE
        RAISE NOTICE 'read column already exists';
    END IF;
END $$;
