
-- Fix overly permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- The telemed_chats and telemed_messages INSERT policies are pre-existing, not from this migration
