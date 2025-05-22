
-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for discussions
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Anyone can read discussions
CREATE POLICY "Anyone can read discussions" 
  ON discussions FOR SELECT 
  USING (true);

-- Only authenticated users can insert their own discussions
CREATE POLICY "Authenticated users can insert their own discussions" 
  ON discussions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Only discussion owner can update their discussions
CREATE POLICY "Users can update own discussions" 
  ON discussions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Only discussion owner can delete their discussions
CREATE POLICY "Users can delete own discussions" 
  ON discussions FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages
CREATE POLICY "Anyone can read chat messages" 
  ON chat_messages FOR SELECT 
  USING (true);

-- Only authenticated users can insert their own messages
CREATE POLICY "Authenticated users can insert their own messages" 
  ON chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Only message owner can update their messages
CREATE POLICY "Users can update own messages" 
  ON chat_messages FOR UPDATE 
  USING (auth.uid() = user_id);

-- Only message owner can delete their messages
CREATE POLICY "Users can delete own messages" 
  ON chat_messages FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
