-- Add UPDATE policy for messages so users can mark them as read
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
CREATE POLICY "Users can update messages in their conversations"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id
            AND (customer_id = auth.uid() OR reshipper_id = auth.uid())
        )
    );
